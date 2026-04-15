import React, { useState, useEffect } from "react";
import { Plus, Save, X, Loader2, DollarSign, Percent, UserCheck, Image as ImageIcon, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner"; // Certifique-se de ter o sonner instalado

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    cost_price: "",
    sell_price: "",
    commission_percent: "5",
    brand: "Vitalle Exclusive", // Valor padrão de luxo
    image_url: "",
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
        price: parseFloat(formData.sell_price), // Alinhado com o SQL que corrigimos
        cost_price: parseFloat(formData.cost_price),
        commission_value: metrics.commission_value,
        net_profit: metrics.net_profit
      }]);

      if (error) throw error;

      // ✅ ALERTA PERSONALIZADO VITALLE
      toast.success("💎 PEÇA REGISTRADA COM SUCESSO!", {
        description: `${formData.name} foi adicionado ao catálogo de luxo.`,
        className: "bg-magenta text-white font-black rounded-2xl border-none shadow-2xl",
      });

      setShowForm(false);
      setFormData({ name: "", category: "", cost_price: "", sell_price: "", commission_percent: "5", brand: "Vitalle Exclusive", image_url: "", sku: "", status: "Ativo" });
    } catch (error) {
      toast.error("ERRO NA VITALLE", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">VITALLE GESTÃO</h1>
          <p className="text-[10px] text-slate-400 font-bold tracking-[0.3em] uppercase mt-1">Catálogo de Produtos e Margens</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={cn("px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest transition-all shadow-lg", 
          showForm ? "bg-slate-900 text-white" : "bg-magenta text-white shadow-magenta/20 hover:scale-105")}
        >
          {showForm ? "CANCELAR" : "NOVO PRODUTO"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] p-10 border-2 border-magenta/5 shadow-2xl space-y-8">
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="space-y-4 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">Nome da Peça</label>
                <input required type="text" placeholder="Ex: Baby Doll de Seda" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-magenta/20" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">Marca / Grife</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
                  <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">URL da Foto</label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
                  <input type="text" placeholder="https://imagem.com/foto.jpg" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-12 text-sm font-bold" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">Categoria</label>
                <input type="text" placeholder="Lingerie / Noite" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold" />
              </div>
            </div>

            {/* PRECIFICAÇÃO */}
            <div className="bg-magenta/5 rounded-[2rem] p-6 space-y-4 border border-magenta/10">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase ml-2">Custo Unitário (R$)</label>
                <input required type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="bg-white border-none rounded-2xl p-4 text-sm font-bold shadow-sm" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-magenta tracking-widest uppercase ml-2 italic">Preço de Venda (R$)</label>
                <input required type="number" step="0.01" value={formData.sell_price} onChange={e => setFormData({...formData, sell_price: e.target.value})} className="bg-white border-none rounded-2xl p-4 text-sm font-black text-magenta shadow-md focus:ring-2 focus:ring-magenta/30" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase ml-2 italic">Comissão (%)</label>
                <input type="number" value={formData.commission_percent} onChange={e => setFormData({...formData, commission_percent: e.target.value})} className="bg-blue-50 border-none rounded-2xl p-4 text-sm font-bold" />
              </div>
            </div>
          </div>

          {/* PAINEL DE MÉTRICAS VITALLE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-magenta/10 blur-[60px] rounded-full" />
            
            <div className="space-y-1 relative z-10">
              <div className="flex items-center gap-2 text-magenta">
                <UserCheck className="h-4 w-4" />
                <span className="text-[9px] font-black tracking-widest uppercase">Pagamento Vendedor</span>
              </div>
              <p className="text-2xl font-black italic">R$ {metrics.commission_value.toFixed(2)}</p>
            </div>

            <div className="space-y-1 border-x border-white/5 px-6 relative z-10">
              <div className="flex items-center gap-2 text-green-400">
                <DollarSign className="h-4 w-4" />
                <span className="text-[9px] font-black tracking-widest uppercase">Lucro Líquido (Real)</span>
              </div>
              <p className="text-2xl font-black italic text-green-400">R$ {metrics.net_profit.toFixed(2)}</p>
            </div>

            <div className="space-y-1 pl-6 relative z-10">
              <div className="flex items-center gap-2 text-blue-400">
                <Percent className="h-4 w-4" />
                <span className="text-[9px] font-black tracking-widest uppercase">Margem de Contribuição</span>
              </div>
              <p className={cn("text-3xl font-black italic", metrics.margin < 30 ? "text-red-400" : "text-white")}>
                {metrics.margin.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              disabled={loading} 
              type="submit" 
              className="bg-magenta hover:bg-magenta/90 text-white px-16 py-6 rounded-3xl font-black text-[11px] tracking-[0.4em] shadow-2xl shadow-magenta/30 hover:scale-105 transition-all flex items-center gap-3"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "FINALIZAR CADASTRO EXCLUSIVO"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}