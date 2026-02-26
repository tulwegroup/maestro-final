'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  FileText,
  User,
  Shield,
  CreditCard,
  Route,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Download,
  Calendar
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  resourceId: string;
  userId: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  details: string;
  changes?: {
    before: any;
    after: any;
  };
}

// Mock audit logs
function generateMockAuditLogs(): AuditLog[] {
  const actions = [
    { action: 'USER_LOGIN', resource: 'User', icon: User, status: 'success' as const },
    { action: 'USER_LOGOUT', resource: 'User', icon: User, status: 'success' as const },
    { action: 'JOURNEY_CREATED', resource: 'Journey', icon: Route, status: 'success' as const },
    { action: 'PAYMENT_PROCESSED', resource: 'Payment', icon: CreditCard, status: 'success' as const },
    { action: 'PAYMENT_FAILED', resource: 'Payment', icon: CreditCard, status: 'failure' as const },
    { action: 'USER_SUSPENDED', resource: 'User', icon: Shield, status: 'warning' as const },
    { action: 'SETTINGS_CHANGED', resource: 'Settings', icon: Settings, status: 'success' as const },
    { action: 'API_KEY_GENERATED', resource: 'ApiKey', icon: Shield, status: 'success' as const },
    { action: 'LOGIN_FAILED', resource: 'Auth', icon: Shield, status: 'failure' as const },
    { action: 'PERMISSION_GRANTED', resource: 'Permission', icon: Shield, status: 'success' as const },
  ];

  const users = ['Ahmed Al Mansoori', 'Fatima Hassan', 'System', 'Admin User', 'Support Agent 1'];

  return actions.flatMap((a, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 15 * 60 * 1000).toISOString(),
    action: a.action,
    resource: a.resource,
    resourceId: `RES-${1000 + i}`,
    userId: `user-${i % 5}`,
    userName: users[i % 5],
    ipAddress: `192.168.1.${100 + i}`,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: a.status,
    details: `${a.action} performed on ${a.resource} by ${users[i % 5]}`,
    changes: i % 3 === 0 ? { before: { status: 'active' }, after: { status: 'suspended' } } : undefined,
  }));
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [resourceFilter, setResourceFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    setTimeout(() => {
      const mockLogs = generateMockAuditLogs();
      setLogs(mockLogs);
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    if (searchQuery) {
      filtered = filtered.filter(l => 
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.resourceId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    
    if (resourceFilter !== 'all') {
      filtered = filtered.filter(l => l.resource === resourceFilter);
    }
    
    return filtered;
  }, [searchQuery, statusFilter, resourceFilter, logs]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400">Success</Badge>;
      case 'failure':
        return <Badge className="bg-red-500/20 text-red-400">Failure</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  const resources = [...new Set(logs.map(l => l.resource))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 text-sm">Track all system activities and changes</p>
        </div>
        <Button variant="outline" className="border-slate-600 text-slate-300">
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <FileText className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{logs.length}</p>
                <p className="text-xs text-slate-400">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{logs.filter(l => l.status === 'success').length}</p>
                <p className="text-xs text-slate-400">Success</p>
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
                <p className="text-2xl font-bold text-white">{logs.filter(l => l.status === 'failure').length}</p>
                <p className="text-xs text-slate-400">Failures</p>
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
                <p className="text-2xl font-bold text-white">{logs.filter(l => l.status === 'warning').length}</p>
                <p className="text-xs text-slate-400">Warnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by action, user, or resource ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
                <option value="warning">Warning</option>
              </select>
              <select
                value={resourceFilter}
                onChange={(e) => setResourceFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="all">All Resources</option>
                {resources.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                <Calendar className="w-4 h-4 mr-1" />
                Date Range
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Timestamp</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Action</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">User</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Resource</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{log.action}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300">{log.userName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-white">{log.resource}</span>
                        <span className="text-slate-500 text-xs ml-2">({log.resourceId})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm font-mono">{log.ipAddress}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
          <Card className="bg-slate-800 border-slate-700 w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {getStatusIcon(selectedLog.status)}
                {selectedLog.action}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Timestamp</p>
                  <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">User</p>
                  <p className="text-white">{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Resource</p>
                  <p className="text-white">{selectedLog.resource} ({selectedLog.resourceId})</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">IP Address</p>
                  <p className="text-white font-mono">{selectedLog.ipAddress}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Details</p>
                <p className="text-slate-300">{selectedLog.details}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">User Agent</p>
                <p className="text-slate-400 text-sm">{selectedLog.userAgent}</p>
              </div>
              {selectedLog.changes && (
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-2">Changes</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-red-400 mb-1">Before</p>
                      <pre className="text-xs text-slate-300">{JSON.stringify(selectedLog.changes.before, null, 2)}</pre>
                    </div>
                    <div>
                      <p className="text-xs text-green-400 mb-1">After</p>
                      <pre className="text-xs text-slate-300">{JSON.stringify(selectedLog.changes.after, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
