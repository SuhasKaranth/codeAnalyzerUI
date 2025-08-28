// API Response Types
export interface AnalysisStatus {
    status: 'IDLE' | 'CLONING' | 'PARSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
    totalFiles: number;
    processedFiles: number;
    progressPercentage: number;
    error?: string;
    message?: string;
}

export interface CloneResponse {
    success: boolean;
    message: string;
    repositoryPath?: string;
}

export interface ChatResponse {
    response: string;
    sessionId: string;
    timestamp?: string;
}

export interface FileStructureResponse {
    files: string[];
}

export interface ExplainResponse {
    explanation: string;
    codeSnippets?: string[];
    relatedFiles?: string[];
}

// UI State Types
export interface HistoryEntry {
    id: number;
    timestamp: string;
    action: string;
    status: 'started' | 'in_progress' | 'completed' | 'error' | 'loaded';
    details: string;
}

export interface FileTreeNode {
    [key: string]: FileTreeNode | { isFile: true; fullPath: string };
}

// Component Props Types
export interface FileExplorerProps {
    fileStructure: FileTreeNode;
    selectedFile: string | null;
    onFileSelect: (filePath: string | FileTreeNode | { isFile: true; fullPath: string }) => void;
    onExplainFile: () => void;
}

export interface HistoryPanelProps {
    history: HistoryEntry[];
    currentStatus: string;
}

export interface RepositoryInputProps {
    repoUrl: string;
    isAnalyzing: boolean;
    currentStatus: string;
    onUrlChange: (url: string) => void;
    onAnalyze: () => void;
}