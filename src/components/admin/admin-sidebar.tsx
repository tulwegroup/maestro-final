'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Zap, 
  LayoutDashboard, 
  Users, 
  Ticket, 
  Route, 
  FileText, 
  Settings, 
  Activity,
  CreditCard,
  Building2,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  Home
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Support Tickets', href: '/admin/tickets', icon: Ticket },
  { name: 'Journeys', href: '/admin/journeys', icon: Route },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  { name: 'Integrations', href: '/admin/integrations', icon: Building2 },
  { name: 'Notifications', href: '/admin/notifications', icon: Bell },
  { name: 'System Health', href: '/admin/health', icon: Activity },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface NavLinksProps {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavLinks({ pathname, collapsed, onNavigate }: NavLinksProps) {
  return (
    <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-10rem)]">
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/admin' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive 
                ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20" 
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 flex-shrink-0",
              isActive ? "text-white" : "text-slate-400 group-hover:text-white"
            )} />
            {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  showCloseButton: boolean;
}

function SidebarHeader({ collapsed, onToggleCollapse, onCloseMobile, showCloseButton }: SidebarHeaderProps) {
  return (
    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
      <Link href="/admin" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-white">MAESTRO</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        )}
      </Link>
      {!showCloseButton && (
        <button 
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
      {showCloseButton && (
        <button 
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

interface BackToAppLinkProps {
  collapsed: boolean;
}

function BackToAppLink({ collapsed }: BackToAppLinkProps) {
  return (
    <div className="absolute bottom-16 left-0 right-0 p-3 border-t border-slate-700">
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-all group"
      >
        <Home className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-white" />
        {!collapsed && (
          <span className="text-sm font-medium flex items-center gap-1">
            Back to App
            <ExternalLink className="w-3 h-3" />
          </span>
        )}
      </Link>
    </div>
  );
}

interface UserSectionProps {
  collapsed: boolean;
}

function UserSection({ collapsed }: UserSectionProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700">
      <div className={cn(
        "flex items-center gap-3 p-2 rounded-lg bg-slate-700/50",
        collapsed && "lg:justify-center"
      )}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          AD
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin User</p>
              <p className="text-xs text-slate-400 truncate">Super Admin</p>
            </div>
            <button className="p-1.5 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleToggleCollapse = () => setCollapsed(!collapsed);
  const handleCloseMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white">MAESTRO</h1>
            <p className="text-xs text-slate-400">Admin Portal</p>
          </div>
        </div>
        <button 
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={handleCloseMobile}
        />
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:block fixed left-0 top-0 h-screen bg-slate-800 border-r border-slate-700 transition-all duration-300 z-50",
        collapsed ? "w-20" : "w-64"
      )}>
        <SidebarHeader 
          collapsed={collapsed} 
          onToggleCollapse={handleToggleCollapse}
          onCloseMobile={handleCloseMobile}
          showCloseButton={false}
        />
        <NavLinks pathname={pathname} collapsed={collapsed} />
        <BackToAppLink collapsed={collapsed} />
        <UserSection collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar */}
      <aside className={cn(
        "lg:hidden fixed left-0 top-0 h-screen w-64 bg-slate-800 border-r border-slate-700 transition-transform duration-300 z-50",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarHeader 
          collapsed={false} 
          onToggleCollapse={handleToggleCollapse}
          onCloseMobile={handleCloseMobile}
          showCloseButton={true}
        />
        <NavLinks pathname={pathname} collapsed={false} onNavigate={handleCloseMobile} />
        <BackToAppLink collapsed={false} />
        <UserSection collapsed={false} />
      </aside>
    </>
  );
}
