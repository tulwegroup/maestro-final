import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    // For demo, use a fixed user ID or create one
    let user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' },
      include: { profile: true }
    });

    // Create demo user if not exists
    if (!user) {
      user = await db.user.create({
        data: {
          email: 'demo@maestro.ae',
          name: 'Mohamed Al-Rashid',
          role: 'USER',
          profile: {
            create: {
              emiratesId: '784-1990-1234567-1',
              fullNameArabic: 'محمد الراشد',
              fullNameEnglish: 'Mohamed Al-Rashid',
              mobile: '+971501234567',
              mobileVerified: true,
              nationality: 'UAE',
              visaExpiry: new Date('2026-08-15'),
              licenseNumber: 'DXB-123456',
              licenseExpiry: new Date('2026-03-20'),
              vehiclePlate: 'DXB-A1234',
              vehicleExpiry: new Date('2026-05-10'),
              lifeScore: 88,
              uaePassConnected: true,
              walletBalance: 5000,
              aaniLinked: true,
              aaniAccountNumber: 'AANI-784199012345671',
              btcBalance: 0.05,
              usdtTrc20Balance: 1000,
              subscriptionTier: 'premium'
            }
          }
        },
        include: { profile: true }
      });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' }
    });

    if (!user || !user.profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updatedProfile = await db.userProfile.update({
      where: { userId: user.id },
      data: body
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATE',
        resource: 'UserProfile',
        resourceId: updatedProfile.id,
        newValue: JSON.stringify(body)
      }
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
  }
}
