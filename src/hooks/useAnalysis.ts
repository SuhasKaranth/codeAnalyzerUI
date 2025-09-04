import { useState, useEffect, useCallback } from 'react';
import { apiService, generateSessionId } from '@/services/api';
import { HistoryEntry, FileTreeNode } from '@/types';
import { SessionStorage, RepositorySessionData, QAEntry } from '@/utils/sessionStorage';

// Named export - this is the key!
export const useAnalysis = (userEmail?: string) => {
    const [repoUrl, setRepoUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState<HistoryEntry[]>([]);
    const [currentStatus, setCurrentStatus] = useState('idle');
    const [fileStructure, setFileStructure] = useState<FileTreeNode>({});
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    // Generate sessionId immediately when hook is created - ensures consistent session ID
    const [sessionId, setSessionId] = useState<string>(() => generateSessionId());
    const [explainFileQuestion, setExplainFileQuestion] = useState<string | null>(null);
    const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
    const [sessionRestored, setSessionRestored] = useState(false);



    // Store session data helper - sessionId remains constant for this instance
    const storeSessionData = useCallback(() => {
        if (userEmail && repoUrl && sessionId) {
            const sessionData: RepositorySessionData = {
                repoUrl,
                sessionId,
                fileStructure,
                currentStatus,
                userEmail,
                timestamp: Date.now(),
                qaHistory: qaHistory || []
            };
            SessionStorage.saveSession(sessionData);
            console.log('Session data stored with consistent sessionId:', sessionId);
        }
    }, [userEmail, repoUrl, sessionId, fileStructure, currentStatus, qaHistory]);

    // Clear session helper - generates new sessionId for fresh start
    const clearSession = useCallback(() => {
        setSessionId(generateSessionId()); // Generate new sessionId for new session
        setRepoUrl('');
        setFileStructure({});
        setCurrentStatus('idle');
        setAnalysisHistory([]);
        setQaHistory([]);
        setSessionRestored(false); // Allow session restoration again after clearing
        
        SessionStorage.clearSession();
        console.log('Session cleared - new sessionId generated');
    }, []);

    // Truncate long messages for activity history
    const truncateMessage = useCallback((message: string, maxLength: number = 80) => {
        if (message.length <= maxLength) return message;
        return message.substring(0, maxLength) + '...';
    }, []);

    // Add history entry helper
    const addHistoryEntry = useCallback((action: string, status: HistoryEntry['status'], details = '') => {
        const entry: HistoryEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }),
            action,
            status,
            details: truncateMessage(details)
        };
        setAnalysisHistory(prev => [entry, ...prev]);
    }, [truncateMessage]);

    // Load session from cookies on mount - only once
    useEffect(() => {
        if (userEmail && !sessionRestored) {
            const storedSession = SessionStorage.getSession();
            if (storedSession && storedSession.userEmail === userEmail) {
                // Restore all session data
                setRepoUrl(storedSession.repoUrl);
                setSessionId(storedSession.sessionId);
                setFileStructure(storedSession.fileStructure);
                
                // If we have file structure, status should be completed
                // Don't restore 'analyzing' status as that would be misleading
                const restoredStatus = storedSession.currentStatus === 'analyzing' && 
                                     Object.keys(storedSession.fileStructure || {}).length > 0 
                                     ? 'completed' 
                                     : storedSession.currentStatus;
                setCurrentStatus(restoredStatus);
                setQaHistory(storedSession.qaHistory || []);
                
                // Mark session as restored to prevent future restorations
                setSessionRestored(true);
                
                // Add history entry to indicate session restored
                addHistoryEntry('Session Restored', 'completed', `Restored session for ${storedSession.repoUrl} with ${(storedSession.qaHistory || []).length} Q&A entries`);
                
                console.log('Session restored from cookie:', storedSession);
                console.log('Restored session ID:', storedSession.sessionId, 'Type:', typeof storedSession.sessionId);
                
                // Inform backend about session continuation - use current sessionId
                if (storedSession.repoUrl) {
                    // Use the current sessionId from state (generated on app start)
                    apiService.continueUserSession(sessionId, userEmail, storedSession.repoUrl)
                        .then(response => {
                            console.log('Backend session continuation response:', response);
                            console.log('Using consistent sessionId:', sessionId);
                        })
                        .catch(error => {
                            console.error('Failed to continue session with backend:', error);
                        });
                }
            } else {
                // No stored session, mark as "restored" to prevent future checks
                setSessionRestored(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userEmail]); // Only depend on userEmail - intentionally excluding other deps to prevent infinite loops

    // Organize files into tree structure
    const organizeFileStructure = useCallback((files: string[]): FileTreeNode => {
        const tree: FileTreeNode = {};

        files.forEach(file => {
            const parts = file.split('/');
            let current = tree;

            parts.forEach((part, index) => {
                if (!current[part]) {
                    current[part] = index === parts.length - 1
                        ? { isFile: true, fullPath: file }
                        : {};
                }
                current = current[part] as FileTreeNode;
            });
        });

        return tree;
    }, []);

    // Complete analysis and load files function
    const completeAnalysis = useCallback(async () => {
        console.log('completeAnalysis called, repoUrl:', repoUrl, 'sessionId:', sessionId);
        setIsAnalyzing(false);
        setCurrentStatus('completed');
        addHistoryEntry('Analysis Complete', 'completed', 'Analysis manually completed - loading files...');

        if (repoUrl) {
            try {
                // Call the API with the repository URL
                const files = await apiService.getRepositoryFiles(repoUrl);
                console.log('Files loaded:', files);
                const organizedFiles = organizeFileStructure(files);
                setFileStructure(organizedFiles);
                addHistoryEntry('File Structure', 'loaded', `${files.length} Java files loaded successfully`);
                
                // Update session storage with file structure
                storeSessionData();
            } catch (error) {
                console.error('Error loading files:', error);
                addHistoryEntry('File Structure', 'error', 'Could not load file structure from API');

                // Fallback: Try using chat API if we have a session
                if (sessionId) {
                    try {
                        const response = await apiService.sendChatMessage('List all the Java files in the repository', sessionId);
                        addHistoryEntry('File Structure', 'completed', 'Requested file list from chat API as fallback');
                        console.log('Chat response for file list:', response);
                    } catch (chatError) {
                        console.error('Chat API also failed:', chatError);
                        addHistoryEntry('File Structure', 'error', 'Could not load file structure via any method');
                    }
                }
            }
        } else {
            addHistoryEntry('File Structure', 'error', 'No repository URL available');
        }
    }, [addHistoryEntry, organizeFileStructure, repoUrl, sessionId, storeSessionData]);

    // Load file structure
    const loadFileStructure = useCallback(async () => {
        if (!sessionId) return;

        try {
            const files = await apiService.getRepositoryFiles();
            const organizedFiles = organizeFileStructure(files);
            setFileStructure(organizedFiles);
            addHistoryEntry('File Structure', 'loaded', `${files.length} files loaded`);
            
            // Update session storage with file structure
            storeSessionData();
        } catch (error) {
            addHistoryEntry('File Structure', 'error', 'Failed to load file structure');
            console.error('Error loading file structure:', error);
        }
    }, [sessionId, organizeFileStructure, addHistoryEntry, storeSessionData]);

    // Parse analysis response and update UI accordingly - enhanced for non-blocking responses
    const parseAnalysisResponse = useCallback((response: string) => {
        // Handle structured status responses (JSON-like)
        try {
            const statusObj = JSON.parse(response);
            if (statusObj.status) {
                const status = statusObj.status.toLowerCase();
                const progress = statusObj.progress || '';
                
                if (status === 'completed' || status === 'finished') {
                    setTimeout(() => completeAnalysis(), 1000);
                    return 'completed';
                } else if (status === 'error' || status === 'failed') {
                    setIsAnalyzing(false);
                    setCurrentStatus('error');
                    addHistoryEntry('Analysis Failed', 'error', statusObj.message || 'Analysis failed');
                    return 'error';
                } else if (status === 'processing' || status === 'in_progress' || status === 'analyzing') {
                    addHistoryEntry('Analysis Progress', 'in_progress', progress || 'Analysis in progress');
                    return 'in_progress';
                }
            }
        } catch {
            // Not JSON, continue with text parsing
        }

        // Handle system health checks - only show failures, suppress successful ones
        if (response.includes('System Health Check') || 
            response.includes('All systems are operational') ||
            response.includes('All systems operational and ready')) {
            
            // Don't add successful health checks to activity history
            // Only failed health checks will be shown to reduce noise
            console.log('Suppressing successful health check from activity history');
            return 'health_check';
        }

        // Show failed health checks
        if (response.includes('System Health Check') && 
            (response.includes('failed') || response.includes('error') || response.includes('unavailable'))) {
            
            addHistoryEntry('System Health', 'error', 'System health check failed');
            return 'health_check_failed';
        }

        // Check for actual completion indicators
        if (response.includes('Analysis completed') ||
            response.includes('successfully processed') ||
            response.includes('analysis is complete') ||
            response.includes('finished analyzing') ||
            response.includes('Storing everything in the vector database') ||
            response.includes('You can now ask me questions') ||
            response.includes('process may take 2-10 minutes') ||
            (response.includes('Creating vector embeddings') && response.includes('Storing everything'))) {

            // Call complete analysis
            setTimeout(() => completeAnalysis(), 1000);
            return 'completed';
        }

        // Check for progress indicators
        else if (response.includes('files processed') ||
            response.includes('parsing') ||
            response.includes('analyzing') ||
            response.includes('processing') ||
            response.includes('cloning initiated') ||
            response.includes('Code analysis') ||
            response.includes('embedding generation') ||
            response.includes('Creating vector embeddings') ||
            response.includes('Repository cloning')) {

            // Check if this indicates completion
            if (response.includes('This process may take 2-10 minutes') &&
                response.includes('You can now ask me questions')) {
                setTimeout(() => completeAnalysis(), 1000);
                return 'completed';
            }

            // Provide concise status messages instead of full response
            let statusMessage = 'Processing repository...';
            if (response.includes('cloning') || response.includes('Repository cloning')) {
                statusMessage = 'Cloning repository';
            } else if (response.includes('parsing')) {
                statusMessage = 'Parsing code files';
            } else if (response.includes('analyzing') || response.includes('Code analysis')) {
                statusMessage = 'Analyzing code structure';
            } else if (response.includes('embedding') || response.includes('Creating vector embeddings')) {
                statusMessage = 'Creating embeddings';
            } else if (response.includes('files processed')) {
                statusMessage = 'Processing files';
            }

            // Only add entry if it's different from the last one to avoid spam
            const lastEntry = analysisHistory[0];
            if (!lastEntry || lastEntry.details !== statusMessage) {
                addHistoryEntry('Analysis Progress', 'in_progress', statusMessage);
            }
            return 'in_progress';
        }

        // Check for error indicators
        else if (response.includes('error') ||
            response.includes('failed') ||
            response.includes('cannot') ||
            response.includes('unable to')) {
            setIsAnalyzing(false);
            setCurrentStatus('error');
            
            // Provide concise error messages
            let errorMessage = 'Analysis failed';
            if (response.includes('cannot access') || response.includes('unable to access')) {
                errorMessage = 'Unable to access repository';
            } else if (response.includes('failed to clone')) {
                errorMessage = 'Failed to clone repository';
            } else if (response.includes('timeout')) {
                errorMessage = 'Analysis timed out';
            }
            
            addHistoryEntry('Analysis Failed', 'error', errorMessage);
            return 'error';
        }

        // For any other response - avoid spam by checking last entry
        else {
            const lastEntry = analysisHistory[0];
            const conciseUpdate = 'Analysis in progress';
            if (!lastEntry || (lastEntry.details !== conciseUpdate && lastEntry.action !== 'Analysis Progress')) {
                addHistoryEntry('Analysis Update', 'in_progress', conciseUpdate);
            }
            return 'unknown';
        }
    }, [analysisHistory, addHistoryEntry, completeAnalysis]);

    // Manual analysis status check - can be triggered by user action
    const checkAnalysisStatus = useCallback(async () => {
        if (!userEmail || !sessionId) {
            console.log('Cannot check status - missing userEmail or sessionId');
            return;
        }

        try {
            addHistoryEntry('Status Check', 'in_progress', 'Checking analysis status...');
            const response = await apiService.sendChatMessage('What is the current analysis status?', userEmail, sessionId, repoUrl);

            // Note: We now use consistent sessionId generated at initialization
            console.log('Using consistent sessionId:', sessionId);

            if (response.response || response.status) {
                const statusText = response.status || response.response;
                const result = parseAnalysisResponse(statusText);

                if (result === 'completed') {
                    setIsAnalyzing(false);
                    setCurrentStatus('completed');
                } else if (result === 'error') {
                    setIsAnalyzing(false);
                    setCurrentStatus('error');
                }
                
                addHistoryEntry('Status Check', 'completed', 'Status check completed');
                return result;
            }
        } catch (error) {
            console.error('Error checking analysis status:', error);
            addHistoryEntry('Status Check', 'error', 'Status check failed');
            throw error;
        }
    }, [userEmail, sessionId, repoUrl, parseAnalysisResponse, addHistoryEntry]);

    // Analyze repository using chat API with non-blocking response handling
    const analyzeRepository = useCallback(async () => {
        if (!repoUrl.trim()) {
            addHistoryEntry('Analyze Repository', 'error', 'Repository URL is required');
            return;
        }

        if (!userEmail) {
            addHistoryEntry('Analyze Repository', 'error', 'User email is required');
            return;
        }

        setIsAnalyzing(true);
        setCurrentStatus('analyzing');
        addHistoryEntry('Analyze Repository', 'started', `Starting analysis of ${repoUrl}`);
        
        // Store initial session data
        storeSessionData();

        try {
            // Send analysis request - expecting non-blocking response
            const response = await apiService.analyzeRepositoryWithChat(repoUrl, userEmail, sessionId);

            // Using consistent sessionId generated at app initialization
            console.log('Analysis response received for sessionId:', sessionId);

            // Handle immediate response or start polling
            if (response.response) {
                const result = parseAnalysisResponse(response.response);

                if (result === 'completed') {
                    return;
                } else if (result === 'error') {
                    setIsAnalyzing(false);
                    setCurrentStatus('error');
                    return;
                }
            }

            // Analysis initiated - backend will handle completion notification
            addHistoryEntry('Analysis Status', 'in_progress', 'Analysis initiated - backend will notify when complete');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
            addHistoryEntry('Analyze Repository', 'error', errorMessage);
            setIsAnalyzing(false);
            setCurrentStatus('error');
            console.error('Repository analysis error:', error);
        }
    }, [repoUrl, userEmail, sessionId, addHistoryEntry, parseAnalysisResponse, storeSessionData]);

    // Explain selected file using chat API - now triggers question in UI
    const explainFile = useCallback(async () => {
        if (!selectedFile || !userEmail) return;

        const fileName = selectedFile.split('/').pop();
        const question = `I have already analyzed the repository ${repoUrl}. Now please explain the specific file ${selectedFile}. What does this class/file do? Please provide a detailed explanation of its purpose, main functionality, and key components. Focus on the code structure, methods, dependencies, and how it fits into the overall application architecture.`;

        addHistoryEntry('Explain File', 'started', `Explaining ${fileName}`);

        // Trigger the question in the RepositoryInput component
        setExplainFileQuestion(question);

        // Clear the question after a short delay to allow the component to process it
        setTimeout(() => {
            setExplainFileQuestion(null);
        }, 1000);

        addHistoryEntry('File Explanation', 'completed', `Question sent - check answer below in Q&A section`);
    }, [selectedFile, userEmail, addHistoryEntry, repoUrl]);

    // Ensure repository context is set before asking questions
    const ensureRepositoryContext = useCallback(async () => {
        if (userEmail && repoUrl && sessionId) {
            console.log('Setting repository context via session continuation with sessionId:', sessionId);
            try {
                const response = await apiService.continueUserSession(sessionId, userEmail, repoUrl);
                console.log('Repository context set successfully:', response);
            } catch (error) {
                console.log('Could not set repository context:', error);
            }
        }
    }, [userEmail, repoUrl, sessionId]);

    // Ask question using chat API - Don't add to activity history
    const askQuestion = useCallback(async (question: string) => {
        if (!userEmail) {
            throw new Error('No user email available');
        }

        // Ensure repository context is set before asking
        await ensureRepositoryContext();

        try {
            console.log('Sending question with userEmail:', userEmail, 'sessionId:', sessionId, 'repoUrl:', repoUrl, 'and question:', question);
            console.log('Session ID type:', typeof sessionId, 'Session ID value:', sessionId);
            
            // Enhance question with explicit repository context to help backend filtering
            const contextualQuestion = repoUrl 
                ? `[Repository: ${repoUrl}] ${question}`
                : question;
            
            console.log('Contextual question being sent:', contextualQuestion);
            const response = await apiService.sendChatMessage(contextualQuestion, userEmail, sessionId, repoUrl);
            
            // Using consistent sessionId throughout the session
            console.log('Question response received for sessionId:', sessionId);
            
            console.log('Backend response:', response);
            console.log('Response.response value:', response.response);
            console.log('Response type:', typeof response.response);
            
            // Store Q&A in session storage - handle different response formats
            const answerText = response.response || response.answer || response.data?.response;
            
            if (answerText && typeof answerText === 'string' && answerText.trim()) {
                console.log('Adding QA entry to storage and state');
                SessionStorage.addQAEntry(question, answerText);
                
                // Update local state
                const newEntry: QAEntry = {
                    id: Date.now(),
                    question,
                    answer: answerText,
                    timestamp: new Date().toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })
                };
                console.log('New QA entry created:', newEntry);
                
                setQaHistory(prev => {
                    console.log('Previous QA history:', prev);
                    const updated = [newEntry, ...prev]; // Add new entry to BEGINNING for newest-first order
                    console.log('Updated QA history:', updated);
                    return updated;
                });
                
                console.log('QA entry should now be visible in UI');
            } else {
                console.log('No valid response text found in backend response');
                console.log('Available response properties:', Object.keys(response));
            }
            
            return response; // Just return the response, don't log to activity
        } catch (error: unknown) {
            console.error('Error in askQuestion:', error);
            
            // Type guard for axios error
            const isAxiosError = (err: unknown): err is { response?: { status: number }; code?: string } => {
                return typeof err === 'object' && err !== null && ('response' in err || 'code' in err);
            };
            
            // Provide specific error messages based on error type
            if (isAxiosError(error) && error.response?.status === 404) {
                throw new Error('Chat API endpoint not found. Please ensure the backend server is running and the /api/v1/chat/message endpoint exists.');
            } else if (isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
                throw new Error('Cannot connect to backend server. Please ensure the backend is running on http://localhost:8080 with v1 API endpoints');
            } else if (isAxiosError(error) && error.response?.status === 500) {
                throw new Error('Internal server error. Please check the backend server logs.');
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Failed to ask question';
                throw new Error(errorMessage);
            }
        }
    }, [userEmail, sessionId, repoUrl, ensureRepositoryContext]);

    // REMOVED: Polling logic that was overwhelming backend with status requests
    // The backend now handles analysis asynchronously without requiring continuous status checks

    return {
        // State
        repoUrl,
        isAnalyzing,
        analysisHistory,
        currentStatus,
        fileStructure,
        selectedFile,
        sessionId,
        explainFileQuestion,
        qaHistory,

        // Actions
        setRepoUrl,
        setSelectedFile,
        analyzeRepository,
        explainFile,
        loadFileStructure,
        completeAnalysis,
        askQuestion,
        clearSession,
        checkAnalysisStatus,

        // Utilities
        addHistoryEntry
    };
};