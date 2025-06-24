import { createClient } from '@supabase/supabase-js';

// Replace with your actual values
const supabaseUrl = 'https://fcimhehnuxycljnewqdw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjaW1oZWhudXh5Y2xqbmV3cWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMzcwOTQsImV4cCI6MjA2NTcxMzA5NH0.ACuc_NUS3oUP8gVV-6mcsGQcUPxnuU5RZLj1SGkB5cQ';

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