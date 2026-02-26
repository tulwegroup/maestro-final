'use client';

import { useEffect, useState, useCallback } from 'react';
import { 
  Zap, 
  Bell, 
  Settings, 
  RefreshCw,
  Sparkles,
  Shield,
  CheckCircle,
  Loader2,
  Users,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LifeScoreCard } from '@/components/maestro/life-score-card';
import { JourneyCard } from '@/components/maestro/journey-card';
import { ProactiveAlerts } from '@/components/maestro/proactive-alerts';
import { WalletCard } from '@/components/maestro/wallet-card';
import { 
  QuickActions, 
  VehicleInfoModal, 
  DocumentsModal, 
  PoliceClearanceModal, 
  PayFinesModal,
  TransferModal,
  CryptoTransferModal,
  AaniPayModal
} from '@/components/maestro/quick-actions';
import { UpcomingRenewals } from '@/components/maestro/upcoming-renewals';
import { JourneyPaymentFlow } from '@/components/maestro/journey-payment-flow';
import { AdminDashboard } from '@/components/maestro/admin-dashboard';
import { AIAssistant } from '@/components/maestro/ai-assistant';
import { IntegrationStatusCard } from '@/components/maestro/integration-status-card';

// Types
interface UserProfile {
  id: string;
  fullNameEnglish: string;
  mobile: string;
  lifeScore: number;
  walletBalance: number;
  uaePassConnected: boolean;
  aaniLinked: boolean;
  licenseExpiry: Date | null;
  visaExpiry: Date | null;
  vehicleExpiry: Date | null;
  vehiclePlate?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  licenseNumber?: string;
  emiratesId?: string;
  btcBalance: number;
  usdtTrc20Balance: number;
}

interface Task {
  id: string;
  entity: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  blockingTask: boolean;
  priority: number;
}

interface Journey {
  id: string;
  title: string;
  status: string;
  totalAmount: number;
  tasks: Task[];
  createdAt: string;
}

