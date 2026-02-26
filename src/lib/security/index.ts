// MAESTRO - Security Module Index
// Central export for all security-related functionality
// PCI DSS, ISO 27001, Penetration Test Hardening

// Middleware & Headers
export {
  securityMiddleware,
  applySecurityHeaders,
  getSecurityLogs,
  getRateLimitStatus,
  generateCSRFToken,
  detectMaliciousInput,
  sanitizeInput,
  getClientIdentifier
} from './middleware';

// Authentication Security
export {
  recordLoginAttempt,
  getLoginStatus,
  generateMFACode,
  verifyMFACode,
  createSecureSession,
  validateSecureSession,
  terminateSession,
  terminateAllUserSessions,
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
  generateDeviceFingerprint,
  AUTH_CONFIG
} from './auth';

// Cryptography
export {
  encryptField,
  decryptField,
  hashField,
  hashFieldWithSalt,
  maskEmiratesId,
  maskMobileNumber,
  maskCardNumber,
  maskAccountNumber,
  maskEmail,
  generateSecureToken,
  generateNumericCode,
  generateReferenceNumber,
  signData,
  verifySignature,
  secureCompare,
  isCardData,
  isSensitiveData,
  sanitizeForLogging,
  CRYPTO_CONFIG
} from './crypto';

// Input Validation
export {
  emiratesIdSchema,
  uaeMobileSchema,
  emailSchema,
  strongPasswordSchema,
  vehiclePlateSchema,
  amountSchema,
  safeStringSchema,
  uuidSchema,
  pastDateSchema,
  futureDateSchema,
  containsXSS,
  containsSQLInjection,
  sanitizeHTML,
  sanitizeSQL,
  sanitizeFilename,
  sanitizeURL,
  validateInput,
  validateRequestHeaders,
  validateFileUpload,
  ValidationResult
} from './validation';

// Security Logging
export {
  logSecurityEvent,
  getSecurityEvents,
  generateSecurityReport,
  resolveSecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecurityEvent
} from './logging';

// API Security
export {
  generateAPIKey,
  validateAPIKey,
  revokeAPIKey,
  signRequest,
  verifyRequestSignature,
  authenticateAPIRequest,
  checkPermission,
  checkResourceAccess,
  verifyWebhookSignature,
  addToIPWhitelist,
  removeFromIPWhitelist,
  isIPWhitelisted,
  requireIPWhitelist,
  validateOrigin,
  getCORSHeaders,
  APIKey,
  API_CONFIG
} from './api';

// Error Handling
export {
  ErrorCode,
  createErrorResponse,
  AppError,
  sanitizeError,
  logError,
  getErrorLog,
  handleApiError,
  asyncHandler,
  setupGlobalErrorHandlers
} from './errors';

// Compliance & Audit
export {
  createAuditLog,
  generateComplianceReport,
  AuditAction,
  AuditLogEntry,
  ComplianceReport
} from './compliance';

// Types
export type { SecureSession } from './auth';
export type { SignedRequest, AuthenticatedRequest } from './api';
