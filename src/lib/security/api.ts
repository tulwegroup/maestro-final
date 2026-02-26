// MAESTRO - API Security
// Request signing, authentication, and API key management
// PCI DSS Requirement 6.5, ISO 27001 A.14.2

import { NextRequest } from 'next/server';
import { signData, verifySignature, generateSecureToken } from './crypto';

// ===========================
// CONFIGURATION
// ===========================

const API_CONFIG = {
  // Request signing
  signatureHeader: 'x-maestro-signature',
  timestampHeader: 'x-maestro-timestamp',
  nonceHeader: 'x-maestro-nonce',
  signatureValidityMs: 300000, // 5 minutes
  
  // API Keys
  apiKeyHeader: 'x-api-key',
  apiKeyPrefix: 'maestro_live_',
  testApiKeyPrefix: 'maestro_test_',
  
  // Rate limiting per API key
  defaultRateLimit: 1000,
  premiumRateLimit: 10000
};

// ===========================
// API KEY MANAGEMENT
// ===========================

export interface APIKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  permissions: string[];
  rateLimit: number;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
}

// In-memory store (replace with database in production)
const apiKeys = new Map<string, APIKey>();

export function generateAPIKey(name: string, userId: string, permissions: string[], isTest: boolean = false): APIKey {
  const prefix = isTest ? API_CONFIG.testApiKeyPrefix : API_CONFIG.apiKeyPrefix;
  const keyString = generateSecureToken(32);
  const fullKey = `${prefix}${keyString}`;
  
  const apiKey: APIKey = {
    id: `apikey_${generateSecureToken(8)}`,
    key: fullKey,
    name,
    userId,
    permissions,
    rateLimit: isTest ? API_CONFIG.defaultRateLimit : API_CONFIG.premiumRateLimit,
    expiresAt: isTest ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days for test
    lastUsedAt: null,
    isActive: true
  };
  
  apiKeys.set(fullKey, apiKey);
  
  return apiKey;
}

export function validateAPIKey(key: string): { valid: boolean; apiKey?: APIKey; error?: string } {
  if (!key) {
    return { valid: false, error: 'API key required' };
  }
  
  const apiKey = apiKeys.get(key);
  
  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }
  
  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is disabled' };
  }
  
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }
  
  // Update last used
  apiKey.lastUsedAt = new Date();
  
  return { valid: true, apiKey };
}

export function revokeAPIKey(keyId: string): boolean {
  for (const [key, apiKey] of apiKeys.entries()) {
    if (apiKey.id === keyId) {
      apiKey.isActive = false;
      return true;
    }
  }
  return false;
}

// ===========================
// REQUEST SIGNING
// ===========================

export interface SignedRequest {
  method: string;
  path: string;
  query: string;
  body?: string;
  timestamp: number;
  nonce: string;
}

export async function signRequest(request: SignedRequest): Promise<string> {
  const payload = buildSignaturePayload(request);
  return signData(payload);
}

export async function verifyRequestSignature(
  request: NextRequest,
  body?: string
): Promise<{ valid: boolean; error?: string }> {
  const signature = request.headers.get(API_CONFIG.signatureHeader);
  const timestamp = request.headers.get(API_CONFIG.timestampHeader);
  const nonce = request.headers.get(API_CONFIG.nonceHeader);
  
  if (!signature || !timestamp || !nonce) {
    return { valid: false, error: 'Missing required signature headers' };
  }
  
  // Check timestamp validity (prevent replay attacks)
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum)) {
    return { valid: false, error: 'Invalid timestamp' };
  }
  
  const now = Date.now();
  if (Math.abs(now - timestampNum) > API_CONFIG.signatureValidityMs) {
    return { valid: false, error: 'Request expired' };
  }
  
  // Check nonce uniqueness (prevent replay attacks)
  if (!nonceStore.has(nonce)) {
    nonceStore.set(nonce, timestampNum);
  } else {
    return { valid: false, error: 'Duplicate request detected' };
  }
  
  // Build payload and verify signature
  const signedRequest: SignedRequest = {
    method: request.method,
    path: new URL(request.url).pathname,
    query: new URL(request.url).search,
    body,
    timestamp: timestampNum,
    nonce
  };
  
  const payload = buildSignaturePayload(signedRequest);
  const isValid = await verifySignature(payload, signature);
  
  if (!isValid) {
    return { valid: false, error: 'Invalid signature' };
  }
  
  return { valid: true };
}

