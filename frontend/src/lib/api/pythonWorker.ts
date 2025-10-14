/**
 * Python Worker API Client
 * Fetches real data from the Python FastAPI worker
 * Base URL: https://codeinsight-python-worker.onrender.com
 */

const PYTHON_WORKER_URL = process.env.NEXT_PUBLIC_PYTHON_WORKER_URL || 'https://codeinsight-python-worker.onrender.com';

export interface Job {
  job_id: string;
  user_id: string;
  type: string; // "review", "debug", "architecture"
  status: string; // "pending", "processing", "completed", "failed"
  file_path?: string;
  file_content?: string;
  language?: string;
  results?: {
    content: string;
    lint_result?: any;
    model?: string;
    elapsed_time?: number;
    cached: boolean;
  };
  tokens_used: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  estimated_cost: number;
  cache_hit: boolean;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface UserJobsResponse {
  jobs: Job[];
  count: number;
}

export interface QueueInfo {
  stream_name: string;
  length: number;
  pending_count: number;
  consumer_group: string;
}

export interface CacheStats {
  total_keys: number;
  memory_used: string;
  hit_rate?: number;
}

export interface SystemStats {
  service: string;
  cache: CacheStats;
  queue: QueueInfo;
  status: string;
}

/**
 * Fetch all jobs for a user
 */
export async function getUserJobs(userId: string, limit: number = 50): Promise<UserJobsResponse> {
  const response = await fetch(`${PYTHON_WORKER_URL}/jobs/user/${userId}?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user jobs: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a specific job by ID
 */
export async function getJob(jobId: string): Promise<Job> {
  const response = await fetch(`${PYTHON_WORKER_URL}/jobs/${jobId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Enqueue a new job
 */
export async function enqueueJob(params: {
  user_id: string;
  job_type: string;
  file_path?: string;
  file_content?: string;
  language?: string;
  repo_id?: string;
}): Promise<{ success: boolean; job_id: string; message_id: string; status: string }> {
  const response = await fetch(`${PYTHON_WORKER_URL}/jobs/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to enqueue job: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get queue info
 */
export async function getQueueInfo(): Promise<QueueInfo> {
  const response = await fetch(`${PYTHON_WORKER_URL}/queue/info`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch queue info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get system stats
 */
export async function getSystemStats(): Promise<SystemStats> {
  const response = await fetch(`${PYTHON_WORKER_URL}/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch system stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Calculate user statistics from jobs
 */
export function calculateUserStats(jobs: Job[]) {
  const totalReviews = jobs.length;

  const totalTokens = jobs.reduce((sum, job) => {
    return sum + (job.tokens_used?.total_tokens || 0);
  }, 0);

  const totalCost = jobs.reduce((sum, job) => {
    return sum + (job.estimated_cost || 0);
  }, 0);

  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');
  const processingJobs = jobs.filter(job => job.status === 'processing');
  const pendingJobs = jobs.filter(job => job.status === 'pending');

  // Count total issues found (from lint results)
  const totalIssues = completedJobs.reduce((sum, job) => {
    if (job.results?.lint_result?.issues) {
      return sum + job.results.lint_result.issues.length;
    }
    return sum;
  }, 0);

  // Calculate cache hit rate
  const cacheHits = jobs.filter(job => job.cache_hit).length;
  const cacheHitRate = totalReviews > 0 ? (cacheHits / totalReviews) * 100 : 0;

  return {
    totalReviews,
    totalTokens,
    totalCost,
    totalIssues,
    completedJobs: completedJobs.length,
    failedJobs: failedJobs.length,
    processingJobs: processingJobs.length,
    pendingJobs: pendingJobs.length,
    cacheHitRate,
  };
}
