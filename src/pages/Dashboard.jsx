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
      <h1>Bem-vindo ao Dashboard</h1>
      {userRole === 'admin' && <p>Acesso ao Financeiro liberado.</p>}
      {userRole !== 'admin' && <p>Você não tem acesso ao Financeiro.</p>}
    </div>
    );
  } catch (error) {
    console.error('Erro no Dashboard:', error);
    return <div>Erro ao carregar o Dashboard.</div>;
  }
};

export default Dashboard;
