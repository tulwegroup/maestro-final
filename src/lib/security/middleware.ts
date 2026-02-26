// MAESTRO - Security Middleware
// PCI DSS, ISO 27001, and Penetration Test Hardening
import { NextRequest, NextResponse } from 'next/server';

// ===========================
// SECURITY HEADERS
// ===========================

const SECURITY_HEADERS = {
  // Strict Transport Security - Force HTTPS for 1 year, include subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Content Security Policy - Comprehensive
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.maestro.ae https://api.stripe.com https://maps.googleapis.com https://api.coingecko.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
  
  // Allow iframes from same origin (needed for preview)
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=(self https://js.stripe.com)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),
  
  // Cross-Origin policies (relaxed for development/preview compatibility)
  // 'Cross-Origin-Opener-Policy': 'same-origin',
  // 'Cross-Origin-Resource-Policy': 'cross-origin',
  
  // Cache Control (relaxed for development)
  // 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  // 'Pragma': 'no-cache',
  // 'Expires': '0'
};

// ===========================
// RATE LIMITING
// ===========================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
const RATE_LIMITS = {
  // General API: 100 requests per minute
  api: { windowMs: 60000, max: 100 },
  // Authentication: 5 attempts per 15 minutes
  auth: { windowMs: 900000, max: 5 },
  // Payment: 10 requests per minute
  payment: { windowMs: 60000, max: 10 },
  // Password reset: 3 per hour
  passwordReset: { windowMs: 3600000, max: 3 },
  // Sensitive operations: 20 per minute
  sensitive: { windowMs: 60000, max: 20 }
};

function getClientIdentifier(req: NextRequest): string {
  // Use multiple factors for identification
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');
  const userAgent = req.headers.get('user-agent') || '';
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown';
  return `${ip}:${hashString(userAgent)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function checkRateLimit(
  identifier: string, 
  type: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();
  
  let entry = rateLimitStore.get(key);
  
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false
    };
  }
  
  entry.count++;
  rateLimitStore.set(key, entry);
  
  const remaining = Math.max(0, config.max - entry.count);
  
  if (entry.count > config.max) {
    entry.blocked = true;
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }
  
  return { allowed: true, remaining, resetTime: entry.resetTime };
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 300000);
}

// ===========================
// CSRF PROTECTION
// ===========================

const CSRF_EXEMPT_PATHS = [
  '/api/auth',
  '/api/webhooks',
  '/api/health'
];

function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function validateCSRFToken(req: NextRequest): boolean {
  // Skip CSRF for exempt paths
  const path = new URL(req.url).pathname;
  if (CSRF_EXEMPT_PATHS.some(p => path.startsWith(p))) {
    return true;
  }
  
  // Skip CSRF for GET, HEAD, OPTIONS
  const method = req.method.toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }
  
  // Check for CSRF token in headers
  const csrfHeader = req.headers.get('x-csrf-token');
  const csrfCookie = req.cookies.get('csrf-token')?.value;
  
  if (!csrfHeader || !csrfCookie) {
    return false;
  }
  
  // Timing-safe comparison
  return timingSafeEqual(csrfHeader, csrfCookie);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ===========================
// INPUT VALIDATION
// ===========================

const SUSPICIOUS_PATTERNS = [
  // SQL Injection
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b)/i,
  /(--|\/\*|\*\/|xp_|sp_)/i,
  /('|--|;|\/\*|\*\/)/i,
  /(OR\s+1\s*=\s*1|AND\s+1\s*=\s*1)/i,
  /(UNION\s+SELECT|UNION\s+ALL\s+SELECT)/i,
  
  // XSS
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/i,
  /on(load|error|click|mouse|focus|blur|key|submit|reset|change|input|select|resize|scroll|unload|beforeunload)\s*=/i,
  /data:\s*text\/html/i,
  /vbscript:/i,
  
  // Path Traversal
  /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|%2e%2e%5c)/i,
  
  // Command Injection
  /[;&|`$(){}[\]\\]/,
  /\b(cat|ls|pwd|whoami|id|uname|wget|curl|nc|netcat|bash|sh|cmd|powershell)\b/i,
  
  // LDAP Injection
  /[\(\)\*\0\\]/,
  
  // NoSQL Injection
  /(\$where|\$gt|\$lt|\$ne|\$or|\$and|\$not|\$nor|\$regex|\$exists)/i,
  
  // SSTI
  /\{\{.*\}\}|\{\%.*\%\}|<%.*%>/i,
  
  // Prototype Pollution
  /__proto__|constructor|prototype/i
];

function detectMaliciousInput(input: string): { detected: boolean; pattern: string } {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, pattern: pattern.source };
    }
  }
  return { detected: false, pattern: '' };
}

function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/'/g, "''") // Escape single quotes for SQL
    .trim();
}

// ===========================
// SECURITY LOGGING
// ===========================

