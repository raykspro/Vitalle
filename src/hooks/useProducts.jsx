import { useState, useEffect } from 'react';
import * as api from '../api/supabase.js';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const { data, error } = await api.getProducts();
      if (error) {
        setError(error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  const addProduct = async (product) => {
    const res = await api.addProduct(product);
    if (!res.error && res.data) {
      setProducts(prev => [...prev, res.data]);
    }
    return res;
  };

  const updateProduct = async (id, updates) => {
    const res = await api.updateProduct(id, updates);
    if (!res.error && res.data) {
      setProducts(prev => prev.map(p => p.id === id ? res.data : p));
    }
    return res;
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct
  };
};

