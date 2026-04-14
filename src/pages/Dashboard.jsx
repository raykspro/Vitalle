import { useState, useEffect } from "react";
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { supabase } from "@/lib/supabase";
import { 
  Package, ShoppingCart, Wallet, LayoutDashboard, Users, 
  TrendingUp, AlertTriangle, LogOut, ShieldCheck, Menu, X,
  FileText, History, Settings, Truck, Box
} from "lucide-react";
import { Link } from "react-router-dom";

// Formatação inspirada no seu arquivo base44 [cite: 3]
const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export default function Dashboard() {
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, customers: 0, sales: [], payments: [] });

  const admins = ['rayan', 'julia', 'raykspro']; 
  const isAdmin = admins.includes(user?.username?.toLowerCase());
  const NOME_MESTRE = (user?.username || "MESTRE").toUpperCase();

  useEffect(() => {
    async function fetchSupabaseData() {
      try {
        // Buscando métricas reais do seu novo banco Supabase
        const { count: prodCount } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
        const { count: cliCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
        const { data: salesData } = await supabase.from('vendas').select('*').order('created_at', { ascending: false }).limit(5);
        
        setStats({
          products: prodCount || 0,
          customers: cliCount || 0,
          sales: salesData || [],
          payments: [] // Integrar com sua tabela de contas a pagar/receber
        });
      } catch (error) {
        console.error("Erro Supabase:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSupabaseData();
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Links das páginas baseados no seu arquivo original [cite: 11, 12, 19, 25]
  const menuItems = [
    { to: "/", icon: LayoutDashboard, label: "DASHBOARD" },
    { to: "/produtos", icon: Box, label: "PRODUTOS" },
    { to: "/estoque", icon: Package, label: "ESTOQUE" },
    { to: "/clientes", icon: Users, label: "CLIENTES" },
    { to: "/fornecedores", icon: Truck, label: "FORNECEDORES" },
    { to: "/vendas", icon: ShoppingCart, label: "VENDAS" },
    { to: "/notas-fiscais", icon: FileText, label: "NOTAS FISCAIS" },
    { to: "/financeiro", icon: Wallet, label: "FINANCEIRO" },
    { to: "/historico", icon: History, label: "HISTÓRICO" },
    { to: "/configuracoes", icon: Settings, label: "CONFIGURAÇÕES" },
  ];

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFBF7] text-[#d946ef] font-bold">CARREGANDO VITALLE...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans">
      
      {/* MOBILE HEADER COM MENU HAMBÚRGUER */}
      <div className="md:hidden bg-white p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-black tracking-tighter italic">VITALLE</h1>
        <button onClick={toggleMenu} className="text-[#d946ef] p-2 bg-[#d946ef]/5 rounded-xl">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR COMPLETA (RESPONSIVA) */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-col shrink-0
      `}>
        <div className="p-8 hidden md:block">
          <h1 className="text-3xl font-black text-black tracking-tighter italic">VITALLE</h1>
          <p className="text-[10px] text-[#d946ef] font-bold tracking-[0.3em]">BOUTIQUE</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 flex flex-col pb-10 md:pb-0">
          {menuItems.map((item) => (
            <Link 
              key={item.label}
              to={item.to} 
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 p-3.5 text-gray-500 hover:bg-[#d946ef]/10 hover:text-[#d946ef] rounded-2xl transition-all font-black text-[11px] tracking-widest"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <SignOutButton>
            <button className="flex items-center justify-center space-x-3 w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] tracking-widest border border-red-100">
              <LogOut size={18} />
              <span>SAIR DO SISTEMA</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="flex-1 p-6 md:p-12 space-y-8">
        <header>
          <div className="flex items-center gap-2 mb-1">
            {isAdmin && <ShieldCheck size={18} className="text-[#d946ef]" />}
            <span className="text-[10px] font-black text-[#d946ef] uppercase tracking-[0.2em]">Status: Oficialmente Online</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-black tracking-tight uppercase">OLÁ, {NOME_MESTRE}!</h2>
          <p className="text-gray-500 text-sm mt-2">Aqui está o resumo real do seu negócio [Supabase Ativo]</p>
        </header>

        {/* MÉTRICAS EXIGIDAS (Grid Adaptável) [cite: 11, 12] */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-gray-400 tracking-widest">PRODUTOS</p>
              <Package size={20} className="text-[#d946ef]" />
            </div>
            <h3 className="text-3xl font-black text-black">{stats.products}</h3>
          </div>
          
          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-gray-400 tracking-widest">CLIENTES</p>
              <Users size={20} className="text-[#d946ef]" />
            </div>
            <h3 className="text-3xl font-black text-black">{stats.customers}</h3>
          </div>

          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-gray-400 tracking-widest">TOTAL EM VENDAS</p>
              <TrendingUp size={20} className="text-[#d946ef]" />
            </div>
            <h3 className="text-3xl font-black text-black">{formatCurrency(0)}</h3>
          </div>

          <div className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-gray-400 tracking-widest">A RECEBER</p>
              <Wallet size={20} className="text-[#d946ef]" />
            </div>
            <h3 className="text-3xl font-black text-[#d946ef]">{formatCurrency(0)}</h3>
          </div>
        </div>

        {/* SEÇÃO INFERIOR: VENDAS E PAGAMENTOS [cite: 13, 19] */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg tracking-tight">VENDAS RECENTES</h3>
              <Link to="/vendas" className="text-[10px] font-black text-[#d946ef] underline">VER TODAS</Link>
            </div>
            <div className="space-y-4">
              {stats.sales.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Nenhuma venda sincronizada com Supabase.</p>
              ) : (
                stats.sales.map((sale) => (
                  <div key={sale.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-all">
                    <span className="text-xs font-bold uppercase">{sale.cliente}</span>
                    <span className="font-black text-[#d946ef]">{formatCurrency(sale.valor)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-black rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#d946ef]/20 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="text-[#d946ef]" />
              <h3 className="font-black text-lg tracking-tight">PAGAMENTOS URGENTES</h3>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl border border-white/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pendente hoje</p>
              <p className="text-3xl font-black">{formatCurrency(0)}</p>
            </div>
            <Link to="/financeiro" className="mt-6 text-center text-[10px] font-black text-[#d946ef] tracking-widest hover:bg-[#d946ef] hover:text-white p-3 border border-[#d946ef] rounded-2xl transition-all">
              GERENCIAR CAIXA
            </Link>
          </div>
        </div>
      </main>

      {/* OVERLAY MOBILE */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={toggleMenu} />}
    </div>
  );
}