import React, { useState } from 'react';
import { Play, CheckCircle, AlertCircle, Clock, MessageCircle, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import { RepositoryInputProps } from '@/types';

interface ExtendedRepositoryInputProps extends RepositoryInputProps {
    onAskQuestion?: (question: string) => Promise<any>;
    sessionId?: string | null;
}

interface QuestionAnswer {
    question: string;
    answer: string;
    timestamp: string;
}

const RepositoryInput: React.FC<ExtendedRepositoryInputProps> = ({
                                                                     repoUrl,
                                                                     isAnalyzing,
                                                                     currentStatus,
                                                                     onUrlChange,
                                                                     onAnalyze,
                                                                     onAskQuestion,
                                                                     sessionId
                                                                 }) => {
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);

    const handleAskQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !onAskQuestion || !sessionId) return;

        setIsAsking(true);
        try {
            const response = await onAskQuestion(question);

            // Add the Q&A to our local state for display
            const newQA: QuestionAnswer = {
                question: question,
                answer: response?.response || response?.explanation || 'No response received',
                timestamp: new Date().toLocaleTimeString()
            };

            setQuestionAnswers(prev => [newQA, ...prev]);
            setQuestion(''); // Clear the question after asking
        } catch (error) {
            console.error('Error asking question:', error);

            // Add error as answer
            const errorQA: QuestionAnswer = {
                question: question,
                answer: 'Error: Failed to get response from the API',
                timestamp: new Date().toLocaleTimeString()
            };
            setQuestionAnswers(prev => [errorQA, ...prev]);
        } finally {
            setIsAsking(false);
        }
    };

    const handleAnalyzeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAnalyzing && repoUrl.trim()) {
            onAnalyze();
        }
    };

    const isCompleted = currentStatus === 'completed';

    // Get status icon based on current status
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

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isAnalyzing && repoUrl.trim()) {
            onAnalyze();
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gray-50 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            Repository Analysis
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {isCompleted ? 'Analysis completed - ask questions below' : 'Enter a GitHub repository URL to start analysis'}
                        </p>
                    </div>

                    {/* Collapse button - only show when completed */}
                    {isCompleted && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
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

            {/* Main Input Area */}
            <div className="flex-1 flex flex-col justify-center p-8">
                <div className="max-w-md mx-auto w-full space-y-6">

                    {/* Input Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                                required
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
                            type="submit"
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
                    </form>

                    {/* Status Display */}
                    {currentStatus !== 'idle' && (
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
                  {currentStatus === 'analyzing' ? 'Analysis in Progress' : currentStatus}
                </span>
                            </div>
                        </div>
                    )}

                    {/* Question Interface - Only show when analysis is complete */}
                    {isCompleted && sessionId && (
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                                <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
                                Ask Questions About The Code
                            </h4>

                            <form onSubmit={handleAskQuestion} className="space-y-4">
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
                                    type="submit"
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
                            </form>

                            <div className="mt-3 text-xs text-gray-500">
                                <p>Popular questions: "What REST endpoints does it have?" • "Show me the Spring components" • "How does the data flow work?"</p>
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
                </div>
            </div>

            {/* Example URLs Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-lg">
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
    );
};

export default RepositoryInput;