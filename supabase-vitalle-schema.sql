-- Supabase Schema Completo para Vitalle
-- DROP e RECRIA todas as tabelas principais para limpar cache/cols erradas
-- Execute NO SQL Editor do Supabase (https://supabase.com/dashboard/project/_/sql)
-- ATENÇÃO: DROP deleta TODOS os dados! Backup se necessário.

-- Habilitar RLS global
ALTER DATABASE postgres SET row_level_security TO ON;

-- ========== 1. PRODUTOS ==========
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('Camisetas','Calças','Vestidos','Saias','Blusas','Jaquetas','Shorts','Acessórios','Outros')),
  color TEXT,
  brand TEXT,
  cost_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (cost_price_cents >= 0),
  sell_price_cents BIGINT NOT NULL CHECK (sell_price_cents >= 0),
  model TEXT UNIQUE,  -- SKU
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  image_url TEXT,
  status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo','Inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_model ON products(model);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category);

-- ========== 2. CLIENTES ==========
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  cpf TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 3. FORNECEDORES ==========
DROP TABLE IF EXISTS suppliers CASCADE;
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

-- ========== 4. VENDAS ==========
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT NOT NULL,
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
  discount BIGINT DEFAULT 0 CHECK (discount >= 0),
  final_amount BIGINT NOT NULL CHECK (final_amount >= 0),
  payment_method TEXT CHECK (payment_method IN ('Dinheiro','PIX','Cartão Crédito','Cartão Débito','Fiado','Boleto')),
  status TEXT DEFAULT 'Concluída' CHECK (status IN ('Concluída','Pendente','Cancelada')),
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  seller_id UUID NOT NULL,
  commission_value_cents BIGINT DEFAULT 0 CHECK (commission_value_cents >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL CHECK (unit_price >= 0),
  total BIGINT NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 5. FINANCEIRO ==========
DROP TABLE IF EXISTS financial_records CASCADE;
CREATE TABLE financial_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('entrada','saida')),
  description TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents != 0),
  category TEXT,
  payment_method TEXT,
  status TEXT DEFAULT 'Paga' CHECK (status IN ('Pendente','Paga','Vencida','Cancelada')),
  date TIMESTAMPTZ DEFAULT NOW(),
  related_id UUID,  -- ref sale/purchase
  related_type TEXT,  -- 'sale', 'purchase_order', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_financial_date ON financial_records(date);
CREATE INDEX idx_financial_type ON financial_records(type, status);

-- ========== 6. ESTOQUE ==========
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS stock_items CASCADE;
CREATE TABLE stock_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size, color)
);
CREATE INDEX idx_stock_product ON stock_items(product_id);
CREATE TABLE stock_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('Entrada','Saída')),
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  quantity INTEGER NOT NULL CHECK (quantity != 0),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  movement_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_stock_movement_date ON stock_movements(movement_date);
CREATE INDEX idx_stock_movement_type ON stock_movements(type);

-- ========== 7. ORDENS DE COMPRA/NF ==========
DROP TABLE IF EXISTS purchase_orders CASCADE;
CREATE TABLE purchase_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL,
  total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
  freight BIGINT DEFAULT 0 CHECK (freight >= 0),
  payment_method TEXT,
  issue_date TIMESTAMPTZ,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente','Paga','Vencida','Cancelada')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_purchase_date ON purchase_orders(issue_date);
CREATE INDEX idx_purchase_status ON purchase_orders(status);

-- ========== POLÍTICAS RLS (Row Level Security) ==========
-- Enable RLS em TODAS as tabelas
DO $$ 
DECLARE 
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN (
      'products','customers','suppliers','sales','sale_items','financial_records',
      'stock_items','stock_movements','purchase_orders'
    )
  LOOP
    EXECUTE 'ALTER TABLE public.' || table_name || ' ENABLE ROW LEVEL SECURITY;';
    
    -- Políticas básicas: authenticated pode SELECT/INSERT/UPDATE/DELETE
    EXECUTE 'CREATE POLICY "Authenticated users can manage all" ON public.' || table_name || 
            ' FOR ALL USING (auth.role() = ''authenticated'') WITH CHECK (auth.role() = ''authenticated'');';
  END LOOP;
END $$;

-- ========== TRIGGERS (Update updated_at) ==========
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger em tabelas com updated_at
DO $$
DECLARE
  table_rec RECORD;
BEGIN
  FOR table_rec IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' AND tablename IN ('products')
  LOOP
    EXECUTE 'CREATE TRIGGER update_' || table_rec.tablename || '_updated_at 
             BEFORE UPDATE ON public.' || table_rec.tablename || ' 
             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();';
  END LOOP;
END $$;

-- ========== VERIFICAÇÃO FINAL ==========
-- Rode para verificar:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';

-- ✅ Schema limpo! Cache resolvido. Seu código agora fala a mesma língua do DB.
