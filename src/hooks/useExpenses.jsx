import { useState, useEffect } from 'react';
import * as api from '../api/supabase.js';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExpenses = async () => {
      setLoading(true);
      const { data, error } = await api.getExpenses();
      if (error) {
        setError(error);
      } else {
        setExpenses(data || []);
      }
      setLoading(false);
    };
    loadExpenses();
  }, []);

  const addExpense = async (expense) => {
    const res = await api.addExpense(expense);
    if (!res.error && res.data) {
      setExpenses(prev => [...prev, res.data]);
    }
    return res;
  };

  const updateExpense = async (id, updates) => {
    const res = await api.updateExpense(id, updates);
    if (!res.error && res.data) {
      setExpenses(prev => prev.map(e => e.id === id ? res.data : e));
    }
    return res;
  };

  return {
    expenses,
    loading,
    error,
    addExpense,
    updateExpense
  };
};

