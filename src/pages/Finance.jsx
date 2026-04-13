import React, { useState, useEffect } from 'react';
import { obterTotalContasAPagar } from '../api/finance';
import FinanceFilter from '../components/FinanceFilter';

const Finance = () => {
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    async function fetchTotal() {
      const total = await obterTotalContasAPagar(filter);
      setTotal(total);
    }
    fetchTotal();
  }, [filter]);

  const handleFilterChange = (selectedFilter) => {
    setFilter(selectedFilter);
  };

  return (
    <div className="finance-page">
      <h1>Finanças</h1>
      <FinanceFilter onFilterChange={handleFilterChange} />
      <h2>Total Contas a Pagar: R$ {total.toFixed(2)}</h2>
    </div>
  );
};

export default Finance;