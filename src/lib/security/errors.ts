// MAESTRO - Secure Error Handling
// PCI DSS Requirement 6.5, ISO 27001 A.14.2.8
// Prevents information disclosure through error messages

import { NextResponse } from 'next/server';

// ===========================
// ERROR TYPES
// ===========================

export enum ErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

interface ErrorInfo {
  code: ErrorCode;
  message: string;
  statusCode: number;
  isOperational: boolean; // Operational errors are expected, programming errors are not
}

const ERROR_MAP: Record<ErrorCode, ErrorInfo> = {
  [ErrorCode.BAD_REQUEST]: { code: ErrorCode.BAD_REQUEST, message: 'Invalid request', statusCode: 400, isOperational: true },
  [ErrorCode.UNAUTHORIZED]: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required', statusCode: 401, isOperational: true },
  [ErrorCode.FORBIDDEN]: { code: ErrorCode.FORBIDDEN, message: 'Access denied', statusCode: 403, isOperational: true },
  [ErrorCode.NOT_FOUND]: { code: ErrorCode.NOT_FOUND, message: 'Resource not found', statusCode: 404, isOperational: true },
  [ErrorCode.METHOD_NOT_ALLOWED]: { code: ErrorCode.METHOD_NOT_ALLOWED, message: 'Method not allowed', statusCode: 405, isOperational: true },
  [ErrorCode.CONFLICT]: { code: ErrorCode.CONFLICT, message: 'Resource conflict', statusCode: 409, isOperational: true },
  [ErrorCode.VALIDATION_ERROR]: { code: ErrorCode.VALIDATION_ERROR, message: 'Validation failed', statusCode: 422, isOperational: true },
  [ErrorCode.RATE_LIMITED]: { code: ErrorCode.RATE_LIMITED, message: 'Too many requests', statusCode: 429, isOperational: true },
  
  [ErrorCode.INTERNAL_ERROR]: { code: ErrorCode.INTERNAL_ERROR, message: 'Internal server error', statusCode: 500, isOperational: false },
  [ErrorCode.SERVICE_UNAVAILABLE]: { code: ErrorCode.SERVICE_UNAVAILABLE, message: 'Service temporarily unavailable', statusCode: 503, isOperational: true },
  [ErrorCode.DATABASE_ERROR]: { code: ErrorCode.DATABASE_ERROR, message: 'Database error', statusCode: 500, isOperational: false },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: { code: ErrorCode.EXTERNAL_SERVICE_ERROR, message: 'External service error', statusCode: 502, isOperational: true }
};

// ===========================
// SECURE ERROR RESPONSE
// ===========================

interface SecureErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
    details?: string[]; // Only in development
  };
  timestamp: string;
}

export function createErrorResponse(
  code: ErrorCode,
  details?: string[],
  requestId?: string
): NextResponse<SecureErrorResponse> {
  const errorInfo = ERROR_MAP[code];
  
  const response: SecureErrorResponse = {
    success: false,
    error: {
      code: errorInfo.code,
      message: errorInfo.message,
      requestId
    },
    timestamp: new Date().toISOString()
  };
  
  // Only include details in development
  if (process.env.NODE_ENV === 'development' && details) {
    response.error.details = details;
  }
  
  return NextResponse.json(response, { 
    status: errorInfo.statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'X-Request-ID': requestId || ''
    }
  });
}

