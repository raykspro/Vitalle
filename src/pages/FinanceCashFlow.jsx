import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  FiArrowUpCircle, 
  FiArrowDownCircle, 
  FiDollarSign,
  FiPlus,
  FiFilter
} from 'react-icons/fi';

const FinanceCashFlow = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ income: 0, expense: 0, balance: 0 });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const income = data.filter(t => t.type === 'Entrada').reduce((acc, curr) => acc + curr.amount, 0);
      const expense = data.filter(t => t.type === 'Saída').reduce((acc, curr) => acc + curr.amount, 0);

      setStats({ income, expense, balance: income - expense });
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Fluxo de Caixa</h1>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <FiPlus /> Nova Transação
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span>Entradas</span>
            <FiArrowUpCircle className="text-green-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-800">R$ {stats.income.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span>Saídas</span>
            <FiArrowDownCircle className="text-red-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-800">R$ {stats.expense.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
          <div className="flex justify-between items-center text-gray-500 mb-2">
            <span>Saldo Total</span>
            <FiDollarSign className="text-blue-500" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-800">R$ {stats.balance.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-semibold text-gray-700">Histórico Recente</h3>
          <FiFilter className="text-gray-400 cursor-pointer" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-sm uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Descrição</th>
                <th className="px-6 py-4 font-medium">Categoria</th>
                <th className="px-6 py-4 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-10">Carregando transações...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-10 text-gray-500">Nenhuma transação encontrada.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors text-gray-700">
                    <td className="px-6 py-4">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">{t.description}</td>
                    <td className="px-6 py-4 text-sm">{t.category}</td>
                    <td className={`px-6 py-4 font-bold ${t.type === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceCashFlow;