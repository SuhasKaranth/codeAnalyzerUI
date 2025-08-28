import { useState, useEffect, useCallback } from 'react';
import { apiService } from '@/services/api';
import { AnalysisStatus, HistoryEntry, FileTreeNode } from '@/types';

// Named export - this is the key!
export const useAnalysis = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisHistory, setAnalysisHistory] = useState<HistoryEntry[]>([]);
    const [currentStatus, setCurrentStatus] = useState('idle');
    const [fileStructure, setFileStructure] = useState<FileTreeNode>({});
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

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
            details
        };
        setAnalysisHistory(prev => [entry, ...prev]);
    }, []);

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
                setFileStructure(organizeFileStructure(files));
                addHistoryEntry('File Structure', 'loaded', `${files.length} Java files loaded successfully`);
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
    }, [addHistoryEntry, organizeFileStructure, repoUrl, sessionId]);

    // Load file structure
    const loadFileStructure = useCallback(async () => {
        if (!sessionId) return;

        try {
            const files = await apiService.getRepositoryFiles();
            setFileStructure(organizeFileStructure(files));
            addHistoryEntry('File Structure', 'loaded', `${files.length} files loaded`);
        } catch (error) {
            addHistoryEntry('File Structure', 'error', 'Failed to load file structure');
            console.error('Error loading file structure:', error);
        }
    }, [sessionId, organizeFileStructure, addHistoryEntry]);

    // Parse analysis response and update UI accordingly
    const parseAnalysisResponse = useCallback((response: string) => {
        // Don't add duplicate system health checks
        if (response.includes('System Health Check') && response.includes('All systems are operational')) {
            const hasHealthCheck = analysisHistory.some(entry =>
                entry.action === 'System Health' && entry.status === 'completed'
            );

            if (!hasHealthCheck) {
                addHistoryEntry('System Health', 'completed', 'All systems operational and ready');
            }

            return 'health_check';
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

            addHistoryEntry('Analysis Progress', 'in_progress', response);
            return 'in_progress';
        }

        // Check for error indicators
        else if (response.includes('error') ||
            response.includes('failed') ||
            response.includes('cannot') ||
            response.includes('unable to')) {
            setIsAnalyzing(false);
            setCurrentStatus('error');
            addHistoryEntry('Analysis Failed', 'error', response);
            return 'error';
        }

        // For any other response
        else {
            const lastEntry = analysisHistory[0];
            if (!lastEntry || lastEntry.details !== response) {
                addHistoryEntry('Analysis Update', 'in_progress', response);
            }
            return 'unknown';
        }
    }, [analysisHistory, addHistoryEntry, completeAnalysis]);

    // Monitor analysis progress
    const checkAnalysisProgress = useCallback(async () => {
        if (!sessionId || !isAnalyzing) return;

        try {
            const statusMessages = [
                'What is the current analysis progress?',
                'Show me the analysis status',
                'How many files have been processed?',
                'Is the analysis complete?'
            ];

            const randomMessage = statusMessages[Math.floor(Math.random() * statusMessages.length)];
            const response = await apiService.sendChatMessage(randomMessage, sessionId);

            if (response.response) {
                const result = parseAnalysisResponse(response.response);

                if (result === 'completed' || result === 'error') {
                    setIsAnalyzing(false);
                }
            }
        } catch (error) {
            console.error('Error checking analysis progress:', error);
            setIsAnalyzing(false);
            setCurrentStatus('error');
            addHistoryEntry('Status Check Failed', 'error', 'Unable to check analysis progress');
        }
    }, [sessionId, isAnalyzing, parseAnalysisResponse, addHistoryEntry]);

    // Analyze repository using chat API
    const analyzeRepository = useCallback(async () => {
        if (!repoUrl.trim()) {
            addHistoryEntry('Analyze Repository', 'error', 'Repository URL is required');
            return;
        }

        setIsAnalyzing(true);
        setCurrentStatus('analyzing');
        addHistoryEntry('Analyze Repository', 'started', `Starting analysis of ${repoUrl}`);

        try {
            const response = await apiService.analyzeRepositoryWithChat(repoUrl);

            if (response.sessionId) {
                setSessionId(response.sessionId);
            }

            if (response.response) {
                const result = parseAnalysisResponse(response.response);

                if (result === 'completed') {
                    return;
                }

                setTimeout(() => {
                    checkAnalysisProgress();
                }, 5000);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
            addHistoryEntry('Analyze Repository', 'error', errorMessage);
            setIsAnalyzing(false);
            setCurrentStatus('error');
            console.error('Repository analysis error:', error);
        }
    }, [repoUrl, addHistoryEntry, parseAnalysisResponse, checkAnalysisProgress]);

    // Explain selected file using chat API
    const explainFile = useCallback(async () => {
        if (!selectedFile || !sessionId) return;

        addHistoryEntry('Explain File', 'started', `Explaining ${selectedFile}`);

        try {
            const response = await apiService.sendChatMessage(
                `Explain the code in ${selectedFile}. What does this class/file do?`,
                sessionId
            );

            const truncatedExplanation = response.response?.substring(0, 100) + '...';
            addHistoryEntry('File Explanation', 'completed',
                `Explained ${selectedFile.split('/').pop()}: ${truncatedExplanation}`);

            return response;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to explain file';
            addHistoryEntry('Explain File', 'error', errorMessage);
            throw error;
        }
    }, [selectedFile, sessionId, addHistoryEntry]);

    // Ask question using chat API - Don't add to activity history
    const askQuestion = useCallback(async (question: string) => {
        if (!sessionId) {
            throw new Error('No active session available');
        }

        try {
            const response = await apiService.sendChatMessage(question, sessionId);
            return response; // Just return the response, don't log to activity
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to ask question';
            throw new Error(errorMessage);
        }
    }, [sessionId]);

    // Poll for status updates when analyzing (with timeout)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        let timeoutId: NodeJS.Timeout;

        if (isAnalyzing && sessionId) {
            interval = setInterval(checkAnalysisProgress, 15000);

            timeoutId = setTimeout(() => {
                completeAnalysis();
            }, 300000); // 5 minutes
        }

        return () => {
            if (interval) clearInterval(interval);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isAnalyzing, sessionId, checkAnalysisProgress, completeAnalysis]);

    return {
        // State
        repoUrl,
        isAnalyzing,
        analysisHistory,
        currentStatus,
        fileStructure,
        selectedFile,
        sessionId,

        // Actions
        setRepoUrl,
        setSelectedFile,
        analyzeRepository,
        explainFile,
        loadFileStructure,
        completeAnalysis,
        askQuestion,

        // Utilities
        addHistoryEntry
    };
};