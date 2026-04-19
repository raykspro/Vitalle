# TODO - Limpeza Vitalle (Plano Aprovado)

## Status: ✅ Iniciando implementação

**Passos do Plano (breakdown lógico):**

1. **[PENDENTE]** Criar TODO.md (concluído)
2. ✅ Editar src/pages/Vendas.jsx: commission_cents corrigido, z-index dropdowns, rounded-[2.5rem] botões principais, margin totals, magenta #D946EF

   - Renomear commission_value_cents → commission_cents (payload, reduce, stats)
   - Adicionar z-[99] mt-4 aos SelectTrigger de produtos/tamanhos
   - rounded-[2.5rem] em todos Input/Button
   - bg-[#D946EF] em botões principais
   - Mobile: TableRow → Card/grid-cols-1 sm:grid-cols-N
   - ?. em commission_cents acessos
   
3. **[PENDENTE]** Editar src/pages/Clientes.jsx:
   - Corrigir sintaxe ts(8002/1005): balancear { } ( ) em upload logic/try-catch
   - Garantir export default Clientes;
   - Aplicar rounded-[2.5rem], magenta botões
   - Mobile cards para tabelas

4. **[PENDENTE]** Teste: npm run dev, verificar console/DB, mobile viewport, dropdowns
5. **[PENDENTE]** Atualizar TODO progresso, attempt_completion

Próximo: Editar Vendas.jsx (tem conteúdo completo)

