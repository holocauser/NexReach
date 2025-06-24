import Constants from 'expo-constants';

export type AppEnv = 'development' | 'staging' | 'production';

/**
 * Returns the current app environment based on Expo release channel.
 */
export function getCurrentEnv(): AppEnv {
  // Use releaseChannel if available, otherwise default to development
  const channel = (Constants.manifest as any)?.releaseChannel || (Constants as any)?.expoConfig?.extra?.eas?.channel;
  if (!channel || channel === 'default') return 'development';
  if (channel === 'staging') return 'staging';
  if (channel === 'production') return 'production';
  return channel as AppEnv;
}

/**
 * Returns the value of an environment variable, or the fallback if not set.
 */
export function getEnvVar<T = string>(key: string, fallback?: T): T {
  const value = process.env[key];
  return (value !== undefined ? (value as unknown as T) : fallback) as T;
}

// Usage example:
// const supabaseUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
// const env = getCurrentEnv(); 