// MAESTRO - Enhanced Authentication Security
// MFA, Brute-force Protection, Session Hardening
// PCI DSS Requirement 8, ISO 27001 A.9

import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

// ===========================
// CONFIGURATION
// ===========================

const AUTH_CONFIG = {
  // Session
  sessionDurationHours: 24,
  maxConcurrentSessions: 5,
  sessionCookieName: 'maestro_session',
  mfaCookieName: 'maestro_mfa_verified',
  
  // Brute-force protection
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  progressiveDelay: true,
  
  // MFA
  mfaCodeLength: 6,
  mfaCodeExpiryMinutes: 5,
  mfaRequiredForSensitive: true,
  
  // Password
  minPasswordLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  passwordHistoryCount: 5,
  passwordExpiryDays: 90,
  
  // Device fingerprinting
  enableDeviceFingerprinting: true,
  trustedDeviceDays: 30
};

// ===========================
// BRUTE-FORCE PROTECTION
// ===========================

interface LoginAttempt {
  email: string;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();

export function recordLoginAttempt(email: string, success: boolean): { allowed: boolean; waitTime: number } {
  const now = Date.now();
  const key = email.toLowerCase();
  let attempt = loginAttempts.get(key);
  
  if (!attempt) {
    attempt = {
      email: key,
      attempts: 0,
      firstAttempt: now,
      lastAttempt: now,
      lockedUntil: null
    };
  }
  
  // Check if locked
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const waitTime = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { allowed: false, waitTime };
  }
  
  // Reset if lockout expired
  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    attempt.attempts = 0;
    attempt.lockedUntil = null;
    attempt.firstAttempt = now;
  }
  
  if (success) {
    // Reset on successful login
    loginAttempts.delete(key);
    return { allowed: true, waitTime: 0 };
  }
  
  // Record failed attempt
  attempt.attempts++;
  attempt.lastAttempt = now;
  
  // Check for lockout
  if (attempt.attempts >= AUTH_CONFIG.maxLoginAttempts) {
    attempt.lockedUntil = now + AUTH_CONFIG.lockoutDurationMinutes * 60 * 1000;
    loginAttempts.set(key, attempt);
    
    // Log security event
    logAuthSecurityEvent('ACCOUNT_LOCKED', email, { attempts: attempt.attempts });
    
    return { allowed: false, waitTime: AUTH_CONFIG.lockoutDurationMinutes * 60 };
  }
  
  loginAttempts.set(key, attempt);
  
  // Progressive delay
  const delaySeconds = AUTH_CONFIG.progressiveDelay ? 
    Math.min(Math.pow(2, attempt.attempts), 60) : 0;
  
  return { allowed: true, waitTime: delaySeconds };
}

export function getLoginStatus(email: string): { attempts: number; lockedUntil: number | null } {
  const attempt = loginAttempts.get(email.toLowerCase());
  if (!attempt) {
    return { attempts: 0, lockedUntil: null };
  }
  return { attempts: attempt.attempts, lockedUntil: attempt.lockedUntil };
}

// ===========================
// MFA (Multi-Factor Authentication)
// ===========================

interface MFACode {
  userId: string;
  code: string;
  createdAt: number;
  verified: boolean;
  method: 'sms' | 'email' | 'totp' | 'backup';
}

const mfaCodes = new Map<string, MFACode>();

export function generateMFACode(userId: string, method: 'sms' | 'email' = 'email'): string {
  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  const mfaData: MFACode = {
    userId,
    code,
    createdAt: Date.now(),
    verified: false,
    method
  };
  
  // Store with hash as key
  const key = `mfa:${userId}`;
  mfaCodes.set(key, mfaData);
  
  // Set expiry
  setTimeout(() => {
    mfaCodes.delete(key);
  }, AUTH_CONFIG.mfaCodeExpiryMinutes * 60 * 1000);
  
  return code;
}

