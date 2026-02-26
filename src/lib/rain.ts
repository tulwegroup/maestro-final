/**
 * Crypto Price Service
 * 
 * Uses CoinGecko free public API for crypto prices
 * CoinGecko provides reliable, free cryptocurrency data
 */

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  high_24h: number;
  low_24h: number;
  total_volume: number;
  market_cap: number;
  last_updated: string;
}

interface CryptoPrice {
  symbol: string;
  baseCurrency: string;
  name: string;
  price: number;
  priceAED: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: Date;
}

// AED peg rate (1 USD = 3.6725 AED fixed rate)
const USD_TO_AED = 3.6725;

// Coin IDs mapping to symbols
const COIN_IDS: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  tether: 'USDT',
  'usd-coin': 'USDC',
  solana: 'SOL',
  binancecoin: 'BNB',
  ripple: 'XRP',
};

const COIN_SYMBOLS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  SOL: 'solana',
  BNB: 'binancecoin',
  XRP: 'ripple',
};

/**
 * Fetch crypto prices from CoinGecko
 */
export async function fetchCryptoPrices(): Promise<CoinGeckoPrice[]> {
  const ids = Object.keys(COIN_IDS).join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false`;
  
  const response = await fetch(url, {
    next: { revalidate: 30 }, // Cache for 30 seconds
  });
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get all supported crypto prices
 */
export async function getAllCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const data = await fetchCryptoPrices();
    const prices: CryptoPrice[] = [];
    
    for (const coin of data) {
      const symbol = COIN_IDS[coin.id];
      if (symbol) {
        prices.push({
          symbol,
          baseCurrency: 'USD',
          name: coin.name,
          price: coin.current_price,
          priceAED: coin.current_price * USD_TO_AED,
          change24h: coin.price_change_24h,
          changePercent24h: coin.price_change_percentage_24h,
          high24h: coin.high_24h,
          low24h: coin.low_24h,
          volume24h: coin.total_volume,
          marketCap: coin.market_cap,
          lastUpdated: new Date(coin.last_updated),
        });
      }
    }
    
    return prices.sort((a, b) => b.marketCap - a.marketCap);
  } catch (error) {
    console.error('Error fetching all crypto prices:', error);
    return [];
  }
}

/**
 * Get price for a specific crypto pair
 */
export async function getCryptoPrice(symbol: string): Promise<CryptoPrice | null> {
  try {
    const coinId = COIN_SYMBOLS[symbol.toUpperCase()];
    if (!coinId) return null;
    
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`;
    
    const response = await fetch(url, {
      next: { revalidate: 30 },
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const marketData = data.market_data;
    
    return {
      symbol: symbol.toUpperCase(),
      baseCurrency: 'USD',
      name: data.name,
      price: marketData.current_price.usd,
      priceAED: marketData.current_price.usd * USD_TO_AED,
      change24h: marketData.price_change_24h,
      changePercent24h: marketData.price_change_percentage_24h,
      high24h: marketData.high_24h.usd,
      low24h: marketData.low_24h.usd,
      volume24h: marketData.total_volume.usd,
      marketCap: marketData.market_cap.usd,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Convert crypto amount to AED
 */
export async function convertCryptoToAED(
  symbol: string,
  amount: number
): Promise<{ aedAmount: number; rate: number; symbol: string } | null> {
  const price = await getCryptoPrice(symbol);
  
  if (!price) return null;
  
  const aedAmount = amount * price.priceAED;
  
  return {
    aedAmount,
    rate: price.priceAED,
    symbol: price.symbol,
  };
}

/**
 * Get exchange rate for crypto to fiat
 */
export function getExchangeRate(symbol: string, prices: CryptoPrice[]): number {
  const price = prices.find(p => p.symbol === symbol);
  return price?.priceAED || 0;
}

/**
 * Format crypto price for display
 */
export function formatCryptoPrice(price: number, symbol: string): string {
  if (symbol === 'USDT' || symbol === 'USDC') {
    return `AED ${price.toFixed(4)}`;
  }
  if (symbol === 'BTC') {
    return `AED ${price.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `AED ${price.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get crypto icon URL
 */
export function getCryptoIcon(symbol: string): string {
  const icons: Record<string, string> = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    USDT: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    USDC: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
    BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    XRP: 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
  };
  
  return icons[symbol] || `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${symbol.toLowerCase()}-logo.png`;
}

/**
 * Crypto metadata for display
 */
export const CRYPTO_INFO: Record<string, {
  name: string;
  network: string;
  depositNetworks: string[];
}> = {
  BTC: {
    name: 'Bitcoin',
    network: 'Bitcoin Network',
    depositNetworks: ['BTC'],
  },
  ETH: {
    name: 'Ethereum',
    network: 'Ethereum (ERC20)',
    depositNetworks: ['ERC20'],
  },
  USDT: {
    name: 'Tether USD',
    network: 'Multi-chain',
    depositNetworks: ['TRC20', 'ERC20', 'BEP20'],
  },
  USDC: {
    name: 'USD Coin',
    network: 'Multi-chain',
    depositNetworks: ['ERC20', 'SOL', 'MATIC'],
  },
  SOL: {
    name: 'Solana',
    network: 'Solana Network',
    depositNetworks: ['SOL'],
  },
  BNB: {
    name: 'BNB',
    network: 'Binance Smart Chain',
    depositNetworks: ['BEP20'],
  },
  XRP: {
    name: 'Ripple',
    network: 'XRP Ledger',
    depositNetworks: ['XRP'],
  },
};

export type { CryptoPrice };
