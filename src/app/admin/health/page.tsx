'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Globe, 
  Cpu, 
  HardDrive, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  Clock,
  Building2
} from 'lucide-react';

interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  history: number[];
}

interface IntegrationHealth {
  name: string;
  type: 'banking' | 'crypto' | 'payment' | 'government';
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  uptime: number;
  lastCheck: string;
  errorRate: number;
}

interface SystemAlert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  source: string;
  resolved: boolean;
}

// Static data generators - called outside render
function generateMetrics(): SystemMetric[] {
  return [
    { name: 'CPU Usage', value: 42, unit: '%', status: 'healthy', trend: 'stable', history: [40, 38, 45, 42, 41, 43, 42] },
    { name: 'Memory Usage', value: 68, unit: '%', status: 'healthy', trend: 'up', history: [60, 62, 64, 65, 66, 67, 68] },
    { name: 'Disk Usage', value: 54, unit: '%', status: 'healthy', trend: 'stable', history: [52, 53, 53, 54, 54, 54, 54] },
    { name: 'Network I/O', value: 125, unit: 'MB/s', status: 'healthy', trend: 'up', history: [100, 110, 115, 118, 120, 122, 125] },
    { name: 'API Response Time', value: 45, unit: 'ms', status: 'healthy', trend: 'down', history: [55, 52, 50, 48, 47, 46, 45] },
    { name: 'Active Connections', value: 1247, unit: '', status: 'healthy', trend: 'up', history: [1100, 1150, 1180, 1200, 1220, 1235, 1247] },
    { name: 'Error Rate', value: 0.12, unit: '%', status: 'healthy', trend: 'down', history: [0.2, 0.18, 0.16, 0.15, 0.14, 0.13, 0.12] },
    { name: 'Queue Depth', value: 23, unit: 'jobs', status: 'healthy', trend: 'stable', history: [20, 22, 21, 23, 22, 24, 23] },
  ];
}

function generateIntegrations(): IntegrationHealth[] {
  return [
    { name: 'RAKBANK', type: 'banking', status: 'online', latency: 45, uptime: 99.98, lastCheck: new Date().toISOString(), errorRate: 0.01 },
    { name: 'Mashreq Bank', type: 'banking', status: 'online', latency: 38, uptime: 99.95, lastCheck: new Date().toISOString(), errorRate: 0.02 },
    { name: 'Wio Bank', type: 'banking', status: 'online', latency: 52, uptime: 99.99, lastCheck: new Date().toISOString(), errorRate: 0.00 },
    { name: 'Emirates NBD', type: 'banking', status: 'degraded', latency: 120, uptime: 98.50, lastCheck: new Date().toISOString(), errorRate: 1.2 },
    { name: 'Binance', type: 'crypto', status: 'online', latency: 89, uptime: 99.90, lastCheck: new Date().toISOString(), errorRate: 0.05 },
    { name: 'Rain Exchange', type: 'crypto', status: 'offline', latency: 0, uptime: 95.00, lastCheck: new Date().toISOString(), errorRate: 5.0 },
    { name: 'UAE Pass', type: 'government', status: 'online', latency: 65, uptime: 99.99, lastCheck: new Date().toISOString(), errorRate: 0.01 },
    { name: 'RTA API', type: 'government', status: 'online', latency: 78, uptime: 99.95, lastCheck: new Date().toISOString(), errorRate: 0.03 },
  ];
}

function generateAlerts(): SystemAlert[] {
  return [
    { id: '1', severity: 'warning', message: 'Emirates NBD API latency above threshold (120ms)', timestamp: new Date(Date.now() - 300000).toISOString(), source: 'API Monitor', resolved: false },
    { id: '2', severity: 'error', message: 'Rain Exchange API connection failed', timestamp: new Date(Date.now() - 600000).toISOString(), source: 'Integration Service', resolved: false },
    { id: '3', severity: 'info', message: 'Database backup completed successfully', timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'Backup Service', resolved: true },
    { id: '4', severity: 'warning', message: 'Memory usage approaching 70% threshold', timestamp: new Date(Date.now() - 7200000).toISOString(), source: 'System Monitor', resolved: false },
    { id: '5', severity: 'info', message: 'SSL certificate renewal scheduled for next week', timestamp: new Date(Date.now() - 86400000).toISOString(), source: 'Security Service', resolved: true },
  ];
}

