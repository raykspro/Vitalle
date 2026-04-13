import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Função para registrar comissão automática
export async function registrarComissao(vendaId, valorVenda, vendedorId) {
  const comissao = valorVenda * 0.25;

  const { error } = await supabase
    .from('contas_a_pagar')
    .insert([
      {
        venda_id: vendaId,
        valor: comissao,
        tipo: 'Colaborador',
        colaborador_id: vendedorId,
      },
    ]);

  if (error) {
    console.error('Erro ao registrar comissão:', error);
    throw error;
  }
}

// Função para obter total de contas a pagar
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