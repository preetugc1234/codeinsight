'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { enqueueJob } from '@/lib/api/pythonWorker';

function CodeReviewContent() {
  const router = useRouter();
  const { user } = useAuthStore();
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

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const langConfig = supportedLanguages.find(l => l.value === newLanguage);
    if (langConfig) {
      const nameWithoutExt = fileName.split('.').slice(0, -1).join('.') || 'untitled';
      setFileName(`${nameWithoutExt}${langConfig.extension}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const detectedLang = supportedLanguages.find(l => l.extension.toLowerCase() === `.${ext}`);
    if (detectedLang) setLanguage(detectedLang.value);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCode(content);
    };
    reader.readAsText(file);
  };

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

      const result = await enqueueJob({
        user_id: user.id,
        job_type: 'review',
        file_path: fileName,
        file_content: code,
        language: language,
      });

      if (result.success) {
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
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />

      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">
              Code Review 🔍
            </h1>
            <p className="text-[#a1a1aa]">
              Submit your code for AI-powered review with Claude Sonnet 4.5
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

          {/* Code Editor */}
          <div className="bg-[#13131a] border border-[#27273a] rounded-xl overflow-hidden">
            {/* Editor Header */}
            <div className="border-b border-[#27273a] p-4 bg-[#1a1a24]">
              <div className="flex items-center gap-4 flex-wrap">
                {/* File Name */}
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#13131a] border border-[#27273a] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    placeholder="untitled.py"
                  />
                </div>

                {/* Language Selector */}
                <div className="min-w-[150px]">
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#13131a] border border-[#27273a] rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
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
                  <label className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                    Upload File
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-[#27273a] rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-[#1f1f2e] hover:text-white transition-colors">
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
                  fontFamily: 'Poppins, monospace',
                }}
              />
            </div>

            {/* Editor Footer */}
            <div className="border-t border-[#27273a] p-4 bg-[#1a1a24] flex items-center justify-between">
              <div className="text-sm text-[#a1a1aa]">
                <span className="font-medium text-white">{code.split('\n').length}</span> lines ·
                <span className="font-medium text-white ml-2">{code.length}</span> characters
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCode('');
                    setFileName('untitled.py');
                    setError(null);
                  }}
                  className="px-4 py-2 bg-[#13131a] border border-[#27273a] rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-[#1f1f2e] hover:text-white transition-colors"
                  disabled={submitting}
                >
                  Clear
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !code.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/20"
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

          {/* Info Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
              <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">🤖 AI-Powered Review</h3>
              <p className="text-xs text-[#a1a1aa]">
                Your code will be analyzed by Claude Sonnet 4.5, the most advanced AI model for code review
              </p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
              <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">⚡ Fast Processing</h3>
              <p className="text-xs text-[#a1a1aa]">
                Reviews typically complete in 5-15 seconds. You'll be redirected to the results page automatically
              </p>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
              <h3 className="text-sm font-semibold text-white mb-2 tracking-tight">🔒 Secure & Private</h3>
              <p className="text-xs text-[#a1a1aa]">
                Your code is never stored permanently. We only cache results for 24 hours for performance
              </p>
            </div>
          </div>
        </main>
      </div>
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
