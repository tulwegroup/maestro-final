import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllCryptoPrices, 
  getCryptoPrice, 
  convertCryptoToAED 
} from '@/lib/rain';

/**
 * GET /api/crypto/prices
 * Get all crypto prices from CoinGecko
 * 
 * Query params:
 * - symbol: Get price for specific crypto (BTC, ETH, USDT, etc.)
 * - convert: Convert amount to AED (requires symbol and amount)
 * - amount: Amount to convert
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const convert = searchParams.get('convert');
    const amount = searchParams.get('amount');
    
    // Convert crypto to AED
    if (convert === 'aed' && symbol && amount) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum)) {
        return NextResponse.json(
          { error: 'Invalid amount' },
          { status: 400 }
        );
      }
      
      const result = await convertCryptoToAED(symbol.toUpperCase(), amountNum);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Could not convert crypto', symbol },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        conversion: {
          fromSymbol: symbol.toUpperCase(),
          fromAmount: amountNum,
          toCurrency: 'AED',
          toAmount: result.aedAmount,
          rate: result.rate,
          timestamp: new Date().toISOString(),
        }
      });
    }
    
    // Get price for specific symbol
    if (symbol) {
      const price = await getCryptoPrice(symbol.toUpperCase());
      
      if (!price) {
        return NextResponse.json(
          { error: 'Symbol not found', symbol },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        price,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Get all prices
    const prices = await getAllCryptoPrices();
    
    return NextResponse.json({
      success: true,
      prices,
      count: prices.length,
      timestamp: new Date().toISOString(),
      source: 'CoinGecko',
      aedPegRate: 3.6725,
    });
    
  } catch (error) {
    console.error('Crypto prices API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch crypto prices',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
