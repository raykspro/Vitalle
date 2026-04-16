import { useState, useEffect } from 'react';
import * as api from '../api/supabase.js';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      const { data, error } = await api.getCustomers();
      if (error) {
        setError(error);
      } else {
        setCustomers(data || []);
      }
      setLoading(false);
    };
    loadCustomers();
  }, []);

  const addCustomer = async (customer) => {
    const res = await api.addCustomer(customer);
    if (!res.error && res.data) {
      setCustomers(prev => [...prev, res.data]);
    }
    return res;
  };

  const updateCustomer = async (id, updates) => {
    const res = await api.updateCustomer(id, updates);
    if (!res.error && res.data) {
      setCustomers(prev => prev.map(c => c.id === id ? res.data : c));
    }
    return res;
  };

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer
  };
};

