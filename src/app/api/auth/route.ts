// MAESTRO - Authentication API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, createSession, getCurrentUser, logout, mockUAEPassLogin, createOrUpdateUserFromUAEPass } from '@/lib/auth';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';
import { nanoid } from 'nanoid';

// Login with email/password (for admins)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, action } = body;
    
    // UAE Pass login
    if (action === 'uae-pass') {
      const uaePassUser = mockUAEPassLogin();
      const user = await createOrUpdateUserFromUAEPass(uaePassUser);
      const token = await createSession(user.id);
      
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: 'session',
        newValue: 'uae_pass_login'
      });
      
      const response = NextResponse.json({ success: true, user });
      response.cookies.set('maestro_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      });
      
      return response;
    }
    
    // Demo login (creates a new demo user)
    if (action === 'demo') {
      let user = await db.user.findUnique({
        where: { email: 'demo@maestro.ae' }
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
                licenseExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
                visaExpiry: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days
                vehiclePlate: 'ABC-1234',
              }
            }
          },
          include: { profile: true }
        });
      }
      
      const token = await createSession(user.id);
      
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: 'session',
        newValue: 'demo_login'
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
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/'
      });
      
      return response;
    }
    
    // Admin login
    if (email && password) {
      const user = await db.user.findUnique({
        where: { email },
        include: { profile: true }
      });
      
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      const isValid = await (await import('@/lib/auth')).verifyPassword(password, user.passwordHash);
      if (!isValid) {
        await logAudit({
          action: AUDIT_ACTIONS.LOGIN_FAILED,
          resource: 'user',
          newValue: email
        });
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      
      const token = await createSession(user.id);
      
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.LOGIN,
        resource: 'session',
        newValue: 'email_login'
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
        sameSite: 'lax',
        maxAge: 24 * 60 * 60,
        path: '/'
      });
      
      return response;
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// Get current user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}

// Logout
export async function DELETE() {
  try {
    await logout();
    const response = NextResponse.json({ success: true });
    response.cookies.delete('maestro_session');
    return response;
  } catch {
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
