'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Menu,
  Home,
  CreditCard,
  Car,
  Building2,
  FileText,
  Settings,
  Bell,
  TrendingUp,
  HelpCircle,
  X
} from 'lucide-react';
import Link from 'next/link';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'DEWA Bills', href: '/dewa', icon: Building2 },
  { name: 'RTA Services', href: '/rta', icon: Car },
  { name: 'Visa & ID', href: '/visa', icon: FileText },
  { name: 'Crypto', href: '/crypto', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface MobileNavProps {
  currentPath?: string;
}

export function MobileNav({ currentPath = '/' }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-teal-500 to-emerald-600">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">MAESTROPAY</h2>
                <p className="text-xs text-teal-100">UAE Life Automation</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-teal-600' : ''}`} />
                    <span className="font-medium">{item.name}</span>
                    {item.name === 'Payments' && (
                      <Badge className="ml-auto bg-orange-100 text-orange-700 text-xs">
                        3
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <HelpCircle className="w-4 h-4" />
              <span>Need help? Contact support</span>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileBottomNav({ currentPath = '/' }: MobileNavProps) {
  const mainItems = NAV_ITEMS.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {mainItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
                isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 md:hidden">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <MobileNav />
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900">MAESTROPAY</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="w-4 h-4 text-slate-600" />
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">3</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default MobileNav;
