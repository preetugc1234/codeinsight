'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Code Insight
              </h1>
              <div className="hidden md:flex ml-10 space-x-8">
                <Link href="/dashboard" className="text-gray-900 font-medium border-b-2 border-blue-600 py-5">
                  Dashboard
                </Link>
                <Link href="/dashboard/review" className="text-gray-500 hover:text-gray-900 py-5">
                  Code Review
                </Link>
                <Link href="/dashboard/history" className="text-gray-500 hover:text-gray-900 py-5">
                  History
                </Link>
                <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900 py-5">
                  Settings
                </Link>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase">
                {profile?.plan || 'LITE'}
              </span>

              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
                    {(profile?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                  <span className="hidden md:block">
                    {profile?.first_name || user?.email?.split('@')[0]}
                  </span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <Link
                      href="/dashboard/billing"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Billing
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.first_name || 'there'}! 👋
          </h2>
          <p className="text-gray-600">
            Here's what's happening with your code reviews today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="px-4 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Tokens Used</h3>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">of {profile?.plan === 'business' ? '4M' : profile?.plan === 'pro' ? '500K' : '200K'} / month</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Issues Found</h3>
              <span className="text-2xl">🐛</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Fixed 0 issues</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Current Plan</h3>
              <span className="text-2xl">💎</span>
            </div>
            <p className="text-3xl font-bold text-blue-600 capitalize">{profile?.plan || 'Lite'}</p>
            <Link href="/dashboard/billing" className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
              Upgrade →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/review"
              className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-xl text-white hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">🔍</div>
              <h4 className="text-lg font-semibold mb-1">New Code Review</h4>
              <p className="text-sm text-blue-100">Submit code for AI-powered review</p>
            </Link>

            <Link
              href="/dashboard/debug"
              className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-white hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">🐛</div>
              <h4 className="text-lg font-semibold mb-1">Debug Doctor</h4>
              <p className="text-sm text-purple-100">Get AI-powered debugging help</p>
            </Link>

            <Link
              href="/dashboard/settings"
              className="bg-gradient-to-r from-gray-600 to-gray-800 p-6 rounded-xl text-white hover:shadow-lg transition"
            >
              <div className="text-3xl mb-2">⚙️</div>
              <h4 className="text-lg font-semibold mb-1">Settings</h4>
              <p className="text-sm text-gray-300">Configure your preferences</p>
            </Link>
          </div>
        </div>

        {/* Getting Started */}
        <div className="px-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">🚀 Getting Started</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span>Account created successfully</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <Link href="/dashboard/review" className="hover:underline">Submit your first code review</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <Link href="/dashboard/settings" className="hover:underline">Configure API keys and integrations</Link>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <Link href="/dashboard/billing" className="hover:underline">Upgrade to unlock more features</Link>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
