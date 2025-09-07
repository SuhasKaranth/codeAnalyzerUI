import axios from 'axios';
import { AnalysisStatus, CloneResponse, ExplainResponse } from '@/types';

// Session API response types
interface SessionResponse {
    sessionId: string;
    message?: string;
    status?: string;
}

interface ChatResponse {
    response?: string;
    answer?: string;
    sessionId?: string;
    status?: string;
    data?: {
        response?: string;
    };
}

interface RepositoriesResponse {
    repositories: string[];
}

interface SessionStatusResponse {
    sessionId: string;
    userEmail: string;
    repositoryUrl?: string;
    isActive: boolean;
}

// Configure axios with base URL and timeout
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    timeout: 1200000, // 2 minutes for long-running operations
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for logging and API key authentication
api.interceptors.request.use(
    (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        // Add API key header to all requests except /health endpoint
        if (config.url && !config.url.includes('/health')) {
            const apiKey = process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY;
            if (apiKey) {
                config.headers = config.headers || {};
                config.headers['X-API-Key'] = apiKey;
            }
        }
        
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
        if (process.env.NODE_ENV === 'development') {
            console.log(`API Response: ${response.status} ${response.config.url}`);
        }
        return response;
    },
    (error) => {
        // Only log meaningful errors in development
        if (process.env.NODE_ENV === 'development') {
            if (error.response) {
                // Server responded with error status
                const errorData = error.response.data;
                const errorMessage = errorData?.message || errorData?.error;
                
                // Skip logging common development 404s and expected errors
                const isExpected404 = error.response.status === 404 && (
                    error.config.url?.includes('/user/session/continue') ||
                    error.config.url?.includes('/user/') ||
                    errorMessage?.includes('No static resource')
                );
                
                // Only log unexpected errors with meaningful messages
                if (errorMessage && errorMessage !== '{}' && !isExpected404) {
                    console.error(`API Error [${error.response.status}]:`, errorMessage);
                }
                // Silently ignore empty responses, expected 404s, and development setup issues
            } else if (error.request && error.code !== 'ECONNREFUSED' && error.code !== 'ENOTFOUND') {
                // Network error (but not connection issues during dev)
                console.warn('Network Error:', error.message);
            }
        }
        
        // Don't reject 202 status codes - they're successful async responses
        if (error.response?.status === 202) {
            return error.response;
        }
        
        return Promise.reject(error);
    }
);

// Generate unique session ID - more robust UUID-like format
const generateSessionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
};

