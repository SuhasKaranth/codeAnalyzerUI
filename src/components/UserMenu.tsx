import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, History } from 'lucide-react';
import { apiService } from '@/services/api';

interface Repository {
    id: string;
    name: string;
    url: string;
    lastAnalyzed: string;
}

interface UserMenuProps {
    userEmail: string;
    onLogout: () => void;
    onSelectRepository: (repoUrl: string) => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userEmail, onLogout, onSelectRepository }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);

    // Load user repositories when menu opens
    useEffect(() => {
        if (isOpen && repositories.length === 0) {
            loadRepositories();
        }
    }, [isOpen]);

    const loadRepositories = async () => {
        setLoadingRepos(true);
        try {
            const repoData = await apiService.getUserRepositories(userEmail);
            setRepositories(repoData || []);
        } catch (error) {
            console.error('Failed to load repositories:', error);
        } finally {
            setLoadingRepos(false);
        }
    };

    const handleRepositoryClick = (repository: Repository) => {
        onSelectRepository(repository.url);
        setIsOpen(false);
    };

    return (
        <>
            {/* Hamburger Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="User Menu"
            >
                {isOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                )}
            </button>

            {/* Overlay */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Side Panel */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 z-50 ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}>
                {/* Header */}
                <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">User Menu</h2>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-gray-200 rounded"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </div>

                {/* User Account Section */}
                <div className="p-4 border-b">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">{userEmail}</p>
                            <p className="text-sm text-gray-500">Account Settings</p>
                        </div>
                    </div>
                </div>

                {/* Repository History Section */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                        <div className="flex items-center space-x-2 mb-4">
                            <History className="w-5 h-5 text-gray-600" />
                            <h3 className="font-medium text-gray-900">Recent Repositories</h3>
                        </div>

                        {loadingRepos ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    </div>
                                ))}
                            </div>
                        ) : repositories.length > 0 ? (
                            <div className="space-y-3">
                                {repositories.map((repo) => (
                                    <button
                                        key={repo.id}
                                        onClick={() => handleRepositoryClick(repo)}
                                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                                    >
                                        <p className="font-medium text-gray-900 truncate">{repo.name}</p>
                                        <p className="text-sm text-blue-600 truncate">{repo.url}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Analyzed: {new Date(repo.lastAnalyzed).toLocaleDateString()}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">No repositories analyzed yet</p>
                                <p className="text-gray-400 text-xs mt-1">Start by analyzing your first repository</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Logout */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={() => {
                            onLogout();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default UserMenu;