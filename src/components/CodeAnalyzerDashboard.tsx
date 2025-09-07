import React, { useEffect, useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';  // Named import - matches the export
import { FileTreeNode } from '@/types';
import FileExplorer from './FileExplorer';
import HistoryPanel from './HistoryPanel';
import RepositoryInput from './RepositoryInput';
import EmailLogin from './EmailLogin';
import { Github } from 'lucide-react';
import UserMenu from './UserMenu';
import { apiService } from '@/services/api';

const CodeAnalyzerDashboard: React.FC = () => {
    const [isClient, setIsClient] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const {
        repoUrl,
        isAnalyzing,
        analysisHistory,
        currentStatus,
        fileStructure,
        selectedFile,
        setRepoUrl,
        setSelectedFile,
        analyzeRepository,
        explainFile,
        completeAnalysis,
        sessionId,
        isInitialized,
        askQuestion,
        explainFileQuestion,
        clearSession,
        qaHistory,

    } = useAnalysis(userEmail || undefined);

    // Ensure we only render on client to avoid hydration issues and check for stored email
    useEffect(() => {
        setIsClient(true);
        // Check for stored email in localStorage
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
            setUserEmail(storedEmail);
        }
    }, []);

    // Initialize user session when email, sessionId, and initialization are complete
    useEffect(() => {
        if (userEmail && sessionId && isClient && isInitialized) {
            console.log('Starting user session with sessionId:', sessionId, 'for email:', userEmail);
            apiService.startUserSession(sessionId, userEmail)
                .then(response => {
                    console.log('User session started successfully:', response);
                })
                .catch(error => {
                    console.warn('Failed to start user session (backend may not be ready):', error);
                });
        }
    }, [userEmail, sessionId, isClient, isInitialized]);

    // Handle email submission
    const handleEmailSubmit = (email: string) => {
        localStorage.setItem('userEmail', email);
        setUserEmail(email);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('userEmail');
        clearSession(); // Clear chat session
        setUserEmail(null);
    };

    // Handle repository selection from menu
    const handleRepositorySelect = async (repositoryUrl: string) => {
        try {
            // Load repository session and files
            setRepoUrl(repositoryUrl);
            
            // Set repository context using our consistent sessionId (wait for initialization)
            if (userEmail && sessionId && isInitialized) {
                console.log('Setting repository context with sessionId:', sessionId);
                const sessionResponse = await apiService.continueUserSession(sessionId, userEmail, repositoryUrl);
                console.log('Continue session response:', sessionResponse);
            }
        } catch (error) {
            console.error('Failed to load repository:', error);
        }
    };

    if (!isClient) {
        // Return a loading skeleton that matches the final UI structure
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            AI Code Analysis Agent
                        </h1>
                        <p className="text-gray-600">
                            Analyze Java repositories with natural language queries
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border h-full animate-pulse">
                                <div className="h-12 bg-gray-200 rounded-t-lg"></div>
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-sm border h-full animate-pulse">
                                <div className="h-12 bg-gray-200 rounded-t-lg"></div>
                                <div className="p-8">
                                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-10 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm border h-full animate-pulse">
                                <div className="h-12 bg-gray-200 rounded-t-lg"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-16 bg-gray-200 rounded"></div>
                                    <div className="h-16 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show email login if no email is provided
    if (!userEmail) {
        return <EmailLogin onEmailSubmit={handleEmailSubmit} />;
    }

    const handleFileSelect = (filePath: string | FileTreeNode | { isFile: true; fullPath: string }) => {
        if (typeof filePath === 'string') {
            setSelectedFile(filePath);
        } else if (filePath && typeof filePath === 'object' && 'isFile' in filePath && filePath.isFile === true && 'fullPath' in filePath) {
            setSelectedFile(typeof filePath.fullPath === 'string' ? filePath.fullPath : null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    {/* User Menu Header */}
                    <div className="flex justify-between items-center mb-6">
                        <UserMenu 
                            userEmail={userEmail}
                            onLogout={handleLogout}
                            onSelectRepository={handleRepositorySelect}
                        />
                        {repoUrl && (
                            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <Github className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                    {repoUrl.split('/').slice(-2).join('/')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Main Title */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            AI Code Analysis Agent
                        </h1>
                        <p className="text-gray-600">
                            Analyze Java repositories with natural language queries
                        </p>
                    </div>

                    {/* Repository Status */}
                    {repoUrl && (
                        <div className="mt-4 text-center">

                            {/* Debug: Manual Complete Button (remove in production) */}
                            {isAnalyzing && (
                                <div className="space-y-2">
                                    <button
                                        onClick={completeAnalysis}
                                        className="px-4 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition-colors"
                                    >
                                        Complete Analysis & Load Files
                                    </button>
                                    {/* Debug info */}
                                    <p className="text-xs text-gray-500">
                                        Session: {sessionId ? `Active (${sessionId.substring(0, 10)}...)` : 'None'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">

                    {/* Left Panel - File Structure */}
                    <div className="lg:col-span-1">
                        <FileExplorer
                            fileStructure={fileStructure}
                            selectedFile={selectedFile}
                            onFileSelect={handleFileSelect}
                            onExplainFile={explainFile}
                        />
                    </div>

                    {/* Center Panel - Repository Input */}
                    <div className="lg:col-span-2">
                        <RepositoryInput
                            repoUrl={repoUrl}
                            isAnalyzing={isAnalyzing}
                            currentStatus={currentStatus}
                            onUrlChange={setRepoUrl}
                            onAnalyze={analyzeRepository}
                            onAskQuestion={askQuestion}
                            explainFileQuestion={explainFileQuestion}
                            qaHistory={qaHistory}
                        />
                    </div>

                    {/* Right Panel - History */}
                    <div className="lg:col-span-1">
                        <HistoryPanel
                            history={analysisHistory}
                            currentStatus={currentStatus}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeAnalyzerDashboard;