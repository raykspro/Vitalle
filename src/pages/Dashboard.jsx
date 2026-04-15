import React from "react";
import { useUser } from '@clerk/clerk-react';
import { ShoppingBag, Users, Package, TrendingUp, ArrowUpRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user } = useUser();

  // Dados zerados para aguardar integração real
  const cards = [
    { label: "Vendas do Mês", value: "R$ 0,00", icon: ShoppingBag, trend: "0%", color: "magenta" },
    { label: "Novos Clientes", value: "0", icon: Users, trend: "0%", color: "black" },
    { label: "Estoque Total", value: "0", icon: Package, trend: "Estável", color: "magenta" },
    { label: "Lucro Estimado", value: "R$ 0,00", icon: TrendingUp, trend: "0%", color: "black" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header de Luxo */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-1.5 w-16 bg-magenta mb-2 rounded-full" />
          <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
            BEM-VINDO, <span className="text-magenta italic">{(user?.firstName || 'Mestre').toUpperCase()}</span>
          </h2>
          <p className="text-slate-500 font-medium tracking-wide">Acompanhe a performance da Vitalle em tempo real.</p>
        </div>
        
        <Link 
          to="/products" 
          className="flex items-center gap-2 bg-slate-900 hover:bg-magenta text-white px-6 py-4 rounded-2xl font-black text-xs tracking-[0.2em] transition-all hover:shadow-lg hover:shadow-magenta/20 group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
          NOVO PRODUTO
        </Link>
      </header>

      {/* Grid de Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:border-magenta/20">
            <div className="flex flex-col gap-5">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-transform group-hover:scale-110 duration-500",
                card.color === "magenta" ? "bg-magenta shadow-magenta/30" : "bg-slate-900 shadow-slate-900/30"
              )}>
                <card.icon className="h-7 w-7" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] text-slate-400 uppercase mb-1">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center bg-slate-50 px-2 py-1 rounded-full">
                    {card.trend} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </div>
            </div>
            {/* Efeito Visual ao Passar o Mouse */}
            <div className="absolute -right-6 -bottom-6 h-28 w-28 bg-magenta/5 rounded-full blur-2xl group-hover:bg-magenta/10 transition-all duration-700" />
          </div>
        ))}
      </div>

      {/* Seção de Insights */}
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-[3rem] bg-slate-900 p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h4 className="text-2xl font-black mb-4 tracking-tight">STATUS OPERACIONAL</h4>
            <p className="text-slate-400 text-base mb-10 font-medium leading-relaxed max-w-md">
              O sistema está pronto para sincronizar com sua base <span className="text-magenta font-black">products</span> do Supabase. Nenhuma anomalia detectada nos serviços de autenticação.
            </p>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Database Online</span>
               </div>
               <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                  <div className="h-2 w-2 rounded-full bg-magenta animate-pulse" />
                  <span className="text-[10px] font-black tracking-widest uppercase">Auth Active</span>
               </div>
            </div>
          </div>
          <Package className="absolute right-[-10%] bottom-[-10%] h-64 w-64 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
        </div>

        <div className="lg:col-span-2 rounded-[3rem] border-2 border-magenta/10 bg-white p-10 flex flex-col items-center justify-center text-center shadow-lg shadow-magenta/5">
           <div className="w-20 h-20 bg-magenta/10 rounded-3xl flex items-center justify-center mb-6 rotate-3">
              <TrendingUp className="h-10 w-10 text-magenta" />
           </div>
           <h4 className="text-2xl font-black text-slate-900 tracking-tight">VENDAS HOJE</h4>
           <p className="text-slate-500 text-sm mt-3 font-medium leading-relaxed">
              As métricas de conversão aparecerão aqui assim que as primeiras vendas forem registradas no módulo comercial.
           </p>
           <button className="mt-8 text-magenta font-black text-xs tracking-widest hover:underline decoration-2 underline-offset-8">
              VER RELATÓRIO COMPLETO
           </button>
        </div>
      </div>
    </div>
  );
}