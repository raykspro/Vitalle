import { createClient } from '@supabase/supabase-js';

// URL e ANON_KEY via variáveis de ambiente (Vite)
// Importante: mantenha a construção determinística e logue falhas para diagnosticar build/worker.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Variáveis ausentes: VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY', {
    VITE_SUPABASE_URL: !!supabaseUrl,
    VITE_SUPABASE_ANON_KEY: !!supabaseAnonKey,
  });
}

// Fallback (apenas para não quebrar o app em dev; em produção o ideal é NÃO depender de fallback)
const supabaseUrlFallback = 'https://khoaydnauwslawczydl.supabase.co';
const supabaseAnonKeyFallback = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2F5ZG5hdXV3c2xhd2N6eWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTY1MjYsImV4cCI6MjA5MTI3MjUyNn0.3TaKhAVRRCF3GX0sKioHyMgYW6MbcyfqmCDVQ53Fv5c';

export const supabase = createClient(
  supabaseUrl || supabaseUrlFallback,
  supabaseAnonKey || supabaseAnonKeyFallback
);


export default supabase;
