import React, { useState } from 'react';

const FinanceFilter = ({ onFilterChange }) => {
  const [filter, setFilter] = useState('');

  const handleFilterChange = (event) => {
    const selectedFilter = event.target.value;
    setFilter(selectedFilter);
    onFilterChange(selectedFilter);
  };

  return (
    <div className="finance-filter">
      <label htmlFor="filter">Filtrar por:</label>
      <select id="filter" value={filter} onChange={handleFilterChange}>
        <option value="">Todos</option>
        <option value="Fornecedor">Fornecedor</option>
        <option value="Colaborador">Colaborador</option>
      </select>
    </div>
  );
};

export default FinanceFilter;