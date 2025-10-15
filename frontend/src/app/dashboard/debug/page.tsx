'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enqueueJob } from '@/lib/api/pythonWorker';

function DebugDoctorContent() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [language, setLanguage] = useState('python');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('You must be logged in to use Debug Doctor');
      return;
    }

    if (!code.trim()) {
      setError('Please paste your code');
      return;
    }

    if (!errorLog.trim()) {
      setError('Please paste your error log');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const result = await enqueueJob({
        user_id: user.id,
        job_type: 'debug',
        file_path: fileName || `untitled.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : 'py'}`,
        file_content: code,
        language: language,
        error_log: errorLog,
        repo_id: 'debug_session'
      });

      if (result.success) {
        router.push(`/dashboard/jobs/${result.job_id}`);
      } else {
        setError('Failed to submit debug request');
      }
    } catch (err) {
      console.error('Error submitting debug request:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit debug request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />

      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Debug Doctor 🩺
            </h1>
            <p className="text-[#a1a1aa]">
              Paste your code and error log, Claude will analyze and suggest fixes
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-red-400">Error</h3>
                <p className="text-sm text-red-300/70 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Info */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">File Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    File Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g., app.py"
                    className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="ruby">Ruby</option>
                    <option value="php">PHP</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Code Input */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Your Code <span className="text-purple-400">*</span>
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={12}
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white placeholder-[#71717a] font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                required
              />
              <p className="text-xs text-[#71717a] mt-2">
                Paste the code that's causing the error
              </p>
            </div>

            {/* Error Log Input */}
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Error Log / Stack Trace <span className="text-purple-400">*</span>
              </label>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="Paste your error message or stack trace here..."
                rows={8}
                className="w-full px-4 py-3 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white placeholder-[#71717a] font-mono text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"
                required
              />
              <p className="text-xs text-[#71717a] mt-2">
                Include the full error message and stack trace for best results
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-purple-400 text-xl">ℹ️</span>
                <div>
                  <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">How Debug Doctor Works</h3>
                  <ul className="text-sm text-[#a1a1aa] space-y-1.5">
                    <li>• Parses your stack trace to identify exact error locations</li>
                    <li>• Runs static analysis (linters) on your code</li>
                    <li>• Uses Claude Sonnet 4.5 to analyze the error and suggest fixes</li>
                    <li>• Provides step-by-step verification instructions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-[#1a1a24] border border-[#27273a] text-[#a1a1aa] rounded-lg font-medium hover:bg-[#1f1f2e] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !code.trim() || !errorLog.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Analyzing...
                  </span>
                ) : (
                  'Diagnose & Fix 🩺'
                )}
              </button>
            </div>
          </form>

          {/* Examples */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-5 hover:border-purple-500/30 transition-colors">
              <h4 className="font-semibold text-white mb-2 tracking-tight">Import Errors</h4>
              <p className="text-sm text-[#a1a1aa]">
                ModuleNotFoundError, ImportError, missing dependencies
              </p>
            </div>
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-5 hover:border-purple-500/30 transition-colors">
              <h4 className="font-semibold text-white mb-2 tracking-tight">Type Errors</h4>
              <p className="text-sm text-[#a1a1aa]">
                TypeError, AttributeError, type mismatches
              </p>
            </div>
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-5 hover:border-purple-500/30 transition-colors">
              <h4 className="font-semibold text-white mb-2 tracking-tight">Syntax Errors</h4>
              <p className="text-sm text-[#a1a1aa]">
                SyntaxError, IndentationError, parsing issues
              </p>
            </div>
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-5 hover:border-purple-500/30 transition-colors">
              <h4 className="font-semibold text-white mb-2 tracking-tight">Runtime Errors</h4>
              <p className="text-sm text-[#a1a1aa]">
                IndexError, KeyError, ValueError, exceptions
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DebugDoctorPage() {
  return (
    <ProtectedRoute>
      <DebugDoctorContent />
    </ProtectedRoute>
  );
}
