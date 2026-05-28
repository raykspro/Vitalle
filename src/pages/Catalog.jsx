import React, { useEffect, useState } from "react";
import { Plus, Search, Grid, List } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabaseClient";

export default function Catalog() {
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [productsRes, stockRes] = await Promise.all([
          supabase
            .from("products")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("stock_items").select("*"),
        ]);

        const productsData = productsRes?.data || [];
        const stockData = stockRes?.data || [];

        const productsWithStock = productsData.map((p) => {
          const total_stock = stockData
            .filter((s) => s.product_id === p.id)
            .reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

          return { ...p, total_stock };
        });

        setProducts(productsWithStock);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const formatBRLFromCents = (cents) => {
    const numeric = Number(cents ?? 0);
    const value = numeric / 100;
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const renderGrid = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {products.map((p) => (
        <div
          key={p.id}
          className="group bg-white/90 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-lg transition-all"
        >
          <div className="p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#D946EF]">
              {p.category || "—"}
            </div>
            <div className="font-black text-slate-900 dark:text-white text-sm uppercase mt-1 line-clamp-2">
              {p.name || p.model || "Produto"}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <div
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border",
                  (p.total_stock ?? 0) > 0
                    ? "bg-emerald-50/70 text-emerald-700 border-emerald-200"
                    : "bg-orange-50/70 text-orange-700 border-orange-200"
                )}
              >
                Estoque: {(p.total_stock ?? 0) > 0 ? `${p.total_stock} un` : "Sem estoque"}
              </div>
              <div className="text-[#D946EF] font-black italic text-lg">
                {formatBRLFromCents(p.sell_price_cents)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="flex flex-col gap-3">
      {products.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4"
        >
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-widest text-[#D946EF]">
              {p.category || "—"}
            </div>
            <div className="font-black text-slate-900 dark:text-white text-sm uppercase truncate">
              {p.name || p.model || "Produto"}
            </div>
          </div>
          <div className="text-[#D946EF] font-black italic text-base whitespace-nowrap">
            {formatBRLFromCents(p.sell_price_cents)}
          </div>
        </div>
      ))}
    </div>
  );

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

        {/* ÁREA DE CONTEÚDO */}
        {loading ? (
          <div className="rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 h-96 flex flex-col items-center justify-center text-center p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D946EF] mb-4" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
              Carregando catálogo...
            </h3>
          </div>
        ) : viewMode === "grid" ? (
          renderGrid()
        ) : (
          renderList()
        )}
      </div>
    </div>
  );
}
