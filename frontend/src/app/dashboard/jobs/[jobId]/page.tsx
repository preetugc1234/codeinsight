'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getJob, type Job } from '@/lib/api/pythonWorker';

function JobStatusContent() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch job status
  const fetchJobStatus = async () => {
    try {
      setError(null);
      const jobData = await getJob(jobId);
      setJob(jobData);

      // Stop polling if job is completed or failed
      if (jobData.status === 'completed' || jobData.status === 'failed') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    } catch (err) {
      console.error('Error fetching job:', err);
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  // Start polling on mount
  useEffect(() => {
    fetchJobStatus();

    // Poll every 2 seconds if job is still processing
    const interval = setInterval(() => {
      if (job?.status === 'pending' || job?.status === 'processing') {
        fetchJobStatus();
      }
    }, 2000);

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      completed: '✓',
      processing: '⏳',
      pending: '⏸️',
      failed: '✗',
    };

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {icons[status as keyof typeof icons] || '○'}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Could not find the requested job'}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
                <Link href="/dashboard/history" className="text-gray-500 hover:text-gray-900 py-5">
                  History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Job Details</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {job.type === 'review' ? '🔍' : job.type === 'debug' ? '🐛' : '🏗️'}
                {' '}
                {job.file_path || job.job_id}
              </h2>
              <p className="text-gray-600">
                {job.language || 'Unknown language'} • Created {formatDate(job.created_at)}
              </p>
            </div>
            <StatusBadge status={job.status} />
          </div>
        </div>

        {/* Processing Status */}
        {(job.status === 'pending' || job.status === 'processing') && (
          <div className="px-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-1">
                    {job.status === 'pending' ? 'Job Queued' : 'Processing Your Code'}
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    {job.status === 'pending'
                      ? 'Your job is in the queue and will be processed shortly...'
                      : 'Claude is analyzing your code. This usually takes 5-15 seconds...'}
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failed Status */}
        {job.status === 'failed' && (
          <div className="px-4 mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <span className="text-3xl">❌</span>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-1">Job Failed</h3>
                  <p className="text-sm text-red-800">
                    {job.error || 'An error occurred while processing your code'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Job Details */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Job ID</p>
                <p className="text-sm font-mono text-gray-900 truncate">{job.job_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{job.type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Tokens Used</p>
                <p className="text-sm font-medium text-gray-900">
                  {job.tokens_used?.total_tokens.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Cost</p>
                <p className="text-sm font-medium text-gray-900">
                  ${job.estimated_cost.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {job.status === 'completed' && job.results && (
          <div className="px-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 p-4 bg-gray-50 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Review Results</h3>
                {job.results.cached && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    ⚡ Cached Result
                  </span>
                )}
              </div>
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono bg-gray-50 p-4 rounded-lg border border-gray-200">
{job.results.content}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linter Results */}
        {job.status === 'completed' && job.results?.lint_result && job.results.lint_result.issues?.length > 0 && (
          <div className="px-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="border-b border-gray-200 p-4 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Linter Issues</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {job.results.lint_result.issues.slice(0, 10).map((issue: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className={`text-sm font-medium px-2 py-1 rounded ${
                        issue.severity === 'error'
                          ? 'bg-red-100 text-red-800'
                          : issue.severity === 'warning'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{issue.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Line {issue.line}:{issue.column} • {issue.rule}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {job.status === 'completed' && (
          <div className="px-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/review"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-center font-medium hover:shadow-lg transition"
              >
                Submit Another Review
              </Link>
              <Link
                href="/dashboard/history"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-center font-medium hover:bg-gray-50 transition"
              >
                View History
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function JobStatusPage() {
  return (
    <ProtectedRoute>
      <JobStatusContent />
    </ProtectedRoute>
  );
}
