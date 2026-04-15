import React, { useState, useEffect } from "react";
import { useUser } from '@clerk/clerk-react';
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    vendas: "R$ 0,00",
    clientes: "0",
    produtos: "0",
    crescimento: "+0%"
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header de Boas-vindas */}
      <header>
        <h2 className="text-3xl font-black text-black tracking-tight">
          OLÁ, <span className="text-magenta uppercase">{user?.firstName || 'MESTRE'}</span>
        </h2>
        <p className="text-gray-500 font-medium">Aqui está o resumo da sua boutique hoje.</p>
      </header>

      {/* Grid de Estatísticas (Os Cards do seu Design) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "VENDAS DO MÊS", value: stats.vendas, icon: ShoppingBag, color: "bg-magenta" },
          { label: "NOVOS CLIENTES", value: stats.clientes, icon: Users, color: "bg-black" },
          { label: "TOTAL PRODUTOS", value: stats.produtos, icon: Package, color: "bg-magenta" },
          { label: "CRESCIMENTO", value: stats.crescimento, icon: TrendingUp, color: "bg-black" },
        ].map((card, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-xl hover:shadow-magenta/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">{card.label}</p>
                <h3 className="mt-2 text-2xl font-black text-black">{card.value}</h3>
              </div>
              <div className={`${card.color} rounded-xl p-3 text-white shadow-lg`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-magenta transition-all group-hover:w-full" />
          </div>
        ))}
      </div>

      {/* Espaço para Gráficos ou Tabelas Futuras */}
      <div className="rounded-3xl border-2 border-dashed border-magenta/10 bg-magenta/5 p-12 text-center">
        <p className="font-black text-magenta/40 tracking-widest uppercase text-sm">
          Área de Monitoramento Vitalle — Pronta para Conexão de Dados
        </p>
      </div>
    </div>
  );
}