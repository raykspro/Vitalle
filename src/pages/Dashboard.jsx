import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Dashboard = () => {
  const { user } = useUser();

  console.log('RENDERIZANDO DASHBOARD');

  return (
    <h1>Dashboard da Vitalle - Logado como {user.username}</h1>
  );
};

export default Dashboard;