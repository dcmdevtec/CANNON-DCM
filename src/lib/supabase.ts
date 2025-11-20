import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // keep a runtime-friendly check for local development clarity
  console.warn('Supabase env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not set');
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signInWithEmail(email: string, password?: string) {
  if (password) {
    return await supabase.auth.signInWithPassword({ email, password });
  }
  // magic link
  return await supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
  return await supabase.auth.signOut();
}

export default supabase;
