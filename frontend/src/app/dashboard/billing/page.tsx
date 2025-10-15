'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

function BillingContent() {
  const { profile } = useAuthStore();
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual'); // Default to annual (20% off)

  useEffect(() => {
    if (profile?.plan === 'trial' && profile?.trial_end_date) {
      const endDate = new Date(profile.trial_end_date);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, diffDays));
    }
    // Set billing cycle from profile, default to annual
    if (profile?.billing_cycle) {
      setBillingCycle(profile.billing_cycle);
    }
  }, [profile]);

  const getPlanPrice = (plan: string, cycle: 'monthly' | 'annual' = billingCycle) => {
    const prices = {
      monthly: {
        trial: { price: 0, display: '$0' },
        lite: { price: 15, display: '$15' },
        pro: { price: 30, display: '$30' },
        business: { price: 200, display: '$200' },
      },
      annual: {
        trial: { price: 0, display: '$0' },
        lite: { price: 12, display: '$12' },      // 20% off
        pro: { price: 24, display: '$24' },       // 20% off
        business: { price: 160, display: '$160' }, // 20% off
      },
    };
    return prices[cycle][plan as keyof typeof prices.monthly] || prices[cycle].trial;
  };

  const getAnnualTotal = (plan: string) => {
    const monthlyPrice = getPlanPrice(plan, 'annual').price;
    return monthlyPrice * 12;
  };

  const getAnnualSavings = (plan: string) => {
    const monthlyTotal = getPlanPrice(plan, 'monthly').price * 12;
    const annualTotal = getAnnualTotal(plan);
    return monthlyTotal - annualTotal;
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
                    {profile?.plan === 'trial'
                      ? '7-day free trial'
                      : profile?.billing_cycle === 'annual'
                        ? 'Renews annually (20% off)'
                        : 'Renews monthly'
                    }
                  </p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    {getPlanPrice(profile?.plan || 'trial', profile?.billing_cycle || 'annual').display}/mo
                  </p>
                  {profile?.plan !== 'trial' && profile?.billing_cycle === 'annual' && (
                    <p className="text-xs text-green-400 mt-1">
                      Saving ${getAnnualSavings(profile.plan)}/year
                    </p>
                  )}
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

          {/* Billing Cycle Toggle */}
          <div className="mb-8 flex flex-col items-center">
            <div className="inline-flex items-center gap-3 bg-[#13131a] border border-[#27273a] rounded-xl p-2">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-lg font-medium transition-all relative ${
                  billingCycle === 'annual'
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'text-[#a1a1aa] hover:text-white'
                }`}
              >
                Annual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  20% OFF
                </span>
              </button>
            </div>
            <p className="text-sm text-[#71717a] mt-3">
              {billingCycle === 'annual' ? (
                <span className="text-green-400">💰 Save up to $480/year with annual billing!</span>
              ) : (
                <span>Switch to annual billing to save 20%</span>
              )}
            </p>
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
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors relative">
              {billingCycle === 'annual' && (
                <div className="absolute top-3 right-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded">
                  SAVE $36/YR
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">LITE</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For individuals</p>
                <div className="mt-4">
                  <p className="text-4xl font-bold text-white">{getPlanPrice('lite').display}</p>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-[#71717a] line-through">$15</p>
                  )}
                </div>
                <p className="text-[#71717a] text-sm">per month</p>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-green-400 mt-1">${getAnnualTotal('lite')}/year</p>
                )}
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
              <div className="absolute top-0 left-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg rounded-tl-lg">
                POPULAR
              </div>
              {billingCycle === 'annual' && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg">
                  SAVE $72/YR
                </div>
              )}
              <div className="text-center mb-6 mt-6">
                <h3 className="text-xl font-bold text-white tracking-tight">PRO</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For professionals</p>
                <div className="mt-4">
                  <p className="text-4xl font-bold text-white">{getPlanPrice('pro').display}</p>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-[#71717a] line-through">$30</p>
                  )}
                </div>
                <p className="text-[#71717a] text-sm">per month</p>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-green-400 mt-1">${getAnnualTotal('pro')}/year</p>
                )}
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
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors relative">
              {billingCycle === 'annual' && (
                <div className="absolute top-3 right-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded">
                  SAVE $480/YR
                </div>
              )}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">BUSINESS</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For teams</p>
                <div className="mt-4">
                  <p className="text-4xl font-bold text-white">{getPlanPrice('business').display}</p>
                  {billingCycle === 'annual' && (
                    <p className="text-sm text-[#71717a] line-through">$200</p>
                  )}
                </div>
                <p className="text-[#71717a] text-sm">per month</p>
                {billingCycle === 'annual' && (
                  <p className="text-xs text-green-400 mt-1">${getAnnualTotal('business')}/year</p>
                )}
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
