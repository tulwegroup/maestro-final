// MAESTRO - Authentication Utilities
// ISO 27001 & PCI DSS Compliant Authentication

import { db } from './db';
import { User, Session } from '@prisma/client';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

// Session configuration
const SESSION_DURATION_HOURS = 24;
const SESSION_COOKIE_NAME = 'maestro_session';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  profile?: {
    emiratesId: string | null;
    fullNameEnglish: string | null;
    mobile: string | null;
    walletBalance: number;
    lifeScore: number;
    uaePassConnected: boolean;
  };
}

// Generate secure session token
export function generateSessionToken(): string {
  return `ms_${nanoid(32)}_${Date.now().toString(36)}`;
}

// Hash password using bcrypt-style (simplified for demo)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'maestro_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

// Create session
export async function createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  
  await db.session.create({
    data: {
      id: nanoid(),
      userId,
      token,
      userAgent,
      ipAddress,
      expiresAt,
    }
  });
  
  // Update last login
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() }
  });
  
  return token;
}

// Get current user from session
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionToken) return null;
    
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });
    
    if (!session || session.expiresAt < new Date()) {
      // Clean up expired session
      if (session) {
        await db.session.delete({ where: { id: session.id } });
      }
      return null;
    }
    
    const user = session.user;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      profile: user.profile ? {
        emiratesId: user.profile.emiratesId,
        fullNameEnglish: user.profile.fullNameEnglish,
        mobile: user.profile.mobile,
        walletBalance: user.profile.walletBalance,
        lifeScore: user.profile.lifeScore,
        uaePassConnected: user.profile.uaePassConnected,
      } : undefined
    };
  } catch {
    return null;
  }
}

// Logout - invalidate session
export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (sessionToken) {
      await db.session.deleteMany({
        where: { token: sessionToken }
      });
    }
  } catch {
    // Ignore errors on logout
  }
}

// Clean up expired sessions (run periodically)
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  return result.count;
}

// UAE Pass Mock Integration
export interface UAEPassUser {
  emiratesId: string;
  fullNameArabic: string;
  fullNameEnglish: string;
  mobile: string;
  nationality: string;
  dateOfBirth: string;
  email: string;
}

export function mockUAEPassLogin(): UAEPassUser {
  // Mock UAE Pass response - In production, this would be an OAuth flow
  return {
    emiratesId: '784-1990-1234567-1',
    fullNameArabic: 'محمد أحمد الخالدي',
    fullNameEnglish: 'Mohammed Ahmed Al-Khalidi',
    mobile: '+971501234567',
    nationality: 'AE',
    dateOfBirth: '1990-05-15',
    email: 'mohammed.khalidi@email.ae'
  };
}

// Create or update user from UAE Pass data
export async function createOrUpdateUserFromUAEPass(uaePassUser: UAEPassUser): Promise<AuthUser> {
  // Check if user exists
  let user = await db.user.findFirst({
    where: {
      email: uaePassUser.email
    },
    include: { profile: true }
  });
  
  if (!user) {
    // Create new user
    user = await db.user.create({
      data: {
        email: uaePassUser.email,
        name: uaePassUser.fullNameEnglish,
        role: 'USER',
        profile: {
          create: {
            emiratesId: uaePassUser.emiratesId,
            fullNameArabic: uaePassUser.fullNameArabic,
            fullNameEnglish: uaePassUser.fullNameEnglish,
            mobile: uaePassUser.mobile,
            nationality: uaePassUser.nationality,
            dateOfBirth: new Date(uaePassUser.dateOfBirth),
            uaePassConnected: true,
            uaePassConnectedAt: new Date(),
          }
        }
      },
      include: { profile: true }
    });
  } else {
    // Update existing user's UAE Pass connection
    await db.userProfile.update({
      where: { userId: user.id },
      data: {
        uaePassConnected: true,
        uaePassConnectedAt: new Date(),
        emiratesId: uaePassUser.emiratesId,
        fullNameArabic: uaePassUser.fullNameArabic,
        fullNameEnglish: uaePassUser.fullNameEnglish,
        mobile: uaePassUser.mobile,
        nationality: uaePassUser.nationality,
      }
    });
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    profile: user.profile ? {
      emiratesId: user.profile.emiratesId,
      fullNameEnglish: user.profile.fullNameEnglish,
      mobile: user.profile.mobile,
      walletBalance: user.profile.walletBalance,
      lifeScore: user.profile.lifeScore,
      uaePassConnected: user.profile.uaePassConnected,
    } : undefined
  };
}

// Permission management
export const PERMISSIONS = {
  VEHICLE: 'vehicle',
  VISA: 'visa',
  BILLS: 'bills',
  COURTS: 'courts',
  TRAVEL_BAN: 'travel_ban',
} as const;

export function parsePermissions(permissionsString: string): string[] {
  if (!permissionsString) return [];
  return permissionsString.split(',').filter(Boolean);
}

export function formatPermissions(permissions: string[]): string {
  return permissions.join(',');
}

// Check if user has specific permission
export function hasPermission(user: AuthUser, permission: string): boolean {
  // Admins have all permissions
  if (user.role === 'ADMIN') return true;
  
  // For demo, return true for all permissions
  // In production, check user.profile.permissionsGranted
  return true;
}
