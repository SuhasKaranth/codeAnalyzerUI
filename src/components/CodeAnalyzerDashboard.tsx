import React, { useEffect, useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';  // Named import - matches the export
import FileExplorer from './FileExplorer';
import HistoryPanel from './HistoryPanel';
import RepositoryInput from './RepositoryInput';

const CodeAnalyzerDashboard: React.FC = () => {
    const [isClient, setIsClient] = useState(false);

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
        askQuestion
    } = useAnalysis();

    // Ensure we only render on client to avoid hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

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

    const handleFileSelect = (filePath: string) => {
        setSelectedFile(filePath);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        AI Code Analysis Agent
                    </h1>
                    <p className="text-gray-600">
                        Analyze Java repositories with natural language queries
                    </p>
                    {/* Current Repository Display */}
                    {repoUrl && (
                        <div className="mt-4 flex flex-col items-center space-y-2">
                            <div className="inline-flex items-center px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
                                <span className="font-medium">Repository:</span>
                                <span className="ml-2 truncate max-w-md">{repoUrl}</span>
                            </div>

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
                            sessionId={sessionId}
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