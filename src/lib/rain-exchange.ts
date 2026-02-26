/**
 * Rain Exchange API Service
 * 
 * Rain is a licensed crypto exchange in UAE (ADGM FSRA regulated)
 * Website: https://www.rain.com
 * 
 * Features:
 * - Fiat ↔ Crypto conversion (AED, SAR, BHD, KWD, USD)
 * - Buy/Sell cryptocurrencies
 * - Transfer to external wallets
 * 
 * Note: Requires API keys from Rain business account
 */

// API Configuration
const RAIN_CONFIG = {
  sandbox: {
    baseUrl: 'https://api-sandbox.rain.com',
  },
  production: {
    baseUrl: 'https://api.rain.com',
  },
};

const USE_SANDBOX = process.env.RAIN_USE_SANDBOX !== 'false';
const API_BASE = USE_SANDBOX ? RAIN_CONFIG.sandbox.baseUrl : RAIN_CONFIG.production.baseUrl;

// API Keys
const API_KEY = process.env.RAIN_API_KEY || '';
const API_SECRET = process.env.RAIN_API_SECRET || '';

// Types
export interface RainTicker {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  lastPrice: number;
  bidPrice: number;
  askPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
}

export interface RainBalance {
  currency: string;
  available: number;
  frozen: number;
  total: number;
}

export interface RainOrder {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  status: 'OPEN' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  price?: number;
  amount: number;
  filled: number;
  createdAt: string;
  updatedAt: string;
}

export interface RainOrderRequest {
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'MARKET' | 'LIMIT';
  amount: number;
  price?: number;
}

export interface RainDepositAddress {
  currency: string;
  address: string;
  network: string;
  tag?: string;
}

export interface RainWithdrawalRequest {
  currency: string;
  amount: number;
  address: string;
  network?: string;
  tag?: string;
}

export interface RainWithdrawalResponse {
  id: string;
  status: string;
  transactionHash?: string;
}

export interface RainCryptoPrice {
  symbol: string;
  name: string;
  priceAED: number;
  priceUSD: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  lastUpdated: Date;
}

// AED to USD (fixed peg)
const AED_TO_USD = 0.2723;

// Supported pairs
const SUPPORTED_PAIRS = [
  'BTC-AED', 'ETH-AED', 'SOL-AED', 'BNB-AED',
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD',
];

// Symbol mapping
const SYMBOL_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  SOL: 'Solana',
  BNB: 'BNB',
  USDT: 'Tether',
  USDC: 'USD Coin',
};

/**
 * Check if Rain API is configured
 */
export function isConfigured(): boolean {
  return Boolean(API_KEY && API_SECRET);
}

/**
 * Get configuration status
 */
export function getConfigStatus() {
  return {
    configured: isConfigured(),
    environment: USE_SANDBOX ? 'sandbox' : 'production',
    hasApiKey: Boolean(API_KEY),
    hasApiSecret: Boolean(API_SECRET),
  };
}

/**
 * Get authentication headers
 */
function getHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    'X-API-Secret': API_SECRET,
  };
}

/**
 * Get tickers (public endpoint - may work without auth)
 */
export async function getTickers(): Promise<{ success: boolean; tickers?: RainTicker[]; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/v1/tickers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 10 },
    });

    if (!response.ok) {
      throw new Error(`Rain API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, tickers: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get crypto prices formatted for our dashboard
 */
export async function getCryptoPrices(): Promise<{ success: boolean; prices?: RainCryptoPrice[]; error?: string }> {
  try {
    const result = await getTickers();
    
    if (!result.success || !result.tickers) {
      return { success: false, error: result.error };
    }

    const prices: RainCryptoPrice[] = result.tickers
      .filter(t => SUPPORTED_PAIRS.includes(t.symbol))
      .map(ticker => {
        const [base] = ticker.symbol.split('-');
        const isAEDPair = ticker.symbol.endsWith('-AED');
        
        return {
          symbol: base,
          name: SYMBOL_NAMES[base] || base,
          priceAED: isAEDPair ? ticker.lastPrice : ticker.lastPrice / AED_TO_USD,
          priceUSD: isAEDPair ? ticker.lastPrice * AED_TO_USD : ticker.lastPrice,
          change24h: ticker.change24h,
          changePercent24h: ticker.changePercent24h,
          high24h: ticker.high24h,
          low24h: ticker.low24h,
          volume24h: ticker.volume24h,
          lastUpdated: new Date(),
        };
      });

    // Deduplicate by symbol
    const uniquePrices = prices.filter((price, index, self) =>
      index === self.findIndex(p => p.symbol === price.symbol)
    );

    return { success: true, prices: uniquePrices };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get account balances
 */
export async function getBalances(): Promise<{ success: boolean; balances?: RainBalance[]; error?: string }> {
  if (!isConfigured()) {
    return {
      success: false,
      error: 'Rain API not configured. Please set RAIN_API_KEY and RAIN_API_SECRET environment variables.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/balances`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Rain API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, balances: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Place order
 */
export async function placeOrder(
  order: RainOrderRequest
): Promise<{ success: boolean; order?: RainOrder; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Rain API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/orders`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`Rain API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, order: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get deposit address
 */
export async function getDepositAddress(
  currency: string
): Promise<{ success: boolean; address?: RainDepositAddress; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Rain API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/deposit-address/${currency}`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Rain API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, address: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Withdraw crypto
 */
export async function withdraw(
  request: RainWithdrawalRequest
): Promise<{ success: boolean; response?: RainWithdrawalResponse; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: 'Rain API not configured' };
  }

  try {
    const response = await fetch(`${API_BASE}/v1/withdrawals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Rain API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mock data for development
 */
export function getMockBalances(): RainBalance[] {
  return [
    { currency: 'AED', available: 10000.00, frozen: 500.00, total: 10500.00 },
    { currency: 'BTC', available: 0.05, frozen: 0, total: 0.05 },
    { currency: 'ETH', available: 1.5, frozen: 0.1, total: 1.6 },
  ];
}

export function getMockPrices(): RainCryptoPrice[] {
  return [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      priceAED: 245000,
      priceUSD: 66750,
      change24h: 1500,
      changePercent24h: 2.5,
      high24h: 250000,
      low24h: 240000,
      volume24h: 1500000000,
      lastUpdated: new Date(),
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      priceAED: 7100,
      priceUSD: 1935,
      change24h: 85,
      changePercent24h: 1.2,
      high24h: 7200,
      low24h: 6950,
      volume24h: 850000000,
      lastUpdated: new Date(),
    },
  ];
}

export type {
  RainTicker,
  RainBalance,
  RainOrder,
  RainOrderRequest,
  RainDepositAddress,
  RainWithdrawalRequest,
  RainWithdrawalResponse,
  RainCryptoPrice,
};
