'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Car, 
  FileText, 
  Shield, 
  CreditCard,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Building2,
  Wallet,
  Bitcoin,
  Apple,
  Smartphone,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useState } from 'react';

interface QuickActionsProps {
  onAction: (action: string) => void;
  isScanning?: boolean;
  onOpenModal: (modal: string, data?: any) => void;
}

const QUICK_ACTIONS = [
  { icon: Search, label: 'Check Travel Ban', description: 'AED 170', color: 'bg-red-50 text-red-600', action: 'travel_ban' },
  { icon: Car, label: 'Vehicle Info', description: 'RTA', color: 'bg-purple-50 text-purple-600', action: 'vehicle' },
  { icon: FileText, label: 'View Documents', description: 'All docs', color: 'bg-blue-50 text-blue-600', action: 'documents' },
  { icon: Shield, label: 'Police Clearance', description: 'Apply', color: 'bg-green-50 text-green-600', action: 'police' },
  { icon: CreditCard, label: 'Pay Fines', description: 'All emirates', color: 'bg-orange-50 text-orange-600', action: 'fines' },
  { icon: Zap, label: 'Scan Now', description: 'Find issues', color: 'bg-teal-50 text-teal-600', action: 'scan' }
];

export function QuickActions({ onAction, isScanning, onOpenModal }: QuickActionsProps) {
  const handleClick = (action: string) => {
    // For actions that need modals
    if (['vehicle', 'documents', 'police', 'fines'].includes(action)) {
      onOpenModal(action);
    } else {
      onAction(action);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur border-slate-200">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.action}
              variant="ghost"
              className="h-auto flex-col gap-2 p-3 hover:bg-slate-50"
              onClick={() => handleClick(action.action)}
              disabled={action.action === 'scan' && isScanning}
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-700">{action.label}</p>
                <p className="text-xs text-slate-400">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Vehicle Info Modal
export function VehicleInfoModal({ isOpen, onClose, profile }: { isOpen: boolean; onClose: () => void; profile?: any }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-purple-600" />
            Vehicle Information
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Plate Number</p>
              <p className="font-semibold text-slate-900">{profile?.vehiclePlate || 'DXB-A1234'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Expiry Date</p>
              <p className="font-semibold text-slate-900">{profile?.vehicleExpiry ? new Date(profile.vehicleExpiry).toLocaleDateString() : 'May 10, 2026'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Make</p>
              <p className="font-semibold text-slate-900">{profile?.vehicleMake || 'Toyota'}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Model</p>
              <p className="font-semibold text-slate-900">{profile?.vehicleModel || 'Camry'}</p>
            </div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Registration expires in 120 days</span>
            </div>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            Renew Registration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Documents Modal
export function DocumentsModal({ isOpen, onClose, profile }: { isOpen: boolean; onClose: () => void; profile?: any }) {
  const documents = [
    { name: 'Emirates ID', number: profile?.emiratesId || '784-1990-1234567-1', expiry: profile?.visaExpiry, status: 'valid' },
    { name: 'Driving License', number: profile?.licenseNumber || 'DXB-123456', expiry: profile?.licenseExpiry, status: 'expiring' },
    { name: 'Vehicle Registration', number: profile?.vehiclePlate || 'DXB-A1234', expiry: profile?.vehicleExpiry, status: 'valid' },
    { name: 'Passport', number: 'A12345678', expiry: null, status: 'valid' },
    { name: 'Visa', number: 'VISA-2024-001', expiry: profile?.visaExpiry, status: 'valid' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-700';
      case 'expiring': return 'bg-yellow-100 text-yellow-700';
      case 'expired': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            My Documents
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
          {documents.map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-500">{doc.number}</p>
              </div>
              <div className="text-right">
                <Badge className={getStatusColor(doc.status)}>
                  {doc.status}
                </Badge>
                {doc.expiry && (
                  <p className="text-xs text-slate-400 mt-1">
                    Expires: {new Date(doc.expiry).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full" variant="outline">
          Add Document
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Police Clearance Modal
export function PoliceClearanceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    setIsApplying(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsApplying(false);
    setApplied(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Police Clearance Certificate
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {applied ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="font-semibold text-lg">Application Submitted!</p>
              <p className="text-slate-500 text-sm mt-1">Your police clearance certificate will be ready in 2-3 business days.</p>
              <p className="text-slate-400 text-xs mt-2">Reference: PCC-{Date.now()}</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium mb-2">Service Details</h4>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• Good Conduct Certificate</li>
                  <li>• Valid for all UAE emirates</li>
                  <li>• Processing: 2-3 business days</li>
                  <li>• Fee: AED 200</li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Input placeholder="Purpose (e.g., Employment, Travel)" className="flex-1" />
              </div>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleApply}
                disabled={isApplying}
              >
                {isApplying ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {isApplying ? 'Applying...' : 'Apply Now - AED 200'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Pay Fines Modal
export function PayFinesModal({ isOpen, onClose, onPay }: { isOpen: boolean; onClose: () => void; onPay?: () => void }) {
  const fines = [
    { id: '1', authority: 'Dubai Police', type: 'Speeding', amount: 600, date: 'Dec 15, 2025', discount: 0 },
    { id: '2', authority: 'RTA', type: 'Parking', amount: 200, date: 'Jan 5, 2026', discount: 50 },
    { id: '3', authority: 'Sharjah Police', type: 'Lane Violation', amount: 300, date: 'Jan 20, 2026', discount: 0 },
  ];

  const totalFines = fines.reduce((sum, f) => sum + f.amount, 0);
  const totalDiscount = fines.reduce((sum, f) => sum + f.discount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-600" />
            Pay Fines - All Emirates
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {fines.map((fine) => (
              <div key={fine.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{fine.type}</p>
                  <p className="text-xs text-slate-500">{fine.authority} • {fine.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">AED {fine.amount}</p>
                  {fine.discount > 0 && (
                    <p className="text-xs text-green-600">-{fine.discount}% discount</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="flex justify-between mb-1">
              <span className="text-slate-600">Total Fines</span>
              <span>AED {totalFines}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discounts Applied</span>
                <span>-AED {totalDiscount}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-orange-200">
              <span>Total to Pay</span>
              <span className="text-orange-600">AED {totalFines - totalDiscount}</span>
            </div>
          </div>
          <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={onPay}>
            Pay All Fines
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Transfer Modal
export function TransferModal({ isOpen, onClose, balance, onTransfer }: { 
  isOpen: boolean; 
  onClose: () => void;
  balance: number;
  onTransfer?: (amount: number, destination: string) => void;
}) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transferType, setTransferType] = useState<'bank' | 'wallet' | 'aani'>('aani');

  const handleTransfer = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setSuccess(true);
    onTransfer?.(parseFloat(amount), destination);
  };

  const resetAndClose = () => {
    setAmount('');
    setDestination('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-teal-600" />
            Transfer Money
          </DialogTitle>
        </DialogHeader>
        
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="font-semibold text-lg">Transfer Successful!</p>
            <p className="text-slate-500">AED {amount} sent successfully</p>
            <Button className="mt-4" onClick={resetAndClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-3 bg-teal-50 rounded-lg">
              <p className="text-xs text-slate-500">Available Balance</p>
              <p className="font-semibold text-teal-600">AED {balance.toLocaleString()}</p>
            </div>

            <Tabs value={transferType} onValueChange={(v) => setTransferType(v as any)}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="aani">AANI</TabsTrigger>
                <TabsTrigger value="bank">Bank</TabsTrigger>
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
              </TabsList>
              
              <TabsContent value="aani" className="space-y-3">
                <div>
                  <Label>Recipient Phone / AANI ID</Label>
                  <Input 
                    placeholder="+971 50 XXX XXXX" 
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="bank" className="space-y-3">
                <div>
                  <Label>Bank Name</Label>
                  <Input placeholder="Select bank" />
                </div>
                <div>
                  <Label>Account Number / IBAN</Label>
                  <Input placeholder="AEXX XXXX XXXX XXXX XXXX XXXX" />
                </div>
              </TabsContent>
              
              <TabsContent value="wallet" className="space-y-3">
                <div>
                  <Label>Recipient Email</Label>
                  <Input type="email" placeholder="email@example.com" />
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label>Amount (AED)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleTransfer}
              disabled={isProcessing || !amount || parseFloat(amount) > balance}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Transfer AED {amount || '0.00'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Crypto Transfer Modal
export function CryptoTransferModal({ isOpen, onClose, balances, onTransfer }: { 
  isOpen: boolean; 
  onClose: () => void;
  balances: { btc: number; usdt: number };
  onTransfer?: (crypto: string, amount: number, toWallet: boolean) => void;
}) {
  const [selectedCrypto, setSelectedCrypto] = useState('usdt');
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'toWallet' | 'withdraw'>('toWallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTransfer = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setSuccess(true);
  };

  const resetAndClose = () => {
    setAmount('');
    setSuccess(false);
    onClose();
  };

  const rate = 3.67; // USDT to AED
  const aedEquivalent = parseFloat(amount) * rate;

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bitcoin className="w-5 h-5 text-orange-600" />
            Crypto Vault
          </DialogTitle>
        </DialogHeader>
        
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="font-semibold text-lg">Transfer Complete!</p>
            <p className="text-slate-500">{amount} {selectedCrypto.toUpperCase()} transferred</p>
            <Button className="mt-4" onClick={resetAndClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-slate-500">₿ Bitcoin</p>
                <p className="font-semibold">{balances.btc.toFixed(6)} BTC</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-slate-500">₮ USDT TRC20</p>
                <p className="font-semibold">{balances.usdt.toLocaleString()} USDT</p>
              </div>
            </div>

            {/* Direction */}
            <Tabs value={direction} onValueChange={(v) => setDirection(v as any)}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="toWallet">
                  <ArrowDownLeft className="w-4 h-4 mr-1" />
                  To Wallet
                </TabsTrigger>
                <TabsTrigger value="withdraw">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  Withdraw
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Crypto Selection */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={selectedCrypto === 'usdt' ? 'default' : 'outline'}
                className={selectedCrypto === 'usdt' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setSelectedCrypto('usdt')}
              >
                USDT TRC20
              </Button>
              <Button 
                variant={selectedCrypto === 'btc' ? 'default' : 'outline'}
                className={selectedCrypto === 'btc' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                onClick={() => setSelectedCrypto('btc')}
              >
                Bitcoin
              </Button>
            </div>

            {/* Amount */}
            <div>
              <Label>Amount</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              {selectedCrypto === 'usdt' && amount && (
                <p className="text-xs text-slate-400 mt-1">
                  ≈ AED {aedEquivalent.toFixed(2)}
                </p>
              )}
            </div>

            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleTransfer}
              disabled={isProcessing || !amount}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {direction === 'toWallet' ? 'Convert to AED' : 'Withdraw'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// AANI Pay Modal
export function AaniPayModal({ isOpen, onClose, balance }: { 
  isOpen: boolean; 
  onClose: () => void;
  balance: number;
}) {
  const [merchantId, setMerchantId] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsProcessing(false);
    setSuccess(true);
  };

  const resetAndClose = () => {
    setMerchantId('');
    setAmount('');
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            AANI Pay
          </DialogTitle>
        </DialogHeader>
        
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="font-semibold text-lg">Payment Successful!</p>
            <p className="text-slate-500">AED {amount} paid via AANI</p>
            <p className="text-xs text-slate-400 mt-2">Transaction ID: AANI-{Date.now()}</p>
            <Button className="mt-4" onClick={resetAndClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
              <p className="font-medium">UAE Central Bank Instant Payment</p>
              <p className="text-xs text-slate-500">Real-time bank transfers</p>
            </div>

            <div>
              <Label>Merchant ID / Alias</Label>
              <Input 
                placeholder="Enter merchant ID or phone" 
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
              />
            </div>

            <div>
              <Label>Amount (AED)</Label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">Your Balance</p>
              <p className="font-semibold">AED {balance.toLocaleString()}</p>
            </div>

            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={handlePay}
              disabled={isProcessing || !amount || !merchantId}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Pay AED {amount || '0.00'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
