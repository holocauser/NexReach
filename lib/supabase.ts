import { createClient } from '@supabase/supabase-js';

// Replace with your actual values
const supabaseUrl = 'https://YOUR_PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR_PUBLIC_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Provider = {
  id: string;
  name: string;
  // Add other fields as needed, e.g.:
  // specialty: string;
  // city: string;
  // state: string;
  // tags: string[];
  // latitude?: number;
  // longitude?: number;
};

export async function fetchProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*');

  if (error) {
    console.error('❌ Supabase fetch error:', error);
    return [];
  }

  return data as Provider[];
} 