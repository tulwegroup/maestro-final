// MAESTRO - Security Configuration
// Central configuration for all security features
// PCI DSS, ISO 27001, Penetration Test Hardening

export const SECURITY_CONFIG = {
  // ===========================
  // APPLICATION SECURITY
  // ===========================
  app: {
    name: 'MAESTRO',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    
    // Security contact
    securityContact: 'security@maestro.ae',
    incidentResponseTeam: ['security@maestro.ae', 'ops@maestro.ae'],
  },

  // ===========================
  // AUTHENTICATION
  // ===========================
  auth: {
    // Session settings
    sessionDurationHours: 24,
    maxConcurrentSessions: 5,
    sessionCookieName: 'maestro_session',
    sessionCookieSecure: true,
    sessionCookieSameSite: 'strict' as const,
    
    // MFA settings
    mfaEnabled: true,
    mfaRequiredForAdmin: true,
    mfaRequiredForPayments: true,
    mfaCodeExpiryMinutes: 5,
    mfaMaxAttempts: 3,
    
    // Brute-force protection
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    progressiveDelay: true,
    
    // Password policy
    passwordMinLength: 12,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSpecialChars: true,
    passwordHistoryCount: 5,
    passwordExpiryDays: 90,
    
    // UAE Pass
    uaePassEnabled: true,
    uaePassClientId: process.env.UAE_PASS_CLIENT_ID,
    uaePassRedirectUri: process.env.UAE_PASS_REDIRECT_URI,
  },

  // ===========================
  // RATE LIMITING
  // ===========================
  rateLimit: {
    // General API
    apiWindowMs: 60000, // 1 minute
    apiMaxRequests: 100,
    
    // Authentication endpoints
    authWindowMs: 900000, // 15 minutes
    authMaxRequests: 5,
    
    // Payment endpoints
    paymentWindowMs: 60000,
    paymentMaxRequests: 10,
    
    // Password reset
    passwordResetWindowMs: 3600000, // 1 hour
    passwordResetMaxRequests: 3,
    
    // Sensitive operations
    sensitiveWindowMs: 60000,
    sensitiveMaxRequests: 20,
  },

  // ===========================
  // ENCRYPTION
  // ===========================
  encryption: {
    // AES-256-GCM for data at rest
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 12,
    tagLength: 128,
    
    // Key derivation
    kdfIterations: 100000,
    kdfHash: 'SHA-256',
    
    // TLS
    tlsMinVersion: 'TLSv1.2',
    tlsPreferredVersion: 'TLSv1.3',
    hstsMaxAge: 31536000, // 1 year
    hstsIncludeSubdomains: true,
    hstsPreload: true,
  },

  // ===========================
  // CONTENT SECURITY
  // ===========================
  contentSecurity: {
    // CSP
    cspEnabled: true,
    cspReportOnly: false,
    cspReportUri: '/api/security/csp-report',
    
    // XSS Prevention
    xssFilter: true,
    xssFilterMode: 'block',
    
    // Content Type
    noSniff: true,
    
    // Frame Protection
    frameGuard: 'DENY' as const,
    
    // Referrer
    referrerPolicy: 'strict-origin-when-cross-origin' as const,
  },

  // ===========================
  // INPUT VALIDATION
  // ===========================
  validation: {
    // Request size limits
    maxRequestBodySize: 10 * 1024 * 1024, // 10MB
    maxQueryStringLength: 2048,
    maxUrlLength: 2048,
    maxHeaderSize: 8192,
    
    // File uploads
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    },
    
    // String validation
    maxStringLength: 10000,
    maxArrayLength: 100,
    maxObjectDepth: 5,
  },

  // ===========================
  // LOGGING & MONITORING
  // ===========================
  logging: {
    // Security events
    logSecurityEvents: true,
    logAuthEvents: true,
    logAccessEvents: true,
    logDataEvents: true,
    
    // Levels
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    
    // Retention
    logRetentionDays: 90,
    maxLogFileSize: 100 * 1024 * 1024, // 100MB
    
    // Sensitive data
    redactSensitiveData: true,
    sensitiveFields: ['password', 'token', 'secret', 'cardNumber', 'cvv', 'pin', 'emiratesId'],
  },

  // ===========================
  // COMPLIANCE
  // ===========================
  compliance: {
    // PCI DSS
    pciDssEnabled: true,
    pciDssLevel: 1,
    pciDssScope: 'e-commerce',
    
    // ISO 27001
    iso27001Enabled: true,
    iso27001Certified: false, // Update after certification
    
    // Data Protection
    gdprCompliant: true,
    uaeDataProtectionCompliant: true,
    dataResidency: 'UAE',
    
    // Audit
    auditLogEnabled: true,
    auditLogRetentionDays: 365,
    auditLogImmutable: true,
  },

  // ===========================
  // API SECURITY
  // ===========================
  api: {
    // API Keys
    apiKeyEnabled: true,
    apiKeyPrefix: 'maestro_live_',
    testApiKeyPrefix: 'maestro_test_',
    apiKeyExpiryDays: 365,
    
    // Request signing
    requestSigningEnabled: true,
    signatureValidityMs: 300000, // 5 minutes
    
    // CORS
    corsEnabled: true,
    corsAllowedOrigins: [
      'https://maestro.ae',
      'https://app.maestro.ae',
      'https://api.maestro.ae'
    ],
    corsAllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    corsAllowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-API-Key',
      'X-CSRF-Token',
      'X-Maestro-Signature',
      'X-Maestro-Timestamp',
      'X-Maestro-Nonce'
    ],
    corsCredentialsAllowed: true,
    corsMaxAge: 86400,
  },

  // ===========================
  // IP SECURITY
  // ===========================
  ipSecurity: {
    // IP blocking
    ipBlockingEnabled: true,
    autoBlacklistEnabled: true,
    blacklistDurationMinutes: 60,
    
    // IP whitelisting (for admin access)
    ipWhitelistEnabled: false,
    ipWhitelist: [] as string[],
    
    // Geo-blocking
    geoBlockingEnabled: false,
    allowedCountries: ['AE', 'SA', 'KW', 'BH', 'OM', 'QA'],
  },

  // ===========================
  // WEBHOOK SECURITY
  // ===========================
  webhook: {
    signatureHeader: 'x-webhook-signature',
    timestampHeader: 'x-webhook-timestamp',
    signatureAlgorithm: 'SHA256',
    signatureValidityMs: 300000, // 5 minutes
  },

  // ===========================
  // INCIDENT RESPONSE
  // ===========================
  incidentResponse: {
    // Alerts
    emailAlerts: true,
    slackAlerts: false,
    smsAlerts: false,
    
    // Escalation
    escalationEnabled: true,
    escalationMinutesLow: 60,
    escalationMinutesMedium: 30,
    escalationMinutesHigh: 15,
    escalationMinutesCritical: 5,
    
    // Auto-response
    autoBlockOnCritical: true,
    autoNotifyOnHigh: true,
  },

  // ===========================
  // HEADERS
  // ===========================
  headers: {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), payment=(self)',
  },
};

// Type exports
export type SecurityConfig = typeof SECURITY_CONFIG;
export type AuthConfig = typeof SECURITY_CONFIG.auth;
export type RateLimitConfig = typeof SECURITY_CONFIG.rateLimit;
export type EncryptionConfig = typeof SECURITY_CONFIG.encryption;
export type ComplianceConfig = typeof SECURITY_CONFIG.compliance;
