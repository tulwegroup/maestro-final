import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JourneyType, JourneyStatus, PaymentStatus, Entity, TaskStatus } from '@prisma/client';

// GET /api/journeys - Get all journeys for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const where: any = { userId: user.id };
    // Only filter by status if it's a valid status (not 'all')
    if (status && status !== 'all') {
      where.status = status as JourneyStatus;
    }

    const journeys = await db.journey.findMany({
      where,
      include: {
        tasks: {
          orderBy: { priority: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, journeys });
  } catch (error) {
    console.error('Error fetching journeys:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch journeys' }, { status: 500 });
  }
}

// POST /api/journeys - Create new journey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journeyType, title, description, tasks } = body;

    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Calculate total amount from tasks
    const totalAmount = tasks?.reduce((sum: number, t: any) => sum + (t.amount || 0), 0) || 0;

    const journey = await db.journey.create({
      data: {
        userId: user.id,
        journeyType: journeyType as JourneyType,
        title,
        description,
        totalAmount,
        status: JourneyStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        tasks: {
          create: tasks?.map((t: any) => ({
            entity: t.entity as Entity,
            taskType: t.taskType,
            title: t.title,
            description: t.description,
            amount: t.amount || 0,
            priority: t.priority || 1,
            blockingTask: t.blockingTask || false,
            metadata: t.metadata ? JSON.stringify(t.metadata) : null,
            status: TaskStatus.PENDING
          })) || []
        }
      },
      include: { tasks: true }
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'JOURNEY_CREATED',
        resource: 'Journey',
        resourceId: journey.id,
        newValue: JSON.stringify(journey)
      }
    });

    return NextResponse.json({ success: true, journey });
  } catch (error) {
    console.error('Error creating journey:', error);
    return NextResponse.json({ success: false, error: 'Failed to create journey' }, { status: 500 });
  }
}
