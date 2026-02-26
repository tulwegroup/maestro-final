import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { JourneyStatus, PaymentStatus, TaskStatus, PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';

// POST /api/payment - Process payment for journey
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { journeyId, taskIds, paymentMethod, amount } = body;

    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Check wallet balance if using wallet
    if (paymentMethod === 'MAESTRO_WALLET' && user.profile.walletBalance < amount) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insufficient wallet balance' 
      }, { status: 400 });
    }

    // Start transaction
    const result = await db.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type: TransactionType.JOURNEY_PAYMENT,
          amount,
          currency: 'AED',
          paymentMethod: paymentMethod as PaymentMethod,
          status: TransactionStatus.COMPLETED,
          description: `Payment for journey ${journeyId}`,
          paymentReference: `PAY-${Date.now()}`,
          journeyId
        }
      });

      // Update journey
      const journey = await tx.journey.update({
        where: { id: journeyId },
        data: {
          status: JourneyStatus.PROCESSING,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod,
          paymentDate: new Date(),
          startedAt: new Date()
        }
      });

      // Update tasks
      if (taskIds && taskIds.length > 0) {
        await tx.task.updateMany({
          where: { id: { in: taskIds } },
          data: { status: TaskStatus.IN_PROGRESS }
        });
      }

      // Deduct from wallet if applicable
      if (paymentMethod === 'MAESTRO_WALLET') {
        await tx.userProfile.update({
          where: { userId: user.id },
          data: { walletBalance: { decrement: amount } }
        });
      }

      return { transaction, journey };
    });

    // Simulate async processing - mark tasks as completed after delay
    setTimeout(async () => {
      try {
        await db.task.updateMany({
          where: { journeyId },
          data: { 
            status: TaskStatus.COMPLETED,
            completedAt: new Date()
          }
        });

        await db.journey.update({
          where: { id: journeyId },
          data: {
            status: JourneyStatus.COMPLETED,
            completedAt: new Date()
          }
        });

        // Audit log
        await db.auditLog.create({
          data: {
            userId: user.id,
            action: 'JOURNEY_COMPLETED',
            resource: 'Journey',
            resourceId: journeyId
          }
        });
      } catch (err) {
        console.error('Error completing journey:', err);
      }
    }, 3000);

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'PAYMENT_COMPLETED',
        resource: 'Transaction',
        resourceId: result.transaction.id,
        newValue: JSON.stringify({ journeyId, amount, paymentMethod })
      }
    });

    return NextResponse.json({
      success: true,
      transaction: result.transaction,
      journey: result.journey
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 });
  }
}