export function verifyMFACode(userId: string, code: string): { valid: boolean; reason?: string } {
  const key = `mfa:${userId}`;
  const mfaData = mfaCodes.get(key);
  
  if (!mfaData) {
    return { valid: false, reason: 'Code expired or not found' };
  }
  
  // Check expiry
  const expiryTime = AUTH_CONFIG.mfaCodeExpiryMinutes * 60 * 1000;
  if (Date.now() - mfaData.createdAt > expiryTime) {
    mfaCodes.delete(key);
    return { valid: false, reason: 'Code expired' };
  }
  
  // Check attempts (prevent brute-force on MFA)
  const verifyKey = `mfa_verify:${userId}`;
  const attempts = mfaCodes.get(verifyKey);
  if (attempts && attempts.attempts >= 3) {
    return { valid: false, reason: 'Too many failed attempts. Request a new code.' };
  }
  
  // Verify code (timing-safe comparison)
  if (!timingSafeEqual(code, mfaData.code)) {
    // Track failed attempts
    const currentAttempts = attempts?.attempts || 0;
    mfaCodes.set(verifyKey, { 
      ...mfaData, 
      code: '', 
      attempts: currentAttempts + 1 
    } as MFACode & { attempts: number });
    return { valid: false, reason: 'Invalid code' };
  }
  
  // Mark as verified
  mfaData.verified = true;
  mfaCodes.delete(verifyKey);
  
  return { valid: true };
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
// SESSION HARDENING
// ===========================

export interface SecureSession {
  id: string;
  userId: string;
  token: string;
  userAgent: string;
  ipAddress: string;
  deviceFingerprint: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
  mfaVerified: boolean;
  isTrustedDevice: boolean;
}

export async function createSecureSession(
  userId: string,
  userAgent: string,
  ipAddress: string,
  deviceFingerprint?: string
): Promise<{ token: string; sessionId: string }> {
  // Check concurrent sessions
  const existingSessions = await db.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  
  // Remove oldest sessions if over limit
  if (existingSessions.length >= AUTH_CONFIG.maxConcurrentSessions) {
    const sessionsToRemove = existingSessions.slice(AUTH_CONFIG.maxConcurrentSessions - 1);
    for (const session of sessionsToRemove) {
      await db.session.delete({ where: { id: session.id } });
    }
  }
  
  // Generate secure token
  const token = generateSecureToken();
  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + AUTH_CONFIG.sessionDurationHours * 60 * 60 * 1000);
  
  // Create session
  await db.session.create({
    data: {
      id: sessionId,
      userId,
      token,
      userAgent,
      ipAddress,
      expiresAt,
      createdAt: new Date()
    }
  });
  
  // Log session creation
  logAuthSecurityEvent('SESSION_CREATED', userId, { 
    sessionId, 
    ipAddress, 
    userAgent: userAgent.substring(0, 100) 
  });
  
  return { token, sessionId };
}

export async function validateSecureSession(token: string): Promise<{ 
  valid: boolean; 
  userId?: string; 
  needsMFA?: boolean;
  reason?: string 
}> {
  const session = await db.session.findUnique({
    where: { token },
    include: { user: { include: { profile: true } } }
  });
  
  if (!session) {
    return { valid: false, reason: 'Session not found' };
  }
  
  // Check expiry
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return { valid: false, reason: 'Session expired' };
  }
  
  // Check if user is active
  if (!session.user.isActive) {
    return { valid: false, reason: 'User account is disabled' };
  }
  
  // Update last activity (throttled)
  const lastActivityKey = `activity:${session.id}`;
  // In production, use Redis for this
  
  return { 
    valid: true, 
    userId: session.userId,
    needsMFA: AUTH_CONFIG.mfaRequiredForSensitive && !session.userAgent?.includes('MFA_VERIFIED')
  };
}

export async function terminateSession(token: string): Promise<void> {
  await db.session.deleteMany({
    where: { token }
  });
}

export async function terminateAllUserSessions(userId: string): Promise<number> {
  const result = await db.session.deleteMany({
    where: { userId }
  });
  return result.count;
}

// ===========================
// PASSWORD SECURITY
// ===========================

export interface PasswordPolicy {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
}

export function validatePasswordPolicy(password: string): PasswordPolicy {
  const errors: string[] = [];
  let strength: PasswordPolicy['strength'] = 'weak';
  
  // Length check
  if (password.length < AUTH_CONFIG.minPasswordLength) {
    errors.push(`Password must be at least ${AUTH_CONFIG.minPasswordLength} characters`);
  }
  
  // Complexity checks
  if (AUTH_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (AUTH_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (AUTH_CONFIG.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (AUTH_CONFIG.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Common password check
  const commonPasswords = [
    'password', 'Password1!', '123456', 'qwerty', 'admin',
    'letmein', 'welcome', 'monkey', 'password123'
  ];
  if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
    errors.push('Password contains common patterns');
  }
  
  // Calculate strength
  const strengthScore = calculatePasswordStrength(password);
  if (strengthScore >= 80) strength = 'very-strong';
  else if (strengthScore >= 60) strength = 'strong';
  else if (strengthScore >= 40) strength = 'medium';
  
  return {
    valid: errors.length === 0,
    errors,
    strength
  };
}

function calculatePasswordStrength(password: string): number {
  let score = 0;
  
  // Length
  score += Math.min(password.length * 4, 40);
  
  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  
  // Patterns
  if (!/(.)\1{2,}/.test(password)) score += 10; // No repeated characters
  if (!/[a-z]{3,}/i.test(password)) score += 5; // No dictionary words
  
  return Math.min(score, 100);
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.randomUUID();
  const data = encoder.encode(password + salt + process.env.NEXTAUTH_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Store salt with hash (format: salt:hash)
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt + process.env.NEXTAUTH_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const newHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return timingSafeEqual(hash, newHash);
}

// ===========================
// DEVICE FINGERPRINTING
// ===========================

export function generateDeviceFingerprint(
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
  ip: string
): string {
  const components = [
    userAgent.substring(0, 100),
    acceptLanguage,
    acceptEncoding,
    ip
  ].join('|');
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `fp_${Math.abs(hash).toString(16)}`;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function generateSecureToken(): string {
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

function logAuthSecurityEvent(
  event: string,
  identifier: string,
  details: Record<string, unknown>
): void {
  console.log(`[AUTH_SECURITY] ${event}: ${identifier}`, JSON.stringify(details));
  
  // In production, send to security monitoring system
  // Could also store in database for audit trail
}

// ===========================
// EXPORTS
// ===========================

export {
  AUTH_CONFIG,
  loginAttempts,
  mfaCodes
};
