'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { enqueueJob } from '@/lib/api/pythonWorker';

function DebugDoctorContent() {
  const { user, profile } = useAuthStore();
  const router = useRouter();

  // Form state
  const [fileName, setFileName] = useState('');
  const [code, setCode] = useState('');
  const [errorLog, setErrorLog] = useState('');
  const [language, setLanguage] = useState('python');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
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

      // Enqueue debug job
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
        // Redirect to job status page
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Code Insight
              </Link>
              <div className="hidden md:flex ml-10 space-x-8">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-900 py-5">
                  Dashboard
                </Link>
                <Link href="/dashboard/review" className="text-gray-500 hover:text-gray-900 py-5">
                  Code Review
                </Link>
                <Link href="/dashboard/debug" className="text-gray-900 font-medium border-b-2 border-blue-600 py-5">
                  Debug Doctor
                </Link>
                <Link href="/dashboard/history" className="text-gray-500 hover:text-gray-900 py-5">
                  History
                </Link>
                <Link href="/dashboard/settings" className="text-gray-500 hover:text-gray-900 py-5">
                  Settings
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase">
                {profile?.plan || 'LITE'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Debug Doctor 🩺
          </h2>
          <p className="text-gray-600">
            Paste your code and error log, and Claude will analyze the issue and suggest fixes
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <span className="text-red-600 text-xl">⚠️</span>
              <div>
                <h3 className="text-sm font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Form */}
        <form onSubmit={handleSubmit} className="px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            {/* File Name and Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File Name (Optional)
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g., app.py"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {/* Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Code <span className="text-red-500">*</span>
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste the relevant code that's causing the error
              </p>
            </div>

            {/* Error Log Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Log / Stack Trace <span className="text-red-500">*</span>
              </label>
              <textarea
                value={errorLog}
                onChange={(e) => setErrorLog(e.target.value)}
                placeholder="Paste your error message or stack trace here..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include the full error message and stack trace for best results
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 text-xl">ℹ️</span>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">How Debug Doctor Works</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Parses your stack trace to identify exact error locations</li>
                    <li>• Runs static analysis (linters) on your code</li>
                    <li>• Uses Claude Sonnet 4.5 to analyze the error and suggest fixes</li>
                    <li>• Provides step-by-step verification instructions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <button
                type="submit"
                disabled={submitting || !code.trim() || !errorLog.trim()}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </form>

        {/* Examples Section */}
        <div className="px-4 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Example Errors Debug Doctor Can Help With</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Import Errors</h4>
                <p className="text-sm text-gray-600">
                  ModuleNotFoundError, ImportError, missing dependencies
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Type Errors</h4>
                <p className="text-sm text-gray-600">
                  TypeError, AttributeError, type mismatches
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Syntax Errors</h4>
                <p className="text-sm text-gray-600">
                  SyntaxError, IndentationError, parsing issues
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Runtime Errors</h4>
                <p className="text-sm text-gray-600">
                  IndexError, KeyError, ValueError, exceptions
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
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
