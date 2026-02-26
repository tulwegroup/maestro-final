'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  UserPlus,
  Route,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Ticket,
  Building2,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    growth: number;
  };
  journeys: {
    total: number;
    pending: number;
    completed: number;
    failed: number;
  };
  revenue: {
    today: number;
    week: number;
    month: number;
    growth: number;
  };
  support: {
    open: number;
    avgResponseTime: number;
    satisfaction: number;
  };
  system: {
    uptime: number;
    apiLatency: number;
    errorRate: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'user' | 'journey' | 'payment' | 'ticket' | 'system';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error' | 'info';
}

// Mock data generator
function generateMockStats(): DashboardStats {
  return {
    users: {
      total: 12847,
      active: 3421,
      newToday: 47,
      growth: 12.5,
    },
    journeys: {
      total: 45892,
      pending: 1234,
      completed: 42156,
      failed: 89,
    },
    revenue: {
      today: 23450,
      week: 156780,
      month: 623450,
      growth: 8.3,
    },
    support: {
      open: 23,
      avgResponseTime: 4.5,
      satisfaction: 94.2,
    },
    system: {
      uptime: 99.97,
      apiLatency: 45,
      errorRate: 0.12,
    },
  };
}

function generateRecentActivity(): RecentActivity[] {
  return [
    { id: '1', type: 'user', message: 'New user registered: Ahmed Al Mansoori', timestamp: new Date(Date.now() - 120000).toISOString(), status: 'success' },
    { id: '2', type: 'payment', message: 'Payment processed: AED 2,500 - Journey #4521', timestamp: new Date(Date.now() - 300000).toISOString(), status: 'success' },
    { id: '3', type: 'journey', message: 'Journey completed: Visa Renewal for Fatima Hassan', timestamp: new Date(Date.now() - 600000).toISOString(), status: 'success' },
    { id: '4', type: 'ticket', message: 'Support ticket #1234 escalated', timestamp: new Date(Date.now() - 900000).toISOString(), status: 'warning' },
    { id: '5', type: 'system', message: 'API rate limit warning for Binance integration', timestamp: new Date(Date.now() - 1200000).toISOString(), status: 'warning' },
    { id: '6', type: 'user', message: 'User account suspended: suspicious activity detected', timestamp: new Date(Date.now() - 1500000).toISOString(), status: 'error' },
    { id: '7', type: 'payment', message: 'Refund processed: AED 1,200 - Transaction #7890', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'info' },
    { id: '8', type: 'journey', message: 'New journey started: RTA Fine Payment', timestamp: new Date(Date.now() - 2100000).toISOString(), status: 'success' },
  ];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 500));
    setStats(generateMockStats());
    setActivity(generateRecentActivity());
    setLastRefresh(new Date());
    setIsLoading(false);
  }, []);

  // Initial data fetch - using layout effect pattern for SSR compatibility
  useEffect(() => {
    // Set up interval first
    const interval = setInterval(fetchData, 30000);
    // Then fetch initial data
    fetchData();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading && !stats) {
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
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">MAESTRO Platform Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500">Last updated: {lastRefresh.toLocaleTimeString()}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Users</p>
                <p className="text-2xl font-bold text-white">{stats?.users.total.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats && stats.users.growth >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${stats && stats.users.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats?.users.growth}% this month
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-slate-400">Active: <span className="text-white font-medium">{stats?.users.active.toLocaleString()}</span></span>
              <span className="text-slate-400">New Today: <span className="text-green-400 font-medium">+{stats?.users.newToday}</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Total Journeys */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Journeys</p>
                <p className="text-2xl font-bold text-white">{stats?.journeys.total.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                    {stats?.journeys.pending} pending
                  </Badge>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Route className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div className="mt-3">
              <Progress 
                value={stats ? (stats.journeys.completed / stats.journeys.total) * 100 : 0} 
                className="h-2 bg-slate-700"
              />
              <p className="text-xs text-slate-400 mt-1">
                {stats?.journeys.completed.toLocaleString()} completed ({stats ? ((stats.journeys.completed / stats.journeys.total) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Revenue (AED)</p>
                <p className="text-2xl font-bold text-white">{stats?.revenue.month.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stats && stats.revenue.growth >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 text-green-400" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-400" />
                  )}
                  <span className={`text-xs ${stats && stats.revenue.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats?.revenue.growth}% this month
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-slate-400">Today: <span className="text-white font-medium">AED {stats?.revenue.today.toLocaleString()}</span></span>
              <span className="text-slate-400">Week: <span className="text-white font-medium">AED {stats?.revenue.week.toLocaleString()}</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Support Tickets</p>
                <p className="text-2xl font-bold text-white">{stats?.support.open}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-slate-400">Avg Response: {stats?.support.avgResponseTime}h</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Ticket className="w-6 h-6 text-orange-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1">
                <p className="text-xs text-slate-400 mb-1">Satisfaction Rate</p>
                <Progress value={stats?.support.satisfaction || 0} className="h-2 bg-slate-700" />
              </div>
              <span className="text-green-400 font-medium text-sm">{stats?.support.satisfaction}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Uptime</span>
              <div className="flex items-center gap-2">
                <Progress value={stats?.system.uptime || 0} className="w-24 h-2 bg-slate-700" />
                <span className="text-green-400 text-sm font-medium">{stats?.system.uptime}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">API Latency</span>
              <Badge className="bg-green-500/20 text-green-400">{stats?.system.apiLatency}ms</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Error Rate</span>
              <Badge className="bg-green-500/20 text-green-400">{stats?.system.errorRate}%</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Database</span>
              <Badge className="bg-green-500/20 text-green-400">Healthy</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Redis Cache</span>
              <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Integration Status */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'RAKBANK', status: 'online', latency: '45ms' },
              { name: 'Mashreq Bank', status: 'online', latency: '38ms' },
              { name: 'Wio Bank', status: 'online', latency: '52ms' },
              { name: 'Emirates NBD', status: 'degraded', latency: '120ms' },
              { name: 'Binance', status: 'online', latency: '89ms' },
              { name: 'Rain Exchange', status: 'offline', latency: '-' },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-300">{integration.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{integration.latency}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    integration.status === 'online' ? 'bg-green-400' :
                    integration.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Test User
            </Button>
            <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
              <Route className="w-4 h-4 mr-2" />
              New Test Journey
            </Button>
            <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync All Integrations
            </Button>
            <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
              <Activity className="w-4 h-4 mr-2" />
              View System Logs
            </Button>
            <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Send Broadcast Notification
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activity.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  item.status === 'success' ? 'bg-green-500/20' :
                  item.status === 'warning' ? 'bg-yellow-500/20' :
                  item.status === 'error' ? 'bg-red-500/20' : 'bg-blue-500/20'
                }`}>
                  {item.type === 'user' && <Users className={`w-4 h-4 ${
                    item.status === 'success' ? 'text-green-400' :
                    item.status === 'warning' ? 'text-yellow-400' :
                    item.status === 'error' ? 'text-red-400' : 'text-blue-400'
                  }`} />}
                  {item.type === 'payment' && <DollarSign className={`w-4 h-4 ${
                    item.status === 'success' ? 'text-green-400' : 'text-blue-400'
                  }`} />}
                  {item.type === 'journey' && <Route className={`w-4 h-4 ${
                    item.status === 'success' ? 'text-green-400' : 'text-blue-400'
                  }`} />}
                  {item.type === 'ticket' && <Ticket className="text-yellow-400 w-4 h-4" />}
                  {item.type === 'system' && <Activity className={`w-4 h-4 ${
                    item.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                  }`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">{item.message}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className={`text-xs ${
                  item.status === 'success' ? 'border-green-500/30 text-green-400' :
                  item.status === 'warning' ? 'border-yellow-500/30 text-yellow-400' :
                  item.status === 'error' ? 'border-red-500/30 text-red-400' : 'border-blue-500/30 text-blue-400'
                }`}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
