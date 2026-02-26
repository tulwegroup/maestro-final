/**
 * Unified Crypto Price Service
 * 
 * Aggregates prices from multiple sources with fallback:
 * 1. Binance (Primary - testnet for development)
 * 2. CoinGecko (Fallback)
 * 
 * This provides redundancy and better reliability
 */

import { getCryptoPrices as getBinancePrices, convertToAED as binanceConvertToAED } from './binance';
import { getAllCryptoPrices as getCoinGeckoPrices, convertCryptoToAED as coingeckoConvertToAED } from './rain';

export interface UnifiedCryptoPrice {
  symbol: string;
  name: string;
  price: number;
  priceAED: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap?: number;
  source: 'binance' | 'coingecko';
  lastUpdated: Date;
}

export interface PriceSourceStatus {
  name: string;
  status: 'online' | 'offline' | 'error';
  latency?: number;
  error?: string;
}

// Symbol to name mapping
const SYMBOL_NAMES: Record<string, string> = {
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether',
  USDC: 'USD Coin',
  SOL: 'Solana',
  BNB: 'BNB',
  XRP: 'XRP',
  ADA: 'Cardano',
  DOGE: 'Dogecoin',
  MATIC: 'Polygon',
};

/**
 * Get prices from all sources and merge
 */
export async function getUnifiedCryptoPrices(): Promise<{
  prices: UnifiedCryptoPrice[];
  sources: PriceSourceStatus[];
}> {
  const sources: PriceSourceStatus[] = [];
  const priceMap = new Map<string, UnifiedCryptoPrice>();

  // Try Binance first (primary)
  const binanceStart = Date.now();
  try {
    const binancePrices = await getBinancePrices();
    const binanceLatency = Date.now() - binanceStart;
    
    sources.push({
      name: 'Binance',
      status: binancePrices.length > 0 ? 'online' : 'error',
      latency: binanceLatency,
    });

    for (const price of binancePrices) {
      priceMap.set(price.symbol, {
        symbol: price.symbol,
        name: SYMBOL_NAMES[price.symbol] || price.symbol,
        price: price.price,
        priceAED: price.priceAED,
        change24h: price.change24h,
        changePercent24h: price.changePercent24h,
        high24h: price.high24h,
        low24h: price.low24h,
        volume24h: price.volume24h,
        source: 'binance',
        lastUpdated: price.lastUpdated,
      });
    }
  } catch (error) {
    sources.push({
      name: 'Binance',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Try CoinGecko as fallback/supplement
  const coingeckoStart = Date.now();
  try {
    const coingeckoPrices = await getCoinGeckoPrices();
    const coingeckoLatency = Date.now() - coingeckoStart;
    
    sources.push({
      name: 'CoinGecko',
      status: coingeckoPrices.length > 0 ? 'online' : 'error',
      latency: coingeckoLatency,
    });

    // Fill in missing prices from CoinGecko
    for (const price of coingeckoPrices) {
      if (!priceMap.has(price.symbol)) {
        priceMap.set(price.symbol, {
          symbol: price.symbol,
          name: price.name,
          price: price.price,
          priceAED: price.priceAED,
          change24h: price.change24h,
          changePercent24h: price.changePercent24h,
          high24h: price.high24h,
          low24h: price.low24h,
          volume24h: price.volume24h,
          marketCap: price.marketCap,
          source: 'coingecko',
          lastUpdated: price.lastUpdated,
        });
      }
    }
  } catch (error) {
    sources.push({
      name: 'CoinGecko',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Sort by market cap / volume
  const prices = Array.from(priceMap.values()).sort((a, b) => {
    // Prioritize by volume (as proxy for liquidity)
    return (b.volume24h || 0) - (a.volume24h || 0);
  });

  return { prices, sources };
}

/**
 * Convert crypto to AED using best available source
 */
export async function convertCryptoToAED(
  symbol: string,
  amount: number
): Promise<{ aedAmount: number; rate: number; symbol: string; source: string } | null> {
  // Try Binance first
  const binanceResult = await binanceConvertToAED(symbol, amount);
  if (binanceResult) {
    return { ...binanceResult, source: 'binance' };
  }

  // Fall back to CoinGecko
  const coingeckoResult = await coingeckoConvertToAED(symbol, amount);
  if (coingeckoResult) {
    return { ...coingeckoResult, source: 'coingecko' };
  }

  return null;
}

/**
 * Get status of all price sources
 */
export async function getPriceSourcesStatus(): Promise<PriceSourceStatus[]> {
  const statuses: PriceSourceStatus[] = [];

  // Check Binance
  const binanceStart = Date.now();
  try {
    const prices = await getBinancePrices();
    statuses.push({
      name: 'Binance Testnet',
      status: prices.length > 0 ? 'online' : 'error',
      latency: Date.now() - binanceStart,
    });
  } catch (error) {
    statuses.push({
      name: 'Binance Testnet',
      status: 'offline',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Check CoinGecko
  const coingeckoStart = Date.now();
  try {
    const prices = await getCoinGeckoPrices();
    statuses.push({
      name: 'CoinGecko',
      status: prices.length > 0 ? 'online' : 'error',
      latency: Date.now() - coingeckoStart,
    });
  } catch (error) {
    statuses.push({
      name: 'CoinGecko',
      status: 'offline',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  return statuses;
}
