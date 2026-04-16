import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../../lib/AuthContext.jsx'; // Not used here, for hooks

// Customers CRUD
export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao listar clientes:', error);
    return { data: [], error: 'Erro ao carregar clientes' };
  }
}

export async function addCustomer(customer) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao adicionar cliente:', error);
    return { data: null, error: 'Erro ao adicionar cliente' };
  }
}

export async function updateCustomer(id, updates) {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return { data: null, error: 'Erro ao atualizar cliente' };
  }
}

// Suppliers CRUD
export async function getSuppliers() {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    return { data: [], error: 'Erro ao carregar fornecedores' };
  }
}

export async function addSupplier(supplier) {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([supplier])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao adicionar fornecedor:', error);
    return { data: null, error: 'Erro ao adicionar fornecedor' };
  }
}

export async function updateSupplier(id, updates) {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return { data: null, error: 'Erro ao atualizar fornecedor' };
  }
}

// Expenses CRUD (contas a pagar/pagas)
export async function getExpenses() {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao listar despesas:', error);
    return { data: [], error: 'Erro ao carregar despesas' };
  }
}

export async function addExpense(expense) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao adicionar despesa:', error);
    return { data: null, error: 'Erro ao adicionar despesa' };
  }
}

export async function updateExpense(id, updates) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Erro ao atualizar despesa:', error);
    return { data: null, error: 'Erro ao atualizar despesa' };
  }
}

// Robust createSale with sale_items
export async function createSale(saleData, seller_id) {
  try {
    // Sale data without items
    const salePayload = {
      ...saleData,
      seller_id,
      sale_date: new Date().toISOString(),
      status: 'Concluída'
    };
    delete salePayload.items; // items separate

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([salePayload])
      .select()
      .single();
    if (saleError) throw saleError;

    // Insert sale_items
    const itemsPayload = saleData.items.map(item => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total
    }));

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsPayload)
      .select();
    if (itemsError) {
      // Cleanup sale if items fail
      await supabase.from('sales').delete().eq('id', sale.id);
      throw itemsError;
    }

    return { data: { sale, items }, error: null };
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    const errorMsg = error.message.toLowerCase().includes('stock') || 
                     error.message.toLowerCase().includes('estoque') || 
                     error.message.toLowerCase().includes('insufficient') ||
                     error.code === 'P0001' 
      ? 'Estoque insuficiente para um ou mais itens. Verifique a disponibilidade.' 
      : 'Erro ao criar venda';
    return { data: null, error: errorMsg };
  }
}

