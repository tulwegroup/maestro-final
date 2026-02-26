import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PaymentMethod, TransactionType, TransactionStatus } from '@prisma/client';

// GET /api/wallet - Get wallet balance and transactions
export async function GET(request: NextRequest) {
  try {
    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const transactions = await db.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      wallet: {
        balance: user.profile.walletBalance,
        currency: user.profile.walletCurrency,
        btcBalance: user.profile.btcBalance,
        usdtTrc20Balance: user.profile.usdtTrc20Balance,
        usdtErc20Balance: user.profile.usdtErc20Balance,
        usdcSolBalance: user.profile.usdcSolBalance,
        usdcPolygonBalance: user.profile.usdcPolygonBalance
      },
      transactions
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

// POST /api/wallet - Top up wallet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, paymentMethod } = body;

    const user = await db.user.findFirst({
      where: { email: 'demo@maestro.ae' },
      include: { profile: true }
    });

    if (!user || !user.profile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        type: TransactionType.WALLET_TOP_UP,
        amount,
        currency: 'AED',
        paymentMethod: paymentMethod as PaymentMethod,
        status: TransactionStatus.COMPLETED,
        description: `Wallet top-up via ${paymentMethod}`,
        paymentReference: `TOP-${Date.now()}`
      }
    });

    // Update wallet balance
    const updatedProfile = await db.userProfile.update({
      where: { userId: user.id },
      data: {
        walletBalance: { increment: amount }
      }
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'WALLET_TOP_UP',
        resource: 'Transaction',
        resourceId: transaction.id,
        newValue: JSON.stringify({ amount, paymentMethod })
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      newBalance: updatedProfile.walletBalance
    });
  } catch (error) {
    console.error('Error topping up wallet:', error);
    return NextResponse.json({ success: false, error: 'Failed to top up wallet' }, { status: 500 });
  }
}
