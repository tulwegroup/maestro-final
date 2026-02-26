import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // In production, add proper authentication check here
  // For now, we'll allow access for demo purposes
  
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 min-h-screen">
          {/* Mobile header spacer */}
          <div className="lg:hidden h-16" />
          {children}
        </main>
      </div>
    </div>
  );
}