// ===========================
// ERROR HANDLING CLASS
// ===========================

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: string[];
  
  constructor(code: ErrorCode, message?: string, details?: string[]) {
    super(message || ERROR_MAP[code].message);
    
    this.code = code;
    this.statusCode = ERROR_MAP[code].statusCode;
    this.isOperational = ERROR_MAP[code].isOperational;
    this.details = details;
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// ===========================
// ERROR SANITIZATION
// ===========================

interface SanitizedError {
  message: string;
  code: ErrorCode;
  isOperational: boolean;
}

export function sanitizeError(error: unknown): SanitizedError {
  // Handle known application errors
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      isOperational: error.isOperational
    };
  }
  
  // Handle Zod validation errors
  if (error && typeof error === 'object' && 'issues' in error) {
    return {
      message: 'Validation failed',
      code: ErrorCode.VALIDATION_ERROR,
      isOperational: true
    };
  }
  
  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return {
        message: 'Resource already exists',
        code: ErrorCode.CONFLICT,
        isOperational: true
      };
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return {
        message: 'Resource not found',
        code: ErrorCode.NOT_FOUND,
        isOperational: true
      };
    }
    
    // Database connection error
    if (prismaError.code === 'P1001') {
      return {
        message: 'Database error',
        code: ErrorCode.DATABASE_ERROR,
        isOperational: false
      };
    }
    
    // Generic database error
    return {
      message: 'Database error',
      code: ErrorCode.DATABASE_ERROR,
      isOperational: false
    };
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('JWT') || error.message.includes('token')) {
      return {
        message: 'Authentication error',
        code: ErrorCode.UNAUTHORIZED,
        isOperational: true
      };
    }
    
    if (error.message.includes('timeout')) {
      return {
        message: 'Request timeout',
        code: ErrorCode.SERVICE_UNAVAILABLE,
        isOperational: true
      };
    }
    
    // Unknown error - don't expose details
    return {
      message: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
      isOperational: false
    };
  }
  
  // Completely unknown error type
  return {
    message: 'Internal server error',
    code: ErrorCode.INTERNAL_ERROR,
    isOperational: false
  };
}

// ===========================
// ERROR LOGGING
// ===========================

interface ErrorLogEntry {
  timestamp: string;
  error: string;
  stack?: string;
  code: ErrorCode;
  statusCode: number;
  isOperational: boolean;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  ip?: string;
}

const errorLog: ErrorLogEntry[] = [];
const MAX_ERROR_LOG = 1000;

export function logError(
  error: unknown,
  context?: {
    requestId?: string;
    userId?: string;
    path?: string;
    method?: string;
    ip?: string;
  }
): void {
  const sanitized = sanitizeError(error);
  
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : 'Unknown error',
    stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
    code: sanitized.code,
    statusCode: sanitized.statusCode,
    isOperational: sanitized.isOperational,
    ...context
  };
  
  errorLog.push(entry);
  
  // Trim log
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.shift();
  }
  
  // Log to console with appropriate level
  if (!sanitized.isOperational) {
    console.error('[ERROR]', entry);
  } else {
    console.warn('[OPERATIONAL_ERROR]', {
      code: entry.code,
      message: entry.error,
      path: entry.path
    });
  }
}

export function getErrorLog(limit: number = 100): ErrorLogEntry[] {
  return errorLog.slice(-limit);
}

// ===========================
// GLOBAL ERROR HANDLER
// ===========================

export function handleApiError(
  error: unknown,
  requestId?: string
): NextResponse {
  // Log the error
  logError(error, { requestId });
  
  // Sanitize for response
  const sanitized = sanitizeError(error);
  
  // Create secure response
  return createErrorResponse(
    sanitized.code,
    process.env.NODE_ENV === 'development' && error instanceof Error ? [error.message] : undefined,
    requestId
  );
}

// ===========================
// ASYNC ERROR WRAPPER
// ===========================

export function asyncHandler<T>(
  fn: () => Promise<T>
): Promise<T | NextResponse> {
  return fn().catch(error => handleApiError(error));
}

// ===========================
// UNHANDLED ERROR HANDLERS
// ===========================

export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[UNCAUGHT_EXCEPTION]', error);
    logError(error);
    
    // For non-operational errors, exit gracefully
    const sanitized = sanitizeError(error);
    if (!sanitized.isOperational) {
      process.exit(1);
    }
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED_REJECTION]', reason);
    logError(reason);
  });
}

// ===========================
// EXPORTS
// ===========================

export { ERROR_MAP };
