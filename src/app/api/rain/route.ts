import { NextRequest, NextResponse } from 'next/server';
import {
  getTickers,
  getCryptoPrices,
  getBalances,
  isConfigured,
  getConfigStatus,
  getMockBalances,
  getMockPrices,
} from '@/lib/rain-exchange';

/**
 * GET /api/rain
 * 
 * Rain Exchange API endpoints
 * 
 * Query params:
 * - action: 'status' | 'prices' | 'tickers' | 'balances'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'status':
        const config = getConfigStatus();
        return NextResponse.json({
          success: true,
          provider: 'Rain Exchange',
          regulated: 'ADGM FSRA (UAE)',
          ...config,
          features: ['buy-sell', 'fiat-ramp', 'wallet-transfer', 'AED-support'],
          timestamp: new Date().toISOString(),
        });

      case 'prices':
        const pricesResult = await getCryptoPrices();
        if (pricesResult.success && pricesResult.prices) {
          return NextResponse.json({
            success: true,
            count: pricesResult.prices.length,
            prices: pricesResult.prices,
            source: 'rain',
            timestamp: new Date().toISOString(),
          });
        }
        // Fallback to mock data
        return NextResponse.json({
          success: true,
          count: getMockPrices().length,
          prices: getMockPrices(),
          source: 'rain-mock',
          note: 'Using mock data - API not connected',
          timestamp: new Date().toISOString(),
        });

      case 'tickers':
        const tickersResult = await getTickers();
        if (tickersResult.success && tickersResult.tickers) {
          return NextResponse.json({
            success: true,
            count: tickersResult.tickers.length,
            tickers: tickersResult.tickers,
            timestamp: new Date().toISOString(),
          });
        }
        return NextResponse.json({
          success: false,
          error: tickersResult.error,
        }, { status: 500 });

      case 'balances':
        if (!isConfigured()) {
          return NextResponse.json({
            success: true,
            balances: getMockBalances(),
            note: 'Using mock data - API not configured',
            timestamp: new Date().toISOString(),
          });
        }
        const balancesResult = await getBalances();
        if (balancesResult.success && balancesResult.balances) {
          return NextResponse.json({
            success: true,
            balances: balancesResult.balances,
            timestamp: new Date().toISOString(),
          });
        }
        return NextResponse.json({
          success: false,
          error: balancesResult.error,
        }, { status: 500 });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: status, prices, tickers, or balances',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Rain API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process Rain request',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
