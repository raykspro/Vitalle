import { createClient } from '@supabase/supabase-js';
import { cline } from './clineClient.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Enhanced complete sale creation
export async function createCompleteSale(salePayload, sellerId) {
  // Assume frontend pre-calcs commission_value_cents and final_amount_cents
  const saleData = {
    ...salePayload,
    seller_id: sellerId,
    sale_date: new Date().toISOString(),
    status: 'Concluída'
  };

  // Create sale
  const { data: sale } = await cline.entities.Sale.create(saleData);

  // Aggregate and update stock
  const stockUpdates = {};
  for (const item of saleData.items) {
    const key = `${item.product_id}-${item.size}-${item.color}`;
    stockUpdates[key] = (stockUpdates[key] || 0) + item.quantity;
  }

  for (const [key, qty] of Object.entries(stockUpdates)) {
    const [pid, size, color] = key.split('-');
    const { data: stockItems } = await cline.entities.StockItem.list({
      customQuery: `product_id=eq.${pid}&size=eq.${size}&color=eq.${color}`
    });
    if (stockItems.length === 0) throw new Error(`Stock not found for ${item.product_name} ${size}/${color}`);
    const stockItem = stockItems[0];
    const newQty = stockItem.quantity - qty;
    if (newQty < 0) throw new Error(`Insufficient stock for ${item.product_name}`);
    await cline.entities.StockItem.update(stockItem.id, { quantity: newQty });
  }

  // Create receivable if not cash
  if (saleData.payment_method !== 'Dinheiro') {
    const amountCents = Math.round(saleData.final_amount * 100);
    const { error } = await supabase
      .from('finance_receivables')
      .insert([{
        customer_id: saleData.customer_id || null,
        customer_name: saleData.customer_name,
        amount_cents: amountCents,
        final_amount_cents: amountCents,
        due_date: saleData.sale_date,
        status: 'Pendente',
        source: 'sale',
        source_id: sale.id,
      }]);
    if (error) console.error('Receivable create error:', error);
  }

  return sale;
}

// Existing functions
export async function registrarComissao(vendaId, valorVenda, vendedorId) {
  // Updated to use commission_value_cents from sale, but called post-sale
  const { data: sale } = await cline.entities.Sale.get(vendaId);
  const comissaoCents = sale.commission_value_cents || Math.round(valorVenda * 0.25 * 100);

  const { error } = await supabase
    .from('finance_receivables') // Changed to receivables for seller commission
    .insert([{
      customer_id: vendedorId,
      customer_name: 'Comissão Vendedor',
      amount_cents: comissaoCents,
      final_amount_cents: comissaoCents,
      due_date: new Date().toISOString(),
      status: 'Pendente',
      source: 'commission',
      source_id: vendaId,
      type: 'Colaborador',
    }]);

  if (error) {
    console.error('Erro ao registrar comissão:', error);
    throw error;
  }
}

export async function obterTotalContasAPagar(filtroTipo = null) {
  let query = supabase.from('contas_a_pagar').select('valor');

  if (filtroTipo) {
    query = query.eq('tipo', filtroTipo);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao obter total de contas a pagar:', error);
    throw error;
  }

  return data.reduce((total, item) => total + item.valor, 0);
}
