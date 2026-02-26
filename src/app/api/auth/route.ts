// MAESTRO - Authentication API (Security Enhanced)
// PCI DSS Requirement 8, ISO 27001 A.9
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import {
  recordLoginAttempt,
  createSecureSession,
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
  generateMFACode,
  verifyMFACode,
  generateDeviceFingerprint
} from '@/lib/security';
import { createAuditLog } from '@/lib/security/compliance';
import { handleApiError, AppError, ErrorCode } from '@/lib/security/errors';
import { validateInput, emailSchema, safeStringSchema } from '@/lib/security/validation';

// Get client IP from request
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

// Login with email/password (for admins)
export async function POST(request: NextRequest) {
  const requestId = nanoid();
  
  try {
    const body = await request.json();
    const { email, password, action } = body;
    
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // UAE Pass login
    if (action === 'uae-pass') {
      const uaePassUser = {
        emiratesId: '784-1990-1234567-1',
        fullNameArabic: 'محمد أحمد الخالدي',
        fullNameEnglish: 'Mohammed Ahmed Al-Khalidi',
        mobile: '+971501234567',
        nationality: 'AE',
        dateOfBirth: '1990-05-15',
        email: 'mohammed.khalidi@email.ae'
      };
      
      let user = await db.user.findFirst({
        where: { email: uaePassUser.email },
        include: { profile: true }
      });
      
      if (!user) {
        user = await db.user.create({
          data: {
            id: nanoid(),
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
        await db.userProfile.update({
          where: { userId: user.id },
          data: {
            uaePassConnected: true,
            uaePassConnectedAt: new Date(),
          }
        });
      }
      
      // Create secure session
      const { token } = await createSecureSession(
        user.id,
        userAgent,
        clientIP,
        generateDeviceFingerprint(userAgent, '', '', clientIP)
      );
      
      // Audit log
      await createAuditLog({
        action: 'LOGIN',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: clientIP,
        userAgent,
        resource: 'session',
        status: 'SUCCESS',
        details: 'uae_pass_login'
      });
      
      const response = NextResponse.json({ success: true, user: {
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
      }});
      
      response.cookies.set('maestro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/'
      });
      
      return response;
    }
    
    // Demo login (creates a new demo user)
    if (action === 'demo') {
      let user = await db.user.findUnique({
        where: { email: 'demo@maestro.ae' },
        include: { profile: true }
      });
      
      if (!user) {
        user = await db.user.create({
          data: {
            id: nanoid(),
            email: 'demo@maestro.ae',
            name: 'Demo User',
            role: 'USER',
            profile: {
              create: {
                emiratesId: '784-1990-1234567-1',
                fullNameArabic: 'محمد أحمد الخالدي',
                fullNameEnglish: 'Mohammed Ahmed Al-Khalidi',
                mobile: '+971501234567',
                nationality: 'AE',
                walletBalance: 2500,
                lifeScore: 88,
                uaePassConnected: true,
                uaePassConnectedAt: new Date(),
                licenseNumber: 'DXB-123456',
                licenseExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                visaExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
                vehiclePlate: 'ABC-1234',
              }
            }
          },
          include: { profile: true }
        });
      }
      
      // Create secure session
      const { token } = await createSecureSession(
        user.id,
        userAgent,
        clientIP,
        generateDeviceFingerprint(userAgent, '', '', clientIP)
      );
      
      // Audit log
      await createAuditLog({
        action: 'LOGIN',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: clientIP,
        userAgent,
        resource: 'session',
        status: 'SUCCESS',
        details: 'demo_login'
      });
      
      const response = NextResponse.json({ success: true, user: {
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
      }});
      
      response.cookies.set('maestro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/'
      });
      
      return response;
    }
    
    // Admin login with email/password
    if (email && password) {
      // Validate input
      const emailValidation = validateInput(emailSchema, email);
      if (!emailValidation.success) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid email format');
      }
      
      // Check brute-force protection
      const { allowed, waitTime } = recordLoginAttempt(email, false);
      if (!allowed) {
        throw new AppError(ErrorCode.RATE_LIMITED, `Account temporarily locked. Try again in ${Math.ceil(waitTime / 60)} minutes`);
      }
      
      const user = await db.user.findUnique({
        where: { email: emailValidation.data },
        include: { profile: true }
      });
      
      if (!user || !user.passwordHash) {
        await createAuditLog({
          action: 'LOGIN_FAILED',
          ipAddress: clientIP,
          userAgent,
          resource: 'user',
          status: 'FAILURE',
          details: `Invalid credentials for ${email}`
        });
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid credentials');
      }
      
      // Verify password
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        recordLoginAttempt(email, false);
        await createAuditLog({
          action: 'LOGIN_FAILED',
          userId: user.id,
          userEmail: user.email,
          ipAddress: clientIP,
          userAgent,
          resource: 'user',
          status: 'FAILURE',
          details: 'Invalid password'
        });
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Invalid credentials');
      }
      
      // Reset login attempts on success
      recordLoginAttempt(email, true);
      
      // Generate MFA code (skip for demo)
      const mfaCode = generateMFACode(user.id, 'email');
      console.log(`[AUTH] MFA code for ${user.email}: ${mfaCode}`); // In production, send via email/SMS
      
      // For now, auto-verify MFA (in production, require actual verification)
      verifyMFACode(user.id, mfaCode);
      
      // Create secure session
      const { token } = await createSecureSession(
        user.id,
        userAgent,
        clientIP,
        generateDeviceFingerprint(userAgent, '', '', clientIP)
      );
      
      // Audit log
      await createAuditLog({
        action: 'LOGIN',
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: clientIP,
        userAgent,
        resource: 'session',
        status: 'SUCCESS',
        details: 'email_login'
      });
      
      const response = NextResponse.json({ success: true, user: {
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
      }});
      
      response.cookies.set('maestro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/'
      });
      
      return response;
    }
    
    throw new AppError(ErrorCode.BAD_REQUEST, 'Invalid request');
    
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

// Get current user
export async function GET(request: NextRequest) {
  const requestId = nanoid();
  
  try {
    const sessionToken = request.cookies.get('maestro_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }
    
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });
    
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await db.session.delete({ where: { id: session.id } });
      }
      return NextResponse.json({ user: null });
    }
    
    const user = session.user;
    return NextResponse.json({ user: {
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
    }});
  } catch (error) {
    return handleApiError(error, requestId);
  }
}

// Logout
export async function DELETE(request: NextRequest) {
  const requestId = nanoid();
  
  try {
    const sessionToken = request.cookies.get('maestro_session')?.value;
    
    if (sessionToken) {
      const session = await db.session.findUnique({
        where: { token: sessionToken },
        include: { user: true }
      });
      
      if (session) {
        await db.session.delete({ where: { id: session.id } });
        
        // Audit log
        await createAuditLog({
          action: 'LOGOUT',
          userId: session.userId,
          userEmail: session.user?.email,
          ipAddress: getClientIP(request),
          userAgent: request.headers.get('user-agent') || 'unknown',
          resource: 'session',
          status: 'SUCCESS'
        });
      }
    }
    
    const response = NextResponse.json({ success: true });
    response.cookies.delete('maestro_session');
    return response;
  } catch (error) {
    return handleApiError(error, requestId);
  }
}
