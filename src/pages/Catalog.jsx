import React, { useState } from "react";
import { Plus, Search, Grid, List, Package } from "lucide-react";
import { cn } from "../lib/utils";

export default function Catalog() {
  const [viewMode, setViewMode] = useState("grid"); // Alterna entre grade de fotos e lista de estoque

  return (
    <div className="min-h-full w-full bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 pb-20 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* CABEÇALHO */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="h-1 w-12 bg-[#D946EF] mb-2" />
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              CATÁLOGO <span className="text-[#D946EF] italic uppercase">& ESTOQUE</span>
            </h2>
            <p className="text-slate-400 text-xs font-bold italic uppercase tracking-widest">
              Gestão Centralizada Vitalle
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* TOGGLE DE VISUALIZAÇÃO */}
            <div className="flex bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-100 dark:border-slate-800 shadow-sm w-full sm:w-auto justify-center">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-3 rounded-xl transition-all flex-1 sm:flex-none flex justify-center",
                  viewMode === "grid" 
                    ? "bg-slate-100 dark:bg-slate-800 text-[#D946EF]" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-3 rounded-xl transition-all flex-1 sm:flex-none flex justify-center",
                  viewMode === "list" 
                    ? "bg-slate-100 dark:bg-slate-800 text-[#D946EF]" 
                    : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <List className="h-5 w-5" />
              </button>
            </div>

            {/* BOTÃO NOVO PRODUTO */}
            <button className="flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#D946EF] dark:hover:bg-[#D946EF] dark:hover:text-white w-full sm:w-auto px-8 py-4 rounded-3xl font-black text-xs tracking-[0.2em] transition-all shadow-lg">
              <Plus className="h-5 w-5" />
              CADASTRAR
            </button>
          </div>
        </header>

        {/* BARRA DE BUSCA INTELIGENTE */}
        <div className="flex items-center bg-white dark:bg-slate-900 rounded-3xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
          <Search className="h-5 w-5 text-slate-400 ml-4 shrink-0" />
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou código..."
            className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {/* ÁREA DE CONTEÚDO (PLACEHOLDER) */}
        <div className="rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 h-96 flex flex-col items-center justify-center text-center p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
           <Package className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-6" />
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
             Layout Base Configurado
           </h3>
           <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mt-2 font-medium">
             A estrutura está pronta para receber o banco de dados do Supabase. O próximo passo é integrar as funções de busca e o mapeamento dos itens.
           </p>
        </div>

      </div>
    </div>
  );
}