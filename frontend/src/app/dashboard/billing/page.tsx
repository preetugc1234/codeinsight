'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';

function BillingContent() {
  const { profile } = useAuthStore();

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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-300">Current Plan</p>
                  <p className="text-3xl font-bold text-white mt-1 capitalize">{profile?.plan || 'LITE'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#a1a1aa]">Renews monthly</p>
                  <p className="text-2xl font-semibold text-white mt-1">
                    {profile?.plan === 'pro' ? '$29/mo' : 'Free'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* LITE Plan */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">LITE</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For individuals</p>
                <p className="text-4xl font-bold text-white mt-4">$0</p>
                <p className="text-[#71717a] text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">50 code reviews/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Debug Doctor access</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Multi-language support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">WebSocket real-time updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#71717a] mt-0.5">✗</span>
                  <span className="text-sm text-[#71717a]">Priority support</span>
                </li>
              </ul>
              <button
                disabled
                className="w-full px-4 py-3 bg-[#1a1a24] text-[#71717a] rounded-lg font-medium cursor-not-allowed"
              >
                Current Plan
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
                <p className="text-4xl font-bold text-white mt-4">$29</p>
                <p className="text-[#71717a] text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Unlimited code reviews</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Debug Doctor unlimited</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">All languages supported</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Priority WebSocket updates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Priority support 24/7</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">API access</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20">
                Upgrade to PRO
              </button>
            </div>

            {/* TEAM Plan */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6 hover:border-purple-500/30 transition-colors">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">TEAM</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">For organizations</p>
                <p className="text-4xl font-bold text-white mt-4">$99</p>
                <p className="text-[#71717a] text-sm">per month</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Everything in PRO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Up to 10 team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Shared job history</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Team analytics dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">SSO & SAML support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span className="text-sm text-[#a1a1aa]">Dedicated account manager</span>
                </li>
              </ul>
              <button className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] text-white rounded-lg font-medium hover:bg-[#1f1f2e] hover:border-purple-500/30 transition-all">
                Contact Sales
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
