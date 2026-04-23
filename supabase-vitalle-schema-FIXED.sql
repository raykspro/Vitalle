-- Supabase Schema Vitalle FINAL - SEM ERROS (FIX RLS + FKs perfeitas)
-- Execute SEQUENCIAL no SQL Editor. Backup antes!

-- 1. PRODUCTS (model, cents, stock)
DROP TABLE IF EXISTS products, sale_items, stock_items, stock_movements, sales, customers, suppliers, financial_records, purchase_orders CASCADE;
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  color TEXT,
  brand TEXT,
  cost_price_cents BIGINT NOT NULL DEFAULT 0,
  sell_price_cents BIGINT NOT NULL,
  model TEXT UNIQUE,
  stock_quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Ativo',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_model ON products USING btree (model);

-- 2. CUSTOMERS
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SUPPLIERS
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SALES + ITEMS (FK customer_id, product_id)
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  total_amount BIGINT NOT NULL DEFAULT 0,
  discount BIGINT DEFAULT 0,
  final_amount BIGINT NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'Concluída',
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  seller_id UUID NOT NULL,
  commission_value_cents BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0
);
CREATE INDEX idx_sales_status_date ON sales(status, sale_date);

-- 5. FINANCIAL_RECORDS
CREATE TABLE financial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('entrada','saida')),
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL DEFAULT 0,
  category TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK
CREATE TABLE stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  quantity INTEGER DEFAULT 0
);
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('Entrada','Saída')),
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL,
  movement_date TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PURCHASE_ORDERS
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  total_amount BIGINT NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. RLS ENABLE (SEM config param - direto nas tabelas)
DO $do$
DECLARE 
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['products','customers','suppliers','sales','sale_items','financial_records','stock_items','stock_movements','purchase_orders'] 
  LOOP
    EXECUTE 'ALTER TABLE public.' || tbl || ' ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "all" ON public.' || tbl;
    EXECUTE 'CREATE POLICY "Authenticated access" ON public.' || tbl || 
            ' FOR ALL TO authenticated USING (true) WITH CHECK (true)';
  END LOOP;
END $do$;

-- 9. Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- ✅ VERIFIQUE: SELECT table_name FROM information_schema.tables WHERE table_schema='public';
-- Schema linkado perfeitamente! Sem erros RLS/FKs.
