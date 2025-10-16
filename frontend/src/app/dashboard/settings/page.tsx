'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { useState } from 'react';

function SettingsContent() {
  const { user, profile, session } = useAuthStore();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />

      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Settings ⚙️
            </h1>
            <p className="text-[#a1a1aa]">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-[#71717a] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">User ID</label>
                  <input
                    type="text"
                    value={user?.id || ''}
                    disabled
                    className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-[#71717a] font-mono text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Plan Information */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Current Plan</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-white mb-1">{profile?.plan || 'LITE'}</p>
                  <p className="text-sm text-[#a1a1aa]">
                    {profile?.plan === 'pro' ? 'Unlimited reviews & priority support' : '50 reviews per month'}
                  </p>
                </div>
                <Link
                  href="/dashboard/billing"
                  className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/20"
                >
                  Upgrade Plan
                </Link>
              </div>
            </div>

            {/* API Keys */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white tracking-tight">API Keys</h3>
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                  ACTIVE
                </span>
              </div>

              {/* Current API Key */}
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-[#a1a1aa]">Your API Key</label>
                  <button
                    onClick={() => {
                      if (generatedKey) {
                        navigator.clipboard.writeText(generatedKey);
                        alert('✓ API Key copied to clipboard!\n\nUse this in VS Code extension or CLI.');
                      } else {
                        alert('⚠️ Please generate an API key first by clicking "Regenerate".');
                      }
                    }}
                    className="px-3 py-1 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!generatedKey}
                  >
                    📋 Copy Key
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={generatedKey || 'Click "Regenerate" to create your API key'}
                    disabled
                    className="flex-1 px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white font-mono text-sm cursor-not-allowed"
                  />
                  <button
                    onClick={async () => {
                      if (!session?.access_token) {
                        alert('❌ Not authenticated. Please sign in again.');
                        return;
                      }

                      if (confirm('⚠️ Are you sure you want to regenerate your API key?\n\nThis will invalidate your current key.')) {
                        setIsGenerating(true);
                        try {
                          const response = await fetch('/api/keys/generate', {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${session.access_token}`,
                              'Content-Type': 'application/json',
                            },
                          });

                          const data = await response.json();

                          if (data.success && data.api_key) {
                            setGeneratedKey(data.api_key);
                            navigator.clipboard.writeText(data.api_key);
                            alert(`✓ New API key generated and copied to clipboard!\n\n${data.api_key}\n\n⚠️ Save it securely - you won't see it again after leaving this page!`);
                          } else {
                            alert('❌ Error: ' + (data.message || 'Failed to generate API key'));
                          }
                        } catch (error) {
                          console.error('Error generating API key:', error);
                          alert('❌ Failed to generate API key. Please try again or contact support.');
                        } finally {
                          setIsGenerating(false);
                        }
                      }
                    }}
                    className="px-4 py-3 bg-[#1a1a24] border border-[#27273a] text-[#a1a1aa] rounded-lg hover:border-purple-500/50 hover:text-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                  >
                    {isGenerating ? '⏳ Generating...' : '🔄 Regenerate'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#1a1a24] border border-[#27273a] rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-2">📝 How to Use Your API Key</h4>
                <div className="space-y-2 text-sm text-[#a1a1aa]">
                  <p>
                    <strong className="text-purple-400">VS Code Extension:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Install "Code Insight" extension from marketplace</li>
                    <li>Press Ctrl+Shift+P → "Code Insight: Set API Key"</li>
                    <li>Paste your API key and press Enter</li>
                    <li>Start reviewing code!</li>
                  </ol>
                  <p className="mt-3">
                    <strong className="text-purple-400">CLI / API:</strong>
                  </p>
                  <code className="block mt-1 p-2 bg-[#13131a] rounded text-xs">
                    curl -H "Authorization: Bearer sk_..." https://api.codeinsight.com/review
                  </code>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Notifications</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">Email Notifications</p>
                    <p className="text-sm text-[#a1a1aa]">Receive email updates about your reviews</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#27273a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">WebSocket Updates</p>
                    <p className="text-sm text-[#a1a1aa]">Real-time job status updates</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#27273a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Default Language</label>
                  <select className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors">
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Theme</label>
                  <select className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors">
                    <option value="dark">Dark (Current)</option>
                    <option value="light" disabled>Light (Coming Soon)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4 tracking-tight">Danger Zone</h3>
              <div className="space-y-3">
                <button className="px-6 py-3 bg-[#1a1a24] border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 hover:border-red-500/50 transition-colors">
                  Clear All Cache
                </button>
                <button className="px-6 py-3 bg-[#1a1a24] border border-red-500/30 text-red-400 rounded-lg font-medium hover:bg-red-500/10 hover:border-red-500/50 transition-colors ml-3">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
