import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Dashboard = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role || 'vendedor';

console.log('DEBUG: Dashboard montado - USUÁRIO:', user?.id);

return (
    <div>
      <h1>Bem-vindo ao Dashboard</h1>
      {userRole === 'admin' && <p>Acesso ao Financeiro liberado.</p>}
      {userRole !== 'admin' && <p>Você não tem acesso ao Financeiro.</p>}
    </div>
  );
};

export default Dashboard;
