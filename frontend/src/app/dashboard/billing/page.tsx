'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

function BillingContent() {
  const { profile } = useAuthStore();
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    if (profile?.plan === 'trial' && profile?.trial_end_date) {
      const endDate = new Date(profile.trial_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, diffDays));
    }
  }, [profile]);

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'trial':
        return '$0';
      case 'lite':
        return '$15/mo';
      case 'pro':
        return '$30/mo';
      case 'business':
        return '$200/mo';
      default:
        return '$0';
    }
  };

  const tokensUsed = profile?.tokens_used_this_month || 0;
  const tokenLimit = profile?.monthly_token_limit || 6000;
  const usagePercentage = (tokensUsed / tokenLimit) * 100;
  const remainingTokens = tokenLimit - tokensUsed;

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />

      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Billing & Plans 💳
            </h1>
            <p className="text-[#a1a1aa]">
              Choose the perfect plan for your code review needs
            </p>
          </div>

          {/* Current Plan */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-medium text-purple-300">Current Plan</p>
                  <p className="text-3xl font-bold text-white mt-1 capitalize">{profile?.plan || 'trial'}</p>
                  {profile?.plan === 'trial' && trialDaysLeft !== null && (
                    <p className="text-sm text-purple-300 mt-2">
                      {trialDaysLeft > 0 ? `${trialDaysLeft} days remaining in trial` : 'Trial expired - Please upgrade'}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#a1a1aa]">
                    {profile?.plan === 'trial' ? '7-day free trial' : 'Renews monthly'}
                  </p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    {getPlanPrice(profile?.plan || 'trial')}
                  </p>
                </div>
              </div>

              {/* Token Usage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-purple-300">Token Usage This Month</p>
                  <p className="text-sm text-[#a1a1aa]">
                    {tokensUsed.toLocaleString()} / {tokenLimit.toLocaleString()} tokens
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#1a1a24] rounded-full h-3 overflow-hidden">
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

                <p className="text-xs text-[#71717a] mt-2">
                  {remainingTokens.toLocaleString()} tokens remaining ({(100 - usagePercentage).toFixed(1)}% left)
                </p>

                {usagePercentage >= 90 && (
                  <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-sm text-red-300">
                      ⚠️ Warning: You've used {usagePercentage.toFixed(1)}% of your monthly quota. Consider upgrading to avoid interruptions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {/* TRIAL Plan */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">TRIAL</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">Try for free</p>
                <p className="text-4xl font-bold text-white mt-4">$0</p>
                <p className="text-[#71717a] text-sm">7 days free</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">6,000 tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Code review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Debug Doctor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">All languages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#71717a] mt-0.5">✗</span>
                  <span className="text-sm text-[#71717a]">Priority support</span>
                </li>
              </ul>
              <button
                disabled={profile?.plan === 'trial'}
                className={`w-full px-4 py-3 rounded-lg font-medium ${
                  profile?.plan === 'trial'
                    ? 'bg-[#1a1a24] text-[#71717a] cursor-not-allowed'
                    : 'bg-[#1a1a24] border border-[#27273a] text-white hover:bg-[#1f1f2e] hover:border-purple-500/30 transition-all'
                }`}
              >
                {profile?.plan === 'trial' ? 'Current Plan' : 'Start Trial'}
              </button>
            </div>

            {/* LITE Plan */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">LITE</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For individuals</p>
                <p className="text-4xl font-bold text-white mt-4">$15</p>
                <p className="text-[#71717a] text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">200K tokens/mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Code review</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Debug Doctor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">All languages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Email support</span>
                </li>
              </ul>
              <button
                disabled={profile?.plan === 'lite'}
                className={`w-full px-4 py-3 rounded-lg font-medium ${
                  profile?.plan === 'lite'
                    ? 'bg-[#1a1a24] text-[#71717a] cursor-not-allowed'
                    : 'bg-[#1a1a24] border border-[#27273a] text-white hover:bg-[#1f1f2e] hover:border-purple-500/30 transition-all'
                }`}
              >
                {profile?.plan === 'lite' ? 'Current Plan' : 'Upgrade to Lite'}
              </button>
            </div>

            {/* PRO Plan */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-2 border-purple-500/20 rounded-xl p-6 hover:border-purple-500/40 transition-colors relative shadow-lg shadow-purple-500/10">
              <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPULAR
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">PRO</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For professionals</p>
                <p className="text-4xl font-bold text-white mt-4">$30</p>
                <p className="text-[#71717a] text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">500K tokens/mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">All Lite features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">API access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Advanced analytics</span>
                </li>
              </ul>
              <button
                disabled={profile?.plan === 'pro'}
                className={`w-full px-4 py-3 rounded-lg font-medium shadow-lg ${
                  profile?.plan === 'pro'
                    ? 'bg-[#1a1a24] text-[#71717a] cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all shadow-purple-500/20'
                }`}
              >
                {profile?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
              </button>
            </div>

            {/* BUSINESS Plan */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">BUSINESS</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For teams</p>
                <p className="text-4xl font-bold text-white mt-4">$200</p>
                <p className="text-[#71717a] text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">4M tokens/mo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">All Pro features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Shared history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Dedicated support</span>
                </li>
              </ul>
              <button
                disabled={profile?.plan === 'business'}
                className={`w-full px-4 py-3 rounded-lg font-medium ${
                  profile?.plan === 'business'
                    ? 'bg-[#1a1a24] text-[#71717a] cursor-not-allowed'
                    : 'bg-[#1a1a24] border border-[#27273a] text-white hover:bg-[#1f1f2e] hover:border-purple-500/30 transition-all'
                }`}
              >
                {profile?.plan === 'business' ? 'Current Plan' : 'Upgrade to Business'}
              </button>
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-2xl font-semibold text-white mb-6 tracking-tight">Frequently Asked Questions</h3>
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl divide-y divide-[#27273a]">
              <div className="p-6">
                <h4 className="font-semibold text-white mb-2 tracking-tight">Can I cancel anytime?</h4>
                <p className="text-sm text-[#a1a1aa]">
                  Yes, you can cancel your subscription at any time. Your plan will remain active until the end of your billing period.
                </p>
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-white mb-2 tracking-tight">What payment methods do you accept?</h4>
                <p className="text-sm text-[#a1a1aa]">
                  We accept all major credit cards (Visa, MasterCard, AmEx) and PayPal.
                </p>
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-white mb-2 tracking-tight">Do you offer refunds?</h4>
                <p className="text-sm text-[#a1a1aa]">
                  Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <ProtectedRoute>
      <BillingContent />
    </ProtectedRoute>
  );
}
