import axios from 'axios';
import { AnalysisStatus, CloneResponse, FileStructureResponse, ExplainResponse } from '@/types';

// Configure axios with base URL and timeout
const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 120000, // 2 minutes for long-running operations
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        // Don't reject 202 status codes - they're successful async responses
        if (error.response?.status === 202) {
            return error.response;
        }
        return Promise.reject(error);
    }
);

// Generate unique session ID
const generateSessionId = () => `chat_session_${Date.now()}`;

// API Service Functions
export const apiService = {
    // Chat-based Repository Analysis (replaces separate clone/analyze steps)
    async analyzeRepositoryWithChat(repoUrl: string): Promise<any> {
        const sessionId = generateSessionId();
        const response = await api.post('/chat/message', {
            message: `Analyze ${repoUrl}`,
            sessionId: sessionId
        });
        return {
            ...response.data,
            sessionId // Return session ID for future queries
        };
    },

    // Chat message for queries
    async sendChatMessage(message: string, sessionId: string): Promise<any> {
        const response = await api.post('/chat/message', {
            message,
            sessionId
        });
        return response.data;
    },

    // Get chat session context
    async getChatContext(sessionId: string): Promise<any> {
        const response = await api.get(`/chat/session/${sessionId}/context`);
        return response.data;
    },

    // Legacy Repository Management (keeping for backward compatibility)
    async cloneRepository(repoUrl: string): Promise<CloneResponse> {
        try {
            // Try with query parameters first (based on your error message)
            const response = await api.post(`/repository/clone?url=${encodeURIComponent(repoUrl)}&async=true`);
            return response.data;
        } catch (error) {
            // If that fails, try with request body as fallback
            console.log('Trying request body format...');
            const response = await api.post('/repository/clone', {
                url: repoUrl,
                async: true
            });
            return response.data;
        }
    },

    async getRepositoryFiles(repoUrl?: string): Promise<string[]> {
        try {
            let url = '/repository/files';
            if (repoUrl) {
                url += `?url=${encodeURIComponent(repoUrl)}`;
            }

            const response = await api.get(url);

            // Based on your API response structure, extract the javaFiles array
            if (response.data && response.data.javaFiles) {
                return response.data.javaFiles;
            }

            // Fallback if response structure is different
            return response.data || [];
        } catch (error) {
            console.error('Error getting repository files:', error);
            throw new Error('Could not retrieve repository files from API');
        }
    },

    async cleanupRepository(): Promise<void> {
        await api.delete('/repository/cleanup');
    },

    // Analysis Management
    async startAnalysis(): Promise<void> {
        await api.post('/analysis/start');
    },

    async getAnalysisProgress(): Promise<AnalysisStatus> {
        const response = await api.get<AnalysisStatus>('/analysis/progress');
        return response.data;
    },

    async getAnalysisHealth(): Promise<{ status: string; message: string }> {
        const response = await api.get('/analysis/health');
        return response.data;
    },

    // Query Management
    async explainFile(filePath: string): Promise<ExplainResponse> {
        const response = await api.post<ExplainResponse>('/query/ask', {
            query: `Explain the code in ${filePath}. What does this class/file do? Provide details about its purpose, main methods, and how it fits into the overall architecture.`,
            includeExplanation: true
        });
        return response.data;
    },

    async searchCode(query: string): Promise<any> {
        const response = await api.post('/query/search', {
            query,
            limit: 10
        });
        return response.data;
    },

    async getEndpoints(): Promise<any> {
        const response = await api.get('/query/endpoints');
        return response.data;
    },

    async getSpringComponents(): Promise<any> {
        const response = await api.get('/query/spring-components');
        return response.data;
    }
};

export default apiService;