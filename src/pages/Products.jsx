import React, { useState } from "react";
import { Plus, Archive, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabaseClient"; // CAMINHO AJUSTADO PARA O SEU PROJETO

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para o formulário
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");

  const categories = ["BABY DOLL", "BABY DOLL INFANTIL", "CAMISOLA"];

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Tenta inserir na tabela 'products'
      const { error } = await supabase
        .from('products') 
        .insert([
          { 
            name: nome, 
            category: categoria, 
            price: parseFloat(preco) 
          }
        ]);

      if (error) throw error;

      alert("PEÇA CADASTRADA COM SUCESSO! 💎");
      
      // Limpa os campos para o próximo cadastro
      setNome("");
      setCategoria("");
      setPreco("");
      setShowForm(false);
      
    } catch (error) {
      console.error("Erro na Vitalle:", error);
      alert("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Produtos</h1>
          <p className="text-slate-500 font-medium italic tracking-wide text-sm">Gestão de catálogo premium.</p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all shadow-lg active:scale-95",
            showForm ? "bg-slate-900 text-white" : "bg-magenta text-white shadow-magenta/20"
          )}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "FECHAR" : "NOVO PRODUTO"}
        </button>
      </div>

      {/* Formulário de Cadastro */}
      {showForm && (
        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-magenta/10 shadow-2xl animate-in slide-in-from-top-4 duration-500">
          <form onSubmit={handleSave} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-2">NOME DA PEÇA</label>
              <input 
                required
                type="text" 
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Baby Doll de Seda" 
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-magenta/30 transition-all placeholder:text-slate-300" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-2">CATEGORIA</label>
              <select 
                required
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-2xl p-5 text-sm font-bold focus:ring-2 focus:ring-magenta/30 transition-all appearance-none cursor-pointer"
              >
                <option value="">SELECIONE...</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 tracking-[0.2em] ml-2">PREÇO DE VENDA</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-magenta text-sm">R$</span>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="0,00" 
                  className="w-full bg-slate-50 border-none rounded-2xl p-5 pl-12 text-sm font-bold focus:ring-2 focus:ring-magenta/30 transition-all placeholder:text-slate-300" 
                />
              </div>
            </div>

            <div className="lg:col-span-3 flex justify-end">
              <button 
                disabled={loading}
                type="submit"
                className="bg-magenta text-white px-12 py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] shadow-xl shadow-magenta/30 hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {loading ? "ENVIANDO..." : "SALVAR NA VITALLE"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Indicador de Status */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-8 flex items-center gap-6 shadow-sm">
        <div className="bg-magenta/10 p-5 rounded-2xl text-magenta">
          <Archive className="h-7 w-7" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Status do Banco</p>
          <p className="text-xl font-black text-slate-900 tracking-tight">VITALLE CONECTADA AO SUPABASE</p>
        </div>
      </div>
    </div>
  );
}