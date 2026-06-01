import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Tag, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function NewProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    costPrice: "",
    margin: "30", // Margem padrão da Vitalle
    salePrice: "",
  });

  // Motor de Precificação Inteligente
  useEffect(() => {
    if (formData.costPrice && formData.margin) {
      const cost = parseFloat(formData.costPrice.replace(',', '.')) || 0;
      const margin = parseFloat(formData.margin) || 0;
      
      const calculatedSale = cost + (cost * (margin / 100));
      
      setFormData(prev => ({
        ...prev,
        salePrice: calculatedSale > 0 ? calculatedSale.toFixed(2) : ""
      }));
    }
  }, [formData.costPrice, formData.margin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseMoneyToCents = (value) => {
    const normalized = String(value ?? "").trim().replace(",", ".");
    const num = parseFloat(normalized);
    if (Number.isNaN(num)) return 0;
    return Math.round(num * 100);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        model: formData.name,
        category: formData.category,
        description: formData.description,
        cost_price_cents: parseMoneyToCents(formData.costPrice),
        commission_percent: Number(formData.margin) || 0,
        sell_price_cents: parseMoneyToCents(formData.salePrice),
        status: "Ativo",
      };

      const { error } = await supabase
        .from("products")
        .insert([payload]);

      if (error) {
        toast.error("Erro ao salvar");
        throw error;
      }

      toast.success("Produto cadastrado!");
      navigate("/products");
    } catch (err) {
      // toast já foi disparado em caso de erro do Supabase
      if (!String(err).includes("[object Object]")) {
        toast.error("Erro ao salvar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full w-full bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-300 pb-20 p-4 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        
        {/* CABEÇALHO */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/products')}
              className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-[#D946EF] transition-all shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
                Novo <span className="text-[#D946EF]">Produto</span>
              </h2>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#D946EF] dark:hover:bg-[#D946EF] dark:hover:text-white px-6 md:px-8 py-3 md:py-4 rounded-3xl font-black text-[10px] md:text-xs tracking-[0.2em] transition-all shadow-lg disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "SALVANDO..." : "SALVAR PRODUTO"}
          </button>
        </header>

        <form className="space-y-6" onSubmit={handleSave}>
          
          {/* SESSÃO 1: INFORMAÇÕES BÁSICAS */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="h-5 w-5 text-[#D946EF]" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Informações Essenciais</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Nome da Peça</label>
                <input 
                  type="text" name="name" value={formData.name} onChange={handleInputChange}
                  placeholder="Ex: Pijama de Seda Preto"
                  className="w-full bg-[#F8FAFC] dark:bg-slate-950 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#D946EF]/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Categoria</label>
                <select 
                  name="category" value={formData.category} onChange={handleInputChange}
                  className="w-full bg-[#F8FAFC] dark:bg-slate-950 border-none rounded-2xl px-5 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#D946EF]/20 appearance-none"
                >
                  <option value="">Selecione...</option>
                  <option value="pijamas">Pijamas</option>
                  <option value="lingerie">Lingerie</option>
                  <option value="acessorios">Acessórios</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Descrição Detalhada</label>
                <textarea 
                  name="description" value={formData.description} onChange={handleInputChange}
                  rows="3" placeholder="Detalhes do tecido, modelagem..."
                  className="w-full bg-[#F8FAFC] dark:bg-slate-950 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#D946EF]/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* SESSÃO 2: PRECIFICAÇÃO (INTELIGÊNCIA) */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="h-5 w-5 text-[#D946EF]" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Precificação Automática</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">Custo Base (R$)</label>
                <input 
                  type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange}
                  placeholder="0.00" step="0.01"
                  className="w-full bg-[#F8FAFC] dark:bg-slate-950 border-none rounded-2xl px-5 py-4 text-lg font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#D946EF]/20"
                />
              </div>
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-[#D946EF] uppercase tracking-widest ml-2">Margem Desejada (%)</label>
                <input 
                  type="number" name="margin" value={formData.margin} onChange={handleInputChange}
                  placeholder="30"
                  className="w-full bg-[#D946EF]/10 dark:bg-[#D946EF]/20 border-none rounded-2xl px-5 py-4 text-lg font-black text-[#D946EF] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-green-500 uppercase tracking-widest ml-2">Preço Final (R$)</label>
                <input 
                  type="number" name="salePrice" value={formData.salePrice} readOnly
                  placeholder="0.00"
                  className="w-full bg-green-50 dark:bg-green-500/10 border-none rounded-2xl px-5 py-4 text-lg font-black text-green-600 dark:text-green-400 outline-none cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          
        </form>
      </div>
    </div>
  );
}