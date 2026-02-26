'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Bitcoin, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProviderStatus {
  name: string;
  displayName: string;
  configured: boolean;
  environment: string;
  features: string[];
}

interface ApiStatus {
  health: {
    score: number;
    status: string;
    message: string;
  };
  banking: {
    providers: ProviderStatus[];
    configured: number;
    total: number;
  };
  crypto: {
    providers: ProviderStatus[];
    configured: number;
    total: number;
  };
  recommendations: string[];
}

export function IntegrationStatusCard() {
  const [status, setStatus] = useState<ApiStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      } else {
        setError(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card className="bg-white/80 backdrop-blur border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              <span className="text-sm">Unable to load status</span>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchStatus}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              status.health.score >= 50 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {status.health.score >= 50 ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Integrations</h3>
              <p className="text-xs text-slate-500">{status.health.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.health.score >= 50 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
              {status.health.score}%
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-slate-500">Banking</p>
              <p className="text-sm font-medium">{status.banking.configured}/{status.banking.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <Bitcoin className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-xs text-slate-500">Crypto</p>
              <p className="text-sm font-medium">{status.crypto.configured}/{status.crypto.total}</p>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 space-y-4 pt-4 border-t border-slate-200">
            {/* Banking Providers */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-2">BANKING PROVIDERS</h4>
              <div className="space-y-2">
                {status.banking.providers.map(provider => (
                  <div key={provider.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {provider.configured ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className="text-sm text-slate-700">{provider.displayName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">
                        {provider.environment}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Crypto Providers */}
            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-2">CRYPTO PROVIDERS</h4>
              <div className="space-y-2">
                {status.crypto.providers.map(provider => (
                  <div key={provider.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {provider.configured ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className="text-sm text-slate-700">{provider.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {provider.environment}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {status.recommendations.length > 0 && status.recommendations[0] !== 'All providers configured! System is fully operational.' && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 mb-2">RECOMMENDATIONS</h4>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ul className="text-xs text-yellow-800 space-y-1">
                    {status.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