export default function AdminHealthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationHealth[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(() => {
    // Simulate API call - in production, this would fetch real metrics
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setMetrics(generateMetrics());
        setIntegrations(generateIntegrations());
        setAlerts(generateAlerts());
        setLastRefresh(new Date());
        setIsLoading(false);
        resolve();
      }, 300);
    });
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initialFetch = async () => {
      await fetchData();
    };
    
    if (mounted) {
      initialFetch();
    }
    
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-400';
      case 'warning':
      case 'degraded':
        return 'text-yellow-400';
      case 'critical':
      case 'offline':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  }, []);

  const getStatusIcon = useMemo(() => (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className={`w-5 h-5 ${getStatusColor(status)}`} />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className={`w-5 h-5 ${getStatusColor(status)}`} />;
      case 'critical':
      case 'offline':
        return <XCircle className={`w-5 h-5 ${getStatusColor(status)}`} />;
      default:
        return <Activity className="w-5 h-5 text-slate-400" />;
    }
  }, [getStatusColor]);

  const getSeverityBadge = useMemo(() => (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500/20 text-red-400">Critical</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-400">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/20 text-blue-400">Info</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{severity}</Badge>;
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-slate-400 text-sm">Real-time system monitoring and diagnostics</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-slate-600 ${autoRefresh ? 'text-teal-400' : 'text-slate-300'}`}
          >
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchData()}
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">All Systems Operational</h2>
                <p className="text-slate-400">99.97% uptime in the last 30 days</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">8</p>
                <p className="text-xs text-slate-400">Services Online</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-400">1</p>
                <p className="text-xs text-slate-400">Degraded</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">1</p>
                <p className="text-xs text-slate-400">Offline</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.slice(0, 4).map((metric) => (
          <Card key={metric.name} className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">{metric.name}</span>
                {getStatusIcon(metric.status)}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
                <span className="text-slate-400 text-sm mb-1">{metric.unit}</span>
              </div>
              <Progress 
                value={typeof metric.value === 'number' && metric.value < 100 ? metric.value : (typeof metric.value === 'number' ? metric.value / 10 : 0)} 
                className="h-1.5 mt-3 bg-slate-700"
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Health */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Integration Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(integration.status)}
                  <div>
                    <p className="text-white font-medium">{integration.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{integration.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-slate-300">{integration.latency}ms</p>
                    <p className="text-xs text-slate-500">latency</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400">{integration.uptime}%</p>
                    <p className="text-xs text-slate-500">uptime</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border-l-2 ${
                  alert.resolved ? 'bg-slate-700/30 border-slate-600' : 
                  alert.severity === 'critical' || alert.severity === 'error' ? 'bg-red-500/10 border-red-500' :
                  alert.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500' :
                  'bg-blue-500/10 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getSeverityBadge(alert.severity)}
                      {alert.resolved && <Badge className="bg-green-500/20 text-green-400">Resolved</Badge>}
                    </div>
                    <p className="text-slate-200 text-sm">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <span>{alert.source}</span>
                      <span>•</span>
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Detailed Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.map((metric) => (
              <div key={metric.name} className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{metric.name}</span>
                  <div className="flex items-center gap-1">
                    {metric.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
                    {metric.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
                    {metric.trend === 'stable' && <Activity className="w-3 h-3 text-slate-400" />}
                  </div>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-xl font-bold text-white">{metric.value}</span>
                  <span className="text-slate-400 text-sm mb-0.5">{metric.unit}</span>
                </div>
                {/* Mini sparkline */}
                <div className="flex items-end gap-0.5 mt-2 h-6">
                  {metric.history.map((val, i) => (
                    <div 
                      key={i} 
                      className="flex-1 bg-teal-500/50 rounded-t"
                      style={{ height: `${(val / Math.max(...metric.history)) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">CPU Cores</p>
                <p className="text-xs text-slate-400">8 vCPUs allocated</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Usage</span>
                <span className="text-white">42%</span>
              </div>
              <Progress value={42} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Storage</p>
                <p className="text-xs text-slate-400">256 GB SSD</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Used</span>
                <span className="text-white">138 GB (54%)</span>
              </div>
              <Progress value={54} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">Database</p>
                <p className="text-xs text-slate-400">SQLite / Prisma</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Connections</span>
                <span className="text-white">24 / 100</span>
              </div>
              <Progress value={24} className="h-2 bg-slate-700" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
