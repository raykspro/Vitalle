import { createClient } from '@supabase/supabase-js';

// URL direta para evitar erros de DNS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://khoaydnauwslawczydl.supabase.co';

// Mestre, cole sua chave ANON_KEY dentro das aspas abaixo:
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2F5ZG5hdXV3c2xhd2N6eWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTY1MjYsImV4cCI6MjA5MTI3MjUyNn0.3TaKhAVRRCF3GX0sKioHyMgYW6MbcyfqmCDVQ53Fv5c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error("Mestre, as chaves do Supabase não foram detectadas! Verifique o .env ou as variáveis da Vercel.");
}

export default supabase;
