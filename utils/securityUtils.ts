import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

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

// Input validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateBusinessCardData = (data: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.push('Please enter a valid email address');
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push('Please enter a valid phone number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Data encryption utilities
export const saveEncryptedData = async (key: string, value: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error('Error saving encrypted data:', error);
    throw new Error('Failed to save data securely');
  }
};

export const getEncryptedData = async (key: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('Error retrieving encrypted data:', error);
    return null;
  }
};

export const deleteEncryptedData = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error('Error deleting encrypted data:', error);
  }
};

// Comprehensive error handling
export const handleError = (error: any, context: string, showAlert: boolean = true): void => {
  console.error(`Error in ${context}:`, error);
  
  // Log error details for debugging
  const errorDetails = {
    context,
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    userId: 'current-user-id' // Replace with actual user ID
  };
  
  console.log('Error details:', errorDetails);
  
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
    }
    
    Alert.alert('Error', userMessage);
  }
};

// Permission checking utilities
export const checkPermission = async (permissionType: 'camera' | 'contacts' | 'location'): Promise<boolean> => {
  // This would integrate with actual permission checking libraries
  // For now, return true as a placeholder
  return true;
};

// Data retention utilities
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
  
  // Default: retain for 1 year
  return daysSinceCreation <= 365;
};

// Security audit logging
export const logSecurityEvent = (event: string, details: any): void => {
  const securityLog = {
    event,
    details,
    timestamp: new Date().toISOString(),
    userId: 'current-user-id', // Replace with actual user ID
    deviceInfo: {
      platform: 'react-native',
      version: '1.0.0'
    }
  };
  
  console.log('Security event:', securityLog);
  
  // In production, send this to a security monitoring service
  // analytics.track('security_event', securityLog);
}; 