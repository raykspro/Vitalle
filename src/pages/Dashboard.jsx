import React from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { LayoutDashboard, Package, Wallet, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user } = useUser();
  // Usamos apenas o username para garantir que não dê erro de e-mail
  const nomeMestre = user?.username || "Mestre";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6">
          <h1 className="text-3xl font-extrabold text-black">Vitalle</h1>
          <p className="text-xs text-[#d946ef] font-bold uppercase tracking-widest">Management System</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <div className="flex items-center space-x-3 p-3 bg-magenta/10 text-[#d946ef] rounded-lg">
            <LayoutDashboard size={20} />
            <span className="font-bold">Dashboard</span>
          </div>
          <div className="flex items-center space-x-3 p-3 text-gray-500 hover:bg-gray-50 rounded-lg cursor-not-allowed">
            <Package size={20} />
            <span>Estoque</span>
          </div>
          <div className="flex items-center space-x-3 p-3 text-gray-500 hover:bg-gray-50 rounded-lg cursor-not-allowed">
            <Wallet size={20} />
            <span>Financeiro</span>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <SignOutButton>
            <button className="flex items-center space-x-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <LogOut size={20} />
              <span className="font-bold">Sair</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Olá, {nomeMestre}!</h2>
            <p className="text-gray-500">O que vamos organizar hoje na Vitalle?</p>
          </div>
          <div className="h-12 w-12 bg-[#d946ef] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            {nomeMestre.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-medium">Produtos em Estoque</p>
            <h3 className="text-3xl font-bold mt-2">--</h3>
            <div className="mt-4 text-[#d946ef] text-sm font-bold">Ver inventário →</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-400 text-sm font-medium">Vendas (Mês)</p>
            <h3 className="text-3xl font-bold mt-2">R$ 0,00</h3>
            <div className="mt-4 text-[#d946ef] text-sm font-bold">Ver relatórios →</div>
          </div>

          <div className="bg-[#d946ef] p-6 rounded-2xl shadow-lg text-white">
            <p className="opacity-80 text-sm font-medium">Status do Sistema</p>
            <h3 className="text-xl font-bold mt-2 text-white">SISTEMA INICIADO</h3>
            <div className="mt-4 text-white/80 text-sm">Operação 100% online</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;