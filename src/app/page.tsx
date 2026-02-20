"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Car, CreditCard, FileText, Shield, Bell, ChevronRight, 
  Wallet, Building2, Zap, Clock, CheckCircle2, AlertTriangle, 
  ArrowRight, Loader2, LogOut, User, Settings, History, 
  Bitcoin, Smartphone, QrCode, DollarSign, TrendingUp, 
  AlertCircle, X, Menu, Home, BarChart3, Users, FileCheck,
  BadgeCheck, Plane, Gavel, Droplets, Phone, Ban, RefreshCw,
  FileSignature, Calendar, IdCard, ExternalLink, ChevronLeft,
  Moon, Sun, Globe, Lock, Eye, EyeOff, Plus, Minus, Send,
  Receipt, Clock3, MapPin, CreditCard as CardIcon, Trash2,
  Download, Share2, MoreVertical, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

// ===========================
// TYPES
// ===========================

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  profile?: {
    emiratesId: string | null;
    fullNameEnglish: string | null;
    mobile: string | null;
    walletBalance: number;
    lifeScore: number;
    uaePassConnected: boolean;
  };
}

interface Task {
  id: string;
  entity: string;
  taskType: string;
  title: string;
  description: string | null;
  status: string;
  amount: number;
  priority: number;
  blockingTask: boolean;
  metadata: string | null;
  selected?: boolean;
}

