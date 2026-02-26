/**
 * Binance API Service
 * 
 * Supports both Mainnet and Testnet (Sandbox)
 * Testnet: https://testnet.binance.vision/api
 * Mainnet: https://api.binance.com/api
 * 
 * No API key required for public endpoints (prices, tickers)
 * API key required for trading endpoints
 */

// API Configuration
const BINANCE_CONFIG = {
  testnet: {
    baseUrl: 'https://testnet.binance.vision/api',
    wsUrl: 'wss://testnet.binance.vision/ws',
  },
  mainnet: {
    baseUrl: 'https://api.binance.com/api',
    wsUrl: 'wss://stream.binance.com/ws',
  },
};

// Use testnet by default for development
const USE_TESTNET = process.env.BINANCE_USE_TESTNET !== 'false';
const API_BASE = USE_TESTNET ? BINANCE_CONFIG.testnet.baseUrl : BINANCE_CONFIG.mainnet.baseUrl;

// Types
export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinancePrice {
  symbol: string;
  price: string;
}

export interface CryptoPrice {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceAED: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  lastUpdated: Date;
}

// USD to AED fixed rate
const USD_TO_AED = 3.6725;

// Trading pairs we're interested in (USDT pairs for USD equivalent)
const TRADING_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 
  'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'MATICUSDT'
];

// Symbol mapping
const SYMBOL_MAP: Record<string, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  BNBUSDT: 'BNB',
  XRPUSDT: 'XRP',
  ADAUSDT: 'ADA',
  DOGEUSDT: 'DOGE',
  MATICUSDT: 'MATIC',
  USDTUSDT: 'USDT',
  USDCUSDT: 'USDC',
};

/**
 * Fetch 24hr ticker data for all symbols or specific symbol
 */
export async function fetch24hrTicker(symbol?: string): Promise<BinanceTicker[]> {
  try {
    const url = symbol 
      ? `${API_BASE}/v3/ticker/24hr?symbol=${symbol}`
      : `${API_BASE}/v3/ticker/24hr`;
    
    const response = await fetch(url, {
      next: { revalidate: 10 }, // Cache for 10 seconds
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : [data];
  } catch (error) {
    console.error('Error fetching Binance ticker:', error);
    return [];
  }
}

/**
 * Fetch current prices for all symbols or specific symbol
 */
export async function fetchPrices(symbols?: string[]): Promise<BinancePrice[]> {
  try {
    let url = `${API_BASE}/v3/ticker/price`;
    
    if (symbols && symbols.length > 0) {
      const symbolsParam = encodeURIComponent(JSON.stringify(symbols));
      url += `?symbols=${symbolsParam}`;
    }
    
    const response = await fetch(url, {
      next: { revalidate: 10 },
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching Binance prices:', error);
    return [];
  }
}

/**
 * Fetch exchange info (symbol metadata)
 */
export async function fetchExchangeInfo() {
  try {
    const response = await fetch(`${API_BASE}/v3/exchangeInfo`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching Binance exchange info:', error);
    return null;
  }
}

/**
 * Get formatted crypto prices for our dashboard
 */
export async function getCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    // Fetch tickers for our trading pairs
    const tickers = await fetch24hrTicker();
    
    // Filter for our interested pairs
    const filteredTickers = tickers.filter(t => 
      TRADING_PAIRS.includes(t.symbol) || 
      t.symbol.endsWith('USDT')
    );
    
    // Also add stablecoins
    const prices: CryptoPrice[] = [];
    
    for (const ticker of filteredTickers) {
      const symbol = SYMBOL_MAP[ticker.symbol] || ticker.symbol.replace('USDT', '');
      
      // Skip if not in our list
      if (!TRADING_PAIRS.includes(ticker.symbol) && 
          ticker.symbol !== 'USDTUSDT' && 
          ticker.symbol !== 'USDCUSDT') {
        continue;
      }
      
      const price = parseFloat(ticker.lastPrice);
      const changePercent = parseFloat(ticker.priceChangePercent);
      
      prices.push({
        symbol,
        baseAsset: ticker.symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        price,
        priceAED: price * USD_TO_AED,
        change24h: parseFloat(ticker.priceChange),
        changePercent24h: changePercent,
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.volume),
        quoteVolume24h: parseFloat(ticker.quoteVolume),
        lastUpdated: new Date(ticker.closeTime),
      });
    }
    
    // Add stablecoins manually (they're always ~$1)
    if (!prices.find(p => p.symbol === 'USDT')) {
      prices.push({
        symbol: 'USDT',
        baseAsset: 'USDT',
        quoteAsset: 'USD',
        price: 1.0,
        priceAED: USD_TO_AED,
        change24h: 0,
        changePercent24h: 0,
        high24h: 1.001,
        low24h: 0.999,
        volume24h: 0,
        quoteVolume24h: 0,
        lastUpdated: new Date(),
      });
    }
    
    if (!prices.find(p => p.symbol === 'USDC')) {
      prices.push({
        symbol: 'USDC',
        baseAsset: 'USDC',
        quoteAsset: 'USD',
        price: 1.0,
        priceAED: USD_TO_AED,
        change24h: 0,
        changePercent24h: 0,
        high24h: 1.001,
        low24h: 0.999,
        volume24h: 0,
        quoteVolume24h: 0,
        lastUpdated: new Date(),
      });
    }
    
    // Sort by market cap (approximated by quote volume)
    return prices.sort((a, b) => b.quoteVolume24h - a.quoteVolume24h);
  } catch (error) {
    console.error('Error getting crypto prices:', error);
    return [];
  }
}

/**
 * Convert crypto amount to AED
 */
export async function convertToAED(
  symbol: string, 
  amount: number
): Promise<{ aedAmount: number; rate: number; symbol: string } | null> {
  try {
    const pair = `${symbol.toUpperCase()}USDT`;
    const response = await fetch(`${API_BASE}/v3/ticker/price?symbol=${pair}`, {
      next: { revalidate: 10 },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const price = parseFloat(data.price);
    const aedAmount = amount * price * USD_TO_AED;
    
    return {
      aedAmount,
      rate: price * USD_TO_AED,
      symbol: symbol.toUpperCase(),
    };
  } catch (error) {
    console.error(`Error converting ${symbol} to AED:`, error);
    return null;
  }
}

/**
 * Get system status (test connectivity)
 */
export async function getSystemStatus(): Promise<{ status: string; msg: string }> {
  try {
    const response = await fetch(`${API_BASE}/v3/ping`);
    
    if (response.ok) {
      return { status: 'ok', msg: 'Binance API is operational' };
    }
    
    return { status: 'error', msg: 'Failed to ping Binance API' };
  } catch (error) {
    return { status: 'error', msg: String(error) };
  }
}

/**
 * Get API info
 */
export function getApiInfo() {
  return {
    environment: USE_TESTNET ? 'testnet' : 'mainnet',
    baseUrl: API_BASE,
    wsUrl: USE_TESTNET ? BINANCE_CONFIG.testnet.wsUrl : BINANCE_CONFIG.mainnet.wsUrl,
  };
}

export type { CryptoPrice as BinanceCryptoPrice };
