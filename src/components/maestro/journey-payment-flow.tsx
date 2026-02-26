'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CreditCard, 
  Wallet, 
  Bitcoin, 
  Building2, 
  Apple, 
  Smartphone,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  Receipt,
  Clock
} from 'lucide-react';
import { Entity, TaskStatus } from '@prisma/client';

interface Task {
  id: string;
  entity: Entity;
  title: string;
  description: string | null;
  amount: number;
  status: TaskStatus;
  blockingTask: boolean;
  priority: number;
  metadata: string | null;
}

interface Journey {
  id: string;
  title: string;
  totalAmount: number;
  tasks: Task[];
}

interface JourneyPaymentFlowProps {
  journey: Journey | null;
  walletBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ENTITY_ICONS: Record<Entity, string> = {
  RTA: '🚗',
  DUBAI_POLICE: '👮',
  ICP: '🏛️',
  AADC: '💡',
  SHARJAH_POLICE: '👮',
  DEWA: '⚡',
  EJARI: '🏠',
  EMIRATES_ID: '🪪',
  SALIK: '🛣️',
  DU: '📱',
  ETISALAT: '📞',
  TASJEEL: '🔧',
  DUBAI_COURTS: '⚖️',
  ABU_DHABI_COURTS: '⚖️',
  FEDERAL_COURTS: '⚖️',
  CUSTOM: '📋'
};

export function JourneyPaymentFlow({ 
  journey, 
  walletBalance, 
  isOpen, 
  onClose,
  onComplete 
}: JourneyPaymentFlowProps) {
  // Initialize with all tasks selected when journey changes
  const initialSelectedTasks = useMemo(() => {
    return journey ? new Set(journey.tasks.map(t => t.id)) : new Set<string>();
  }, [journey]);
  
  const [step, setStep] = useState<'select' | 'payment' | 'processing' | 'success'>('select');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(initialSelectedTasks);
  const [paymentMethod, setPaymentMethod] = useState('MAESTRO_WALLET');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [receiptId, setReceiptId] = useState('');

  // Reset state when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset state on close
      setStep('select');
      setSelectedTasks(journey ? new Set(journey.tasks.map(t => t.id)) : new Set());
      setProcessingProgress(0);
      if (step === 'success') {
        onComplete();
      }
      onClose();
    }
  };

  const totalSelected = Array.from(selectedTasks).reduce((sum, id) => {
    const task = journey?.tasks.find(t => t.id === id);
    return sum + (task?.amount || 0);
  }, 0);

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleAll = () => {
    if (journey) {
      if (selectedTasks.size === journey.tasks.length) {
        setSelectedTasks(new Set());
      } else {
        setSelectedTasks(new Set(journey.tasks.map(t => t.id)));
      }
    }
  };

  const handlePayment = async () => {
    setStep('processing');
    setIsProcessing(true);

    // Simulate processing
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate API call
    await new Promise(r => setTimeout(r, 2500));

    // Generate receipt
    setReceiptId(`RCP-${Date.now()}`);
    
    setIsProcessing(false);
    setStep('success');
  };

  if (!journey) return null;

  const insufficientBalance = paymentMethod === 'MAESTRO_WALLET' && totalSelected > walletBalance;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'select' && (
              <>
                <Receipt className="w-5 h-5 text-teal-600" />
                Review & Select Items
              </>
            )}
            {step === 'payment' && (
              <>
                <CreditCard className="w-5 h-5 text-teal-600" />
                Choose Payment Method
              </>
            )}
            {step === 'processing' && (
              <>
                <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                Processing Payment
              </>
            )}
            {step === 'success' && (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Payment Complete
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Task Selection */}
        {step === 'select' && (
          <div className="space-y-4 pt-4">
            {/* Select All */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedTasks.size === journey.tasks.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Badge variant="outline">
                {selectedTasks.size} of {journey.tasks.length} selected
              </Badge>
            </div>

            {/* Task List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {journey.tasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedTasks.has(task.id) 
                      ? 'border-teal-300 bg-teal-50' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  onClick={() => toggleTask(task.id)}
                >
                  <Checkbox 
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{ENTITY_ICONS[task.entity]}</span>
                      <p className="font-medium text-slate-900 truncate">{task.title}</p>
                      {task.blockingTask && (
                        <Badge className="bg-red-100 text-red-700 text-xs">Blocking</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{task.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">AED {task.amount.toLocaleString()}</p>
                    <Badge variant="outline" className="text-xs">
                      {task.entity.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <span className="font-medium text-slate-700">Total Amount</span>
              <span className="text-2xl font-bold text-teal-600">AED {totalSelected.toLocaleString()}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={() => setStep('payment')}
                disabled={selectedTasks.size === 0}
              >
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Payment Method */}
        {step === 'payment' && (
          <div className="space-y-4 pt-4">
            {/* Order Summary */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">Items</span>
                <span>{selectedTasks.size} selected</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-teal-600">AED {totalSelected.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="MAESTRO_WALLET">
                  <Wallet className="w-4 h-4 mr-1" />
                  Wallet
                </TabsTrigger>
                <TabsTrigger value="CARD">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="AANI">
                  <Building2 className="w-4 h-4 mr-1" />
                  AANI
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid grid-cols-3 w-full mt-1">
                <TabsTrigger value="APPLE_PAY">
                  <Apple className="w-4 h-4 mr-1" />
                  Apple
                </TabsTrigger>
                <TabsTrigger value="GOOGLE_PAY">
                  <Smartphone className="w-4 h-4 mr-1" />
                  Google
                </TabsTrigger>
                <TabsTrigger value="USDT_TRC20">
                  <Bitcoin className="w-4 h-4 mr-1" />
                  Crypto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="MAESTRO_WALLET" className="mt-4">
                <div className="p-4 bg-teal-50 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-600">Wallet Balance</span>
                    <span className="font-semibold">AED {walletBalance.toLocaleString()}</span>
                  </div>
                  {insufficientBalance && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Insufficient balance. Please top up or choose another method.
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="CARD" className="mt-4 space-y-3">
                <div>
                  <Label>Card Number</Label>
                  <Input placeholder="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Expiry</Label>
                    <Input placeholder="MM/YY" />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input placeholder="123" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="AANI" className="mt-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-green-600" />
                  <p className="font-medium">AANI Instant Transfer</p>
                  <p className="text-sm text-slate-500 mt-1">You will be redirected to your bank app</p>
                </div>
              </TabsContent>

              <TabsContent value="APPLE_PAY" className="mt-4">
                <div className="p-4 bg-slate-100 rounded-lg text-center">
                  <Apple className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Apple Pay</p>
                  <p className="text-sm text-slate-500 mt-1">Confirm with Face ID or Touch ID</p>
                </div>
              </TabsContent>

              <TabsContent value="GOOGLE_PAY" className="mt-4">
                <div className="p-4 bg-slate-100 rounded-lg text-center">
                  <Smartphone className="w-12 h-12 mx-auto mb-3" />
                  <p className="font-medium">Google Pay</p>
                  <p className="text-sm text-slate-500 mt-1">Confirm with your device</p>
                </div>
              </TabsContent>

              <TabsContent value="USDT_TRC20" className="mt-4">
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Bitcoin className="w-5 h-5 text-orange-500" />
                    <span className="font-medium">USDT (TRC20)</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Equivalent: {(totalSelected / 3.67).toFixed(2)} USDT
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Payment will be processed via Rain Exchange
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep('select')} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button 
                className="flex-1 bg-teal-600 hover:bg-teal-700"
                onClick={handlePayment}
                disabled={insufficientBalance}
              >
                Pay AED {totalSelected.toLocaleString()}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="py-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-teal-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Your Payment</h3>
            <p className="text-slate-500 mb-6">Please wait while we process your request...</p>
            <Progress value={processingProgress} className="h-2 mb-4" />
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4" />
              Connecting to {paymentMethod.replace('_', ' ')}...
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="py-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
            <p className="text-slate-500 mb-6">
              Your payment of AED {totalSelected.toLocaleString()} has been processed.
            </p>
            
            {/* Receipt */}
            <div className="bg-slate-50 rounded-lg p-4 text-left mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Receipt ID</span>
                <span className="font-medium">{receiptId}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Items Processed</span>
                <span>{selectedTasks.size} tasks</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Payment Method</span>
                <span>{paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <Button 
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => handleOpenChange(false)}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
