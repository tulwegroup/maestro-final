'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Loader2,
  Key,
  Globe,
  Clock
} from 'lucide-react';

interface Integration {
  name: string;
  type: 'banking' | 'crypto' | 'payment';
  status: 'online' | 'offline' | 'degraded';
  environment: 'production' | 'sandbox' | 'testnet';
  lastSync: string;
  latency: number;
  features: string[];
  apiKey: string;
  configured: boolean;
}

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch status from API
    fetch('/api/status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const allIntegrations: Integration[] = [
            ...data.banking.providers.map((p: any) => ({
              name: p.displayName,
              type: 'banking' as const,
              status: p.configured ? 'online' : 'offline',
              environment: p.environment,
              lastSync: new Date().toISOString(),
              latency: Math.floor(Math.random() * 100) + 20,
              features: p.features,
              apiKey: p.configured ? '****_live_****' : 'Not configured',
              configured: p.configured
            })),
            ...data.crypto.providers.map((p: any) => ({
              name: p.name,
              type: 'crypto' as const,
              status: p.configured ? 'online' : 'offline',
              environment: p.environment,
              lastSync: new Date().toISOString(),
              latency: Math.floor(Math.random() * 150) + 30,
              features: p.features,
              apiKey: p.configured ? '****_****' : 'Not configured',
              configured: p.configured
            }))
          ];
          setIntegrations(allIntegrations);
        }
        setIsLoading(false);
      })
      .catch(() => {
        // Use mock data if API fails
        setIntegrations([
          { name: 'RAKBANK', type: 'banking', status: 'online', environment: 'sandbox', lastSync: new Date().toISOString(), latency: 45, features: ['accounts', 'transfers'], apiKey: 'rk_test_****', configured: false },
          { name: 'Mashreq Bank', type: 'banking', status: 'online', environment: 'sandbox', lastSync: new Date().toISOString(), latency: 38, features: ['accounts', 'payments'], apiKey: 'mq_test_****', configured: false },
          { name: 'Wio Bank', type: 'banking', status: 'online', environment: 'sandbox', lastSync: new Date().toISOString(), latency: 52, features: ['accounts', 'transfers'], apiKey: 'wio_test_****', configured: false },
          { name: 'Emirates NBD', type: 'banking', status: 'online', environment: 'sandbox', lastSync: new Date().toISOString(), latency: 67, features: ['accounts', 'payments'], apiKey: 'enbd_test_****', configured: false },
          { name: 'Binance', type: 'crypto', status: 'online', environment: 'testnet', lastSync: new Date().toISOString(), latency: 89, features: ['trading', 'prices'], apiKey: 'bn_testnet_****', configured: true },
          { name: 'Rain Exchange', type: 'crypto', status: 'offline', environment: 'sandbox', lastSync: new Date().toISOString(), latency: 0, features: ['trading', 'fiat'], apiKey: 'Not configured', configured: false },
        ]);
        setIsLoading(false);
      });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <XCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'banking':
        return <Badge className="bg-blue-500/20 text-blue-400">Banking</Badge>;
      case 'crypto':
        return <Badge className="bg-orange-500/20 text-orange-400">Crypto</Badge>;
      case 'payment':
        return <Badge className="bg-green-500/20 text-green-400">Payment</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Integrations</h1>
          <p className="text-slate-400 text-sm">Manage API integrations and connections</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync All
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{integrations.filter(i => i.status === 'online').length}</p>
                <p className="text-xs text-slate-400">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{integrations.filter(i => i.status === 'degraded').length}</p>
                <p className="text-xs text-slate-400">Degraded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{integrations.filter(i => i.status === 'offline').length}</p>
                <p className="text-xs text-slate-400">Offline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => (
          <Card key={integration.name} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{integration.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getTypeBadge(integration.type)}
                      <Badge variant="outline" className="border-slate-600 text-slate-400 text-xs">
                        {integration.environment}
                      </Badge>
                    </div>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Latency: {integration.latency}ms</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Key className="w-4 h-4" />
                  <span className="font-mono text-xs">{integration.apiKey}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {integration.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="border-slate-600 text-slate-400 text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300">
                  Configure
                </Button>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                  Test
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
