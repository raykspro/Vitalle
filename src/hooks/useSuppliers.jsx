import { useState, useEffect } from 'react';
import * as api from '../api/supabase.js';

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      const { data, error } = await api.getSuppliers();
      if (error) {
        setError(error);
      } else {
        setSuppliers(data || []);
      }
      setLoading(false);
    };
    loadSuppliers();
  }, []);

  const addSupplier = async (supplier) => {
    const res = await api.addSupplier(supplier);
    if (!res.error && res.data) {
      setSuppliers(prev => [...prev, res.data]);
    }
    return res;
  };

  const updateSupplier = async (id, updates) => {
    const res = await api.updateSupplier(id, updates);
    if (!res.error && res.data) {
      setSuppliers(prev => prev.map(s => s.id === id ? res.data : s));
    }
    return res;
  };

  return {
    suppliers,
    loading,
    error,
    addSupplier,
    updateSupplier
  };
};

