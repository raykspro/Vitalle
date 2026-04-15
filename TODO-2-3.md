# TODO: Tarefas 2/3 - Cents-Only + Limpeza

✅ 0. Criar TODO-2-3.md
✅ 1. Limpeza entities/Product.json [COMPLETO]

⬜ 2. Limpeza Products.jsx
- Remover old price refs

⬜ 2. Limpeza Products.jsx
- Remover old price: parseFloat, old fields in insert/state
- Form/UI unchanged

⬜ 3. Limpeza Stock.jsx
- p?.sell_price → formatPriceDisplay(p.sell_price_cents)

⬜ 4. Finance.jsx
- Import utils
- records.reduce(acc + amount → addCents(parsePriceToCents(record.amount), 0n)
- Displays toFixed → formatPriceDisplay

⬜ 5. PurchaseOrder.jsx
- items.cost_price: string → cents
- calculateTotal(): reduce Number(qty)*Number(cost) → addCents(qtyC * costCents)
- Import utils

⬜ 6. App.jsx verify/clean
- Check imports/routes duplicates

⬜ 7. Test: npm run dev, test all pages totals precise

