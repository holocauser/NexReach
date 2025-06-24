import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import * as Crypto from 'expo-crypto';

// Rate limiting for API calls
export const rateLimiter = {
  requests: new Map<string, number[]>(),
  
  canMakeRequest: (userId: string, maxRequests: number = 10, timeWindow: number = 60000): boolean => {
    const now = Date.now();
    const userRequests = rateLimiter.requests.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < timeWindow);
    
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    rateLimiter.requests.set(userId, recentRequests);
    return true;
  },
  
  clearUserRequests: (userId: string) => {
    rateLimiter.requests.delete(userId);
  }
};

// Enhanced input validation with comprehensive checks
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// XSS Prevention - Comprehensive input sanitization
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove JavaScript event handlers
    .replace(/\bon\w+\s*=/gi, '')
    // Remove JavaScript protocol
    .replace(/javascript:/gi, '')
    // Remove data URLs
    .replace(/data:/gi, '')
    // Remove vbscript
    .replace(/vbscript:/gi, '')
    // Remove onload, onerror, etc.
    .replace(/\bon\w+\s*\(/gi, '')
    // Remove quotes that could break out of attributes
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove backticks
    .replace(/`/g, '&#x60;')
    // Remove angle brackets
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Limit length to prevent buffer overflow attacks
    .substring(0, 1000);
};

// SQL Injection Prevention
export const sanitizeForSQL = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove SQL keywords that could be used in injection
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|WHERE|FROM|JOIN|AND|OR|NOT)\b/gi, '')
    // Remove semicolons
    .replace(/;/g, '')
    // Remove comments
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    // Remove quotes
    .replace(/['"]/g, '')
    // Limit length
    .substring(0, 500);
};

// NoSQL Injection Prevention
export const sanitizeForNoSQL = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    // Remove MongoDB operators
    .replace(/\$[a-zA-Z]+/g, '')
    // Remove JavaScript code
    .replace(/javascript:/gi, '')
    // Remove function calls
    .replace(/\(\)/g, '')
    // Remove quotes
    .replace(/['"]/g, '')
    // Limit length
    .substring(0, 500);
};

// Comprehensive data validation
export const validateBusinessCardData = (data: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validate name
  if (data.name) {
    const sanitizedName = sanitizeInput(data.name);
    if (sanitizedName.length < 2) {
      errors.push('Name must be at least 2 characters long');
    } else if (sanitizedName.length > 100) {
      errors.push('Name must be less than 100 characters');
    }
  }
  
  // Validate email
  if (data.email && !validateEmail(data.email)) {
    errors.push('Please enter a valid email address');
  }
  
  // Validate phone
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Please enter a valid phone number');
  }
  
  // Validate company
  if (data.company) {
    const sanitizedCompany = sanitizeInput(data.company);
    if (sanitizedCompany.length > 200) {
      errors.push('Company name must be less than 200 characters');
    }
  }
  
  // Validate title
  if (data.title) {
    const sanitizedTitle = sanitizeInput(data.title);
    if (sanitizedTitle.length > 100) {
      errors.push('Title must be less than 100 characters');
    }
  }
  
  // Validate website
  if (data.website) {
    const websiteRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    if (!websiteRegex.test(data.website)) {
      errors.push('Please enter a valid website URL');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Data encryption utilities with enhanced security
export const saveEncryptedData = async (key: string, value: string): Promise<void> => {
  try {
    // Hash the key for additional security
    const hashedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key
    );
    
    await SecureStore.setItemAsync(hashedKey, value);
  } catch (error) {
    console.error('Error saving encrypted data:', error);
    throw new Error('Failed to save data securely');
  }
};

export const getEncryptedData = async (key: string): Promise<string | null> => {
  try {
    const hashedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key
    );
    
    return await SecureStore.getItemAsync(hashedKey);
  } catch (error) {
    console.error('Error retrieving encrypted data:', error);
    return null;
  }
};

export const deleteEncryptedData = async (key: string): Promise<void> => {
  try {
    const hashedKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      key
    );
    
    await SecureStore.deleteItemAsync(hashedKey);
  } catch (error) {
    console.error('Error deleting encrypted data:', error);
  }
};

// Multi-Factor Authentication (MFA) utilities
export const mfaUtils = {
  // Generate TOTP secret
  generateTOTPSecret: async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(20);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Verify TOTP code (simplified - in production, use a proper TOTP library)
  verifyTOTPCode: async (secret: string, code: string): Promise<boolean> => {
    // This is a simplified implementation
    // In production, use a proper TOTP library like 'otplib'
    const expectedCode = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      secret + Math.floor(Date.now() / 30000).toString()
    );
    
    return code === expectedCode.substring(0, 6);
  },

  // Store MFA secret securely
  storeMFASecret: async (userId: string, secret: string): Promise<void> => {
    await saveEncryptedData(`mfa_secret_${userId}`, secret);
  },

  // Get MFA secret
  getMFASecret: async (userId: string): Promise<string | null> => {
    return await getEncryptedData(`mfa_secret_${userId}`);
  }
};

// Session management with enhanced security
export const sessionManager = {
  // Store session with expiration
  storeSession: async (userId: string, sessionData: any, expiresIn: number = 3600): Promise<void> => {
    const session = {
      ...sessionData,
      expiresAt: Date.now() + (expiresIn * 1000),
      createdAt: Date.now(),
    };
    
    await saveEncryptedData(`session_${userId}`, JSON.stringify(session));
  },

  // Get valid session
  getSession: async (userId: string): Promise<any | null> => {
    try {
      const sessionData = await getEncryptedData(`session_${userId}`);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session?.expiresAt && Date.now() > session.expiresAt) {
        await sessionManager.clearSession(userId);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Clear session
  clearSession: async (userId: string): Promise<void> => {
    await deleteEncryptedData(`session_${userId}`);
  },

  // Refresh session
  refreshSession: async (userId: string, expiresIn: number = 3600): Promise<boolean> => {
    const session = await sessionManager.getSession(userId);
    if (!session) return false;
    
    await sessionManager.storeSession(userId, session, expiresIn);
    return true;
  }
};

// Comprehensive error handling with security logging
export const handleError = (error: any, context: string, showAlert: boolean = true): void => {
  console.error(`Error in ${context}:`, error);
  
  // Log error details for debugging and security monitoring
  const errorDetails = {
    context,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    userId: 'current-user-id', // Replace with actual user ID
    errorType: error?.constructor?.name || 'Unknown',
    severity: 'medium',
  };
  
  console.log('Error details:', errorDetails);
  
  // Log security event for suspicious errors
  if (error?.message?.includes('injection') || 
      error?.message?.includes('XSS') || 
      error?.message?.includes('unauthorized')) {
    logSecurityEvent('suspicious_error', errorDetails);
  }
  
  // Show user-friendly error message
  if (showAlert) {
    let userMessage = 'Something went wrong. Please try again.';
    
    if (error?.message?.includes('network')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error?.message?.includes('camera')) {
      userMessage = 'Camera access denied. Please enable camera permissions in settings.';
    } else if (error?.message?.includes('contacts')) {
      userMessage = 'Contact access denied. Please enable contact permissions in settings.';
    } else if (error?.message?.includes('location')) {
      userMessage = 'Location access denied. Please enable location permissions in settings.';
    } else if (error?.message?.includes('authentication')) {
      userMessage = 'Authentication failed. Please log in again.';
    } else if (error?.message?.includes('validation')) {
      userMessage = 'Invalid data provided. Please check your input and try again.';
    }
    
    Alert.alert('Error', userMessage);
  }
};

// Permission checking utilities
export const checkPermission = async (permissionType: 'camera' | 'contacts' | 'location' | 'microphone'): Promise<boolean> => {
  // This would integrate with actual permission checking libraries
  // For now, return true as a placeholder
  return true;
};

// Data retention utilities with enhanced security
export const shouldRetainData = (dataType: string, createdAt: Date): boolean => {
  const now = new Date();
  const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  
  // Business card data: retain for 2 years
  if (dataType === 'business_card') {
    return daysSinceCreation <= 730;
  }
  
  // User profile: retain indefinitely (until user deletes)
  if (dataType === 'user_profile') {
    return true;
  }
  
  // Session data: retain for 30 days
  if (dataType === 'session') {
    return daysSinceCreation <= 30;
  }
  
  // Event data: retain for 5 years
  if (dataType === 'event') {
    return daysSinceCreation <= 1825;
  }
  
  // Default: retain for 1 year
  return daysSinceCreation <= 365;
};

// Enhanced security audit logging
export const logSecurityEvent = (event: string, details: any): void => {
  const securityLog = {
    event,
    details,
    timestamp: new Date().toISOString(),
    userId: 'current-user-id', // Replace with actual user ID
    deviceInfo: {
      platform: 'react-native',
      version: '1.0.0',
    },
    severity: details.severity || 'low',
    ipAddress: 'unknown', // Would be set in production
    userAgent: 'ScanCard Mobile App',
  };
  
  console.log('Security event:', securityLog);
  
  // In production, send this to a security monitoring service
  // analytics.track('security_event', securityLog);
  
  // Store locally for audit trail
  storeSecurityLog(securityLog);
};

// Store security logs locally
const storeSecurityLog = async (log: any): Promise<void> => {
  try {
    const logs = await getEncryptedData('security_logs') || '[]';
    const parsedLogs = JSON.parse(logs);
    parsedLogs.push(log);
    
    // Keep only last 1000 logs
    if (parsedLogs.length > 1000) {
      parsedLogs.splice(0, parsedLogs.length - 1000);
    }
    
    await saveEncryptedData('security_logs', JSON.stringify(parsedLogs));
  } catch (error) {
    console.error('Error storing security log:', error);
  }
};

// Token rotation utilities
export const tokenRotation = {
  // Check if token needs rotation
  shouldRotateToken: (tokenCreatedAt: number, maxAge: number = 24 * 60 * 60 * 1000): boolean => {
    return Date.now() - tokenCreatedAt > maxAge;
  },

  // Rotate access token
  rotateAccessToken: async (userId: string): Promise<string | null> => {
    try {
      // Generate new token
      const newToken = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        userId + Date.now() + Math.random().toString()
      );
      
      // Store new token
      await saveEncryptedData(`access_token_${userId}`, newToken);
      
      return newToken;
    } catch (error) {
      console.error('Error rotating access token:', error);
      return null;
    }
  },

  // Validate token
  validateToken: async (userId: string, token: string): Promise<boolean> => {
    try {
      const storedToken = await getEncryptedData(`access_token_${userId}`);
      return storedToken === token;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }
};

// Content Security Policy utilities
export const cspUtils = {
  // Validate image source
  isValidImageSource: (src: string): boolean => {
    const allowedDomains = [
      'https://fcimhehnuxycljnewqdw.supabase.co',
      'https://lh3.googleusercontent.com',
      'https://graph.facebook.com',
    ];
    
    try {
      const url = new URL(src);
      return allowedDomains.some(domain => url.origin === domain);
    } catch {
      return false;
    }
  },

  // Sanitize HTML content
  sanitizeHTML: (html: string): string => {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');
  }
}; 