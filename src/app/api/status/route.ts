import { NextResponse } from 'next/server';
import { getProvidersStatus } from '@/lib/banking-provider';
import { getPriceSourcesStatus } from '@/lib/crypto-provider';
import { getApiInfo as getBinanceInfo, getSystemStatus as getBinanceStatus } from '@/lib/binance';
import { isConfigured as isRainConfigured, getConfigStatus as getRainConfigStatus } from '@/lib/rain-exchange';

export async function GET() {
  try {
    // Get banking provider statuses
    const bankingProviders = getProvidersStatus();
    
    // Get crypto price source statuses
    const cryptoSources = await getPriceSourcesStatus();
    
    // Get Binance info
    const binanceInfo = getBinanceInfo();
    const binanceStatusCheck = await getBinanceStatus();
    const binanceStatus = {
      name: 'Binance',
      configured: binanceStatusCheck.status === 'ok',
      environment: binanceInfo.environment,
      features: ['trading', 'wallet', 'price-feeds'],
    };
    
    // Get Rain Exchange status
    const rainConfigStatus = getRainConfigStatus();
    const rainStatus = {
      name: 'Rain Exchange (UAE)',
      configured: isRainConfigured(),
      environment: rainConfigStatus.environment,
      features: ['trading', 'wallet', 'fiat-ramp', 'aed-pairs'],
    };

    // Calculate overall health
    const totalProviders = bankingProviders.length + 2;
    const configuredProviders = bankingProviders.filter(p => p.configured).length + 
      (binanceStatus.configured ? 1 : 0) + 
      (rainStatus.configured ? 1 : 0);
    
    const healthScore = Math.round((configuredProviders / totalProviders) * 100);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      health: {
        score: healthScore,
        status: healthScore >= 50 ? 'healthy' : 'degraded',
        message: healthScore >= 50 
          ? `${configuredProviders} of ${totalProviders} providers configured`
          : 'Some providers need configuration',
      },
      banking: {
        providers: bankingProviders,
        configured: bankingProviders.filter(p => p.configured).length,
        total: bankingProviders.length,
      },
      crypto: {
        providers: [binanceStatus, rainStatus],
        priceSources: cryptoSources,
        configured: [binanceStatus, rainStatus].filter(p => p.configured).length,
        total: 2,
      },
      recommendations: generateRecommendations(bankingProviders, binanceStatus, rainStatus),
    });
  } catch (error) {
    console.error('Error getting API status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get API status',
    }, { status: 500 });
  }
}

function generateRecommendations(
  bankingProviders: { configured: boolean; displayName: string }[],
  binanceStatus: { configured: boolean },
  rainStatus: { configured: boolean }
): string[] {
  const recommendations: string[] = [];
  
  const unconfiguredBanks = bankingProviders.filter(p => !p.configured);
  if (unconfiguredBanks.length > 0) {
    recommendations.push(
      `Configure ${unconfiguredBanks.map(b => b.displayName).join(', ')} for live banking features`
    );
  }
  
  if (!binanceStatus.configured) {
    recommendations.push('Binance API may be temporarily unavailable');
  }
  
  if (!rainStatus.configured) {
    recommendations.push('Configure Rain Exchange API for UAE-licensed crypto trading');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('All providers configured! System is fully operational.');
  }
  
  return recommendations;
}
