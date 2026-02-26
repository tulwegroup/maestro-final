'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Wallet,
  Bitcoin,
  DollarSign,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'WALLET_TOP_UP' | 'WALLET_DEDUCTION' | 'JOURNEY_PAYMENT' | 'TASK_PAYMENT' | 'CRYPTO_DEPOSIT' | 'CRYPTO_WITHDRAWAL' | 'REFUND' | 'FEE';
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: 'MAESTRO_WALLET' | 'AANI' | 'CARD' | 'APPLE_PAY' | 'BTC' | 'USDT_TRC20';
  user: {
    name: string;
    email: string;
  };
  journeyId?: string;
  description: string;
  createdAt: string;
  completedAt?: string;
  feeAmount: number;
  reference: string;
}

// Mock transactions
function generateMockTransactions(): Transaction[] {
  const types: Transaction['type'][] = ['WALLET_TOP_UP', 'WALLET_DEDUCTION', 'JOURNEY_PAYMENT', 'TASK_PAYMENT', 'CRYPTO_DEPOSIT', 'CRYPTO_WITHDRAWAL', 'REFUND', 'FEE'];
  const statuses: Transaction['status'][] = ['PENDING', 'PROCESSING', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'FAILED', 'REFUNDED'];
  const methods: Transaction['paymentMethod'][] = ['MAESTRO_WALLET', 'AANI', 'CARD', 'APPLE_PAY', 'BTC', 'USDT_TRC20'];
  const users = [
    { name: 'Ahmed Al Mansoori', email: 'ahmed@example.com' },
    { name: 'Fatima Hassan', email: 'fatima@example.com' },
    { name: 'Mohammed Al Maktoum', email: 'mohammed@example.com' },
    { name: 'Aisha Al Nahyan', email: 'aisha@example.com' },
    { name: 'Khalid Obaid', email: 'khalid@example.com' },
  ];

  return Array.from({ length: 50 }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.floor(Math.random() * 10000) + 100;
    return {
      id: `txn-${i + 1}`,
      type,
      amount,
      currency: 'AED',
      status,
      paymentMethod: methods[Math.floor(Math.random() * methods.length)],
      user: users[Math.floor(Math.random() * users.length)],
      journeyId: type === 'JOURNEY_PAYMENT' ? `journey-${Math.floor(Math.random() * 100)}` : undefined,
      description: `${type.replace(/_/g, ' ')} - Transaction #${1000 + i}`,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      completedAt: status === 'COMPLETED' ? new Date(Date.now() - i * 3600000 + 300000).toISOString() : undefined,
      feeAmount: type === 'WALLET_TOP_UP' ? Math.floor(amount * 0.025) : 0,
      reference: `REF-${Date.now()}-${i}`,
    };
  });
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 15;

  useEffect(() => {
    setTimeout(() => {
      setTransactions(generateMockTransactions());
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    return filtered;
  }, [searchQuery, statusFilter, typeFilter, transactions]);

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * transactionsPerPage,
    currentPage * transactionsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  // Stats
  const totalVolume = transactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.filter(t => t.status === 'COMPLETED').reduce((sum, t) => sum + t.feeAmount, 0);
  const pendingCount = transactions.filter(t => t.status === 'PENDING' || t.status === 'PROCESSING').length;
  const failedCount = transactions.filter(t => t.status === 'FAILED').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WALLET_TOP_UP':
      case 'CRYPTO_DEPOSIT':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'WALLET_DEDUCTION':
      case 'CRYPTO_WITHDRAWAL':
      case 'JOURNEY_PAYMENT':
      case 'TASK_PAYMENT':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'REFUND':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      default:
        return <DollarSign className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'PROCESSING':
        return <Badge className="bg-blue-500/20 text-blue-400">Processing</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-purple-500/20 text-purple-400">Refunded</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400">{status}</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'MAESTRO_WALLET':
        return <Wallet className="w-4 h-4 text-teal-400" />;
      case 'AANI':
        return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'CARD':
        return <CreditCard className="w-4 h-4 text-slate-400" />;
      case 'BTC':
        return <Bitcoin className="w-4 h-4 text-orange-400" />;
      case 'USDT_TRC20':
        return <DollarSign className="w-4 h-4 text-green-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-slate-400" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-slate-400 text-sm">Monitor and manage all platform transactions</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Volume</p>
                <p className="text-2xl font-bold text-white">AED {totalVolume.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+12.5%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Fees</p>
                <p className="text-2xl font-bold text-white">AED {totalFees.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">+8.3%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span className="text-xs text-slate-400">Processing</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Failed</p>
                <p className="text-2xl font-bold text-red-400">{failedCount}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingDown className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">-5.2%</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
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
                  placeholder="Search by user, email, or reference..."
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
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white text-sm"
              >
                <option value="all">All Types</option>
                <option value="WALLET_TOP_UP">Wallet Top Up</option>
                <option value="JOURNEY_PAYMENT">Journey Payment</option>
                <option value="CRYPTO_DEPOSIT">Crypto Deposit</option>
                <option value="CRYPTO_WITHDRAWAL">Crypto Withdrawal</option>
                <option value="REFUND">Refund</option>
              </select>
              <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
                <Calendar className="w-4 h-4 mr-1" />
                Date Range
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Transaction</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">User</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Method</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Amount</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Status</th>
                  <th className="text-left text-sm font-medium text-slate-400 px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx) => (
                  <tr 
                    key={tx.id} 
                    className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                    onClick={() => { setSelectedTransaction(tx); setShowModal(true); }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(tx.type)}
                        <div>
                          <p className="text-white font-medium text-sm">{tx.type.replace(/_/g, ' ')}</p>
                          <p className="text-slate-500 text-xs font-mono">{tx.reference}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{tx.user.name}</p>
                        <p className="text-slate-500 text-xs">{tx.user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(tx.paymentMethod)}
                        <span className="text-slate-300 text-sm">{tx.paymentMethod.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{tx.currency} {tx.amount.toLocaleString()}</p>
                        {tx.feeAmount > 0 && (
                          <p className="text-slate-500 text-xs">Fee: {tx.currency} {tx.feeAmount}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-slate-600 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-slate-400 text-sm px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="border-slate-600 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              Transaction Details
              {selectedTransaction && getStatusBadge(selectedTransaction.status)}
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Reference</p>
                    <p className="text-white font-mono">{selectedTransaction.reference}</p>
                  </div>
                  {getTypeIcon(selectedTransaction.type)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400">Amount</p>
                  <p className="text-xl font-bold text-white">{selectedTransaction.currency} {selectedTransaction.amount.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400">Fee</p>
                  <p className="text-xl font-bold text-white">{selectedTransaction.currency} {selectedTransaction.feeAmount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-400">User</p>
                  <p className="text-white">{selectedTransaction.user.name}</p>
                  <p className="text-slate-500 text-xs">{selectedTransaction.user.email}</p>
                </div>
                <div>
                  <p className="text-slate-400">Payment Method</p>
                  <p className="text-white">{selectedTransaction.paymentMethod.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-400">Type</p>
                  <p className="text-white">{selectedTransaction.type.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-400">Created</p>
                  <p className="text-white">{new Date(selectedTransaction.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {selectedTransaction.completedAt && (
                <div className="text-sm">
                  <p className="text-slate-400">Completed At</p>
                  <p className="text-green-400">{new Date(selectedTransaction.completedAt).toLocaleString()}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedTransaction.status === 'PENDING' && (
                  <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                )}
                {selectedTransaction.status === 'COMPLETED' && (
                  <Button variant="outline" className="flex-1 border-slate-600 text-slate-300">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refund
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
