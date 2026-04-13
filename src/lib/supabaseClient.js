import { createClient } from '@supabase/supabase-js';

console.log('Iniciando conexão Vitalle...');
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  headers: {
    Authorization: `Bearer ${user?.session?.idToken}`,
  },
});