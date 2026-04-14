import { useState, useEffect } from "react";
import { useUser, SignOutButton } from '@clerk/clerk-react';
import supabase from "@/lib/supabase";
import { 
  Package, ShoppingCart, Wallet, LayoutDashboard, Users, 
  TrendingUp, AlertTriangle, LogOut, ShieldCheck, Menu, X,
  FileText, History, Settings, Truck, Box
} from "lucide-react";
import { Link } from "react-router-dom";

// Formatação de moeda padrão Vitalle
const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

export default function Dashboard() {
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ products: 0, customers: 0, sales: [], payments: [] });

  const admins = ['rayan', 'julia', 'raykspro']; 
  const isAdmin = admins.includes(user?.username?.toLowerCase());
  const NOME_MESTRE = (user?.username || "MESTRE").toUpperCase();

  useEffect(() => {
    async function loadData() {
      try {
        // Buscando dados reais do seu Supabase
        const { count: pCount } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
        const { count: cCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
        const { data: sData } = await supabase.from('vendas').select('*').order('created_at', { ascending: false }).limit(3);
        
        setData({ products: pCount || 0, customers: cCount || 0, sales: sData || [], payments: [] });
      } catch (e) {
        console.error("Erro na sincronização:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFBF7] font-black text-[#d946ef]">INICIALIZANDO VITALLE...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row font-sans">
      
      {/* HEADER MOBILE (3 RISQUINHOS) */}
      <div className="md:hidden bg-white p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-black italic tracking-tighter">VITALLE</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#d946ef] p-2 bg-[#d946ef]/5 rounded-xl">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR COMPLETA */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 md:flex md:flex-col shrink-0
      `}>
        <div className="p-8 hidden md:block">
          <h1 className="text-3xl font-black italic tracking-tighter">VITALLE</h1>
          <p className="text-[10px] text-[#d946ef] font-bold tracking-[0.3em]">MANAGEMENT</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 flex flex-col">
          {menuItems.map((item) => (
            <Link key={item.label} to={item.to} onClick={() => setIsMenuOpen(false)}
              className="flex items-center space-x-4 p-3.5 text-gray-500 hover:bg-[#d946ef]/10 hover:text-[#d946ef] rounded-2xl transition-all font-black text-[11px] tracking-widest"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-6">
          <SignOutButton>
            <button className="flex items-center justify-center space-x-3 w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] tracking-widest border border-red-100">
              <LogOut size={18} />
              <span>SAIR</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-6 md:p-12 space-y-10">
        <header>
          <div className="flex items-center gap-2 mb-1">
            {isAdmin && <ShieldCheck size={16} className="text-[#d946ef]" />}
            <span className="text-[10px] font-black text-[#d946ef] tracking-widest">SISTEMA OFICIALMENTE ONLINE</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-black">OLÁ, {NOME_MESTRE}!</h2>
        </header>

        {/* MÉTRICAS (GRID RESPONSIVA) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "PRODUTOS", val: data.products, icon: Package },
            { label: "CLIENTES", val: data.customers, icon: Users },
            { label: "TOTAL VENDAS", val: formatCurrency(0), icon: TrendingUp },
            { label: "A RECEBER", val: formatCurrency(0), icon: Wallet, highlight: true }
          ].map((item, i) => (
            <div key={i} className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2">{item.label}</p>
              <h3 className={`text-3xl font-black ${item.highlight ? 'text-[#d946ef]' : 'text-black'}`}>{item.val}</h3>
            </div>
          ))}
        </div>

        {/* SEÇÃO DE LISTAS (VENDAS E PAGAMENTOS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8">
            <h3 className="font-black text-lg mb-6 tracking-tight">VENDAS RECENTES</h3>
            <div className="space-y-4">
              {data.sales.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Aguardando novas vendas...</p>
              ) : (
                data.sales.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-2xl transition-all">
                    <span className="text-xs font-bold uppercase">{s.cliente_nome}</span>
                    <span className="font-black text-[#d946ef]">{formatCurrency(s.total)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-black rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#d946ef]/20 flex flex-col justify-between min-h-[250px]">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-[#d946ef]" />
              <h3 className="font-black text-lg">PAGAMENTOS URGENTES</h3>
            </div>
            <div className="bg-white/10 p-5 rounded-3xl border border-white/5 mt-4">
              <p className="text-[10px] font-bold text-gray-400 tracking-widest mb-1">Total pendente hoje</p>
              <p className="text-3xl font-black">{formatCurrency(0)}</p>
            </div>
          </div>
        </div>
      </main>

      {/* OVERLAY MOBILE */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
}