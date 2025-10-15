'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getJob, type Job } from '@/lib/api/pythonWorker';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/store/authStore';

function JobStatusContent() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { user } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // WebSocket for real-time updates
  const { isConnected, lastMessage, subscribeToJob, unsubscribeFromJob } = useWebSocket(user?.id || null);

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

  // Subscribe to WebSocket updates for this job
  useEffect(() => {
    if (isConnected && jobId) {
      subscribeToJob(jobId);

      return () => {
        unsubscribeFromJob(jobId);
      };
    }
  }, [isConnected, jobId, subscribeToJob, unsubscribeFromJob]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'job_update' && lastMessage.job_id === jobId) {
      console.log('📥 Received job update via WebSocket:', lastMessage);

      // Fetch updated job data
      fetchJobStatus();
    }
  }, [lastMessage, jobId]);

  // Initial fetch and fallback polling
  useEffect(() => {
    fetchJobStatus();

    // Fallback polling every 5 seconds (less frequent since we have WebSocket)
    const interval = setInterval(() => {
      if (job?.status === 'pending' || job?.status === 'processing') {
        fetchJobStatus();
      }
    }, 5000);

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
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      pending: 'bg-[#1a1a24] text-[#a1a1aa] border-[#27273a]',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
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
      <div className="flex h-screen bg-[#0a0a0f]">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#a1a1aa]">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex h-screen bg-[#0a0a0f]">
        <Sidebar />
        <div className="ml-64 flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Job Not Found</h2>
            <p className="text-[#a1a1aa] mb-6">{error || 'Could not find the requested job'}</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />

      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8 max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Link href="/dashboard" className="text-[#71717a] hover:text-[#a1a1aa] transition-colors">
                Dashboard
              </Link>
              <span className="text-[#71717a]">/</span>
              <span className="text-white font-medium">Job Details</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-semibold text-white mb-2 tracking-tight">
                  {job.type === 'review' ? '🔍' : job.type === 'debug' ? '🩺' : '🏗️'}
                  {' '}
                  {job.file_path || job.job_id}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-[#a1a1aa]">
                    {job.language || 'Unknown language'} • Created {formatDate(job.created_at)}
                  </p>
                  {isConnected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                      <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                      Live
                    </span>
                  )}
                </div>
              </div>
              <StatusBadge status={job.status} />
            </div>
          </div>

          {/* Processing Status */}
          {(job.status === 'pending' || job.status === 'processing') && (
            <div className="mb-6">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1 tracking-tight">
                      {job.status === 'pending' ? 'Job Queued' : 'Processing Your Code'}
                    </h3>
                    <p className="text-sm text-[#a1a1aa] mb-3">
                      {job.status === 'pending'
                        ? 'Your job is in the queue and will be processed shortly...'
                        : 'Claude is analyzing your code. This usually takes 5-15 seconds...'}
                    </p>
                    <div className="w-full bg-[#1a1a24] rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Failed Status */}
          {job.status === 'failed' && (
            <div className="mb-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">❌</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-400 mb-1 tracking-tight">Job Failed</h3>
                    <p className="text-sm text-red-300/70">
                      {job.error || 'An error occurred while processing your code'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Details */}
          <div className="mb-6">
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 tracking-tight">Job Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-[#71717a] mb-1">Job ID</p>
                  <p className="text-sm font-mono text-white truncate">{job.job_id}</p>
                </div>
                <div>
                  <p className="text-xs text-[#71717a] mb-1">Type</p>
                  <p className="text-sm font-medium text-white capitalize">{job.type}</p>
                </div>
                <div>
                  <p className="text-xs text-[#71717a] mb-1">Tokens Used</p>
                  <p className="text-sm font-medium text-white">
                    {job.tokens_used?.total_tokens.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#71717a] mb-1">Cost</p>
                  <p className="text-sm font-medium text-white">
                    ${job.estimated_cost.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Section */}
          {job.status === 'completed' && job.results && (
            <div className="mb-6">
              <div className="bg-[#13131a] border border-[#27273a] rounded-xl overflow-hidden">
                <div className="border-b border-[#27273a] p-4 bg-[#1a1a24] flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white tracking-tight">Review Results</h3>
                  {job.results.cached && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      ⚡ Cached Result
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <MarkdownRenderer content={job.results.content} />
                </div>
              </div>
            </div>
          )}

          {/* Linter Results */}
          {job.status === 'completed' && job.results?.lint_result && job.results.lint_result.issues?.length > 0 && (
            <div className="mb-6">
              <div className="bg-[#13131a] border border-[#27273a] rounded-xl overflow-hidden">
                <div className="border-b border-[#27273a] p-4 bg-[#1a1a24]">
                  <h3 className="text-lg font-semibold text-white tracking-tight">Linter Issues</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {job.results.lint_result.issues.slice(0, 10).map((issue: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-[#1a1a24] rounded-lg border border-[#27273a]"
                      >
                        <span className={`text-sm font-medium px-2 py-1 rounded ${
                          issue.severity === 'error'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : issue.severity === 'warning'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-white">{issue.message}</p>
                          <p className="text-xs text-[#71717a] mt-1">
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
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/review"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-center font-medium hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg shadow-purple-500/20"
                >
                  Submit Another Review
                </Link>
                <Link
                  href="/dashboard/history"
                  className="flex-1 px-6 py-3 bg-[#1a1a24] border border-[#27273a] text-white rounded-lg text-center font-medium hover:bg-[#1f1f2e] hover:border-purple-500/30 transition-all"
                >
                  View History
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>
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
