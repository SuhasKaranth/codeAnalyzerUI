import React, { useState } from 'react';
import { FileText, Folder, FolderOpen, Search } from 'lucide-react';
import { FileExplorerProps, FileTreeNode } from '@/types';

const FileExplorer: React.FC<FileExplorerProps> = ({
                                                       fileStructure,
                                                       selectedFile,
                                                       onFileSelect,
                                                       onExplainFile
                                                   }) => {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Toggle folder expansion
    const toggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    // Render file tree recursively
    const renderFileTree = (tree: FileTreeNode, path = ''): React.ReactNode => {
        return Object.entries(tree).map(([name, value]) => {
            const currentPath = path ? `${path}/${name}` : name;

            // Check if it's a file
            if (typeof value === 'object' && 'isFile' in value && value.isFile) {
                return (
                    <div
                        key={currentPath}
                        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-blue-50 rounded text-sm transition-colors ${
                            selectedFile === value.fullPath ? 'bg-blue-100 border-l-2 border-blue-500' : ''
                        }`}
                        onClick={() => onFileSelect(value.fullPath)}
                    >
                        <FileText className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                        <span className="truncate text-gray-900" title={name}>
              {name}
            </span>
                    </div>
                );
            } else {
                // It's a folder
                const isExpanded = expandedFolders.has(currentPath);
                return (
                    <div key={currentPath}>
                        <div
                            className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-50 rounded text-sm font-medium transition-colors"
                            onClick={() => toggleFolder(currentPath)}
                        >
                            {isExpanded ? (
                                <FolderOpen className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                            ) : (
                                <Folder className="w-4 h-4 mr-2 text-gray-600 flex-shrink-0" />
                            )}
                            <span className="truncate text-gray-800" title={name}>
                {name}
              </span>
                        </div>
                        {isExpanded && (
                            <div className="ml-4 border-l border-gray-200 pl-2">
                                {renderFileTree(value as FileTreeNode, currentPath)}
                            </div>
                        )}
                    </div>
                );
            }
        });
    };

    const hasFiles = Object.keys(fileStructure).length > 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    File Structure
                </h3>
            </div>

            {/* File Tree */}
            <div className="flex-1 overflow-auto p-4">
                {!hasFiles ? (
                    <div className="text-center text-gray-500 py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No files loaded</p>
                        <p className="text-sm mt-1">Analyze a repository first</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {renderFileTree(fileStructure)}
                    </div>
                )}
            </div>

            {/* Selected File Action */}
            {selectedFile && (
                <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2 truncate" title={selectedFile}>
                        <span className="font-medium">Selected:</span> {selectedFile.split('/').pop()}
                    </p>
                    <button
                        onClick={onExplainFile}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center font-medium"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Explain File
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileExplorer;