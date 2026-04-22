# Vitalle Layout & Supabase Fixes TODO

## Status: In Progress

### 1. [x] Edit src/components/Layout.jsx
   - Remove direct CLIENTES item ✓
   - Add Contatos dropdown before ORDENS DE COMPRA ✓
   - Fix Finance dropdown CSS classes ✓

### 2. [x] Edit src/lib/supabase.ts
   - Refactor to use VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY with fallbacks ✓
   - Add console.error check for missing env vars ✓

### 3. [ ] Test locally
   - Run `npm run dev`
   - Verify Contatos menu: Clientes→/customers, Fornecedores→/suppliers
   - Check Finance dropdown: solid bg, no overlap, proper spacing
   - Console: No Supabase warnings

### 4. [ ] Deploy & Verify Vercel
   - Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY to Vercel env vars
   - Deploy, test Supabase queries (e.g., customers page)

**Next command:** `npm run dev`