function buildSignaturePayload(request: SignedRequest): string {
  return [
    request.method.toUpperCase(),
    request.path,
    request.query,
    request.body || '',
    request.timestamp.toString(),
    request.nonce
  ].join('\n');
}

// Nonce store for replay protection
const nonceStore = new Map<string, number>();

// Clean up old nonces every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [nonce, timestamp] of nonceStore.entries()) {
      if (now - timestamp > API_CONFIG.signatureValidityMs * 2) {
        nonceStore.delete(nonce);
      }
    }
  }, 300000);
}

// ===========================
// API AUTHENTICATION
// ===========================

export interface AuthenticatedRequest {
  userId: string;
  apiKey: APIKey;
  permissions: string[];
}

export async function authenticateAPIRequest(
  request: NextRequest,
  body?: string
): Promise<{ authenticated: boolean; auth?: AuthenticatedRequest; error?: string }> {
  // Check for API key
  const apiKeyHeader = request.headers.get(API_CONFIG.apiKeyHeader);
  
  if (apiKeyHeader) {
    const { valid, apiKey, error } = validateAPIKey(apiKeyHeader);
    
    if (!valid) {
      return { authenticated: false, error };
    }
    
    return {
      authenticated: true,
      auth: {
        userId: apiKey!.userId,
        apiKey: apiKey!,
        permissions: apiKey!.permissions
      }
    };
  }
  
  // Check for signed request
  const signature = request.headers.get(API_CONFIG.signatureHeader);
  if (signature) {
    const { valid, error } = await verifyRequestSignature(request, body);
    
    if (!valid) {
      return { authenticated: false, error };
    }
    
    // For signed requests, we need to identify the user another way
    // This would typically be via a session token or user ID header
    return {
      authenticated: true,
      auth: {
        userId: 'signed_user', // Would be extracted from the request
        apiKey: null as any,
        permissions: ['read', 'write']
      }
    };
  }
  
  return { authenticated: false, error: 'No authentication provided' };
}

// ===========================
// PERMISSION CHECKING
// ===========================

export function checkPermission(
  auth: AuthenticatedRequest,
  requiredPermission: string
): boolean {
  // Admin has all permissions
  if (auth.permissions.includes('*')) {
    return true;
  }
  
  return auth.permissions.includes(requiredPermission);
}

export function checkResourceAccess(
  auth: AuthenticatedRequest,
  resource: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  const permission = `${resource}:${action}`;
  
  // Check specific permission
  if (auth.permissions.includes(permission)) {
    return true;
  }
  
  // Check wildcard permission
  const wildcardPermission = `${resource}:*`;
  if (auth.permissions.includes(wildcardPermission)) {
    return true;
  }
  
  // Check global wildcard
  if (auth.permissions.includes('*')) {
    return true;
  }
  
  return false;
}

// ===========================
// WEBHOOK SECURITY
// ===========================

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  
  return result === 0;
}

// ===========================
// IP WHITELISTING
// ===========================

const ipWhitelist = new Set<string>();

export function addToIPWhitelist(ip: string): void {
  ipWhitelist.add(ip);
}

export function removeFromIPWhitelist(ip: string): void {
  ipWhitelist.delete(ip);
}

export function isIPWhitelisted(ip: string): boolean {
  return ipWhitelist.has(ip);
}

export function requireIPWhitelist(
  request: NextRequest
): { allowed: boolean; ip: string } {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfIp || 'unknown';
  
  return {
    allowed: ipWhitelist.size === 0 || ipWhitelist.has(ip),
    ip
  };
}

// ===========================
// CORS SECURITY
// ===========================

const ALLOWED_ORIGINS = [
  'https://maestro.ae',
  'https://app.maestro.ae',
  'https://api.maestro.ae'
];

export function validateOrigin(origin: string | null): boolean {
  if (!origin) return false;
  
  // Allow same-origin requests
  if (origin.includes('localhost') && process.env.NODE_ENV !== 'production') {
    return true;
  }
  
  return ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.maestro.ae')
  );
}

export function getCORSHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': validateOrigin(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-CSRF-Token, X-Maestro-Signature, X-Maestro-Timestamp, X-Maestro-Nonce',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400'
  };
}

// ===========================
// EXPORTS
// ===========================

export { API_CONFIG };
