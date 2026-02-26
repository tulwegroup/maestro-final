import { NextRequest, NextResponse } from 'next/server';
import { 
  getCryptoPrices, 
  convertToAED, 
  getSystemStatus,
  getApiInfo,
  fetch24hrTicker
} from '@/lib/binance';

/**
 * GET /api/binance/prices
 * 
 * Query params:
 * - symbol: Get price for specific symbol (e.g., BTC, ETH)
 * - convert: Convert amount to AED (requires symbol and amount)
 * - amount: Amount to convert
 * - status: Get API status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const convert = searchParams.get('convert');
  const amount = searchParams.get('amount');
  const status = searchParams.get('status');
  const ticker = searchParams.get('ticker');

  try {
    // Get API status
    if (status === 'true') {
      const systemStatus = await getSystemStatus();
      const apiInfo = getApiInfo();
      return NextResponse.json({
        success: true,
        api: apiInfo,
        system: systemStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // Get specific ticker
    if (ticker) {
      const tickerSymbol = ticker.toUpperCase() + 'USDT';
      const tickers = await fetch24hrTicker(tickerSymbol);
      return NextResponse.json({
        success: true,
        ticker: tickers[0] || null,
        timestamp: new Date().toISOString(),
      });
    }

    // Convert crypto to AED
    if (convert === 'aed' && symbol && amount) {
      const result = await convertToAED(symbol, parseFloat(amount));
      
      if (!result) {
        return NextResponse.json({
          success: false,
          error: `Unable to convert ${symbol} to AED`,
        }, { status: 400 });
      }
      
      return NextResponse.json({
        success: true,
        conversion: {
          fromSymbol: result.symbol,
          fromAmount: parseFloat(amount),
          toCurrency: 'AED',
          toAmount: result.aedAmount,
          rate: result.rate,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Get specific crypto price
    if (symbol) {
      const prices = await getCryptoPrices();
      const price = prices.find(p => 
        p.symbol.toUpperCase() === symbol.toUpperCase()
      );
      
      if (!price) {
        return NextResponse.json({
          success: false,
          error: `Symbol ${symbol} not found`,
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true,
        price,
        timestamp: new Date().toISOString(),
      });
    }

    // Get all prices
    const prices = await getCryptoPrices();
    
    return NextResponse.json({
      success: true,
      count: prices.length,
      prices,
      source: 'binance',
      environment: getApiInfo().environment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Binance API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prices from Binance',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
