import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Dashboard = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';

console.log('Dashboard Renderizado');
console.log('Dados do Usuário:', user);

try {
  return (
    <div>
      <h1>Carregando Dashboard...</h1>
    </div>
  );
  } catch (error) {
    console.error('Erro no Dashboard:', error);
    return <div>Erro ao carregar o Dashboard.</div>;
  }
};

export default Dashboard;
