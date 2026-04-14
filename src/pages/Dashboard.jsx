import React from 'react';
import { useUser } from '@clerk/clerk-react';

const Dashboard = () => {
  const { user } = useUser();
  const username = user?.username || 'Mestre';

  console.log('USUARIO LOGADO:', username);

  return (
    <h1>Bem-vindo à Vitalle, {username}</h1>
  );
};

export default Dashboard;