// API Service Functions
export const apiService = {
    // Health check to verify backend connectivity  
    async healthCheck(): Promise<{ status: string; message: string }> {
        try {
            await api.get('/analysis/health');
            return { status: 'connected', message: 'Backend server is reachable' };
        } catch (error) {
            console.error('Backend health check failed:', error);
            return { 
                status: 'error', 
                message: 'Backend server is not reachable. Please ensure the backend is running on http://localhost:8080 with v1 API endpoints' 
            };
        }
    },
    // Session Management - now includes sessionId in all calls
    async startUserSession(sessionId: string, email: string): Promise<SessionResponse> {
        const response = await api.post<SessionResponse>('/user/session/start', {
            sessionId,
            email
        });
        return response.data;
    },

    async continueUserSession(sessionId: string, email: string, repositoryUrl: string): Promise<SessionResponse> {
        try {
            const response = await api.post<SessionResponse>('/user/session/continue', {
                sessionId,
                email,
                repositoryUrl
            });
            return response.data;
        } catch (error) {
            // Handle session continuation gracefully - backend might not have the session
            console.log('Session continuation failed (normal for new sessions):', error instanceof Error ? error.message : 'Unknown error');
            return { sessionId, message: 'Starting new session' };
        }
    },

    async getUserRepositories(sessionId: string, email: string): Promise<RepositoriesResponse> {
        const response = await api.get<RepositoriesResponse>(`/user/${email}/repositories`, {
            params: { sessionId }
        });
        return response.data;
    },

    async getCurrentSession(sessionId: string, email: string): Promise<SessionStatusResponse> {
        const response = await api.get<SessionStatusResponse>(`/user/${email}/session`, {
            params: { sessionId }
        });
        return response.data;
    },

    // Chat-based Repository Analysis (hybrid: email + sessionId)
    async analyzeRepositoryWithChat(repoUrl: string, userEmail: string, sessionId?: string | null): Promise<ChatResponse> {
        const payload: {
            message: string;
            userEmail: string;
            sessionId?: string;
        } = {
            message: `Analyze ${repoUrl}`,
            userEmail: userEmail
        };
        
        // Include sessionId if provided (for session continuity)
        if (sessionId) {
            payload.sessionId = sessionId;
        }
        
        // Use shorter timeout for analysis requests (1 minute)
        const response = await api.post<ChatResponse>('/chat/message', payload, {
            timeout: 60000 // 1 minute timeout
        });
        return response.data;
    },

    // Chat message for queries (hybrid: email + sessionId)
    async sendChatMessage(message: string, userEmail: string, sessionId?: string | null, repositoryUrl?: string): Promise<ChatResponse> {
        console.log('💬 sendChatMessage called:', {
            messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            userEmail,
            hasSessionId: !!sessionId,
            hasRepositoryUrl: !!repositoryUrl,
            timestamp: new Date().toLocaleTimeString()
        });
        
        const payload: {
            message: string;
            userEmail: string;
            sessionId?: string;
            repositoryUrl?: string;
            repositoryContext?: string;
        } = {
            message,
            userEmail
        };
        
        // Include sessionId if provided (critical for context preservation)
        console.log('🆔 API sendChatMessage - sessionId parameter:', sessionId, 'Type:', typeof sessionId);
        if (sessionId) {
            payload.sessionId = sessionId;
            console.log('✅ Added sessionId to payload:', payload.sessionId);
        } else {
            console.log('❌ No sessionId provided - payload will not include sessionId');
        }
        
        // Include repository URL if provided (critical for repository filtering)
        if (repositoryUrl) {
            payload.repositoryUrl = repositoryUrl;
            payload.repositoryContext = repositoryUrl; // Additional field for backend
            console.log('✅ Added repositoryUrl to payload:', payload.repositoryUrl);
            console.log('🔗 Repository context for filtering:', repositoryUrl);
        } else {
            console.log('❌ WARNING: No repositoryUrl provided - backend may not filter by repository');
        }
        
        console.log('📦 Full payload being sent to /chat/message:', JSON.stringify(payload, null, 2));
        
        try {
            console.log('📞 Making chat API call...');
            const response = await api.post<ChatResponse>('/chat/message', payload);
            
            console.log('✅ Chat API response received:', {
                status: response.status,
                statusText: response.statusText,
                hasResponse: !!response.data?.response,
                responseLength: response.data?.response?.length || 0,
                responseType: typeof response.data?.response,
                hasAnswer: !!response.data?.answer,
                responseKeys: response.data ? Object.keys(response.data) : []
            });
            
            console.log('💬 Full chat response data:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('❌ sendChatMessage failed:', error);
            console.log('📊 Chat error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                status: (error as unknown as {response?: {status?: number}})?.response?.status,
                statusText: (error as unknown as {response?: {statusText?: string}})?.response?.statusText,
                responseData: (error as unknown as {response?: {data?: unknown}})?.response?.data
            });
            throw error;
        }
    },

    // Get chat session context
    async getChatContext(sessionId: string): Promise<Record<string, unknown>> {
        const response = await api.get<Record<string, unknown>>(`/chat/session/${sessionId}/context`);
        return response.data;
    },

    // Legacy Repository Management (keeping for backward compatibility)
    async cloneRepository(repoUrl: string): Promise<CloneResponse> {
        try {
            // Try with query parameters first (based on your error message)
            const response = await api.post(`/repository/clone?url=${encodeURIComponent(repoUrl)}&async=true`);
            return response.data;
        } catch {
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
        console.log('🌐 getRepositoryFiles called with repoUrl:', repoUrl);
        
        try {
            let url = '/repository/files';
            if (repoUrl) {
                url += `?url=${encodeURIComponent(repoUrl)}`;
            }
            
            console.log('📞 Making API call to:', url);
            const response = await api.get(url);
            
            console.log('✅ API response received:', {
                status: response.status,
                statusText: response.statusText,
                dataType: typeof response.data,
                hasJavaFiles: !!(response.data && response.data.javaFiles),
                javaFilesLength: response.data?.javaFiles?.length || 0,
                responseKeys: response.data ? Object.keys(response.data) : []
            });
            
            // Based on your API response structure, extract the javaFiles array
            if (response.data && response.data.javaFiles) {
                console.log('📄 Returning javaFiles array with', response.data.javaFiles.length, 'files');
                console.log('📋 First few files:', response.data.javaFiles.slice(0, 3));
                return response.data.javaFiles;
            }

            // Fallback if response structure is different
            console.log('⚠️  No javaFiles property found, returning raw data');
            console.log('📊 Raw response data:', response.data);
            return response.data || [];
            
        } catch (error) {
            console.error('❌ getRepositoryFiles failed:', error);
            console.log('📊 Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                status: (error as unknown as {response?: {status?: number}})?.response?.status,
                statusText: (error as unknown as {response?: {statusText?: string}})?.response?.statusText,
                responseData: (error as unknown as {response?: {data?: unknown}})?.response?.data
            });
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

    async searchCode(query: string): Promise<Record<string, unknown>> {
        const response = await api.post<Record<string, unknown>>('/query/search', {
            query,
            limit: 10
        });
        return response.data;
    },

    async getEndpoints(): Promise<Record<string, unknown>> {
        const response = await api.get<Record<string, unknown>>('/query/endpoints');
        return response.data;
    },

    async getSpringComponents(): Promise<Record<string, unknown>> {
        const response = await api.get<Record<string, unknown>>('/query/spring-components');
        return response.data;
    }
};

// Export generateSessionId for use in components
export { generateSessionId };

export default apiService;