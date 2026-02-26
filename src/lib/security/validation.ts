// MAESTRO - Input Validation & Sanitization
// PCI DSS Requirement 6, ISO 27001 A.14
// Comprehensive input validation for all user inputs

import { z } from 'zod';

// ===========================
// VALIDATION SCHEMAS
// ===========================

// Emirates ID: 784-XXXX-XXXXXXX-X
export const emiratesIdSchema = z.string()
  .regex(/^784-\d{4}-\d{7}-\d{1}$/, 'Invalid Emirates ID format')
  .transform(val => val.trim());

// UAE Mobile: +971 5X XXX XXXX
export const uaeMobileSchema = z.string()
  .regex(/^(\+971\s?)?5[0-9]\s?[0-9]{3}\s?[0-9]{4}$/, 'Invalid UAE mobile number')
  .transform(val => val.replace(/\s/g, ''));

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email too long')
  .transform(val => val.toLowerCase().trim());

// Password with strong policy
export const strongPasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain special character')
  .refine(val => !/(password|123456|qwerty)/i.test(val), 'Password too common');

// Vehicle plate (UAE format)
export const vehiclePlateSchema = z.string()
  .regex(/^[A-Z]{1,3}-\d{1,5}$/, 'Invalid vehicle plate format')
  .transform(val => val.toUpperCase());

// Amount validation (positive number, max 2 decimal places)
export const amountSchema = z.number()
  .positive('Amount must be positive')
  .max(1000000, 'Amount exceeds maximum limit')
  .refine(val => /^\d+(\.\d{1,2})?$/.test(val.toString()), 'Invalid amount format');

// Reference number
export const referenceSchema = z.string()
  .alnum()
  .min(4, 'Reference too short')
  .max(50, 'Reference too long');

// Safe string (no XSS, no SQL injection)
export const safeStringSchema = z.string()
  .max(1000, 'Input too long')
  .refine(val => !containsXSS(val), 'Invalid characters detected')
  .refine(val => !containsSQLInjection(val), 'Invalid input detected')
  .transform(val => sanitizeHTML(val));

// UUID validation
export const uuidSchema = z.string()
  .uuid('Invalid ID format');

// Date validation (no future dates for birthdates, no past for expiry)
export const pastDateSchema = z.date()
  .max(new Date(), 'Date cannot be in the future');

export const futureDateSchema = z.date()
  .min(new Date(), 'Date must be in the future');

// ===========================
// XSS DETECTION
// ===========================

const XSS_PATTERNS = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
  /<script\b[^>]*\/?>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on(load|error|click|mouse|focus|blur|key|submit|reset|change|input|select|resize|scroll)\s*=/gi,
  /data:\s*text\/html/gi,
  /<iframe\b/gi,
  /<object\b/gi,
  /<embed\b/gi,
  /<form\b/gi,
  /expression\s*\(/gi,
  /@import\s+/gi,
  /url\s*\(/gi
];

export function containsXSS(input: string): boolean {
  const normalized = input.toLowerCase();
  return XSS_PATTERNS.some(pattern => pattern.test(normalized));
}

// ===========================
// SQL INJECTION DETECTION
// ===========================

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/i,
  /(--|\/\*|\*\/|#)/,
  /('|")\s*(OR|AND)\s*('|")?\s*[=<>]/i,
  /\bOR\s+1\s*=\s*1/i,
  /\bAND\s+1\s*=\s*1/i,
  /UNION\s+(ALL\s+)?SELECT/i,
  /;\s*(SELECT|INSERT|UPDATE|DELETE|DROP)/i,
  /xp_cmdshell/i,
  /sp_executesql/i,
  /WAITFOR\s+DELAY/i,
  /BENCHMARK\s*\(/i,
  /SLEEP\s*\(/i
];

export function containsSQLInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

// ===========================
// SANITIZATION FUNCTIONS
// ===========================

export function sanitizeHTML(input: string): string {
  return input
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=/gi, '')
    // Remove data: URIs
    .replace(/data:\s*[^,]*,/gi, '')
    // Trim whitespace
    .trim();
}

export function sanitizeSQL(input: string): string {
  return input
    // Escape single quotes
    .replace(/'/g, "''")
    // Remove semicolons
    .replace(/;/g, '')
    // Remove comments
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

export function sanitizeFilename(filename: string): string {
  return filename
    // Remove path traversal
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove special characters
    .replace(/[<>:"|?*]/g, '')
    // Limit length
    .substring(0, 255)
    // Add safe prefix if empty
    || 'file';
}

export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    // Remove credentials
    parsed.username = '';
    parsed.password = '';
    
    return parsed.toString();
  } catch {
    return '';
  }
}

// ===========================
// VALIDATION HELPER
// ===========================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: string[];
}

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  try {
    const data = schema.parse(input);
    return { success: true, data, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

// ===========================
// REQUEST VALIDATION
// ===========================

export function validateRequestHeaders(headers: Headers): { 
  valid: boolean; 
  errors: string[];
  sanitized: Record<string, string>;
} {
  const errors: string[] = [];
  const sanitized: Record<string, string> = {};
  
  // Validate Content-Type for POST/PUT
  const contentType = headers.get('content-type');
  if (contentType && !contentType.includes('application/json') && 
      !contentType.includes('multipart/form-data') &&
      !contentType.includes('application/x-www-form-urlencoded')) {
    // Allow but log
  }
  
  // Validate Content-Length
  const contentLength = headers.get('content-length');
  if (contentLength) {
    const length = parseInt(contentLength, 10);
    if (isNaN(length) || length < 0 || length > 10 * 1024 * 1024) { // 10MB max
      errors.push('Invalid content length');
    }
  }
  
  // Check for suspicious headers
  const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
  for (const header of suspiciousHeaders) {
    const value = headers.get(header);
    if (value && containsXSS(value)) {
      errors.push(`Suspicious header detected: ${header}`);
    }
  }
  
  // Sanitize common headers
  const userAgent = headers.get('user-agent');
  if (userAgent) {
    sanitized.userAgent = sanitizeHTML(userAgent.substring(0, 500));
  }
  
  return { valid: errors.length === 0, errors, sanitized };
}

// ===========================
// FILE VALIDATION
// ===========================

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFileUpload(file: {
  name: string;
  type: string;
  size: number;
}, allowedCategory: 'image' | 'document' | 'spreadsheet' = 'document'): ValidationResult<{
  name: string;
  type: string;
  size: number;
}> {
  const errors: string[] = [];
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }
  
  // Check file type
  const allowedTypes = ALLOWED_FILE_TYPES[allowedCategory] || [];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Validate filename
  const sanitizedName = sanitizeFilename(file.name);
  if (sanitizedName !== file.name) {
    errors.push('Filename contains invalid characters');
  }
  
  // Check for double extensions
  const extensions = file.name.split('.').filter(Boolean);
  if (extensions.length > 2) {
    errors.push('Invalid file extension format');
  }
  
  return {
    success: errors.length === 0,
    data: errors.length === 0 ? { name: sanitizedName, type: file.type, size: file.size } : undefined,
    errors
  };
}

// ===========================
// EXPORTS
// ===========================

export {
  XSS_PATTERNS,
  SQL_INJECTION_PATTERNS
};
