# Vitalle Fixes TODO

## Current Task: Fix Products Visibility, Masks, Upload, Modals

✅ **Step 1**: Add products CRUD functions to `src/api/supabase.js` (getProducts, addProduct, updateProduct).

✅ **Step 2**: Create `src/hooks/useProducts.jsx` mirroring `useCustomers.jsx`.

✅ **Step 3**: Update `src/pages/Products.jsx`:
   - Import and use `useProducts` hook.
   - Add products list table below form (columns: name, category, sell price (formatPriceDisplay), actions).
   - Add edit handling like Clientes.
   - Replace image_url text with file input + upload to storage 'products', set publicUrl.
   - Use formatPriceDisplay(product.sell_price_cents) for safe BigInt display.

✅ **Step 4**: Update `src/pages/Clientes.jsx`:
   - Add phone input field with mask ((00) 0 0000-0000).
   - Apply CPF mask (000.000.000-00) to cpf onChange.
   - Change DialogContent className to include `bg-zinc-950`.

✅ **Step 5**: Update `src/pages/Fornecedores.jsx`:
   - Apply phone mask ((00) 0 0000-0000).
   - Change DialogContent className to `bg-zinc-950`.

✅ **Step 6**: Test:
   - Add product, check list appears without crash.
   - Test masks on inputs.
   - Upload image, check storage/DB.
   - Verify modals solid dark bg.

**Next:** Mark steps as done, update as progress.

