// MAESTRO - Payment API
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logAudit, AUDIT_ACTIONS } from '@/lib/audit';
import { generatePaymentReference } from '@/lib/crypto';
import { nanoid } from 'nanoid';

// Process payment
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      journeyId, 
      amount, 
      paymentMethod,
      selectedTasks 
    } = body;
    
    // Get user profile
    const userProfile = await db.userProfile.findUnique({
      where: { userId: user.id }
    });
    
    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // For wallet payments, check balance
    if (paymentMethod === 'MAESTRO_WALLET') {
      if (userProfile.walletBalance < amount) {
        return NextResponse.json({ 
          error: 'Insufficient wallet balance',
          currentBalance: userProfile.walletBalance 
        }, { status: 400 });
      }
    }
    
    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        id: nanoid(),
        userId: user.id,
        type: 'JOURNEY_PAYMENT',
        amount,
        currency: 'AED',
        paymentMethod: paymentMethod as any,
        paymentReference: generatePaymentReference(),
        journeyId,
        status: paymentMethod === 'MAESTRO_WALLET' ? 'COMPLETED' : 'PENDING'
      }
    });
    
    // Deduct from wallet if using wallet
    if (paymentMethod === 'MAESTRO_WALLET') {
      await db.userProfile.update({
        where: { userId: user.id },
        data: {
          walletBalance: { decrement: amount }
        }
      });
      
      await logAudit({
        userId: user.id,
        action: AUDIT_ACTIONS.WALLET_DEDUCTED,
        resource: 'wallet',
        newValue: JSON.stringify({ amount, transactionId: transaction.id })
      });
    }
    
    // Update journey payment status
    if (journeyId) {
      await db.journey.update({
        where: { id: journeyId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod,
          paymentReference: transaction.paymentReference,
          paymentDate: new Date()
        }
      });
      
      // Update selected tasks
      if (selectedTasks && selectedTasks.length > 0) {
        await db.task.updateMany({
          where: { 
            id: { in: selectedTasks },
            journeyId 
          },
          data: { status: 'IN_PROGRESS' }
        });
      }
    }
    
    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.PAYMENT_COMPLETED,
      resource: 'transaction',
      resourceId: transaction.id,
      newValue: JSON.stringify({ amount, method: paymentMethod, journeyId })
    });
    
    return NextResponse.json({ 
      success: true, 
      transaction: {
        id: transaction.id,
        reference: transaction.paymentReference,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
  }
}

// Top up wallet
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { amount, paymentMethod } = body;
    
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    
    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        id: nanoid(),
        userId: user.id,
        type: 'WALLET_TOP_UP',
        amount,
        currency: 'AED',
        paymentMethod: paymentMethod as any,
        paymentReference: generatePaymentReference(),
        status: 'COMPLETED'
      }
    });
    
    // Update wallet balance
    await db.userProfile.update({
      where: { userId: user.id },
      data: {
        walletBalance: { increment: amount }
      }
    });
    
    await logAudit({
      userId: user.id,
      action: AUDIT_ACTIONS.WALLET_TOPUP,
      resource: 'wallet',
      newValue: JSON.stringify({ amount, transactionId: transaction.id })
    });
    
    return NextResponse.json({ 
      success: true,
      transaction: {
        id: transaction.id,
        reference: transaction.paymentReference,
        amount: transaction.amount
      }
    });
  } catch (error) {
    console.error('Wallet top-up error:', error);
    return NextResponse.json({ error: 'Top-up failed' }, { status: 500 });
  }
}
