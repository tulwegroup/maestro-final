import { NextRequest, NextResponse } from 'next/server';
import { getProvidersStatus as getCryptoProviders, getUnifiedCryptoPrices } from '@/lib/crypto-provider';
import { getProvidersStatus as getBankingProviders, getAllAccounts, getTotalBalance } from '@/lib/banking-provider';

/**
 * GET /api/fintech
 * 
 * Unified API for all fintech integrations (crypto + banking)
 * 
 * Query params:
 * - action: 'overview' | 'providers' | 'prices' | 'accounts'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'overview';

  try {
    switch (action) {
      case 'overview':
        // Get all data for dashboard overview
        const [cryptoData, bankingAccounts, bankingBalance] = await Promise.all([
          getUnifiedCryptoPrices(),
          getAllAccounts(),
          getTotalBalance(),
        ]);

        const cryptoProviders = getCryptoProviders();
        const bankingProviders = getBankingProviders();

        return NextResponse.json({
          success: true,
          overview: {
            crypto: {
              prices: cryptoData.prices.slice(0, 5),
              sources: cryptoData.sources,
            },
            banking: {
              totalBalance: bankingBalance.total,
              byProvider: bankingBalance.byProvider,
              accountsCount: bankingAccounts.accounts.length,
            },
          },
          providers: {
            crypto: cryptoProviders,
            banking: bankingProviders,
          },
          timestamp: new Date().toISOString(),
        });

      case 'providers':
        const crypto = getCryptoProviders();
        const banking = getBankingProviders();

        return NextResponse.json({
          success: true,
          providers: {
            crypto,
            banking,
            summary: {
              total: crypto.length + banking.length,
              active: [...crypto, ...banking].filter(p => p.status === 'online' || p.configured).length,
            },
          },
          timestamp: new Date().toISOString(),
        });

      case 'prices':
        const prices = await getUnifiedCryptoPrices();
        return NextResponse.json({
          success: true,
          ...prices,
          timestamp: new Date().toISOString(),
        });

      case 'accounts':
        const accounts = await getAllAccounts();
        return NextResponse.json({
          success: true,
          ...accounts,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: overview, providers, prices, or accounts',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Fintech API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process fintech request',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
