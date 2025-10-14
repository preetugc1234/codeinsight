'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import { enqueueJob } from '@/lib/api/pythonWorker';

function CodeReviewContent() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [fileName, setFileName] = useState('untitled.py');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supportedLanguages = [
    { value: 'python', label: 'Python', extension: '.py' },
    { value: 'javascript', label: 'JavaScript', extension: '.js' },
    { value: 'typescript', label: 'TypeScript', extension: '.ts' },
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'go', label: 'Go', extension: '.go' },
    { value: 'rust', label: 'Rust', extension: '.rs' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'c', label: 'C', extension: '.c' },
    { value: 'csharp', label: 'C#', extension: '.cs' },
    { value: 'php', label: 'PHP', extension: '.php' },
    { value: 'ruby', label: 'Ruby', extension: '.rb' },
    { value: 'swift', label: 'Swift', extension: '.swift' },
  ];

  // Handle language change - update file extension
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);

    const langConfig = supportedLanguages.find(l => l.value === newLanguage);
    if (langConfig) {
      // Update file extension if filename still has old extension
      const nameWithoutExt = fileName.split('.').slice(0, -1).join('.') || 'untitled';
      setFileName(`${nameWithoutExt}${langConfig.extension}`);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // Detect language from file extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const detectedLang = supportedLanguages.find(l =>
      l.extension.toLowerCase() === `.${ext}`
    );
    if (detectedLang) {
      setLanguage(detectedLang.value);
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
    };
    reader.readAsText(file);
  };

  // Submit code for review
  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please enter some code to review');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Enqueue job to Python worker
      const result = await enqueueJob({
        user_id: user.id,
        job_type: 'review',
        file_path: fileName,
        file_content: code,
        language: language,
      });

      if (result.success) {
        // Redirect to job status page
        router.push(`/dashboard/jobs/${result.job_id}`);
      } else {
        throw new Error('Failed to submit code review');
      }
    } catch (err) {
      console.error('Error submitting code review:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit code review');
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
                <Link href="/dashboard/review" className="text-gray-900 font-medium border-b-2 border-blue-600 py-5">
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

            <div className="flex items-center gap-4">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 uppercase">
                {profile?.plan || 'LITE'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Code Review 🔍
          </h2>
          <p className="text-gray-600">
            Submit your code for AI-powered review with Claude Sonnet 4.5
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

        {/* Code Editor Section */}
        <div className="px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Editor Header */}
            <div className="border-b border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-4 flex-wrap">
                {/* File Name */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="untitled.py"
                  />
                </div>

                {/* Language Selector */}
                <div className="min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {supportedLanguages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload */}
                <div className="min-w-[150px]">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Upload File
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Choose File
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".py,.js,.ts,.java,.go,.rs,.cpp,.c,.cs,.php,.rb,.swift"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="relative">
              <Editor
                height="500px"
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>

            {/* Editor Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{code.split('\n').length}</span> lines •
                <span className="font-medium ml-2">{code.length}</span> characters
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCode('');
                    setFileName('untitled.py');
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                  disabled={submitting}
                >
                  Clear
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !code.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit for Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="px-4 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">🤖 AI-Powered Review</h3>
            <p className="text-xs text-blue-800">
              Your code will be analyzed by Claude Sonnet 4.5, the most advanced AI model for code review
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">⚡ Fast Processing</h3>
            <p className="text-xs text-green-800">
              Reviews typically complete in 5-15 seconds. You'll be redirected to the results page automatically
            </p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">🔒 Secure & Private</h3>
            <p className="text-xs text-purple-800">
              Your code is never stored permanently. We only cache results for 24 hours for performance
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CodeReviewPage() {
  return (
    <ProtectedRoute>
      <CodeReviewContent />
    </ProtectedRoute>
  );
}
