# TODO-2-3

## Products.jsx refactor (enriquecimento)
- [ ] Levantar critérios de “pendência” (sem foto, sem preço de venda, sem categoria)
- [ ] Implementar query unindo `products` + `stock_items` (agregação para mostrar presença/variações)
- [x] Implementar UI de lista com badges de pendência
- [x] Implementar formulário de enriquecimento:

  - [x] upload para `products/image_url`

  - [ ] input custo (cost_price)
  - [ ] input margem desejada (%) => calcula sell_price
  - [x] select categoria
  - [x] textarea descrição


- [ ] Persistência:
  - [ ] `.update()` em `products` por `id`
- [ ] Remover campos de criação (model/sku/nome) do formulário
- [ ] Garantir design “Luxury Light” (sem `dark:`)


## Stock.jsx
- [x] Reverter design dark -> Luxury Light

