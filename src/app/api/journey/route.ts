// MAESTRO - Journey API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';
import { nanoid } from 'nanoid';

// Get all journeys for user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const role = user.role;
    
    let whereClause: any = {};
    
    if (role === 'ADMIN' || role === 'OPERATOR') {
      // Admins see all journeys
      if (status) {
        whereClause.status = status;
      }
    } else {
      // Regular users see only their own
      whereClause.userId = user.id;
      if (status) {
        whereClause.status = status;
      }
    }
    
    const journeys = await db.journey.findMany({
      where: whereClause,
      include: {
        tasks: {
          orderBy: { priority: 'asc' }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ journeys });
  } catch (error) {
    console.error('Get journeys error:', error);
    return NextResponse.json({ error: 'Failed to get journeys' }, { status: 500 });
  }
}

// Create new journey
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { journeyType, title, tasks } = body;
    
    const journey = await db.journey.create({
      data: {
        id: nanoid(),
        userId: user.id,
        journeyType: journeyType || 'CUSTOM',
        title: title || 'New Journey',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        totalAmount: tasks?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0,
        tasks: tasks ? {
          create: tasks.map((t: any, i: number) => ({
            id: nanoid(),
            entity: t.entity || 'CUSTOM',
            taskType: t.taskType || 'general',
            title: t.title,
            description: t.description,
            amount: t.amount || 0,
            priority: i + 1,
            metadata: t.metadata ? JSON.stringify(t.metadata) : null
          }))
        } : undefined
      },
      include: {
        tasks: true
      }
    });
    
    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.JOURNEY_CREATED,
      resource: 'journey',
      resourceId: journey.id,
      newValue: JSON.stringify({ type: journeyType, tasksCount: journey.tasks.length })
    });
    
    return NextResponse.json({ journey });
  } catch (error) {
    console.error('Create journey error:', error);
    return NextResponse.json({ error: 'Failed to create journey' }, { status: 500 });
  }
}
