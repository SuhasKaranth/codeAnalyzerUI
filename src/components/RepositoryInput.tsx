import React, { useState, useEffect } from 'react';
import { Play, CheckCircle, AlertCircle, Clock, MessageCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { QAEntry } from '@/utils/sessionStorage';

// Type definitions
interface RepositoryInputProps {
    repoUrl: string;
    isAnalyzing: boolean;
    currentStatus: string;
    onUrlChange: (url: string) => void;
    onAnalyze: () => void;
}

interface ExtendedRepositoryInputProps extends RepositoryInputProps {
    onAskQuestion?: (question: string) => Promise<unknown>;
    explainFileQuestion?: string | null;
    qaHistory?: QAEntry[];
}


const RepositoryInput: React.FC<ExtendedRepositoryInputProps> = ({
                                                                     repoUrl,
                                                                     isAnalyzing,
                                                                     currentStatus,
                                                                     onUrlChange,
                                                                     onAnalyze,
                                                                     onAskQuestion,
                                                                     explainFileQuestion,
                                                                     qaHistory = []
                                                                 }) => {
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Handle explain file question automatically
    useEffect(() => {
        if (explainFileQuestion && explainFileQuestion.trim()) {
            setQuestion(explainFileQuestion);
            // Auto-submit the question
            if (onAskQuestion) {
                handleAskQuestionWithText(explainFileQuestion);
            }
        }
    }, [explainFileQuestion]);

    const handleAskQuestionWithText = async (questionText: string) => {
        if (!questionText.trim() || !onAskQuestion) return;

        setIsAsking(true);
        try {
            await onAskQuestion(questionText);
            setQuestion(''); // Clear the input after successful submission
        } catch (error) {
            console.error('Error asking question:', error);
        } finally {
            setIsAsking(false);
        }
    };

    const handleAskQuestion = async () => {
        return handleAskQuestionWithText(question);
    };

    const handleAnalyze = () => {
        if (!isAnalyzing && repoUrl.trim()) {
            onAnalyze();
        }
    };

    const isCompleted = currentStatus === 'completed';
    
    // Debug logging
    console.log('RepositoryInput - currentStatus:', currentStatus);
    console.log('RepositoryInput - isCompleted:', isCompleted);
    console.log('RepositoryInput - onAskQuestion:', !!onAskQuestion);
    console.log('RepositoryInput - should show Q&A section:', isCompleted && onAskQuestion);

    // Auto-collapse repository section when analysis is completed
    useEffect(() => {
        if (isCompleted) {
            setIsCollapsed(true);
        }
    }, [isCompleted]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'analyzing':
                return <Clock className="w-5 h-5 text-blue-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {/* Header with Repository URL - Always Visible */}
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Repository Analysis
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {isCompleted ? 'Analysis completed - ask questions about your code below' : 'Enter a GitHub repository URL to start analysis'}
                        </p>
                    </div>

                    {/* Collapse button - only show when completed */}
                    {isCompleted && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0 ml-4"
                            title={isCollapsed ? "Show repository input" : "Hide repository input"}
                        >
                            {isCollapsed ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Repository Input Section */}
            <div className={`transition-all duration-300 overflow-hidden ${
                isCollapsed ? 'max-h-0' : 'flex-1'
            }`}>
                <div className="flex flex-col justify-center p-8 h-full">
                    <div className="max-w-md mx-auto w-full space-y-6">
                        {/* Input Form */}
                        <div className="space-y-6">
                            <div>
                                <label
                                    htmlFor="repo-url"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    GitHub Repository URL
                                </label>
                                <input
                                    id="repo-url"
                                    type="url"
                                    value={repoUrl}
                                    onChange={(e) => onUrlChange(e.target.value)}
                                    placeholder="https://github.com/owner/repository"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                                    disabled={isAnalyzing}
                                />
                                {/* URL validation feedback */}
                                {repoUrl && !repoUrl.includes('github.com') && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Please enter a valid GitHub repository URL
                                    </p>
                                )}
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !repoUrl.trim() || !repoUrl.includes('github.com')}
                                className="w-full bg-blue-500 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-h-[48px]"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <div className="animate-spin w-5 h-5 mr-3 border-2 border-white border-t-transparent rounded-full"></div>
                                        Analyzing Repository...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 mr-2" />
                                        Analyze Repository
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Status Display */}
                        {(currentStatus !== 'idle' && (isAnalyzing || currentStatus === 'completed' || currentStatus === 'error')) && (
                            <div className="text-center">
                                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                                    currentStatus === 'completed'
                                        ? 'bg-green-100 text-green-800'
                                        : currentStatus === 'error'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {getStatusIcon(currentStatus)}
                                    <span className="ml-2 capitalize">
                                        {isAnalyzing && currentStatus === 'analyzing' ? 'Analysis in Progress' : 
                                         currentStatus === 'completed' ? 'Analysis Complete' :
                                         currentStatus === 'error' ? 'Analysis Failed' : 
                                         currentStatus}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Help Text */}
                        <div className="text-center space-y-2">
                            <p className="text-sm text-gray-500">
                                Supported: Java repositories with Spring Boot projects
                            </p>
                            <div className="text-xs text-gray-400 space-y-1">
                                <p>• Repository will be cloned and analyzed</p>
                                <p>• Java files will be parsed and indexed</p>
                                <p>• Ask questions about the code structure</p>
                            </div>
                        </div>

                        {/* Example URLs */}
                        <div className="border-t pt-4">
                            <details className="text-sm">
                                <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">
                                    Example Repositories
                                </summary>
                                <div className="mt-2 space-y-2 text-xs text-gray-500">
                                    <button
                                        onClick={() => onUrlChange('https://github.com/spring-projects/spring-petclinic')}
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded truncate"
                                        disabled={isAnalyzing}
                                    >
                                        spring-projects/spring-petclinic
                                    </button>
                                    <button
                                        onClick={() => onUrlChange('https://github.com/cassiomolin/microservices-springboot')}
                                        className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded truncate"
                                        disabled={isAnalyzing}
                                    >
                                        cassiomolin/microservices-springboot
                                    </button>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            </div>

            {/* Question Interface - Always visible when completed */}
            {isCompleted && onAskQuestion && (
                <div className="border-t bg-white p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                        Ask Questions About The Code
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                                What would you like to know about this repository?
                            </label>
                            <textarea
                                id="question"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="e.g., What REST endpoints are available? How does authentication work? Show me the main business logic..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 resize-none"
                                rows={3}
                                disabled={isAsking}
                            />
                        </div>

                        <button
                            onClick={handleAskQuestion}
                            disabled={isAsking || !question.trim()}
                            className="w-full bg-green-500 text-white py-2 px-4 rounded-md font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                            {isAsking ? (
                                <>
                                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                                    Asking...
                                </>
                            ) : (
                                <>
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Ask Question
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-3 text-xs text-gray-500">
                        <p>Popular questions: &quot;What REST endpoints does it have?&quot; • &quot;Show me the Spring components&quot; • &quot;How does the data flow work?&quot;</p>
                    </div>

                    {/* Question & Answer History - Show right after the question interface */}
                    {(() => {
                        console.log('Q&A Section - qaHistory.length:', qaHistory.length);
                        console.log('Q&A Section - qaHistory entries:', qaHistory.map(qa => ({ question: qa.question, id: qa.id, timestamp: qa.timestamp })));
                        return qaHistory.length > 0;
                    })() && (
                        <div className="mt-6">
                            <h5 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                                Recent Questions & Answers ({qaHistory.length})
                            </h5>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {qaHistory.map((qa, index) => {
                                    console.log(`Rendering Q&A entry ${index}:`, { question: qa.question, hasAnswer: !!qa.answer, answerLength: qa.answer?.length });
                                    return (
                                        <div key={qa.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-start justify-between mb-2">
                                                <h6 className="font-medium text-gray-900 text-sm">Q: {qa.question}</h6>
                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">{qa.timestamp}</span>
                                            </div>
                                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                <strong>A:</strong> {qa.answer}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RepositoryInput;