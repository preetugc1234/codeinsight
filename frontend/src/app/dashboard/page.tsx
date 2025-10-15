'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserJobs, calculateUserStats, type Job } from '@/lib/api/pythonWorker';

function DashboardContent() {
  const { user, profile } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
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

  // Calculate trial days remaining
  useEffect(() => {
    if (profile?.plan === 'trial' && profile?.trial_end_date) {
      const endDate = new Date(profile.trial_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, diffDays));
    }
  }, [profile]);

  // Fetch user jobs
  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        setError(null);
        const response = await getUserJobs(user.id, 100);
        setJobs(response.jobs);
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

  const formatNumber = (num: number): string => num.toLocaleString();
  const recentJobs = jobs.slice(0, 5);

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />

      {/* Main Content - 80% */}
      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Welcome back, {profile?.first_name || 'Developer'}
            </h1>
            <p className="text-[#a1a1aa]">
              Here's what's happening with your code reviews today
            </p>
          </div>

          {/* Trial Warning Banner */}
          {profile?.plan === 'trial' && trialDaysLeft !== null && (
            <div className={`mb-6 rounded-lg p-4 flex items-start gap-3 ${
              trialDaysLeft === 0
                ? 'bg-red-500/10 border border-red-500/20'
                : trialDaysLeft <= 2
                ? 'bg-yellow-500/10 border border-yellow-500/20'
                : 'bg-purple-500/10 border border-purple-500/20'
            }`}>
              <span className="text-xl">
                {trialDaysLeft === 0 ? '⏰' : trialDaysLeft <= 2 ? '⚠️' : '🎉'}
              </span>
              <div className="flex-1">
                <h3 className={`text-sm font-medium ${
                  trialDaysLeft === 0
                    ? 'text-red-400'
                    : trialDaysLeft <= 2
                    ? 'text-yellow-400'
                    : 'text-purple-300'
                }`}>
                  {trialDaysLeft === 0
                    ? 'Trial Expired'
                    : trialDaysLeft === 1
                    ? '1 Day Left in Trial'
                    : `${trialDaysLeft} Days Left in Free Trial`
                  }
                </h3>
                <p className={`text-sm mt-1 ${
                  trialDaysLeft === 0
                    ? 'text-red-300/70'
                    : trialDaysLeft <= 2
                    ? 'text-yellow-300/70'
                    : 'text-purple-300/70'
                }`}>
                  {trialDaysLeft === 0
                    ? 'Your trial has ended. Upgrade to Lite, Pro, or Business to continue using CodeInsight.'
                    : `You have ${trialDaysLeft} day${trialDaysLeft > 1 ? 's' : ''} remaining in your free trial. Upgrade now to continue enjoying CodeInsight.`
                  }
                </p>
                <Link
                  href="/dashboard/billing"
                  className={`inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    trialDaysLeft === 0
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : trialDaysLeft <= 2
                      ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  View Plans & Upgrade
                </Link>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-red-400">Failed to load dashboard data</h3>
                <p className="text-sm text-red-300/70 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Total Reviews */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-lg p-6 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#a1a1aa]">Total Reviews</h3>
                <span className="text-2xl">📊</span>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-[#1a1a24] rounded w-20 mb-2"></div>
                  <div className="h-3 bg-[#1a1a24] rounded w-16"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalReviews)}</p>
                  <p className="text-xs text-[#71717a]">
                    {stats.completedJobs} completed · {stats.failedJobs} failed
                  </p>
                </>
              )}
            </div>

            {/* Tokens Used */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-lg p-6 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#a1a1aa]">Tokens Used</h3>
                <span className="text-2xl">⚡</span>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-[#1a1a24] rounded w-24 mb-2"></div>
                  <div className="h-3 bg-[#1a1a24] rounded w-32"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalTokens)}</p>
                  <p className="text-xs text-[#71717a]">
                    ${stats.totalCost.toFixed(4)} · {stats.cacheHitRate.toFixed(1)}% cache
                  </p>
                </>
              )}
            </div>

            {/* Issues Found */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-lg p-6 hover:border-purple-500/30 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-[#a1a1aa]">Issues Found</h3>
                <span className="text-2xl">🐛</span>
              </div>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-[#1a1a24] rounded w-20 mb-2"></div>
                  <div className="h-3 bg-[#1a1a24] rounded w-24"></div>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-white mb-1">{formatNumber(stats.totalIssues)}</p>
                  <p className="text-xs text-[#71717a]">From linter analysis</p>
                </>
              )}
            </div>

            {/* Token Budget */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-purple-300">Token Budget</h3>
                <span className="text-2xl">💎</span>
              </div>
              {(() => {
                const tokensUsed = profile?.tokens_used_this_month || 0;
                const tokenLimit = profile?.monthly_token_limit || 6000;
                const usagePercentage = (tokensUsed / tokenLimit) * 100;
                const remainingTokens = tokenLimit - tokensUsed;

                return (
                  <>
                    <p className="text-2xl font-bold text-white mb-2">
                      {remainingTokens.toLocaleString()}
                      <span className="text-sm font-normal text-[#a1a1aa] ml-1">remaining</span>
                    </p>
                    <div className="w-full bg-[#1a1a24] rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          usagePercentage >= 90
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : usagePercentage >= 70
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : 'bg-gradient-to-r from-purple-500 to-purple-600'
                        }`}
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#71717a] capitalize">
                        {profile?.plan || 'trial'} plan
                      </p>
                      <Link href="/dashboard/billing" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                        Upgrade →
                      </Link>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/dashboard/review"
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 hover:from-purple-500/15 transition-all group"
              >
                <div className="text-3xl mb-3">🔍</div>
                <h4 className="text-lg font-semibold text-white mb-1 tracking-tight">New Code Review</h4>
                <p className="text-sm text-[#a1a1aa]">Submit code for AI-powered review</p>
              </Link>

              <Link
                href="/dashboard/debug"
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 hover:from-purple-500/15 transition-all group"
              >
                <div className="text-3xl mb-3">🩺</div>
                <h4 className="text-lg font-semibold text-white mb-1 tracking-tight">Debug Doctor</h4>
                <p className="text-sm text-[#a1a1aa]">Get AI-powered debugging help</p>
              </Link>

              <Link
                href="/dashboard/history"
                className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 hover:from-purple-500/15 transition-all group"
              >
                <div className="text-3xl mb-3">📚</div>
                <h4 className="text-lg font-semibold text-white mb-1 tracking-tight">View History</h4>
                <p className="text-sm text-[#a1a1aa]">Browse past code reviews</p>
              </Link>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white tracking-tight">Recent Reviews</h3>
              <Link href="/dashboard/history" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                View all →
              </Link>
            </div>

            {loading ? (
              <div className="bg-[#13131a] border border-[#27273a] rounded-lg p-6">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-[#1a1a24] rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-[#1a1a24] rounded w-1/4"></div>
                      </div>
                      <div className="h-6 bg-[#1a1a24] rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : recentJobs.length === 0 ? (
              <div className="bg-[#13131a] border border-[#27273a] rounded-lg p-8 text-center">
                <div className="text-4xl mb-3">📝</div>
                <h4 className="text-lg font-semibold text-white mb-2 tracking-tight">No reviews yet</h4>
                <p className="text-[#a1a1aa] mb-4">Start by submitting your first code review</p>
                <Link
                  href="/dashboard/review"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  Submit Code Review
                </Link>
              </div>
            ) : (
              <div className="bg-[#13131a] border border-[#27273a] rounded-lg divide-y divide-[#27273a]">
                {recentJobs.map((job) => (
                  <Link
                    key={job.job_id}
                    href={`/dashboard/jobs/${job.job_id}`}
                    className="block p-4 hover:bg-[#1a1a24] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">
                            {job.type === 'review' ? '🔍' : job.type === 'debug' ? '🩺' : '🏗️'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate tracking-tight">
                              {job.file_path || job.job_id}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-[#71717a]">
                              <span>{job.language || 'Unknown'}</span>
                              <span>·</span>
                              <span>{new Date(job.created_at).toLocaleDateString()}</span>
                              {job.tokens_used?.total_tokens > 0 && (
                                <>
                                  <span>·</span>
                                  <span>{formatNumber(job.tokens_used.total_tokens)} tokens</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {job.status === 'completed' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                            ✓ Completed
                          </span>
                        )}
                        {job.status === 'processing' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            ⏳ Processing
                          </span>
                        )}
                        {job.status === 'pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1a1a24] text-[#a1a1aa] border border-[#27273a]">
                            ⏸️ Pending
                          </span>
                        )}
                        {job.status === 'failed' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
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
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">🚀 Getting Started</h3>
            <ul className="space-y-3 text-sm text-[#a1a1aa]">
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Account created successfully</span>
              </li>
              <li className="flex items-center gap-3">
                {stats.totalReviews > 0 ? (
                  <span className="text-green-400">✓</span>
                ) : (
                  <span className="text-[#71717a]">○</span>
                )}
                <Link href="/dashboard/review" className="hover:text-white transition-colors">
                  Submit your first code review
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#71717a]">○</span>
                <Link href="/dashboard/settings" className="hover:text-white transition-colors">
                  Configure API keys and integrations
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#71717a]">○</span>
                <Link href="/dashboard/billing" className="hover:text-white transition-colors">
                  Upgrade to unlock more features
                </Link>
              </li>
            </ul>
          </div>
        </main>
      </div>
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
