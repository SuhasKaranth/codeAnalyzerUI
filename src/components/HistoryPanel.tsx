import React from 'react';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { HistoryPanelProps, HistoryEntry } from '@/types';

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, currentStatus }) => {

    // Get status icon based on entry status
    const getStatusIcon = (status: HistoryEntry['status']) => {
        switch (status) {
            case 'completed':
            case 'loaded':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'started':
            case 'in_progress':
                return <Clock className="w-4 h-4 text-blue-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    // Get status color classes
    const getStatusColor = (status: HistoryEntry['status']) => {
        switch (status) {
            case 'completed':
            case 'loaded':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'error':
                return 'text-red-700 bg-red-50 border-red-200';
            case 'started':
            case 'in_progress':
                return 'text-blue-700 bg-blue-50 border-blue-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Activity History
                </h3>
                {/* Current Status Indicator */}
                {currentStatus !== 'idle' && (
                    <div className="mt-2">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            currentStatus === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : currentStatus === 'error'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-blue-100 text-blue-800'
                        }`}>
                            {getStatusIcon(currentStatus as HistoryEntry['status'])}
                            <span className="ml-1 capitalize">{currentStatus}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* History List */}
            <div className="flex-1 overflow-auto p-4">
                {history.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No activity yet</p>
                        <p className="text-sm mt-1">Start analyzing a repository</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {history.map((entry, index) => (
                            <div
                                key={entry.id}
                                className={`relative border-l-2 pl-4 pb-4 ${
                                    index === history.length - 1 ? '' : 'border-gray-200'
                                }`}
                            >
                                {/* Timeline dot */}
                                <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-white border-2 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                                </div>

                                {/* Entry content */}
                                <div className={`border rounded-lg p-3 ${getStatusColor(entry.status)}`}>
                                    <div className="flex items-start space-x-2">
                                        {getStatusIcon(entry.status)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                                {entry.action}
                                            </p>
                                            <p className="text-xs opacity-75 mt-1">
                                                {entry.timestamp}
                                            </p>
                                            {entry.details && (
                                                <p className="text-xs mt-2 break-words">
                                                    {entry.details}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer with helpful tips */}
            {history.length > 0 && (
                <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                    <p className="text-xs text-gray-500 text-center">
                        {history.length} activities recorded
                    </p>
                </div>
            )}
        </div>
    );
};

export default HistoryPanel;