export default function MaestroDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Payment flow state
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  
  // Modal states
  const [showTravelBanModal, setShowTravelBanModal] = useState(false);
  const [travelBanResult, setTravelBanResult] = useState<any>(null);
  const [isCheckingBan, setIsCheckingBan] = useState(false);
  
  // Quick action modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // AI Assistant
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [profileRes, journeysRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/journeys')
      ]);
      
      const profileData = await profileRes.json();
      const journeysData = await journeysRes.json();
      
      if (profileData.success) {
        setProfile(profileData.user.profile);
      }
      if (journeysData.success) {
        // Remove duplicates by ID
        const uniqueJourneys = journeysData.journeys.filter((journey: Journey, index: number, self: Journey[]) =>
          index === self.findIndex(j => j.id === journey.id)
        );
        setJourneys(uniqueJourneys);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Top up wallet
  const handleTopUp = async (amount: number, method: string) => {
    const res = await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethod: method })
    });
    const data = await res.json();
    if (data.success) {
      setProfile(prev => prev ? { ...prev, walletBalance: data.newBalance } : null);
    }
  };

  // Scan for issues
  const handleScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.journey) {
        // Check if journey already exists
        setJourneys(prev => {
          const exists = prev.some(j => j.id === data.journey.id);
          if (!exists) {
            return [data.journey, ...prev];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  // Check travel ban
  const handleTravelBanCheck = async () => {
    setIsCheckingBan(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      setTravelBanResult({
        status: 'clear',
        message: 'No travel restrictions found',
        checkedAt: new Date().toISOString(),
        authorities: ['Dubai Courts', 'Abu Dhabi Courts', 'Sharjah Courts', 'Federal Courts']
      });
    } catch (error) {
      console.error('Travel ban check error:', error);
    } finally {
      setIsCheckingBan(false);
    }
  };

  // Handle journey card click
  const handleJourneyClick = (journey: Journey) => {
    setSelectedJourney(journey);
    setShowPaymentFlow(true);
  };

  // Quick action handler
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        handleScan();
        break;
      case 'travel_ban':
        setShowTravelBanModal(true);
        handleTravelBanCheck();
        break;
      default:
        console.log('Action:', action);
    }
  };

  // Open modal handler
  const handleOpenModal = (modal: string) => {
    setActiveModal(modal);
  };

  // Payment complete handler
  const handlePaymentComplete = () => {
    fetchData();
  };

  // Transfer handler
  const handleTransfer = (amount: number, destination: string) => {
    setProfile(prev => prev ? { ...prev, walletBalance: prev.walletBalance - amount } : null);
  };

  // Get all pending tasks for alerts
  const allPendingTasks = journeys
    .filter(j => j.status === 'PENDING')
    .flatMap(j => (j.tasks || []).filter(t => t.status === 'PENDING'));

  // Upcoming renewals
  const upcomingRenewals = profile ? [
    profile.licenseExpiry && {
      id: 'license',
      type: 'license',
      title: 'Driving License',
      date: profile.licenseExpiry,
      status: new Date(profile.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'urgent' : 'normal',
      daysUntil: Math.ceil((new Date(profile.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    },
    profile.visaExpiry && {
      id: 'visa',
      type: 'visa',
      title: 'Visa',
      date: profile.visaExpiry,
      status: 'normal',
      daysUntil: Math.ceil((new Date(profile.visaExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    },
    profile.vehicleExpiry && {
      id: 'vehicle',
      type: 'vehicle',
      title: 'Vehicle Registration',
      date: profile.vehicleExpiry,
      status: 'upcoming',
      daysUntil: Math.ceil((new Date(profile.vehicleExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    }
  ].filter(Boolean) as any[] : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading Maestro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-900">MAESTRO</h1>
              <p className="text-xs text-slate-500">UAE Life Automation</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {profile?.aaniLinked && (
              <Badge className="bg-green-100 text-green-700 border-green-200 hidden sm:flex">
                <CheckCircle className="w-3 h-3 mr-1" />
                AANI Linked
              </Badge>
            )}
            
            {profile?.uaePassConnected && (
              <Badge className="bg-teal-100 text-teal-700 border-teal-200 hidden sm:flex">
                <Shield className="w-3 h-3 mr-1" />
                UAE Pass
              </Badge>
            )}
            
            <Link href="/admin" target="_blank" className="hidden sm:flex">
              <Button variant="outline" size="sm" className="border-teal-200 text-teal-600 hover:bg-teal-50">
                <Users className="w-4 h-4 mr-1" />
                Admin Portal
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
            
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-slate-600" />
              {allPendingTasks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {allPendingTasks.length}
                </span>
              )}
            </Button>
            
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-slate-600" />
            </Button>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-medium">
              {profile?.fullNameEnglish?.charAt(0) || 'M'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="journeys" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                Journeys
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">
                <Users className="w-4 h-4 mr-1" />
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Welcome Banner */}
            <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 text-white shadow-xl shadow-teal-500/20">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Good evening, {profile?.fullNameEnglish?.split(' ')[0] || 'Friend'}! 👋</h2>
                  <p className="text-teal-100 mt-1">
                    {allPendingTasks.length > 0 
                      ? `You have ${allPendingTasks.length} items requiring attention`
                      : 'All your services are up to date'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                    onClick={handleScan}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Scan for Issues
                  </Button>
                  <Badge 
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 cursor-pointer"
                    onClick={() => setShowAIAssistant(true)}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Assistant
                  </Badge>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {allPendingTasks.length > 0 && (
                  <ProactiveAlerts tasks={allPendingTasks} />
                )}
                
                <QuickActions 
                  onAction={handleQuickAction} 
                  isScanning={isScanning}
                  onOpenModal={handleOpenModal}
                />
                
                {/* Active Journeys */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Active Journeys</h3>
                  {journeys.length === 0 ? (
                    <div className="text-center py-8 bg-white/50 rounded-xl border border-slate-200">
                      <RefreshCw className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-slate-600 mb-2">No active journeys</p>
                      <Button onClick={handleScan} variant="outline" className="border-teal-300 text-teal-600">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Scan for Issues
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {journeys.slice(0, 4).map(journey => (
                        <JourneyCard 
                          key={journey.id} 
                          journey={journey as any}
                          onClick={() => journey.status === 'PENDING' && handleJourneyClick(journey)}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                <UpcomingRenewals items={upcomingRenewals} />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <LifeScoreCard score={profile?.lifeScore || 88} />
                
                <WalletCard 
                  balance={profile?.walletBalance || 0} 
                  onTopUp={handleTopUp}
                  onOpenModal={handleOpenModal}
                />
                
                {/* Crypto Vault */}
                <div 
                  className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setActiveModal('crypto')}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">Crypto Vault</h3>
                    <Badge variant="outline" className="text-xs">Click to manage</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">₿ Bitcoin</span>
                      <span className="font-medium">{profile?.btcBalance?.toFixed(4) || '0'} BTC</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">₮ USDT (TRC20)</span>
                      <span className="font-medium">{profile?.usdtTrc20Balance?.toLocaleString() || '0'} USDT</span>
                    </div>
                  </div>
                </div>
                
                {/* Security Status */}
                <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Security Status</p>
                      <p className="text-xs text-green-600">All services secure</p>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Protected</Badge>
                  </div>
                </div>
                
                {/* Integration Status */}
                <IntegrationStatusCard />
              </div>
            </div>
          </>
        )}

        {/* Journeys Tab */}
        {activeTab === 'journeys' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Your Journeys</h2>
              <Button onClick={handleScan} className="bg-teal-600 hover:bg-teal-700" disabled={isScanning}>
                {isScanning ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                New Scan
              </Button>
            </div>
            
            {journeys.length === 0 ? (
              <div className="text-center py-16 bg-white/50 rounded-xl border border-slate-200">
                <RefreshCw className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Journeys Yet</h3>
                <p className="text-slate-500 mb-4">Scan your UAE services to discover items that need attention</p>
                <Button onClick={handleScan} className="bg-teal-600 hover:bg-teal-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Scan for Issues
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {journeys.map(journey => (
                  <JourneyCard 
                    key={journey.id} 
                    journey={journey as any}
                    onClick={() => journey.status === 'PENDING' && handleJourneyClick(journey)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && (
          <AdminDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-500" />
              <span className="font-medium text-slate-700">MAESTRO</span>
              <span>•</span>
              <span>UAE Life Automation Platform</span>
            </div>
            <div className="flex items-center gap-4">
              <span>UAE Pass Secured</span>
              <span>•</span>
              <span>AANI Ready</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Journey Payment Flow Modal */}
      <JourneyPaymentFlow
        journey={selectedJourney}
        walletBalance={profile?.walletBalance || 0}
        isOpen={showPaymentFlow}
        onClose={() => setShowPaymentFlow(false)}
        onComplete={handlePaymentComplete}
      />

      {/* Travel Ban Check Modal */}
      <Dialog open={showTravelBanModal} onOpenChange={setShowTravelBanModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Travel Ban Check
            </DialogTitle>
          </DialogHeader>
          
          {isCheckingBan ? (
            <div className="py-8 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-slate-600">Checking all UAE courts...</p>
              <p className="text-xs text-slate-400 mt-1">This may take a few seconds</p>
            </div>
          ) : travelBanResult ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${travelBanResult.status === 'clear' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {travelBanResult.status === 'clear' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <Shield className="w-6 h-6 text-red-600" />
                  )}
                  <span className={`font-semibold ${travelBanResult.status === 'clear' ? 'text-green-700' : 'text-red-700'}`}>
                    {travelBanResult.status === 'clear' ? 'No Travel Restrictions' : 'Travel Ban Detected'}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{travelBanResult.message}</p>
              </div>
              
              <div className="text-sm text-slate-500">
                <p className="font-medium mb-2">Checked Authorities:</p>
                <div className="flex flex-wrap gap-1">
                  {travelBanResult.authorities.map((auth: string) => (
                    <Badge key={auth} variant="outline" className="text-xs">
                      {auth}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <p className="text-xs text-slate-400">
                Checked at: {new Date(travelBanResult.checkedAt).toLocaleString()}
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Quick Action Modals */}
      <VehicleInfoModal 
        isOpen={activeModal === 'vehicle'} 
        onClose={() => setActiveModal(null)} 
        profile={profile}
      />
      
      <DocumentsModal 
        isOpen={activeModal === 'documents'} 
        onClose={() => setActiveModal(null)} 
        profile={profile}
      />
      
      <PoliceClearanceModal 
        isOpen={activeModal === 'police'} 
        onClose={() => setActiveModal(null)} 
      />
      
      <PayFinesModal 
        isOpen={activeModal === 'fines'} 
        onClose={() => setActiveModal(null)} 
        onPay={() => setActiveModal(null)}
      />
      
      <TransferModal 
        isOpen={activeModal === 'transfer'} 
        onClose={() => setActiveModal(null)} 
        balance={profile?.walletBalance || 0}
        onTransfer={handleTransfer}
      />
      
      <CryptoTransferModal 
        isOpen={activeModal === 'crypto'} 
        onClose={() => setActiveModal(null)} 
        balances={{ btc: profile?.btcBalance || 0, usdt: profile?.usdtTrc20Balance || 0 }}
      />
      
      <AaniPayModal 
        isOpen={activeModal === 'aani'} 
        onClose={() => setActiveModal(null)} 
        balance={profile?.walletBalance || 0}
      />
      
      {/* AI Assistant Modal */}
      <AIAssistant 
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        userProfile={profile}
      />
    </div>
  );
}
