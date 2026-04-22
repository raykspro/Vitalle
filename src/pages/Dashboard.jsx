import React, { useState, useEffect } from "react";
import { useUser } from '@clerk/clerk-react';
import { ShoppingBag, Users, Package, TrendingUp, ArrowUpRight, ShoppingCart, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from '../lib/supabaseClient';
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    salesMonth: 0,
    newCustomers: 0,
    totalStock: 0,
    estimatedProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  async function fetchDashboardMetrics() {
    setLoading(true);
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // 1. Vendas do Mês (Ajustado para centavos)
      const { data: salesData, error: salesErr } = await supabase
        .from('sales')
        .select('total_price_cents')
        .gte('created_at', monthStart);

      if (salesErr) throw salesErr;
      
      const salesTotalCents = salesData?.reduce((sum, s) => sum + (Number(s.total_price_cents) || 0), 0) || 0;
      const salesTotalReal = salesTotalCents / 100;

      // 2. Novos Clientes
      const { count: customerCount, error: custErr } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      if (custErr) throw custErr;

      // 3. Estoque Total
      const { data: productsData, error: prodErr } = await supabase
        .from('products')
        .select('stock_quantity');

      if (prodErr) throw prodErr;
      const stockTotal = productsData?.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0) || 0;

      setMetrics({
        salesMonth: salesTotalReal,
        newCustomers: customerCount || 0,
        totalStock: stockTotal,
        estimatedProfit: salesTotalReal * 0.3 // Margem Vitalle de 30%
      });

    } catch (err) {
      console.error('Erro na Sincronização:', err);
      toast.error('Erro ao conectar com o banco de dados');
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    { 
      label: "Vendas do Mês", 
      value: `R$ ${metrics.salesMonth.toFixed(2)}`, 
      icon: ShoppingBag, 
      trend: "+12%", 
      color: "magenta"
    },
    { 
      label: "Novos Clientes", 
      value: metrics.newCustomers.toString(), 
      icon: Users, 
      trend: "+8%", 
      color: "black"
    },
    { 
      label: "Estoque em Loja", 
      value: metrics.totalStock.toString(), 
      icon: Package, 
      trend: "Feriado", 
      color: "magenta"
    },
    { 
      label: "Lucro Estimado", 
      value: `R$ ${metrics.estimatedProfit.toFixed(2)}`, 
      icon: TrendingUp, 
      trend: "+25%", 
      color: "black"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#D946EF] mx-auto mb-4" />
          <p className="font-black text-sm text-slate-400 italic tracking-widest uppercase text-center">Sincronizando Sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4 md:p-10 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <div className="h-1 w-12 bg-[#D946EF] mb-2" />
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            OLÁ, <span className="text-[#D946EF] italic uppercase">{(user?.firstName || 'MESTRE')}</span>
          </h2>
          <p className="text-slate-400 text-xs font-bold italic uppercase tracking-widest">Painel de Controle Vitalle Boutique</p>
        </div>
        
        <button 
          onClick={() => navigate('/vendas')} 
          className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-[#D946EF] text-white px-8 py-5 rounded-3xl font-black text-xs tracking-[0.2em] transition-all hover:shadow-2xl hover:shadow-[#D946EF]/40 group"
        >
          <ShoppingCart className="h-5 w-5" />
          NOVA VENDA
        </button>
      </header>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:border-pink-100">
            <div className="flex flex-col gap-5">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                card.color === "magenta" ? "bg-[#D946EF]" : "bg-slate-900"
              )}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-900">{card.value}</h3>
                  <span className="text-[10px] font-bold text-green-500 flex items-center">
                    {card.trend} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[3rem] bg-slate-900 p-10 text-white relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <h4 className="text-xl font-black mb-2 tracking-tight uppercase italic text-[#D946EF]">Status Operacional</h4>
              <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                Sincronização com o banco de dados ativa. Pronto para novas movimentações de estoque e vendas.
              </p>
            </div>
            <button 
              onClick={fetchDashboardMetrics}
              className="mt-8 flex items-center w-fit gap-2 px-6 py-3 bg-white text-black rounded-2xl hover:bg-[#D946EF] hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Sincronizar Banco
            </button>
          </div>
          <Package className="absolute right-[-5%] bottom-[-5%] h-48 w-48 text-white/5 -rotate-12 group-hover:rotate-0 transition-all duration-700" />
        </div>

        <div className="rounded-[3rem] border-2 border-slate-50 bg-white p-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="h-7 w-7 text-[#D946EF]" />
          </div>
          <h4 className="text-lg font-black text-slate-900 uppercase italic">Vitalle Management</h4>
          <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase tracking-tighter">
            Tecnologia de Gestão Avançada
          </p>
        </div>
      </div>
    </div>
  );
}