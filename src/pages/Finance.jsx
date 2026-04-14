import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Finance = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';

  if (userRole !== 'admin') {
    return <div>Acesso negado</div>;
  }

  return <div>Bem-vindo ao Financeiro</div>;
};

export default Finance;