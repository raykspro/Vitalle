import React from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { LayoutDashboard, Package, Wallet, LogOut, Menu } from 'lucide-react';

const Dashboard = () => {
  const { user } = useUser();
  const nomeMestre = user?.username || "Mestre";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
      {/* Sidebar / Topbar Mobile */}
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-gray-100 flex flex-col shrink-0">
        <div className="p-6 flex justify-between items-center md:block">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-black">Vitalle</h1>
            <p className="text-[10px] md:text-xs text-[#d946ef] font-bold uppercase tracking-widest">Management System</p>
          </div>
          <div className="md:hidden text-[#d946ef]">
            <Menu size={24} />
          </div>
        </div>
        
        <nav className="hidden md:flex flex-1 px-4 py-2 space-y-2 flex-col">
          <div className="flex items-center space-x-3 p-3 bg-magenta/10 text-[#d946ef] rounded-xl">
            <LayoutDashboard size={20} />
            <span className="font-bold">Dashboard</span>
          </div>
          <div className="flex items-center space-x-3 p-3 text-gray-500 hover:bg-gray-50 rounded-xl cursor-not-allowed">
            <Package size={20} />
            <span>Estoque</span>
          </div>
          <div className="flex items-center space-x-3 p-3 text-gray-500 hover:bg-gray-50 rounded-xl cursor-not-allowed">
            <Wallet size={20} />
            <span>Financeiro</span>
          </div>
        </nav>

        <div className="hidden md:block p-4 border-t border-gray-100">
          <SignOutButton>
            <button className="flex items-center space-x-3 w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all font-bold">
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 md:p-8">
        <header className="flex justify-between items-center mb-6 md:mb-8">
          <div className="max-w-[70%]">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">Olá, {nomeMestre}!</h2>
            <p className="text-sm text-gray-500">Pronto para organizar?</p>
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 bg-[#d946ef] rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shrink-0">
            {nomeMestre.charAt(0).toUpperCase()}
          </div>
        </header>

        {/* Cards de Resumo - Empilhamento automático no Mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
            <p className="text-gray-400 text-xs md:sm font-medium">Produtos em Estoque</p>
            <h3 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">--</h3>
            <div className="mt-4 text-[#d946ef] text-sm font-bold">Ver inventário →</div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform">
            <p className="text-gray-400 text-xs md:sm font-medium">Vendas (Mês)</p>
            <h3 className="text-2xl md:text-3xl font-bold mt-1 md:mt-2">R$ 0,00</h3>
            <div className="mt-4 text-[#d946ef] text-sm font-bold">Ver relatórios →</div>
          </div>

          <div className="bg-[#d946ef] p-6 rounded-2xl shadow-lg text-white active:scale-95 transition-transform col-span-1 sm:col-span-2 lg:col-span-1">
            <p className="opacity-80 text-xs md:sm font-medium uppercase tracking-tighter">Status do Sistema</p>
            <h3 className="text-lg md:text-xl font-bold mt-1 md:mt-2">SISTEMA ATIVO</h3>
            <div className="mt-4 text-white/80 text-xs md:text-sm">Vercel: Online 🟢</div>
          </div>
        </div>

        {/* Botão de Sair Visível apenas no Mobile */}
        <div className="mt-8 md:hidden">
          <SignOutButton>
            <button className="w-full py-4 bg-white border border-red-100 text-red-500 font-bold rounded-2xl shadow-sm">
              Sair da Conta
            </button>
          </SignOutButton>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;