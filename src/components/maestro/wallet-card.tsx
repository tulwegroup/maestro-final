'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  CreditCard, 
  Bitcoin, 
  Building2,
  Apple,
  Smartphone,
  Plus,
  Loader2,
  CheckCircle,
  ArrowUpRight
} from 'lucide-react';

interface WalletCardProps {
  balance: number;
  onTopUp: (amount: number, method: string) => Promise<void>;
  onOpenModal: (modal: string) => void;
}

const TOP_UP_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Card', icon: CreditCard, description: 'Visa, Mastercard' },
  { id: 'APPLE_PAY', label: 'Apple Pay', icon: Apple, description: 'Instant' },
  { id: 'GOOGLE_PAY', label: 'Google Pay', icon: Smartphone, description: 'Instant' },
  { id: 'AANI', label: 'AANI', icon: Building2, description: 'UAE Bank Transfer' },
  { id: 'BTC', label: 'Bitcoin', icon: Bitcoin, description: 'Crypto' },
  { id: 'USDT_TRC20', label: 'USDT TRC20', icon: Bitcoin, description: 'Stablecoin' },
];

export function WalletCard({ balance, onTopUp, onOpenModal }: WalletCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('CARD');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleTopUp = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) return;

    setIsLoading(true);
    try {
      await onTopUp(amount, selectedMethod);
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setSelectedAmount(null);
        setCustomAmount('');
      }, 1500);
    } catch (error) {
      console.error('Top-up failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0 shadow-xl shadow-teal-500/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Wallet className="w-5 h-5" />
            Maestro Wallet
          </CardTitle>
          <Badge className="bg-white/20 text-white border-white/30">
            AANI Ready
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-teal-100 text-sm">Available Balance</p>
            <p className="text-3xl font-bold">AED {balance.toLocaleString()}</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                <Plus className="w-4 h-4 mr-2" />
                Top Up
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Top Up Wallet</DialogTitle>
              </DialogHeader>
              
              {success ? (
                <div className="flex flex-col items-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <p className="text-lg font-semibold">Top Up Successful!</p>
                  <p className="text-slate-500">Your wallet has been credited</p>
                </div>
              ) : (
                <div className="space-y-4 pt-4">
                  {/* Quick amounts */}
                  <div>
                    <Label className="text-sm text-slate-500">Select Amount</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {TOP_UP_AMOUNTS.map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount ? 'default' : 'outline'}
                          className={selectedAmount === amount ? 'bg-teal-600' : ''}
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount('');
                          }}
                        >
                          AED {amount}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom amount */}
                  <div>
                    <Label className="text-sm text-slate-500">Or enter custom amount</Label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setSelectedAmount(null);
                      }}
                      className="mt-2"
                    />
                  </div>

                  {/* Payment method */}
                  <div>
                    <Label className="text-sm text-slate-500">Payment Method</Label>
                    <Tabs value={selectedMethod} onValueChange={setSelectedMethod} className="mt-2">
                      <TabsList className="grid grid-cols-3 w-full">
                        {PAYMENT_METHODS.slice(0, 3).map((method) => (
                          <TabsTrigger key={method.id} value={method.id} className="text-xs">
                            <method.icon className="w-3 h-3 mr-1" />
                            {method.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <TabsList className="grid grid-cols-3 w-full mt-1">
                        {PAYMENT_METHODS.slice(3).map((method) => (
                          <TabsTrigger key={method.id} value={method.id} className="text-xs">
                            <method.icon className="w-3 h-3 mr-1" />
                            {method.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Confirm button */}
                  <Button 
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    onClick={handleTopUp}
                    disabled={isLoading || (!selectedAmount && !customAmount)}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                    )}
                    Top Up AED {(selectedAmount || parseFloat(customAmount) || 0).toLocaleString()}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick actions - Now functional */}
        <div className="grid grid-cols-3 gap-2">
          <Button 
            variant="ghost" 
            className="bg-white/10 hover:bg-white/20 text-white text-xs"
            onClick={() => onOpenModal('aani')}
          >
            <Building2 className="w-3 h-3 mr-1" />
            AANI Pay
          </Button>
          <Button 
            variant="ghost" 
            className="bg-white/10 hover:bg-white/20 text-white text-xs"
            onClick={() => onOpenModal('crypto')}
          >
            <Bitcoin className="w-3 h-3 mr-1" />
            Crypto
          </Button>
          <Button 
            variant="ghost" 
            className="bg-white/10 hover:bg-white/20 text-white text-xs"
            onClick={() => onOpenModal('transfer')}
          >
            <ArrowUpRight className="w-3 h-3 mr-1" />
            Transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
