import React, { useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "../lib/supabaseClient";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";


function formatInt(val) {
  const n = Number(val ?? 0);
  if (Number.isNaN(n)) return "0";
  return String(n);
}

function getStockBadge(total) {
  const t = Number(total ?? 0);
  if (t <= 0) return { variant: "destructive", label: "Esgotado" };
  if (t < 5) return { variant: "warning", label: "Baixo" };
  return { variant: "success", label: "OK" };
}

export default function Stock() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [products, setProducts] = useState([]); // [{...product, total_quantity, variations:[{size,color,quantity, stock_item_id}]}]

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, stockRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, name, model, category")
            .order("created_at", { ascending: false }),
          supabase
            .from("stock_items")
            .select("id, quantity, size, color, product_id")
            .order("id", { ascending: true }),
        ]);

        if (productsRes.error) throw productsRes.error;
        if (stockRes.error) throw stockRes.error;

        const prods = productsRes?.data || [];
        const stockItems = stockRes?.data || [];

        const byProduct = new Map();
        for (const p of prods) {
          byProduct.set(p.id, {
            ...p,
            total_quantity: 0,
            variations: [],
          });
        }

        // Agregação por tamanho/cor
        const variationKey = (size, color) => `${String(size ?? "").trim()}|${String(color ?? "").trim()}`;
        const variationAgg = new Map(); // product_id -> Map(key -> qty)

        for (const item of stockItems) {
          const productId = item.product_id;
          if (!byProduct.has(productId)) continue;

          if (!variationAgg.has(productId)) variationAgg.set(productId, new Map());
          const prodMap = variationAgg.get(productId);

          const key = variationKey(item.size, item.color);
          const prev = prodMap.get(key) ?? 0;
          prodMap.set(key, prev + (Number(item.quantity) || 0));
        }

        // Construção final
        for (const [productId, prod] of byProduct.entries()) {
          const prodMap = variationAgg.get(productId) || new Map();
          const variations = [];
          let total_quantity = 0;

          for (const [key, qty] of prodMap.entries()) {
            const [sizeRaw, colorRaw] = key.split("|");
            const size = sizeRaw || "Único";
            const color = colorRaw || "N/A";
            const quantity = Number(qty) || 0;
            total_quantity += quantity;
            variations.push({ size, color, quantity });
          }

          variations.sort((a, b) => {
            const s = String(a.size).localeCompare(String(b.size));
            if (s !== 0) return s;
            return String(a.color).localeCompare(String(b.color));
          });

          byProduct.set(productId, { ...prod, total_quantity, variations });
        }

        const final = Array.from(byProduct.values());
        setProducts(final);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar estoque.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const name = (p.name || p.model || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return name.includes(q) || category.includes(q);
    });
  }, [products, search]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[#F8FAFC] dark:bg-slate-950 p-6">
        <Loader2 className="h-10 w-10 animate-spin text-[#D946EF]" />
        <p className="text-slate-500 dark:text-slate-400 font-black italic uppercase tracking-widest">
          Sincronizando estoque...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 pb-20 p-4 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col gap-1">
            <div className="h-1 w-12 bg-[#D946EF] mb-2" />
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
              CONTROLE DE ESTOQUE
            </h2>
            <p className="text-slate-400 dark:text-slate-400 text-xs font-bold italic uppercase tracking-widest">
              Auditoria por variação (Tamanho/Cor)
            </p>
          </div>

          <div className="relative w-full md:w-[420px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por produto ou categoria..."
              className="pl-12 border-none bg-white dark:bg-slate-900/60 h-14 w-full font-bold text-slate-700 dark:text-white shadow-sm rounded-3xl"
            />
          </div>
        </header>

        {/* LISTA */}
        {filtered.length === 0 ? (
          <div className="rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 h-96 flex flex-col items-center justify-center text-center p-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Nenhum produto encontrado</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {filtered.map((p, idx) => {
              const name = p.name || p.model || "Produto";
              const { variant, label } = getStockBadge(p.total_quantity);
              const badgeClass =
                variant === "destructive"
                  ? "bg-red-500/15 text-red-500 border-red-500/25"
                  : variant === "warning"
                    ? "bg-orange-500/15 text-orange-500 border-orange-500/25"
                    : "bg-emerald-500/15 text-emerald-500 border-emerald-500/25";

              return (
                <AccordionItem
                  key={p.id}
                  value={String(p.id)}
                  className="border border-slate-100 dark:border-slate-800 rounded-[2rem] px-4 mb-4 bg-white/70 dark:bg-slate-900/40"
                >
                  <AccordionTrigger className="no-underline hover:no-underline">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full py-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#D946EF]">
                          {p.category || "—"}
                        </p>
                        <p className="text-slate-900 dark:text-white font-black text-sm uppercase truncate">
                          {name}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={`border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                          Total Estoque: {formatInt(p.total_quantity)}
                        </Badge>
                        <Badge className={`border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badgeClass}`}>
                          {label}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent>
                    <div className="pb-4">
                      {p.variations.length === 0 ? (
                        <div className="py-3 text-slate-500 dark:text-slate-400 text-sm font-semibold">
                          Sem variações cadastradas.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {p.variations.map((v, i2) => (
                            <div
                              key={`${v.size}-${v.color}-${i2}`}
                              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-5 py-4"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#D946EF]">Variação</p>
                                <p className="text-slate-900 dark:text-white font-black text-sm uppercase truncate">
                                  Tamanho: {v.size} | Cor: {v.color}
                                </p>
                              </div>
                              <Badge
                                className={
                                  v.quantity <= 0
                                    ? "bg-red-500/15 text-red-500 border-red-500/25"
                                    : v.quantity < 5
                                      ? "bg-orange-500/15 text-orange-500 border-orange-500/25"
                                      : "bg-emerald-500/15 text-emerald-500 border-emerald-500/25"
                                }
                              >
                                Qtd: {formatInt(v.quantity)}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Dica: use a busca para filtrar por nome do produto ou categoria.
        </div>
      </div>
    </div>
  );
}

