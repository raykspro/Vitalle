-- Fix for Clientes form save error: Add missing columns to 'customers' table
-- Run this in Supabase SQL Editor (safe IF NOT EXISTS)

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS observations text;

-- Optional: If form uses 'notes' but DB expects 'observations', add migration:
-- ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes text;
-- Then update code or migrate data: UPDATE customers SET observations = notes WHERE notes IS NOT NULL;

-- Verify:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'customers';
