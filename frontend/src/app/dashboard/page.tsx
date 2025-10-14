'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserJobs, calculateUserStats, type Job } from '@/lib/api/pythonWorker';

function DashboardContent() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalTokens: 0,
    totalCost: 0,
    totalIssues: 0,
    completedJobs: 0,
    failedJobs: 0,
    processingJobs: 0,
    pendingJobs: 0,
    cacheHitRate: 0,
  });

  // Fetch user jobs on mount
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await getUserJobs(user.id, 100);
        setJobs(response.jobs);

        // Calculate stats from jobs
        const calculatedStats = calculateUserStats(response.jobs);
        setStats(calculatedStats);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Get recent jobs (last 5)
  const recentJobs = jobs.slice(0, 5);

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

        {/* Error Alert */}
        {error && (
          <div className="px-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <span className="text-red-600 text-xl">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Failed to load dashboard data</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="px-4 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Reviews</h3>
              <span className="text-2xl">📊</span>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalReviews)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.completedJobs} completed, {stats.failedJobs} failed
                </p>
              </>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Tokens Used</h3>
              <span className="text-2xl">⚡</span>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalTokens)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${stats.totalCost.toFixed(4)} spent • {stats.cacheHitRate.toFixed(1)}% cache hit
                </p>
              </>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Issues Found</h3>
              <span className="text-2xl">🐛</span>
            </div>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            ) : (
              <>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalIssues)}</p>
                <p className="text-xs text-gray-500 mt-1">From linter analysis</p>
              </>
            )}
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

        {/* Recent Reviews */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
            <Link href="/dashboard/history" className="text-sm text-blue-600 hover:text-blue-700">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h4>
              <p className="text-gray-600 mb-4">Start by submitting your first code review</p>
              <Link
                href="/dashboard/review"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Submit Code Review
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
              {recentJobs.map((job) => (
                <Link
                  key={job.job_id}
                  href={`/dashboard/jobs/${job.job_id}`}
                  className="block p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">
                          {job.type === 'review' ? '🔍' : job.type === 'debug' ? '🐛' : '🏗️'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {job.file_path || job.job_id}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{job.language || 'Unknown'}</span>
                            <span>•</span>
                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                            {job.tokens_used?.total_tokens > 0 && (
                              <>
                                <span>•</span>
                                <span>{formatNumber(job.tokens_used.total_tokens)} tokens</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {job.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      )}
                      {job.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ⏳ Processing
                        </span>
                      )}
                      {job.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          ⏸️ Pending
                        </span>
                      )}
                      {job.status === 'failed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Failed
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
                {stats.totalReviews > 0 ? (
                  <span className="text-green-600">✓</span>
                ) : (
                  <span className="text-gray-400">○</span>
                )}
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
