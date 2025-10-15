'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Code Review', href: '/dashboard/review', icon: '🔍' },
    { name: 'Debug Doctor', href: '/dashboard/debug', icon: '🩺' },
    { name: 'History', href: '/dashboard/history', icon: '📚' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
    { name: 'Billing', href: '/dashboard/billing', icon: '💳' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="w-64 h-screen bg-[#13131a] border-r border-[#27273a] flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-[#27273a]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <span className="text-xl font-semibold text-white tracking-tight">Code Insight</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium tracking-tight
              transition-all duration-200
              ${
                isActive(item.href)
                  ? 'bg-purple-500/10 text-white border border-purple-500/20'
                  : 'text-[#a1a1aa] hover:bg-[#1f1f2e] hover:text-white'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-[#27273a]">
        <div className="bg-[#1a1a24] rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#a1a1aa]">Current Plan</span>
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">
              {profile?.plan || 'LITE'}
            </span>
          </div>
          {profile?.plan === 'LITE' && (
            <Link
              href="/dashboard/billing"
              className="block w-full text-center px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-medium rounded-md hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              Upgrade to PRO
            </Link>
          )}
        </div>

        <button
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a24] hover:bg-[#1f1f2e] text-[#a1a1aa] hover:text-white rounded-lg text-sm font-medium transition-all"
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
