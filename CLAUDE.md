# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Build**: `npm run build` (uses Turbopack for production build)
- **Production server**: `npm start` 
- **Linting**: `npm run lint`

## Project Architecture

This is a Next.js 15 React application that serves as a frontend UI for an AI Code Analyzer system. The app analyzes Java repositories through a backend API service.

### Core Architecture Pattern

The application follows a **chat-based analysis pattern** rather than traditional REST endpoints:
- Repository analysis is initiated via chat messages to the backend
- Progress tracking happens through periodic chat queries
- File explanations and code queries use the same chat interface
- Session-based communication maintains context throughout analysis

### Key Components Structure

- **`CodeAnalyzerDashboard`**: Main container component with 3-panel layout (file explorer, input panel, history)
- **`useAnalysis` hook**: Core state management for analysis workflow, session handling, and API communication
- **API Service (`apiService`)**: Axios-based service with 120-second timeout for long operations, configured for `http://localhost:8080/api`

### State Management Flow

The `useAnalysis` hook manages a complex state flow:
1. **Analysis Initiation**: Uses `analyzeRepositoryWithChat()` to start analysis with session creation
2. **Progress Monitoring**: Polls backend via chat messages every 15 seconds during analysis
3. **Response Parsing**: `parseAnalysisResponse()` interprets chat responses to determine completion status
4. **File Structure Loading**: After completion, loads file tree via `getRepositoryFiles()`

### Key Data Structures

- **FileTreeNode**: Recursive tree structure for file organization
- **HistoryEntry**: Activity log with timestamp, action, status, and details
- **Analysis Status**: Tracks IDLE/CLONING/PARSING/ANALYZING/COMPLETED/FAILED states

### Backend API Integration

The backend expects:
- Chat-based repository analysis: `POST /chat/message` with repository URL
- File structure retrieval: `GET /repository/files` (returns `javaFiles` array)
- Session-based queries: `POST /chat/message` with `sessionId`

### Client-Side Rendering Considerations

Uses `isClient` state and loading skeletons to prevent Next.js hydration mismatches, ensuring SSR compatibility.