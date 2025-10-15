'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getUserJobs, type Job } from '@/lib/api/pythonWorker';

function HistoryContent() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchJobs = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getUserJobs(user.id, 500);
        setJobs(response.jobs);
        setFilteredJobs(response.jobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [user?.id]);

  useEffect(() => {
    let filtered = [...jobs];
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.file_path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.job_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.language?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (statusFilter !== 'all') filtered = filtered.filter(job => job.status === statusFilter);
    if (typeFilter !== 'all') filtered = filtered.filter(job => job.type === typeFilter);
    if (languageFilter !== 'all') filtered = filtered.filter(job => job.language === languageFilter);
    setFilteredJobs(filtered);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, languageFilter, jobs]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const uniqueLanguages = Array.from(new Set(jobs.map(j => j.language).filter(Boolean)));

  return (
    <div className="flex h-screen bg-[#0a0a0f]">
      <Sidebar />
      <div className="ml-64 flex-1 overflow-y-auto">
        <main className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">Review History 📚</h1>
            <p className="text-[#a1a1aa]">View and filter all your past code reviews and debug sessions</p>
          </div>

          {/* Filters */}
          <div className="mb-6 bg-[#13131a] border border-[#27273a] rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Search</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="File name, job ID, language..." className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:border-purple-500 transition-colors text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors text-sm">
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Type</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors text-sm">
                  <option value="all">All Types</option>
                  <option value="review">Code Review</option>
                  <option value="debug">Debug Doctor</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-2">Language</label>
                <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="w-full px-4 py-2.5 bg-[#1a1a24] border border-[#27273a] rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors text-sm">
                  <option value="all">All Languages</option>
                  {uniqueLanguages.map(lang => (<option key={lang} value={lang}>{lang}</option>))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-[#a1a1aa]">Showing {filteredJobs.length} of {jobs.length} jobs</p>
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || languageFilter !== 'all') && (
                <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setTypeFilter('all'); setLanguageFilter('all'); }} className="text-purple-400 hover:text-purple-300 font-medium">Clear filters</button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-red-400 text-xl">⚠️</span>
              <div>
                <h3 className="text-sm font-medium text-red-400">Error</h3>
                <p className="text-sm text-red-300/70 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Jobs List */}
          {loading ? (
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-[#1a1a24] rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-[#1a1a24] rounded w-1/4"></div>
                    </div>
                    <div className="h-6 bg-[#1a1a24] rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">No jobs found</h3>
              <p className="text-[#a1a1aa] mb-6">{searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || languageFilter !== 'all' ? 'Try adjusting your filters' : 'Start by submitting your first code review'}</p>
              <Link href="/dashboard/review" className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium">Submit Code Review</Link>
            </div>
          ) : (
            <div className="bg-[#13131a] border border-[#27273a] rounded-xl divide-y divide-[#27273a]">
              {paginatedJobs.map((job) => (
                <Link key={job.job_id} href={`/dashboard/jobs/${job.job_id}`} className="block p-4 hover:bg-[#1a1a24] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <span className="text-2xl">{job.type === 'review' ? '🔍' : job.type === 'debug' ? '🩺' : '🏗️'}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate tracking-tight">{job.file_path || job.job_id}</h4>
                        <div className="flex items-center gap-2 text-xs text-[#71717a]">
                          <span>{job.language || 'Unknown'}</span>
                          <span>·</span>
                          <span>{new Date(job.created_at).toLocaleString()}</span>
                          {job.tokens_used?.total_tokens > 0 && (<><span>·</span><span>{job.tokens_used.total_tokens.toLocaleString()} tokens</span></>)}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {job.status === 'completed' && (<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">✓ Completed</span>)}
                      {job.status === 'processing' && (<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">⏳ Processing</span>)}
                      {job.status === 'pending' && (<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#1a1a24] text-[#a1a1aa] border border-[#27273a]">⏸️ Pending</span>)}
                      {job.status === 'failed' && (<span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">✗ Failed</span>)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-[#a1a1aa]">Page {currentPage} of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-[#1a1a24] border border-[#27273a] rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-[#1f1f2e] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-[#1a1a24] border border-[#27273a] rounded-lg text-sm font-medium text-[#a1a1aa] hover:bg-[#1f1f2e] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (<ProtectedRoute><HistoryContent /></ProtectedRoute>);
}
