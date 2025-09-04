import Cookies from 'js-cookie';
import { FileTreeNode } from '@/types';

export interface QAEntry {
  id: number;
  question: string;
  answer: string;
  timestamp: string;
}

export interface RepositorySessionData {
  repoUrl: string;
  sessionId: string;
  fileStructure: FileTreeNode;
  currentStatus: string;
  userEmail: string;
  timestamp: number;
  qaHistory: QAEntry[];
}

const SESSION_COOKIE_NAME = 'repo_session';
const SESSION_EXPIRY_HOURS = 24; // 24 hours

export class SessionStorage {
  static saveSession(data: RepositorySessionData): void {
    try {
      const sessionData = {
        ...data,
        timestamp: Date.now()
      };
      
      const serializedData = JSON.stringify(sessionData);
      
      // Store in cookie with 24-hour expiry
      Cookies.set(SESSION_COOKIE_NAME, serializedData, {
        expires: SESSION_EXPIRY_HOURS / 24, // js-cookie expects days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      console.log('Session data saved to cookie');
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  static getSession(): RepositorySessionData | null {
    try {
      const cookieData = Cookies.get(SESSION_COOKIE_NAME);
      
      if (!cookieData) {
        return null;
      }
      
      const sessionData: RepositorySessionData = JSON.parse(cookieData);
      
      // Check if session has expired (older than 24 hours)
      const currentTime = Date.now();
      const sessionAge = currentTime - sessionData.timestamp;
      const maxAge = SESSION_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (sessionAge > maxAge) {
        SessionStorage.clearSession();
        return null;
      }
      
      console.log('Session data loaded from cookie');
      return sessionData;
    } catch (error) {
      console.error('Failed to load session data:', error);
      // Clear corrupted data
      SessionStorage.clearSession();
      return null;
    }
  }

  static clearSession(): void {
    try {
      Cookies.remove(SESSION_COOKIE_NAME);
      console.log('Session data cleared from cookie');
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  static updateFileStructure(fileStructure: FileTreeNode): void {
    const existingSession = SessionStorage.getSession();
    if (existingSession) {
      SessionStorage.saveSession({
        ...existingSession,
        fileStructure,
        timestamp: Date.now()
      });
    }
  }

  static updateSessionId(sessionId: string): void {
    const existingSession = SessionStorage.getSession();
    if (existingSession) {
      SessionStorage.saveSession({
        ...existingSession,
        sessionId,
        timestamp: Date.now()
      });
    }
  }

  static updateStatus(currentStatus: string): void {
    const existingSession = SessionStorage.getSession();
    if (existingSession) {
      SessionStorage.saveSession({
        ...existingSession,
        currentStatus,
        timestamp: Date.now()
      });
    }
  }

  static addQAEntry(question: string, answer: string): void {
    const existingSession = SessionStorage.getSession();
    if (existingSession) {
      const newEntry: QAEntry = {
        id: Date.now(),
        question,
        answer,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      };

      const updatedQAHistory = [newEntry, ...(existingSession.qaHistory || [])]; // Add new entry to BEGINNING for newest-first order
      
      SessionStorage.saveSession({
        ...existingSession,
        qaHistory: updatedQAHistory,
        timestamp: Date.now()
      });
    }
  }

  static clearQAHistory(): void {
    const existingSession = SessionStorage.getSession();
    if (existingSession) {
      SessionStorage.saveSession({
        ...existingSession,
        qaHistory: [],
        timestamp: Date.now()
      });
    }
  }
}