interface Journey {
  id: string;
  journeyType: string;
  title: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  tasks: Task[];
  user?: { id: string; email: string; name: string | null };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Document {
  id: string;
  type: string;
  number: string;
  issueDate: string;
  expiryDate: string;
  status: 'valid' | 'expiring' | 'expired';
  issuer: string;
}

interface Vehicle {
  id: string;
  plate: string;
  make: string;
  model: string;
  year: number;
  color: string;
  registrationExpiry: string;
  insuranceExpiry: string;
  status: 'valid' | 'expiring' | 'expired';
}

type PageType = 'welcome' | 'dashboard' | 'profile' | 'journey' | 'admin' | 'documents' | 'vehicle' | 'settings' | 'notifications';

// ===========================
// MAIN APP
// ===========================

export default function MaestroApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<PageType>('welcome');
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setCurrentPage('dashboard');
        await loadJourneys();
        loadMockData();
      }
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  };

  const loadJourneys = async () => {
    try {
      const res = await fetch('/api/journey');
      const data = await res.json();
      setJourneys(data.journeys || []);
    } catch {
      // Failed to load journeys
    }
  };

  const loadMockData = () => {
    // Mock documents
    setDocuments([
      {
        id: 'doc_1',
        type: 'Emirates ID',
        number: '784-1990-1234567-1',
        issueDate: '2020-05-15',
        expiryDate: '2028-05-15',
        status: 'valid',
        issuer: 'ICP'
      },
      {
        id: 'doc_2',
        type: 'Driving License',
        number: 'DXB-123456',
        issueDate: '2023-01-10',
        expiryDate: '2026-05-10',
        status: 'expiring',
        issuer: 'RTA Dubai'
      },
      {
        id: 'doc_3',
        type: 'Residency Visa',
        number: 'VIS-784-123456',
        issueDate: '2024-02-20',
        expiryDate: '2026-02-20',
        status: 'valid',
        issuer: 'ICP'
      },
      {
        id: 'doc_4',
        type: 'Passport',
        number: 'A12345678',
        issueDate: '2022-08-01',
        expiryDate: '2032-08-01',
        status: 'valid',
        issuer: 'Ministry of Foreign Affairs'
      }
    ]);

    // Mock vehicles
    setVehicles([
      {
        id: 'veh_1',
        plate: 'ABC-1234',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        color: 'White',
        registrationExpiry: '2026-03-15',
        insuranceExpiry: '2026-01-20',
        status: 'valid'
      }
    ]);

    // Mock notifications
    setNotifications([
      {
        id: 'notif_1',
        type: 'DOCUMENT_EXPIRING',
        title: 'License Expiring Soon',
        message: 'Your driving license will expire in 90 days. Renew now to avoid penalties.',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'notif_2',
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful',
        message: 'Your DEWA bill payment of AED 450 was processed successfully.',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'notif_3',
        type: 'FINE_DETECTED',
        title: 'New Traffic Fine',
        message: 'A traffic fine of AED 500 has been detected on your account.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]);
  };

  const handleLogin = async (action: 'demo' | 'uae-pass') => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setCurrentPage('dashboard');
        await loadJourneys();
        loadMockData();
        toast({ title: "Welcome to Maestro!", description: "You're now logged in." });
      }
    } catch {
      toast({ title: "Login failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setUser(null);
      setCurrentPage('welcome');
      setJourneys([]);
      toast({ title: "Logged out", description: "See you next time!" });
    } catch {
      // Ignore errors
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return <LoadingScreen />;
  }

  const renderPage = () => {
    if (!user) {
      return <WelcomePage key="welcome" onLogin={handleLogin} loading={loading} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard 
            key="dashboard" 
            user={user} 
            journeys={journeys}
            onRefresh={loadJourneys}
            onSelectJourney={(j) => {
              setSelectedJourney(j);
              setCurrentPage('journey');
            }}
            documents={documents}
            vehicles={vehicles}
            notifications={notifications}
            setCurrentPage={setCurrentPage}
          />
        );
      case 'profile':
        return <ProfilePage key="profile" user={user} onLogout={handleLogout} />;
      case 'journey':
        if (!selectedJourney) {
          setCurrentPage('dashboard');
          return null;
        }
        return (
          <JourneyFlow 
            key="journey" 
            journey={selectedJourney}
            user={user}
            onComplete={() => {
              loadJourneys();
              setCurrentPage('dashboard');
              setSelectedJourney(null);
            }}
            onBack={() => {
              setCurrentPage('dashboard');
              setSelectedJourney(null);
            }}
          />
        );
      case 'admin':
        return <AdminDashboard key="admin" journeys={journeys} onRefresh={loadJourneys} />;
      case 'documents':
        return <DocumentsPage key="documents" documents={documents} />;
      case 'vehicle':
        return <VehiclePage key="vehicle" vehicles={vehicles} />;
      case 'settings':
        return <SettingsPage key="settings" user={user} />;
      case 'notifications':
        return (
          <NotificationsPage 
            key="notifications" 
            notifications={notifications} 
            onMarkRead={(id) => {
              setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n));
            }}
          />
        );
      default:
        return <Dashboard key="dashboard" user={user} journeys={journeys} onRefresh={loadJourneys} onSelectJourney={(j) => { setSelectedJourney(j); setCurrentPage('journey'); }} documents={documents} vehicles={vehicles} notifications={notifications} setCurrentPage={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      <Toaster />
      
      {/* Header */}
      {user && (
        <Header 
          user={user} 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onLogout={handleLogout}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          unreadNotifications={unreadNotifications}
        />
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {renderPage()}
        </AnimatePresence>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

// ===========================
// LOADING SCREEN
// ===========================

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl btn-gradient flex items-center justify-center shadow-lg">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Zap className="w-8 h-8 text-white" />
          </motion.div>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Maestro</h1>
        <p className="text-muted-foreground">Loading your life dashboard...</p>
      </motion.div>
    </div>
  );
}

// ===========================
// HEADER
// ===========================

interface HeaderProps {
  user: AuthUser;
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;
  onLogout: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  unreadNotifications: number;
}

function Header({ user, currentPage, setCurrentPage, onLogout, mobileMenuOpen, setMobileMenuOpen, unreadNotifications }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => setCurrentPage('dashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg btn-gradient flex items-center justify-center shadow-md">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">Maestro</span>
        </button>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem active={currentPage === 'dashboard'} onClick={() => setCurrentPage('dashboard')}>
            <Home className="w-4 h-4" /> Dashboard
          </NavItem>
          <NavItem active={currentPage === 'documents'} onClick={() => setCurrentPage('documents')}>
            <FileText className="w-4 h-4" /> Documents
          </NavItem>
          <NavItem active={currentPage === 'vehicle'} onClick={() => setCurrentPage('vehicle')}>
            <Car className="w-4 h-4" /> Vehicle
          </NavItem>
          <NavItem active={currentPage === 'profile'} onClick={() => setCurrentPage('profile')}>
            <User className="w-4 h-4" /> Profile
          </NavItem>
          {(user.role === 'ADMIN' || user.role === 'OPERATOR') && (
            <NavItem active={currentPage === 'admin'} onClick={() => setCurrentPage('admin')}>
              <Users className="w-4 h-4" /> Admin
            </NavItem>
          )}
        </nav>
        
        {/* User Menu */}
        <div className="hidden md:flex items-center gap-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => setCurrentPage('notifications')}>
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage('settings')}>
            <Settings className="w-5 h-5" />
          </Button>
          
          {/* Wallet */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">AED {user.profile?.walletBalance?.toLocaleString() || 0}</span>
          </div>
          
          {/* User Avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCurrentPage('profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCurrentPage('settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" onClick={() => setCurrentPage('notifications')}>
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-2">
          <Button variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setCurrentPage('dashboard'); setMobileMenuOpen(false); }}>
            <Home className="w-4 h-4 mr-2" /> Dashboard
          </Button>
          <Button variant={currentPage === 'documents' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setCurrentPage('documents'); setMobileMenuOpen(false); }}>
            <FileText className="w-4 h-4 mr-2" /> Documents
          </Button>
          <Button variant={currentPage === 'vehicle' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setCurrentPage('vehicle'); setMobileMenuOpen(false); }}>
            <Car className="w-4 h-4 mr-2" /> Vehicle
          </Button>
          <Button variant={currentPage === 'profile' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setCurrentPage('profile'); setMobileMenuOpen(false); }}>
            <User className="w-4 h-4 mr-2" /> Profile
          </Button>
          <Button variant={currentPage === 'settings' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setCurrentPage('settings'); setMobileMenuOpen(false); }}>
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          {(user.role === 'ADMIN' || user.role === 'OPERATOR') && (
            <Button variant={currentPage === 'admin' ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => { setCurrentPage('admin'); setMobileMenuOpen(false); }}>
              <Users className="w-4 h-4 mr-2" /> Admin
            </Button>
          )}
          <Separator />
          <Button variant="ghost" className="w-full justify-start text-destructive" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      )}
    </header>
  );
}

function NavItem({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
        active ? 'btn-gradient text-white shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
      }`}
    >
      {children}
    </button>
  );
}

// ===========================
// WELCOME PAGE
// ===========================

interface WelcomePageProps {
  onLogin: (action: 'demo' | 'uae-pass') => void;
  loading: boolean;
}

function WelcomePage({ onLogin, loading }: WelcomePageProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [permissions, setPermissions] = useState({
    vehicle: true,
    visa: true,
    bills: true,
    courts: true
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-mesh"
    >
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur border text-sm font-medium mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">UAE Data Residency Compliant • ISO 27001 • PCI DSS</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-bold text-foreground mb-6"
          >
            Your One-Stop Operating System<br />
            <span className="bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">for Life in the UAE</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            AI-powered life automation that handles all government services, utility bills, renewals, 
            and payments through a single intelligent interface.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="gap-2 text-lg px-8 btn-gradient shadow-lg" onClick={() => setShowConsent(true)}>
              <BadgeCheck className="w-5 h-5" />
              Connect with UAE Pass
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-card/50 backdrop-blur" onClick={() => onLogin('demo')} disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
              Try Demo Account
            </Button>
          </motion.div>
        </div>
        
        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 max-w-6xl mx-auto"
        >
          <FeatureCard
            icon={<Car className="w-6 h-6" />}
            title="Vehicle & License"
            description="Renew licenses, pay fines, manage Salik and vehicle registration"
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Visa & Immigration"
            description="Track visa status, renew residencies, manage Emirates ID"
          />
          <FeatureCard
            icon={<Droplets className="w-6 h-6" />}
            title="Utilities & Bills"
            description="Pay DEWA, Etisalat, Du, and all utility bills in one place"
          />
          <FeatureCard
            icon={<Gavel className="w-6 h-6" />}
            title="Legal & Courts"
            description="Check travel bans, manage court cases, request certificates"
          />
        </motion.div>
        
        {/* Payment Methods */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground mb-4">Pay your way</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <PaymentBadge><Wallet className="w-4 h-4 mr-1" /> Maestro Wallet</PaymentBadge>
            <PaymentBadge><QrCode className="w-4 h-4 mr-1" /> AANI</PaymentBadge>
            <PaymentBadge><CreditCard className="w-4 h-4 mr-1" /> Cards</PaymentBadge>
            <PaymentBadge><Bitcoin className="w-4 h-4 mr-1" /> Crypto</PaymentBadge>
            <PaymentBadge><Smartphone className="w-4 h-4 mr-1" /> Apple Pay</PaymentBadge>
            <PaymentBadge><Smartphone className="w-4 h-4 mr-1" /> Google Pay</PaymentBadge>
          </div>
        </motion.div>
      </div>
      
      {/* Consent Modal */}
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Permissions</DialogTitle>
            <DialogDescription>
              Select which areas Maestro can monitor and manage for you
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <PermissionCheckbox
              label="Vehicle & License"
              description="Driving license, vehicle registration, traffic fines, Salik"
              checked={permissions.vehicle}
              onCheckedChange={(checked) => setPermissions(p => ({ ...p, vehicle: !!checked }))}
              icon={<Car className="w-5 h-5" />}
            />
            <PermissionCheckbox
              label="Visa & Immigration"
              description="Visa status, Emirates ID, residency renewals"
              checked={permissions.visa}
              onCheckedChange={(checked) => setPermissions(p => ({ ...p, visa: !!checked }))}
              icon={<FileText className="w-5 h-5" />}
            />
            <PermissionCheckbox
              label="Bills & Utilities"
              description="DEWA, telecom bills, internet services"
              checked={permissions.bills}
              onCheckedChange={(checked) => setPermissions(p => ({ ...p, bills: !!checked }))}
              icon={<Droplets className="w-5 h-5" />}
            />
            <PermissionCheckbox
              label="Courts & Legal"
              description="Travel ban checks, court cases, legal matters"
              checked={permissions.courts}
              onCheckedChange={(checked) => setPermissions(p => ({ ...p, courts: !!checked }))}
              icon={<Gavel className="w-5 h-5" />}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsent(false)}>Cancel</Button>
            <Button onClick={() => { setShowConsent(false); onLogin('uae-pass'); }}>
              Grant & Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="relative overflow-hidden group card-hover bg-card/80 backdrop-blur border-border/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 text-primary">
          {icon}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function PaymentBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center px-4 py-2 rounded-full bg-card/80 backdrop-blur border text-sm font-medium">
      {children}
    </div>
  );
}

function PermissionCheckbox({ label, description, checked, onCheckedChange, icon }: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Checkbox id={label} checked={checked} onCheckedChange={onCheckedChange} />
      <div className="flex-1">
        <label htmlFor={label} className="flex items-center gap-2 font-medium cursor-pointer">
          {icon}
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ===========================
// DASHBOARD
// ===========================

interface DashboardProps {
  user: AuthUser;
  journeys: Journey[];
  onRefresh: () => void;
  onSelectJourney: (journey: Journey) => void;
  documents: Document[];
  vehicles: Vehicle[];
  notifications: Notification[];
  setCurrentPage: (page: PageType) => void;
}

function Dashboard({ user, journeys, onRefresh, onSelectJourney, documents, vehicles, notifications, setCurrentPage }: DashboardProps) {
  const [scanning, setScanning] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showTravelBan, setShowTravelBan] = useState(false);
  
  const lifeScore = user.profile?.lifeScore || 88;
  const pendingJourneys = journeys.filter(j => j.status === 'PENDING' || j.status === 'PAYMENT_PENDING');
  const activeTasks = journeys.flatMap(j => j.tasks).filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const blockingTasks = activeTasks.filter(t => t.blockingTask);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Get expiring documents
  const expiringDocs = documents.filter(d => d.status === 'expiring');

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType: 'all' })
      });
      const data = await res.json();
      if (data.issues && data.issues.length > 0) {
        const journeyRes = await fetch('/api/journey', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            journeyType: 'COMPLETE_CHECKUP',
            title: 'Complete Checkup - ' + new Date().toLocaleDateString(),
            tasks: data.issues
          })
        });
        const journeyData = await journeyRes.json();
        if (journeyData.journey) {
          onRefresh();
          toast({ title: "Scan Complete", description: `Found ${data.issues.length} items requiring attention.` });
        }
      } else {
        toast({ title: "All Clear!", description: "No issues found during scan." });
      }
    } catch {
      toast({ title: "Scan Failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Life Score Card */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Your Life Score</CardTitle>
                <CardDescription>Based on your documents, fines, and renewals</CardDescription>
              </div>
              <Badge variant={lifeScore >= 80 ? 'default' : lifeScore >= 60 ? 'secondary' : 'destructive'}>
                {lifeScore >= 80 ? 'Excellent' : lifeScore >= 60 ? 'Good' : 'Needs Attention'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="relative">
                  <svg className="w-32 h-32 life-score-ring">
                    <circle
                      className="text-muted"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                    />
                    <circle
                      className="text-primary"
                      strokeWidth="8"
                      strokeDasharray={`${(lifeScore / 100) * 352} 352`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="56"
                      cx="64"
                      cy="64"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{lifeScore}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {blockingTasks.length > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    )}
                    <span className="text-sm">
                      {blockingTasks.length > 0 
                        ? `${blockingTasks.length} blocking items need attention` 
                        : 'No blocking issues'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {activeTasks.length} active tasks
                    </span>
                  </div>
                  {expiringDocs.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      <span className="text-sm text-amber-600">
                        {expiringDocs.length} documents expiring soon
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QuickActionButton icon={<Wallet className="w-5 h-5" />} label="Top Up" onClick={() => setShowTopUp(true)} />
                <QuickActionButton icon={<Plane className="w-5 h-5" />} label="Travel Ban" onClick={() => setShowTravelBan(true)} />
                <QuickActionButton icon={<FileText className="w-5 h-5" />} label="View Docs" onClick={() => setCurrentPage('documents')} />
                <QuickActionButton icon={<Car className="w-5 h-5" />} label="Vehicle" onClick={() => setCurrentPage('vehicle')} />
              </div>
            </CardContent>
          </Card>
          
          {/* Proactive Alerts */}
          {(blockingTasks.length > 0 || expiringDocs.length > 0) && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  Proactive Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {expiringDocs.map(doc => (
                  <Alert key={doc.id} className="bg-background">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <AlertTitle>{doc.type} Expiring</AlertTitle>
                    <AlertDescription>
                      Expires on {new Date(doc.expiryDate).toLocaleDateString()}
                    </AlertDescription>
                  </Alert>
                ))}
                {blockingTasks.slice(0, 2).map(task => (
                  <Alert key={task.id} className="bg-background">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <AlertTitle>{task.title}</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>AED {task.amount.toLocaleString()}</span>
                      <Badge variant="destructive">Blocking</Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
          
          {/* Active Journeys */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Journeys</CardTitle>
              <Button variant="outline" size="sm" onClick={handleScan} disabled={scanning}>
                {scanning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Scan for Issues
              </Button>
            </CardHeader>
            <CardContent>
              {pendingJourneys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active journeys</p>
                  <p className="text-sm">Click "Scan for Issues" to check for pending items</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingJourneys.map(journey => (
                    <JourneyCard key={journey.id} journey={journey} onClick={() => onSelectJourney(journey)} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Wallet Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Maestro Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                AED {user.profile?.walletBalance?.toLocaleString() || 0}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Available Balance</p>
              <Button className="w-full btn-gradient shadow-md" onClick={() => setShowTopUp(true)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Top Up Wallet
              </Button>
            </CardContent>
          </Card>
          
          {/* UAE Pass Badge */}
          {user.profile?.uaePassConnected && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center shadow-md">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">UAE Pass Connected</p>
                    <p className="text-sm text-muted-foreground">Your identity is verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Upcoming Renewals */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Renewals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.filter(d => d.status !== 'expired').map(doc => {
                  const daysUntil = Math.ceil((new Date(doc.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={doc.id} className="flex items-center justify-between">
                      <span className="text-sm">{doc.type}</span>
                      <Badge variant={daysUntil < 30 ? 'destructive' : daysUntil < 90 ? 'secondary' : 'outline'}>
                        {daysUntil} days
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{activeTasks.length}</div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{journeys.filter(j => j.status === 'COMPLETED').length}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Notifications</CardTitle>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} new</Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map(notif => (
                    <div key={notif.id} className={`p-2 rounded-lg ${notif.isRead ? 'bg-muted/50' : 'bg-muted'}`}>
                      <p className="text-sm font-medium">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Modals */}
      <TopUpModal open={showTopUp} onOpenChange={setShowTopUp} onSuccess={onRefresh} />
      <TravelBanModal open={showTravelBan} onOpenChange={setShowTravelBan} />
    </motion.div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="h-20 flex-col gap-2" onClick={onClick}>
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function JourneyCard({ journey, onClick }: { journey: Journey; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    PAYMENT_PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  
  const completedTasks = journey.tasks.filter(t => t.status === 'COMPLETED').length;
  const progress = journey.tasks.length > 0 ? (completedTasks / journey.tasks.length) * 100 : 0;
  
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium">{journey.title}</h4>
            <p className="text-sm text-muted-foreground">{journey.tasks.length} tasks</p>
          </div>
          <Badge className={statusColors[journey.status] || ''}>
            {journey.status.replace('_', ' ')}
          </Badge>
        </div>
        <Progress value={progress} className="h-2 mb-2" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">AED {journey.totalAmount.toLocaleString()}</span>
          <span className="text-primary">Review & Pay →</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ===========================
// TOP UP MODAL
// ===========================

function TopUpModal({ open, onOpenChange, onSuccess }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState(500);
  const [method, setMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);
  
  const handleTopUp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, paymentMethod: method })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Top Up Successful", description: `Added AED ${amount} to your wallet` });
        onSuccess();
        onOpenChange(false);
      }
    } catch {
      toast({ title: "Top Up Failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>Add funds to your Maestro Wallet</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Amount (AED)</Label>
            <div className="flex gap-2">
              {[100, 500, 1000, 2000].map(a => (
                <Button key={a} variant={amount === a ? 'default' : 'outline'} size="sm" onClick={() => setAmount(a)}>
                  {a}
                </Button>
              ))}
            </div>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CARD">Credit/Debit Card</SelectItem>
                <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
                <SelectItem value="GOOGLE_PAY">Google Pay</SelectItem>
                <SelectItem value="AANI">AANI</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleTopUp} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Top Up AED {amount}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// TRAVEL BAN MODAL
// ===========================

function TravelBanModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/integrations?service=travel-ban');
      const data = await res.json();
      setResult(data);
    } catch {
      toast({ title: "Check Failed", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            Travel Ban Check
          </DialogTitle>
          <DialogDescription>Check your travel status across all UAE courts</DialogDescription>
        </DialogHeader>
        
        {!result ? (
          <>
            <div className="py-4">
              <Alert>
                <Shield className="w-4 h-4" />
                <AlertTitle>Secure Check</AlertTitle>
                <AlertDescription>
                  This service queries Dubai Courts, Federal Courts, Abu Dhabi Courts, and Sharjah Courts.
                  <br /><br />
                  <strong>Fee: AED 170</strong>
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCheck} disabled={checking}>
                {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Check Travel Ban (AED 170)
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4">
              <div className={`p-6 rounded-lg ${result.status === 'clear' ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}`}>
                <div className="flex items-center gap-3 mb-4">
                  {result.status === 'clear' ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  ) : (
                    <Ban className="w-8 h-8 text-red-600" />
                  )}
                  <div>
                    <h3 className={`text-xl font-bold ${result.status === 'clear' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                      {result.status === 'clear' ? 'No Travel Restrictions' : 'Travel Restrictions Found'}
                    </h3>
                    <p className="text-muted-foreground">{result.message}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Checked Authorities:</p>
                  <ul className="list-disc list-inside">
                    {result.checkedAuthorities?.map((a: string) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => { setResult(null); onOpenChange(false); }}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ===========================
// DOCUMENTS PAGE
// ===========================

function DocumentsPage({ documents }: { documents: Document[] }) {
  const getDocIcon = (type: string) => {
    switch (type) {
      case 'Emirates ID': return <IdCard className="w-5 h-5" />;
      case 'Driving License': return <Car className="w-5 h-5" />;
      case 'Residency Visa': return <FileText className="w-5 h-5" />;
      case 'Passport': return <Globe className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">Your identity and legal documents</p>
        </div>
        <Button className="btn-gradient shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>

      <div className="grid gap-4">
        {documents.map(doc => (
          <Card key={doc.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                  {getDocIcon(doc.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{doc.type}</h3>
                      <p className="text-sm text-muted-foreground">{doc.number}</p>
                    </div>
                    <Badge variant={
                      doc.status === 'valid' ? 'default' : 
                      doc.status === 'expiring' ? 'secondary' : 'destructive'
                    }>
                      {doc.status === 'valid' ? 'Valid' : 
                       doc.status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                    </Badge>
                  </div>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{new Date(doc.issueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expiry Date</p>
                      <p className="font-medium">{new Date(doc.expiryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issued By</p>
                      <p className="font-medium">{doc.issuer}</p>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" /> Download
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ===========================
// VEHICLE PAGE
// ===========================

function VehiclePage({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">Manage your vehicles and registrations</p>
        </div>
        <Button className="btn-gradient shadow-md">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No Vehicles Added</h3>
            <p className="text-muted-foreground mb-4">Add your vehicle to track registration and insurance</p>
            <Button className="btn-gradient shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Vehicle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {vehicles.map(vehicle => (
            <Card key={vehicle.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <Car className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{vehicle.make} {vehicle.model}</h3>
                        <p className="text-muted-foreground">{vehicle.year} • {vehicle.color}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{vehicle.plate}</p>
                        <Badge variant={
                          vehicle.status === 'valid' ? 'default' : 
                          vehicle.status === 'expiring' ? 'secondary' : 'destructive'
                        }>
                          {vehicle.status === 'valid' ? 'Valid' : 
                           vehicle.status === 'expiring' ? 'Expiring Soon' : 'Expired'}
                        </Badge>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Registration</p>
                        <p className="font-medium">{new Date(vehicle.registrationExpiry).toLocaleDateString()}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-muted-foreground">Insurance</p>
                        <p className="font-medium">{new Date(vehicle.insuranceExpiry).toLocaleDateString()}</p>
                      </Card>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm">
                        Renew Registration
                      </Button>
                      <Button variant="outline" size="sm">
                        Check Fines
                      </Button>
                      <Button variant="outline" size="sm">
                        Salik Balance
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ===========================
// SETTINGS PAGE
// ===========================

function SettingsPage({ user }: { user: AuthUser }) {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [language, setLanguage] = useState('en');

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-2xl"
    >
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue="asia_dubai">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia_dubai">Gulf Standard Time (GST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Biometric Login</p>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <Button variant="outline">Change Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">Current Session</p>
                    <p className="text-sm text-muted-foreground">Dubai, UAE • Chrome on Windows</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Switch 
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, email: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                </div>
                <Switch 
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, sms: checked }))}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive in-app notifications</p>
                </div>
                <Switch 
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications(p => ({ ...p, push: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>Manage your data and privacy settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Data Sharing</p>
                  <p className="text-sm text-muted-foreground">Allow sharing anonymized data</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Download My Data
              </Button>
              <Button variant="destructive" className="w-full">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ===========================
// NOTIFICATIONS PAGE
// ===========================

function NotificationsPage({ notifications, onMarkRead }: { notifications: Notification[]; onMarkRead: (id: string) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map(notif => (
          <Card key={notif.id} className={notif.isRead ? 'opacity-70' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${notif.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium">{notif.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  {!notif.isRead && (
                    <Button variant="link" size="sm" className="p-0 h-auto mt-2" onClick={() => onMarkRead(notif.id)}>
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ===========================
// PROFILE PAGE
// ===========================

interface ProfilePageProps {
  user: AuthUser;
  onLogout: () => void;
}

function ProfilePage({ user }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null);
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [showVaultTransfer, setShowVaultTransfer] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/user');
        const data = await res.json();
        if (mounted) {
          setProfile(data.user?.profile);
          setJourneys(data.user?.journeys || []);
        }
      } catch {
        // Failed to load
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadProfile();
    return () => { mounted = false; };
  }, []);
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{profile?.fullNameEnglish || user.name || 'User'}</CardTitle>
                  <CardDescription>{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="Emirates ID" value={profile?.emiratesId || 'Not set'} />
              <ProfileField label="Mobile" value={profile?.mobile || 'Not set'} />
              <ProfileField label="License Number" value={profile?.licenseNumber || 'Not set'} />
              <ProfileField label="Vehicle Plate" value={profile?.vehiclePlate || 'Not set'} />
            </CardContent>
          </Card>
          
          {/* Journey History */}
          <Card>
            <CardHeader>
              <CardTitle>Journey History</CardTitle>
            </CardHeader>
            <CardContent>
              {journeys.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No journeys yet</p>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {journeys.map(j => (
                      <div key={j.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{j.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(j.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={j.status === 'COMPLETED' ? 'default' : 'secondary'}>
                            {j.status}
                          </Badge>
                          <p className="text-sm">AED {j.totalAmount.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Wallet & Crypto */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Maestro Wallet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                AED {profile?.walletBalance?.toLocaleString() || 0}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Available Balance</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bitcoin className="w-5 h-5" />
                Crypto Vault
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CryptoBalance label="BTC" balance={profile?.btcBalance || 0} />
              <CryptoBalance label="USDT (TRC20)" balance={profile?.usdtTrc20Balance || 0} />
              <CryptoBalance label="USDT (ERC20)" balance={profile?.usdtErc20Balance || 0} />
              <Separator />
              <Button variant="outline" className="w-full" onClick={() => setShowVaultTransfer(true)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Transfer to Wallet
              </Button>
            </CardContent>
          </Card>
          
          {profile?.uaePassConnected && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full btn-gradient flex items-center justify-center shadow-md">
                    <BadgeCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">UAE Pass Connected</p>
                    <p className="text-sm text-muted-foreground">Your identity is verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function CryptoBalance({ label, balance }: { label: string; balance: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <span className="font-medium">{balance.toFixed(8)}</span>
    </div>
  );
}

// ===========================
// JOURNEY FLOW
// ===========================

interface JourneyFlowProps {
  journey: Journey;
  user: AuthUser;
  onComplete: () => void;
  onBack: () => void;
}

function JourneyFlow({ journey, user, onComplete, onBack }: JourneyFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(
    journey.tasks.filter(t => t.status === 'PENDING').map(t => t.id)
  );
  const [paymentMethod, setPaymentMethod] = useState('MAESTRO_WALLET');
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const totalAmount = journey.tasks
    .filter(t => selectedTasks.includes(t.id))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const handlePayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journeyId: journey.id,
          amount: totalAmount,
          paymentMethod,
          selectedTasks
        })
      });
      const data = await res.json();
      if (data.success) {
        await new Promise(r => setTimeout(r, 2000));
        setCompleted(true);
        setStep(4);
        toast({ title: "Payment Successful!", description: `Paid AED ${totalAmount.toLocaleString()}` });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-2xl"
    >
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {['Select Tasks', 'Payment', 'Processing', 'Complete'].map((label, i) => (
          <div key={label} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step > i + 1 ? 'bg-green-600 text-white' :
              step === i + 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > i + 1 ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:block ${step === i + 1 ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < 3 && <div className="w-8 sm:w-16 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>
      
      {/* Step 1: Task Selection */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Tasks to Pay</CardTitle>
            <CardDescription>Choose which items you want to process now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              {journey.tasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  selected={selectedTasks.includes(task.id)}
                  onToggle={() => {
                    setSelectedTasks(prev => 
                      prev.includes(task.id) 
                        ? prev.filter(id => id !== task.id)
                        : [...prev, task.id]
                    );
                  }}
                />
              ))}
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>AED {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button className="btn-gradient shadow-md" onClick={() => setStep(2)} disabled={selectedTasks.length === 0}>
              Continue to Payment
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 2: Payment Method */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Payment Method</CardTitle>
            <CardDescription>Select how you want to pay</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={paymentMethod} onValueChange={setPaymentMethod}>
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="MAESTRO_WALLET">Wallet</TabsTrigger>
                <TabsTrigger value="CARD">Card</TabsTrigger>
                <TabsTrigger value="AANI">AANI</TabsTrigger>
              </TabsList>
              <TabsContent value="MAESTRO_WALLET" className="space-y-4">
                <Alert>
                  <Wallet className="w-4 h-4" />
                  <AlertTitle>Wallet Balance</AlertTitle>
                  <AlertDescription>
                    AED {user.profile?.walletBalance?.toLocaleString() || 0} available
                  </AlertDescription>
                </Alert>
                {totalAmount > (user.profile?.walletBalance || 0) && (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle>Insufficient Balance</AlertTitle>
                    <AlertDescription>Please top up your wallet or choose another method</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
              <TabsContent value="CARD" className="space-y-4">
                <Input placeholder="Card Number" />
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="MM/YY" />
                  <Input placeholder="CVV" />
                </div>
              </TabsContent>
              <TabsContent value="AANI" className="space-y-4">
                <Alert>
                  <QrCode className="w-4 h-4" />
                  <AlertTitle>AANI Payment</AlertTitle>
                  <AlertDescription>You will be redirected to your banking app to complete the payment</AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
            
            <div className="p-4 rounded-lg bg-muted mt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total to Pay</span>
                <span>AED {totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button 
              className="btn-gradient shadow-md"
              onClick={() => { setStep(3); handlePayment(); }} 
              disabled={paymentMethod === 'MAESTRO_WALLET' && totalAmount > (user.profile?.walletBalance || 0)}
            >
              Pay Now
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Step 3: Processing */}
      {step === 3 && (
        <Card>
          <CardContent className="py-16 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-16 h-16 mx-auto text-primary mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
            <p className="text-muted-foreground">Please wait while we process your payment...</p>
          </CardContent>
        </Card>
      )}
      
      {/* Step 4: Complete */}
      {step === 4 && completed && (
        <Card>
          <CardContent className="py-16 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <CheckCircle2 className="w-20 h-20 mx-auto text-green-600 mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Your payment of AED {totalAmount.toLocaleString()} has been processed.
            </p>
            <div className="p-4 rounded-lg bg-muted mb-6 text-left">
              <p className="text-sm text-muted-foreground">Transaction Reference</p>
              <p className="font-mono">PAY-{Date.now().toString(36).toUpperCase()}</p>
            </div>
            <Button onClick={onComplete} className="w-full btn-gradient shadow-md">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function TaskItem({ task, selected, onToggle }: { task: Task; selected: boolean; onToggle: () => void }) {
  const entityIcons: Record<string, React.ReactNode> = {
    RTA: <Car className="w-4 h-4" />,
    DEWA: <Droplets className="w-4 h-4" />,
    DUBAI_POLICE: <Shield className="w-4 h-4" />,
    SALIK: <CreditCard className="w-4 h-4" />,
    ETISALAT: <Phone className="w-4 h-4" />,
    DU: <Phone className="w-4 h-4" />,
    DUBAI_COURTS: <Gavel className="w-4 h-4" />,
    ICP: <FileText className="w-4 h-4" />,
  };
  
  return (
    <div 
      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              {entityIcons[task.entity] || <Building2 className="w-3 h-3" />}
              <span className="ml-1">{task.entity.replace('_', ' ')}</span>
            </Badge>
            {task.blockingTask && (
              <Badge variant="destructive" className="text-xs">Blocking</Badge>
            )}
          </div>
          <h4 className="font-medium">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-muted-foreground">{task.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-bold">AED {task.amount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

// ===========================
// ADMIN DASHBOARD
// ===========================

function AdminDashboard({ journeys, onRefresh }: { journeys: Journey[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'PROCESSING' | 'COMPLETED'>('all');
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  
  const filteredJourneys = filter === 'all' ? journeys : journeys.filter(j => j.status === filter);
  
  const stats = {
    pending: journeys.filter(j => j.status === 'PENDING').length,
    processing: journeys.filter(j => j.status === 'PROCESSING').length,
    completed: journeys.filter(j => j.status === 'COMPLETED').length,
    total: journeys.length
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Journeys</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-sm text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-sm text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Journeys Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-4">Journey</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-right p-4">Amount</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJourneys.map(j => (
                  <tr key={j.id} className="border-t hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{j.title}</p>
                        <p className="text-sm text-muted-foreground">{j.tasks.length} tasks</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm">{j.user?.email || 'Unknown'}</p>
                    </td>
                    <td className="p-4">
                      <Badge variant={j.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {j.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-medium">
                      AED {j.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedJourney(j)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Journey Detail Modal */}
      <Dialog open={!!selectedJourney} onOpenChange={() => setSelectedJourney(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedJourney?.title}</DialogTitle>
            <DialogDescription>Journey Details</DialogDescription>
          </DialogHeader>
          {selectedJourney && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge>{selectedJourney.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <Badge variant={selectedJourney.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                    {selectedJourney.paymentStatus}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-2">Tasks</h4>
                <ScrollArea className="h-48">
                  {selectedJourney.tasks.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.entity}</Badge>
                        <span>{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">AED {t.amount}</span>
                        <Badge variant={t.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedJourney(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

// ===========================
// FOOTER
// ===========================

function Footer() {
  return (
    <footer className="border-t py-6 bg-card/50 backdrop-blur border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded btn-gradient flex items-center justify-center shadow-sm">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold">Maestro</span>
            <span className="text-muted-foreground">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-primary" />
              ISO 27001
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-primary" />
              PCI DSS
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-primary" />
              UAE Data Residency
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