interface SecurityLog {
  timestamp: string;
  type: 'BLOCKED' | 'WARNING' | 'INFO';
  category: 'RATE_LIMIT' | 'CSRF' | 'XSS' | 'SQL_INJECTION' | 'PATH_TRAVERSAL' | 'COMMAND_INJECTION' | 'SUSPICIOUS' | 'AUTH_FAILURE';
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

const securityLogs: SecurityLog[] = [];

function logSecurityEvent(
  req: NextRequest,
  type: SecurityLog['type'],
  category: SecurityLog['category'],
  details: string,
  severity: SecurityLog['severity']
): void {
  const log: SecurityLog = {
    timestamp: new Date().toISOString(),
    type,
    category,
    ip: getClientIdentifier(req),
    userAgent: req.headers.get('user-agent') || 'unknown',
    path: new URL(req.url).pathname,
    method: req.method,
    details,
    severity
  };
  
  securityLogs.push(log);
  
  // Keep only last 10000 logs in memory
  if (securityLogs.length > 10000) {
    securityLogs.shift();
  }
  
  // Console log for monitoring
  console.log(`[SECURITY] [${severity}] ${category}: ${details} - IP: ${log.ip} - Path: ${log.path}`);
}

// ===========================
// IP BLACKLISTING
// ===========================

const IP_BLACKLIST = new Set<string>();
const BLACKLIST_DURATION = 3600000; // 1 hour
const blacklistedIPs = new Map<string, number>();

function addToBlacklist(ip: string): void {
  IP_BLACKLIST.add(ip);
  blacklistedIPs.set(ip, Date.now() + BLACKLIST_DURATION);
}

function isBlacklisted(ip: string): boolean {
  const expiry = blacklistedIPs.get(ip);
  if (expiry && Date.now() > expiry) {
    IP_BLACKLIST.delete(ip);
    blacklistedIPs.delete(ip);
    return false;
  }
  return IP_BLACKLIST.has(ip);
}

// ===========================
// MAIN MIDDLEWARE
// ===========================

export function securityMiddleware(req: NextRequest): NextResponse | null {
  const clientIp = getClientIdentifier(req);
  const path = new URL(req.url).pathname;
  
  // 1. Check IP blacklist
  if (isBlacklisted(clientIp)) {
    logSecurityEvent(req, 'BLOCKED', 'SUSPICIOUS', 'Blocked IP attempted access', 'HIGH');
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // 2. Rate limiting
  const rateLimitType = path.startsWith('/api/auth') ? 'auth' :
                       path.startsWith('/api/payment') ? 'payment' :
                       path.startsWith('/api/') ? 'api' : 'sensitive';
  
  const rateLimit = checkRateLimit(clientIp, rateLimitType);
  
  if (!rateLimit.allowed) {
    logSecurityEvent(req, 'BLOCKED', 'RATE_LIMIT', `Rate limit exceeded for ${rateLimitType}`, 'MEDIUM');
    
    // Add to blacklist after multiple rate limit violations
    const key = `violations:${clientIp}`;
    const violations = rateLimitStore.get(key)?.count || 0;
    if (violations > 10) {
      addToBlacklist(clientIp);
    }
    
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
        'X-RateLimit-Limit': String(RATE_LIMITS[rateLimitType].max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(rateLimit.resetTime)
      }
    });
  }
  
  // 3. CSRF Protection for state-changing requests
  if (!validateCSRFToken(req)) {
    logSecurityEvent(req, 'BLOCKED', 'CSRF', 'CSRF token validation failed', 'HIGH');
    return new NextResponse('Invalid CSRF Token', { status: 403 });
  }
  
  // 4. Query parameter validation
  const searchParams = req.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    const { detected, pattern } = detectMaliciousInput(value);
    if (detected) {
      logSecurityEvent(req, 'BLOCKED', 'SUSPICIOUS', `Malicious input detected in query param ${key}: ${pattern}`, 'HIGH');
      addToBlacklist(clientIp);
      return new NextResponse('Bad Request', { status: 400 });
    }
  }
  
  // 5. Path validation
  const { detected: pathMalicious } = detectMaliciousInput(path);
  if (pathMalicious) {
    logSecurityEvent(req, 'BLOCKED', 'PATH_TRAVERSAL', 'Malicious path detected', 'CRITICAL');
    addToBlacklist(clientIp);
    return new NextResponse('Not Found', { status: 404 });
  }
  
  // If all checks pass, continue
  return null;
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Apply all security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) {
      response.headers.set(key, value);
    }
  }
  
  return response;
}

export function getSecurityLogs(): SecurityLog[] {
  return [...securityLogs];
}

export function getRateLimitStatus(identifier: string, type: keyof typeof RATE_LIMITS): { remaining: number; resetTime: number } {
  const key = `${type}:${identifier}`;
  const entry = rateLimitStore.get(key);
  if (!entry) {
    return { remaining: RATE_LIMITS[type].max, resetTime: Date.now() + RATE_LIMITS[type].windowMs };
  }
  return { remaining: Math.max(0, RATE_LIMITS[type].max - entry.count), resetTime: entry.resetTime };
}

export { generateCSRFToken, detectMaliciousInput, sanitizeInput, getClientIdentifier };
