# TODO: Padronização Decimal Financeira

## ✅ 1. Criar TODO.md [COMPLETO]
## ✅ 2. src/lib/formatters.js [COMPLETO]
## ✅ 3. src/pages/Products.jsx [COMPLETO]

## ✅ 4. entities/Product.json [COMPLETO]

## ⬜ 5. Teste
- npm run dev
- Testar form: cost=10.01 → 1001 cents etc.

## ⬜ 3. src/pages/Products.jsx
- Refatorar useEffect para cents
- Atualizar handleSave (salvar *_cents)
- Manter UI inputs como string/number step=0.01

## ⬜ 4. entities/Product.json
- Adicionar cost_price_cents, sell_price_cents, net_profit_cents: integer

## ⬜ 5. Teste
- npm run dev
- Testar form: cost=10.01 → 1001 cents etc.

## ⬜ 6. Secondary files (PurchaseOrder etc.)

## ⬜ 7. Supabase migration
- ALTER TABLE products ADD COLUMN cost_price_cents bigint;

