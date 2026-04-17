import React, { useState, useEffect } from "react";
import { Plus, Save, X, Loader2, DollarSign, Percent, UserCheck, Image as ImageIcon, Tag, Hash, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parsePriceToCents,
  formatPriceDisplay,
  percentOfCents,
  subtractCents
} from "@/lib/formatters";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    cost_price: "",
    sell_price: "",
    commission_percent: "5",
    brand: "Vitalle Exclusive",
    image_url: "",
    color: "",
    sku: "",
    status: "Ativo"
  });

  const [metrics, setMetrics] = useState({ profit_cents: 0n, margin: 0, commission_value_cents: 0n, net_profit_cents: 0n });

  useEffect(() => {
    const costCents = parsePriceToCents(formData.cost_price);
    const sellCents = parsePriceToCents(formData.sell_price);
    const commPer = parseFloat(formData.commission_percent) || 0;
    
    if (Number(sellCents) > 0) {
      const commValueCents = percentOfCents(sellCents, formData.commission_percent);
      const bruteProfitCents = subtractCents(sellCents, costCents);
      const netProfitCents = subtractCents(bruteProfitCents, commValueCents);
      const margin = (Number(netProfitCents) / Number(sellCents)) * 100;

      setMetrics({ 
        profit_cents: bruteProfitCents, 
        margin,
        commission_value_cents: commValueCents,
        net_profit_cents: netProfitCents
      });
    }
  }, [formData.cost_price, formData.sell_price, formData.commission_percent]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const costCents = parsePriceToCents(formData.cost_price);
      const sellCents = parsePriceToCents(formData.sell_price);
      const { error } = await supabase.from('products').insert([{
        ...formData,
        price: parseFloat(formData.sell_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        sell_price_cents: Number(sellCents),
        cost_price_cents: Number(costCents),
        commission_value_cents: Number(metrics.commission_value_cents),
        net_profit_cents: Number(metrics.net_profit_cents)
      }]);

      if (error) throw error;

      toast.success("💎 VITALLE: PEÇA CADASTRADA!", {
        description: `${formData.name} já está no sistema.`,
        className: "bg-magenta text-white font-black rounded-2xl border-none shadow-2xl",
      });

      setShowForm(false);
      setFormData({ name: "", category: "", cost_price: "", sell_price: "", commission_percent: "5", brand: "Vitalle Exclusive", image_url: "", color: "", sku: "", status: "Ativo" });
    } catch (error) {
      toast.error("ERRO NO CADASTRO", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">VITALLE GESTÃO</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">Inventário de Alto Padrão</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={cn(
            "w-full md:w-auto px-10 py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3", 
            showForm ? "bg-slate-900 text-white shadow-xl" : "bg-magenta text-white shadow-magenta hover:scale-105"
          )}
        >
          {showForm ? <><X className="h-4 w-4" /> CANCELAR</> : <><Plus className="h-4 w-4" /> NOVO PRODUTO</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-6 lg:p-12 border border-slate-200 shadow-2xl space-y-10">
          
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* COLUNA 1: IDENTIDADE */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-magenta tracking-widest uppercase flex items-center gap-2">
                <Tag className="h-4 w-4" /> Identidade da Peça
              </h3>
              
              <div className="space-y-4">
                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Nome do Produto</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-vitalle w-full" placeholder="Ex: Conjunto Seda Italiana" />
                </div>

                <div className="group">
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Marca / Grife</label>
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="input-vitalle w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">SKU / Ref</label>
                    <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="input-vitalle w-full" placeholder="VT-001" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Cor</label>
                    <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="input-vitalle w-full" placeholder="Preto Luxo" />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA 2: MÍDIA E CATEGORIA */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-magenta tracking-widest uppercase flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Visual & Categoria
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Link da Foto (URL)</label>
                  <input type="text" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="input-vitalle w-full" placeholder="https://..." />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-1">Categoria</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-vitalle w-full" placeholder="Lingerie" />
                </div>
              </div>
            </div>

            {/* COLUNA 3: FINANCEIRO */}
            <div className="bg-slate-50 rounded-[2rem] p-6 border-2 border-magenta/5 space-y-6">
              <h3 className="text-[11px] font-black text-magenta tracking-widest uppercase flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Precificação
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Custo Unitário</label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">R$</span>
                    <input required type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full border-none p-0 text-lg font-black outline-none focus:ring-0" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-md border-2 border-magenta/20">
                  <label className="text-[9px] font-black text-magenta uppercase">Preço de Venda</label>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-magenta">R$</span>
                    <input required type="number" step="0.01" value={formData.sell_price} onChange={e => setFormData({...formData, sell_price: e.target.value})} className="w-full border-none p-0 text-lg font-black text-magenta outline-none focus:ring-0" />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <label className="text-[9px] font-black text-blue-500 uppercase">Comissão (%)</label>
                  <input type="number" value={formData.commission_percent} onChange={e => setFormData({...formData, commission_percent: e.target.value})} className="w-full border-none p-0 text-lg font-black text-blue-500 outline-none focus:ring-0" />
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL DE PERFORMANCE (DARK MODE VITALLE) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-magenta/20 blur-[80px] rounded-full" />
            
            <div className="space-y-1 relative z-10 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0">
              <span className="text-[9px] font-black tracking-[0.2em] text-magenta uppercase">Lucro Líquido Real</span>
              <p className="text-3xl font-black italic text-green-400">{formatPriceDisplay(metrics.net_profit_cents)}</p>
            </div>

            <div className="space-y-1 relative z-10 border-b md:border-b-0 md:border-r border-white/10 pb-4 md:pb-0 md:px-6">
              <span className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">Margem de Lucro</span>
              <p className={cn("text-3xl font-black italic", metrics.margin < 30 ? "text-rose-500" : "text-white")}>
                {metrics.margin.toFixed(1)}%
              </p>
            </div>

            <div className="space-y-1 relative z-10 md:pl-6">
              <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">Valor p/ Vendedor</span>
              <p className="text-3xl font-black italic">{formatPriceDisplay(metrics.commission_value_cents)}</p>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <button 
              disabled={loading} 
              type="submit" 
              className="btn-vitalle w-full md:w-auto flex items-center justify-center gap-4"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "REGISTRAR PEÇA NA VITALLE"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}