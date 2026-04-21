import React, { useState, useEffect } from "react";
import { useUser } from '@clerk/clerk-react';
import { ShoppingBag, Users, Package, TrendingUp, ArrowUpRight, Plus, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { supabase } from '../lib/supabaseClient';
import { formatPriceDisplay } from '@/lib/formatters';
import { toast } from "sonner";

export default function Dashboard() {
  const { user } = useUser();
  const [metrics, setMetrics] = useState({
    salesMonth: 0,
    newCustomers: 0,
    totalStock: 0,
    estimatedProfit: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  async function fetchDashboardMetrics() {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      // Início do mês atual
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // 1. Vendas do Mês (Soma direta do banco)
      const { data: salesData, error: salesErr } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('sale_date', monthStart);

      if (salesErr) throw salesErr;
      const salesTotal = salesData?.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0) || 0;

      // 2. Novos Clientes (Contagem exata)
      const { count: customerCount, error: custErr } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart);

      if (custErr) throw custErr;

      // 3. Estoque Total (Apenas produtos ativos)
      const { data: productsData, error: prodErr } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('status', 'Ativo');

      if (prodErr) throw prodErr;
      const stockTotal = productsData?.reduce((sum, p) => sum + (Number(p.stock_quantity) || 0), 0) || 0;

      // 4. Lucro Estimado (Baseado em 30% sobre o total de vendas)
      const profit = salesTotal * 0.3;

      setMetrics({
        salesMonth: salesTotal,
        newCustomers: customerCount || 0,
        totalStock: stockTotal,
        estimatedProfit: profit
      });

    } catch (err) {
      console.error('Erro União RGB - Dashboard:', err);
      setError('Falha ao sincronizar métricas com o Supabase');
      toast.error('Erro ao carregar dados da Vitalle');
    } finally {
      setLoading(false);
    }
  }

  const cards = [
    { 
      label: "Vendas do Mês", 
      value: formatPriceDisplay(metrics.salesMonth), 
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
      label: "Estoque Total", 
      value: metrics.totalStock.toString(), 
      icon: Package, 
      trend: "Estável", 
      color: "magenta"
    },
    { 
      label: "Lucro Estimado", 
      value: formatPriceDisplay(metrics.estimatedProfit), 
      icon: TrendingUp, 
      trend: "+25%", 
      color: "black"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFF]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-[#D946EF] mx-auto mb-4" />
          <p className="font-black text-xl text-slate-600 italic tracking-tighter">SINCRONIZANDO VITALLE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 p-6 md:p-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-16 bg-[#D946EF] mb-2 rounded-full" />
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
            BEM-VINDO, <span className="text-[#D946EF] italic uppercase">{(user?.firstName || 'MESTRE').toUpperCase()}</span>
          </h2>
          <p className="text-slate-500 font-medium tracking-wide italic">Monitorando o império Vitalle Boutique Luxury.</p>
        </div>
        
        <Link 
          to="/products" 
          className="flex items-center gap-2 bg-slate-900 hover:bg-[#D946EF] text-white px-8 py-4 rounded-2xl font-black text-sm tracking-[0.2em] transition-all hover:shadow-lg hover:shadow-[#D946EF]/20 group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          + NOVO PRODUTO
        </Link>
      </header>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl transition-all hover:-translate-y-1 hover:border-[#D946EF]/20">
            <div className="flex flex-col gap-5">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110",
                card.color === "magenta" ? "bg-[#D946EF] shadow-[#D946EF]/30" : "bg-slate-900 shadow-slate-900/30"
              )}>
                <card.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
                  <span className="text-[10px] font-bold text-green-500 flex items-center bg-green-50 px-2 py-1 rounded-full">
                    {card.trend} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-[#D946EF]/5 rounded-full blur-2xl" />
          </div>
        ))}
      </div>

      {/* Operacional Status */}
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-2xl font-black mb-4 tracking-tight uppercase">Status da Operação</h4>
            <p className="text-slate-400 text-base mb-10 font-medium leading-relaxed max-w-md">
              Banco de dados Supabase sincronizado. RLS desabilitado para performance máxima. 
              <span className="block mt-4 text-[#D946EF] font-black text-lg underline decoration-white/20">VITALLE BOUTIQUE LUXURY - FERIADO ATIVO 🚀</span>
            </p>
            <div className="flex gap-4">
              <button 
                onClick={fetchDashboardMetrics}
                className="flex items-center gap-2 px-6 py-2 bg-[#D946EF] rounded-full hover:bg-white hover:text-black transition-all font-black text-[11px] uppercase tracking-widest"
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                Atualizar Agora
              </button>
            </div>
          </div>
          <Package className="absolute right-[-5%] bottom-[-5%] h-64 w-64 text-white/5 -rotate-12 group-hover:rotate-0 transition-all duration-1000" />
        </div>

        <div className="lg:col-span-2 rounded-[3rem] border-2 border-slate-100 bg-white p-10 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp className="h-8 w-8 text-[#D946EF]" />
          </div>
          <h4 className="text-xl font-black text-slate-900 uppercase">Performance</h4>
          <p className="text-slate-500 text-sm mt-3 font-medium">
            Dados extraídos diretamente da tabela de vendas e estoque. Margem de lucro fixada em 30%.
          </p>
        </div>
      </div>
    </div>
  );
}