import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const BackendStatus: React.FC = () => {
    const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
    const [message, setMessage] = useState<string>('Checking backend connectivity...');

    const checkBackend = async () => {
        setStatus('checking');
        setMessage('Checking backend connectivity...');
        
        try {
            const result = await apiService.healthCheck();
            setStatus(result.status === 'connected' ? 'connected' : 'error');
            setMessage(result.message);
        } catch {
            setStatus('error');
            setMessage('Failed to check backend status');
        }
    };

    useEffect(() => {
        checkBackend();
    }, []);

    const getStatusIcon = () => {
        switch (status) {
            case 'checking':
                return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />;
            case 'connected':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-red-500" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'checking':
                return 'border-blue-200 bg-blue-50';
            case 'connected':
                return 'border-green-200 bg-green-50';
            case 'error':
                return 'border-red-200 bg-red-50';
        }
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()}`}>
            {getStatusIcon()}
            <div className="flex-1">
                <div className="text-sm font-medium">
                    Backend Status: {status === 'connected' ? 'Connected' : status === 'error' ? 'Disconnected' : 'Checking...'}
                </div>
                <div className="text-xs opacity-75">{message}</div>
            </div>
            {status === 'error' && (
                <button
                    onClick={checkBackend}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                    Retry
                </button>
            )}
        </div>
    );
};

export default BackendStatus;