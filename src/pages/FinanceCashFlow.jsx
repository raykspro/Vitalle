import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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
      console.error('Erro:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Fluxo de Caixa</h1>
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#dcfce7', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <small>Entradas</small>
          <p>R$ {stats.income.toLocaleString()}</p>
        </div>
        <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <small>Saídas</small>
          <p>R$ {stats.expense.toLocaleString()}</p>
        </div>
        <div style={{ background: '#dbeafe', padding: '15px', borderRadius: '8px', flex: 1 }}>
          <small>Saldo</small>
          <p>R$ {stats.balance.toLocaleString()}</p>
        </div>
      </div>
      <table style={{ width: '100%', textAlign: 'left', background: 'white' }}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Descrição</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t.id}>
              <td>{new Date(t.created_at).toLocaleDateString()}</td>
              <td>{t.description}</td>
              <td style={{ color: t.type === 'Entrada' ? 'green' : 'red' }}>
                R$ {t.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinanceCashFlow;