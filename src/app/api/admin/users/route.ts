import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    if (role !== 'all') {
      where.role = role.toUpperCase();
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: { journeys: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      db.user.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name || user.profile?.fullNameEnglish || 'Unknown',
        role: user.role.toLowerCase(),
        status: user.isActive ? 'active' : 'suspended',
        walletBalance: user.profile?.walletBalance || 0,
        journeysCount: user._count.journeys,
        lastActive: user.lastLoginAt?.toISOString() || user.updatedAt.toISOString(),
        createdAt: user.createdAt.toISOString(),
        uaePassConnected: user.profile?.uaePassConnected || false,
        aaniLinked: user.profile?.aaniLinked || false,
        phone: user.profile?.mobile || '',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role } = body;

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        role: role?.toUpperCase() || 'USER',
      }
    });

    // Create profile
    await db.userProfile.create({
      data: {
        userId: user.id,
        fullNameEnglish: name,
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.toLowerCase(),
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
