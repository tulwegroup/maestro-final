// MAESTRO - User Profile API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';

// Get user profile
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      include: { 
        profile: true,
        journeys: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            tasks: true
          }
        }
      }
    });
    
    return NextResponse.json({ user: fullUser });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

// Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const updates = body;
    
    // Update profile
    if (updates.permissions) {
      await db.userProfile.update({
        where: { userId: user.id },
        data: {
          permissionsGranted: Array.isArray(updates.permissions) 
            ? updates.permissions.join(',') 
            : updates.permissions
        }
      });
      
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.PERMISSION_GRANTED,
        resource: 'profile',
        newValue: JSON.stringify(updates.permissions)
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
