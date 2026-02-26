import { NextRequest, NextResponse } from 'next/server';
import {
  getProvidersStatus,
  getAllAccounts,
  getTotalBalance,
  getRecentTransactions,
  findBestPaymentRoute,
} from '@/lib/banking-provider';

/**
 * GET /api/banking
 * 
 * Query params:
 * - action: 'status' | 'accounts' | 'balance' | 'transactions' | 'route'
 * - limit: number of transactions to return
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    switch (action) {
      case 'status':
        const providers = getProvidersStatus();
        return NextResponse.json({
          success: true,
          providers,
          timestamp: new Date().toISOString(),
        });

      case 'accounts':
        const { accounts, errors: accountErrors } = await getAllAccounts();
        return NextResponse.json({
          success: true,
          count: accounts.length,
          accounts,
          errors: accountErrors.length > 0 ? accountErrors : undefined,
          timestamp: new Date().toISOString(),
        });

      case 'balance':
        const balance = await getTotalBalance();
        return NextResponse.json({
          success: true,
          ...balance,
          timestamp: new Date().toISOString(),
        });

      case 'transactions':
        const { transactions, errors: txnErrors } = await getRecentTransactions(limit);
        return NextResponse.json({
          success: true,
          count: transactions.length,
          transactions,
          errors: txnErrors.length > 0 ? txnErrors : undefined,
          timestamp: new Date().toISOString(),
        });

      case 'route':
        const amount = parseFloat(searchParams.get('amount') || '1000');
        const currency = searchParams.get('currency') || 'AED';
        const route = await findBestPaymentRoute(amount, currency);
        return NextResponse.json({
          success: true,
          route,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: status, accounts, balance, transactions, or route',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Banking API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process banking request',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
