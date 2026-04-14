import React from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';

const Dashboard = () => {
  const { user } = useUser();
  const nome = user?.username || "Mestre";

  return (
    <div className="p-10 font-sans">
      <h1 className="text-3xl font-bold">Bem-vindo à Vitalle, {nome}!</h1>
      <p className="mt-4 text-gray-600">O sistema está oficialmente online.</p>
      
      <div className="mt-10">
        <SignOutButton>
          <button className="px-4 py-2 bg-black text-white rounded">Sair do Sistema</button>
        </SignOutButton>
      </div>
    </div>
  );
};

export default Dashboard;