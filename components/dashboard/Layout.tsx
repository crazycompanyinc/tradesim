'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LineChart, LayoutDashboard, Plus, Settings, LogOut, Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.success) setUser(d.data);
        else router.push('/login');
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = () => {
    document.cookie = 'tradesim_token=; path=/; max-age=0';
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/backtest/new', icon: Plus, label: 'New Session' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#131722] flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-[#1e222d] border-r border-[#2B2B43] transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-4 h-14 border-b border-[#2B2B43]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#2962ff] flex items-center justify-center">
              <LineChart size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">TradeSim</span>
          </Link>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-[#2962ff]/10 text-[#2962ff]'
                    : 'text-[#787b86] hover:text-white hover:bg-[#2B2B43]/50'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-[#2B2B43]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#787b86] truncate">{user?.username || '...'}</span>
            <button onClick={handleLogout} className="text-[#787b86] hover:text-[#ef5350] transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-56">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-14 bg-[#131722]/90 backdrop-blur-md border-b border-[#2B2B43] flex items-center px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-[#787b86] hover:text-white mr-3">
            <Menu size={20} />
          </button>
          <h1 className="text-sm font-medium text-white">
            {pathname === '/dashboard' && 'Dashboard'}
            {pathname === '/backtest/new' && 'New Backtest Session'}
            {pathname.startsWith('/backtest/') && pathname !== '/backtest/new' && 'Backtest Workspace'}
            {pathname === '/settings' && 'Settings'}
          </h1>
        </header>

        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
