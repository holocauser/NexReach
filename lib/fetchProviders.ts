import { supabase } from './supabase';

export type Provider = {
  id: string;
  name: string;
  specialty?: string;
  city?: string;
  // Add other fields as needed
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