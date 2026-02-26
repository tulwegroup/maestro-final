'use client';

import { MobileBottomNav } from '@/components/mobile-nav';
import { usePathname } from 'next/navigation';

export function MobileLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 pb-16 md:pb-0">
        {children}
      </div>
      <MobileBottomNav currentPath={pathname} />
    </div>
  );
}
