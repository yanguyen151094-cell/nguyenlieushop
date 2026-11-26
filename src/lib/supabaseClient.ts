import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: false,
  },
});

const basePath = (__BASE_PATH__ || '').replace(/\/+$/, '');

export const AUTH_CALLBACK_URL = `${window.location.origin}${basePath}/auth/callback`;

export default supabase;