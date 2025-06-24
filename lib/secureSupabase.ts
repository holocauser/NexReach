import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Environment variables should be stored securely
const supabaseUrl = 'https://fcimhehnuxycljnewqdw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaW1oZWhudXh5Y2xqbmV3cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzcwOTQsImV4cCI6MjA2NTcxMzA5NH0.ACuc_NUS3oUP8gVV-6mcsGQcUPxnuU5RZLj1SGkB5cQ';

// Secure storage keys
const SESSION_KEY = 'supabase.session';
const REFRESH_TOKEN_KEY = 'supabase.refresh_token';
const USER_KEY = 'supabase.user';

// Custom storage implementation for secure token management
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item from secure storage:', error);
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error setting item in secure storage:', error);
      throw error;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  }
};

// Enhanced Supabase client with security configurations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use secure storage for session management
    storage: secureStorage,
    
    // Auto refresh tokens
    autoRefreshToken: true,
    
    // Persist session across app restarts
    persistSession: true,
    
    // Detect session in URL (for OAuth)
    detectSessionInUrl: true,
    
    // Flow type for authentication
    flowType: 'pkce',
    
    // Debug mode (disable in production)
    debug: __DEV__,
  },
  
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': 'scancard-mobile-app',
    },
  },
  
  // Real-time configuration
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limiting for real-time events
    },
  },
});

// Token management utilities
export const tokenManager = {
  // Store session securely
  async storeSession(session: any): Promise<void> {
    if (!session) return;
    
    try {
      await secureStorage.setItem(SESSION_KEY, JSON.stringify(session));
      
      // Store refresh token separately for additional security
      if (session.refresh_token) {
        await secureStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
      }
      
      // Store user data separately
      if (session.user) {
        await secureStorage.setItem(USER_KEY, JSON.stringify(session.user));
      }
    } catch (error) {
      console.error('Error storing session:', error);
      throw error;
    }
  },

  // Retrieve session securely
  async getSession(): Promise<any> {
    try {
      const sessionData = await secureStorage.getItem(SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error retrieving session:', error);
      return null;
    }
  },

  // Clear all stored tokens
  async clearSession(): Promise<void> {
    try {
      await secureStorage.removeItem(SESSION_KEY);
      await secureStorage.removeItem(REFRESH_TOKEN_KEY);
      await secureStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  },

  // Check if session is valid
  async isSessionValid(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) return false;
      
      // Check if token is expired
      const expiresAt = session.expires_at;
      if (expiresAt && Date.now() >= expiresAt * 1000) {
        await this.clearSession();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking session validity:', error);
      return false;
    }
  },

  // Refresh token if needed
  async refreshTokenIfNeeded(): Promise<boolean> {
    try {
      const session = await this.getSession();
      if (!session) return false;
      
      // Check if token expires within 5 minutes
      const expiresAt = session.expires_at;
      const fiveMinutesFromNow = Date.now() + (5 * 60 * 1000);
      
      if (expiresAt && expiresAt * 1000 <= fiveMinutesFromNow) {
        const refreshToken = await secureStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('Error refreshing token:', error);
            await this.clearSession();
            return false;
          }
          
          if (data.session) {
            await this.storeSession(data.session);
            return true;
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }
};

// Secure API wrapper with automatic token refresh
export const secureApi = {
  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    // Ensure token is fresh before making request
    await tokenManager.refreshTokenIfNeeded();
    
    // Get current session
    const session = await tokenManager.getSession();
    
    // Add authorization header if session exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    // Add security headers
    headers['X-Request-ID'] = generateRequestId();
    headers['X-Timestamp'] = Date.now().toString();
    
    const response = await fetch(`${supabaseUrl}${endpoint}`, {
      ...options,
      headers,
    });
    
    // Handle authentication errors
    if (response.status === 401) {
      await tokenManager.clearSession();
      throw new Error('Authentication required');
    }
    
    return response;
  }
};

// Generate unique request ID for tracking
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Security monitoring
export const securityMonitor = {
  logApiCall: (endpoint: string, method: string, success: boolean, error?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      success,
      error: error?.message,
      userId: 'current-user-id', // Replace with actual user ID
    };
    
    console.log('API Call Log:', logEntry);
    
    // In production, send to security monitoring service
    // securityService.log(logEntry);
  },

  logSecurityEvent: (event: string, details: any) => {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userId: 'current-user-id', // Replace with actual user ID
      deviceInfo: {
        platform: Platform.OS,
        version: '1.0.0',
      },
    };
    
    console.log('Security Event:', securityLog);
    
    // In production, send to security monitoring service
    // securityService.logSecurityEvent(securityLog);
  }
}; 