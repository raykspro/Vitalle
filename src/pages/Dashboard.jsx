import React from "react";
import { useUser } from '@clerk/clerk-react';
import { ShoppingBag, Users, Package, TrendingUp, ArrowUpRight } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();

  const cards = [
    { label: "Vendas do Mês", value: "R$ 12.450", icon: ShoppingBag, trend: "+12%", color: "magenta" },
    { label: "Novos Clientes", value: "48", icon: Users, trend: "+5%", color: "black" },
    { label: "Estoque Total", value: "1.240", icon: Package, trend: "Estável", color: "magenta" },
    { label: "Lucro Estimado", value: "R$ 5.800", icon: TrendingUp, trend: "+18%", color: "black" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col gap-2">
        <div className="h-1 w-20 bg-magenta mb-2" />
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">
          BEM-VINDO, <span className="text-magenta italic">{(user?.firstName || 'Mestre').toUpperCase()}</span>
        </h2>
        <p className="text-slate-500 font-medium">Sua boutique está performando bem hoje.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <div key={i} className="group relative overflow-hidden rounded-[2rem] border-none bg-white p-8 shadow-xl shadow-slate-200/50 transition-all hover:-translate-y-1">
            <div className="flex flex-col gap-4">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg",
                card.color === "magenta" ? "bg-magenta shadow-magenta/30" : "bg-slate-900 shadow-slate-900/30"
              )}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{card.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-slate-900">{card.value}</h3>
                  <span className="text-[10px] font-bold text-green-500 flex items-center">
                    {card.trend} <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-magenta/5 rounded-full group-hover:scale-150 transition-all duration-700" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl">
          <h4 className="text-xl font-black mb-4">Ação Rápida</h4>
          <p className="text-slate-400 text-sm mb-8 font-medium">Você tem 5 novos pedidos aguardando faturamento e o estoque de 'Baby Dolls' está chegando ao fim.</p>
          <button className="bg-magenta hover:bg-magenta/90 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest transition-all">
            GERENCIAR ESTOQUE
          </button>
        </div>
        <div className="rounded-[2.5rem] border-2 border-magenta/10 bg-white p-10 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-magenta/10 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-magenta" />
           </div>
           <h4 className="text-xl font-black text-slate-900">Análise de Tendência</h4>
           <p className="text-slate-500 text-sm mt-2 font-medium">Os dados de vendas serão sincronizados assim que você realizar a primeira transação do dia.</p>
        </div>
      </div>
    </div>
  );
}