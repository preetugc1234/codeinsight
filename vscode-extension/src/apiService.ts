import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export interface ReviewRequest {
    file_path: string;
    file_content: string;
    language: string;
    cursor_context?: string;
}

export interface DebugRequest {
    file_path: string;
    file_content: string;
    error_log: string;
    language: string;
}

export interface JobResponse {
    job_id: string;
    status: string;
    message?: string;
}

export interface JobResult {
    job_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'throttled';
    results?: {
        content: string;
        lint_result?: any;
        cached?: boolean;
    };
    error?: string;
    data?: {
        message?: string;
        usage_percentage?: number;
        throttle_delay?: number;
    };
}

export class ApiService {
    private client: AxiosInstance;
    private apiKey: string | null = null;
    private baseUrl: string;

    constructor() {
        const config = vscode.workspace.getConfiguration('codeInsight');
        this.baseUrl = config.get('apiEndpoint') || 'https://api.codeinsight.com';

        this.client = axios.create({
            baseURL: this.baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    setApiKey(apiKey: string) {
        this.apiKey = apiKey;
        this.client.defaults.headers.common['Authorization'] = `Bearer ${apiKey}`;
    }

    getApiKey(): string | null {
        return this.apiKey;
    }

    async reviewCode(request: ReviewRequest): Promise<JobResponse> {
        if (!this.apiKey) {
            throw new Error('API key not set. Please run "Code Insight: Set API Key" command.');
        }

        try {
            const response = await this.client.post<JobResponse>('/review', request);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.data.message || error.response.statusText}`);
            }
            throw new Error(`Network Error: ${error.message}`);
        }
    }

    async debugCode(request: DebugRequest): Promise<JobResponse> {
        if (!this.apiKey) {
            throw new Error('API key not set. Please run "Code Insight: Set API Key" command.');
        }

        try {
            const response = await this.client.post<JobResponse>('/debug', request);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.data.message || error.response.statusText}`);
            }
            throw new Error(`Network Error: ${error.message}`);
        }
    }

    async getJobStatus(jobId: string): Promise<JobResult> {
        if (!this.apiKey) {
            throw new Error('API key not set.');
        }

        try {
            const response = await this.client.get<JobResult>(`/job/${jobId}`);
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw new Error(`API Error: ${error.response.data.message || error.response.statusText}`);
            }
            throw new Error(`Network Error: ${error.message}`);
        }
    }

    async pollJobUntilComplete(jobId: string, onProgress?: (status: string) => void): Promise<JobResult> {
        const maxAttempts = 60; // 2 minutes max (2s interval)
        const pollInterval = 2000; // 2 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const result = await this.getJobStatus(jobId);

            if (onProgress) {
                onProgress(result.status);
            }

            if (result.status === 'completed') {
                return result;
            }

            if (result.status === 'failed') {
                throw new Error(result.error || 'Job failed');
            }

            if (result.status === 'throttled') {
                const message = result.data?.message || 'Request throttled due to high usage';
                vscode.window.showWarningMessage(`⚠️ ${message}`);
            }

            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        throw new Error('Job timeout: The review is taking longer than expected. Please try again.');
    }

    async validateApiKey(): Promise<boolean> {
        if (!this.apiKey) {
            return false;
        }

        try {
            await this.client.get('/whoami');
            return true;
        } catch {
            return false;
        }
    }
}
