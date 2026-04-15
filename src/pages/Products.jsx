import React, { useState, useEffect } from "react";
import { Plus, Save, X, Loader2, DollarSign, Percent, UserCheck, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabaseClient";

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    cost_price: "",
    sell_price: "",
    commission_percent: "5", // Padrão de 5%
    brand: "Vitalle",
    color: "",
    sku: "",
    status: "Ativo"
  });

  const [metrics, setMetrics] = useState({ profit: 0, margin: 0, commission_value: 0, net_profit: 0 });

  useEffect(() => {
    const cost = parseFloat(formData.cost_price) || 0;
    const sell = parseFloat(formData.sell_price) || 0;
    const commPer = parseFloat(formData.commission_percent) || 0;
    
    if (sell > 0) {
      const commValue = (sell * commPer) / 100;
      const bruteProfit = sell - cost;
      const netProfit = bruteProfit - commValue;
      const margin = (netProfit / sell) * 100;

      setMetrics({ 
        profit: bruteProfit, 
        margin: margin, 
        commission_value: commValue,
        net_profit: netProfit
      });
    }
  }, [formData.cost_price, formData.sell_price, formData.commission_percent]);

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('products').insert([{
        ...formData,
        commission_value: metrics.commission_value,
        net_profit: metrics.net_profit
      }]);
      if (error) throw error;
      alert("PRODUTO E COMISSÃO REGISTRADOS! 💎");
      setShowForm(false);
    } catch (error) {
      alert("Erro na Vitalle: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">VITALLE GESTÃO</h1>
        <button onClick={() => setShowForm(!showForm)} className={cn("px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all shadow-lg", showForm ? "bg-slate-900 text-white" : "bg-magenta text-white shadow-magenta/20")}>
          {showForm ? "CANCELAR" : "NOVO PRODUTO"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-10 border-2 border-magenta/10 shadow-2xl space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">Preço de Custo</label>
              <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-magenta tracking-widest uppercase ml-2 italic">Preço de Venda</label>
              <input type="number" step="0.01" value={formData.sell_price} onChange={e => setFormData({...formData, sell_price: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-magenta/30" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase ml-2 italic">Comissão (%)</label>
              <input type="number" value={formData.commission_percent} onChange={e => setFormData({...formData, commission_percent: e.target.value})} className="bg-blue-50/50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          {/* Painel Financeiro Avançado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-magenta">
                <UserCheck className="h-4 w-4" />
                <span className="text-[9px] font-black tracking-widest uppercase">Comissão Vendedor</span>
              </div>
              <p className="text-2xl font-black italic">R$ {metrics.commission_value.toFixed(2)}</p>
            </div>

            <div className="space-y-1 border-x border-white/10 px-6">
              <div className="flex items-center gap-2 text-green-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-[9px] font-black tracking-widest uppercase">Lucro Líquido Real</span>
              </div>
              <p className="text-2xl font-black italic">R$ {metrics.net_profit.toFixed(2)}</p>
            </div>

            <div className="space-y-1 pl-6">
              <div className="flex items-center gap-2 text-blue-400">
                <Percent className="h-4 w-4" />
                <span className="text-[9px] font-black tracking-widest uppercase">Margem Final</span>
              </div>
              <p className={cn("text-2xl font-black italic", metrics.margin < 20 ? "text-red-400" : "text-white")}>
                {metrics.margin.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button disabled={loading} type="submit" className="bg-magenta text-white px-12 py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] shadow-xl hover:scale-105 transition-all">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "REGISTRAR PEÇA"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}