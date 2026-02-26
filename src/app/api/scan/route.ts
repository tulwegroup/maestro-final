import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JourneyType, JourneyStatus, PaymentStatus, Entity, TaskStatus } from '@prisma/client';

// Demo tasks that would be discovered from real API integrations
const DEMO_DISCOVERIES = [
  {
    entity: Entity.RTA,
    taskType: 'traffic_fine',
    title: 'Traffic Fine - Speeding',
    description: 'Speeding violation on Sheikh Zayed Road',
    amount: 600,
    priority: 3,
    blockingTask: true,
    metadata: { fineNumber: 'DF-2025-8192', location: 'Sheikh Zayed Road', date: '2025-12-15' }
  },
  {
    entity: Entity.DEWA,
    taskType: 'bill_payment',
    title: 'DEWA Bill - December 2025',
    description: 'Electricity and water bill for December',
    amount: 450.50,
    priority: 2,
    blockingTask: false,
    metadata: { billNumber: 'DEWA-1730000000', period: 'December 2025' }
  },
  {
    entity: Entity.DUBAI_POLICE,
    taskType: 'police_fine',
    title: 'Parking Violation Fine',
    description: 'Expired parking meter in Downtown Dubai',
    amount: 200,
    priority: 2,
    blockingTask: false,
    metadata: { fineNumber: 'PK-2025-4521' }
  },
  {
    entity: Entity.SALIK,
    taskType: 'toll_charges',
    title: 'Salik Toll Balance',
    description: 'Low balance - needs top-up',
    amount: 100,
    priority: 1,
    blockingTask: false,
    metadata: { accountNumber: 'SALIK-123456', currentBalance: -50 }
  },
  {
    entity: Entity.ETISALAT,
    taskType: 'telecom_bill',
    title: 'Etisalat Bill - January 2026',
    description: 'Mobile and internet package',
    amount: 599,
    priority: 2,
    blockingTask: false,
    metadata: { accountNumber: 'ETI-789012', period: 'January 2026' }
  }
];

// POST /api/scan - Scan for new issues (simulates API calls)
export async function POST(request: NextRequest) {
  try {
    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check for existing pending journey
    const existingJourney = await db.journey.findFirst({
      where: {
        userId: user.id,
        status: JourneyStatus.PENDING
      }
    });

    if (existingJourney) {
      return NextResponse.json({
        success: true,
        message: 'Existing pending journey found',
        journey: existingJourney,
        newItems: 0
      });
    }

    // Simulate API scanning delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create new journey with discovered items
    const totalAmount = DEMO_DISCOVERIES.reduce((sum, t) => sum + t.amount, 0);
    
    const journey = await db.journey.create({
      data: {
        userId: user.id,
        journeyType: JourneyType.COMPLETE_CHECKUP,
        title: 'Complete Checkup - February 2026',
        description: 'Full scan of all UAE services and pending items',
        totalAmount,
        status: JourneyStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        tasks: {
          create: DEMO_DISCOVERIES.map(t => ({
            ...t,
            metadata: JSON.stringify(t.metadata),
            status: TaskStatus.PENDING
          }))
        }
      },
      include: { tasks: true }
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'SCAN_COMPLETED',
        resource: 'Journey',
        resourceId: journey.id,
        newValue: JSON.stringify({ itemsFound: journey.tasks.length, totalAmount })
      }
    });

    return NextResponse.json({
      success: true,
      message: `Found ${journey.tasks.length} items requiring attention`,
      journey,
      newItems: journey.tasks.length
    });
  } catch (error) {
    console.error('Error scanning for issues:', error);
    return NextResponse.json({ success: false, error: 'Failed to scan for issues' }, { status: 500 });
  }
}
