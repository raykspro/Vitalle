import { createClient } from '@supabase/supabase-js';

// URL direta para evitar erros de DNS
const supabaseUrl = 'https://khoaydnauwslawczydl.supabase.co';

// Mestre, cole sua chave ANON_KEY dentro das aspas abaixo:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob2F5ZG5hdXV3c2xhd2N6eWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTY1MjYsImV4cCI6MjA5MTI3MjUyNn0.3TaKhAVRRCF3GX0sKioHyMgYW6MbcyfqmCDVQ53Fv5c'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;