import React, { useState, useEffect } from "react";
import { ShoppingBag, Save, Plus, Trash2, Loader2, Calendar, Truck, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parsePriceToCents,
  formatPriceDisplay
} from "@/lib/formatters";
import { supabase } from "../lib/supabaseClient";

export default function PurchaseOrder() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [supplier, setSupplier] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  // Itens da Ordem de Compra
  const [items, setItems] = useState([
    { product_id: "", color: "", size: "", quantity: "", cost_price: "" }
  ]);

  useEffect(() => {
    async function getProducts() {
      const { data } = await supabase.from('products').select('id, name');
      setProducts(data || []);
    }
    getProducts();
  }, []);

  const addItem = () => {
    setItems([...items, { product_id: "", color: "", size: "", quantity: 0, cost_price: 0 }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return formatPriceDisplay(addCents(...items.map(item => {
      const qty = Number(item.quantity) || 0;
      const costCents = parsePriceToCents(item.cost_price);
      return BigInt(Math.round(qty)) * costCents;
    })));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. LANÇAMENTO NO FINANCEIRO (Contas a Pagar)
      const { error: finError } = await supabase.from('financial_records').insert([{
        description: `Ordem de Compra: ${supplier}`,
        amount: calculateTotal(),
        due_date: dueDate,
        status: 'Pendente',
        type: 'Despesa'
      }]);
      if (finError) throw finError;

      // 2. ATUALIZAÇÃO DO ESTOQUE (Loop por item)
      for (const item of items) {
        const { error: invError } = await supabase.from('inventory').insert([{
          product_id: item.product_id,
          color: item.color,
          size: item.size,
          quantity: item.quantity
        }]);
        if (invError) throw invError;
      }

      alert("ORDEM DE COMPRA FINALIZADA COM SUCESSO! 💎 Estoque e Financeiro atualizados.");
      setItems([{ product_id: "", color: "", size: "", quantity: 0, cost_price: 0 }]);
      setSupplier("");
      setDueDate("");
      
    } catch (err) {
      alert("Erro ao processar ordem: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col gap-2">
        <div className="h-1.5 w-16 bg-magenta rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Ordem de Compra</h1>
        <p className="text-slate-500 font-medium italic">Substituição de Notas Fiscais e Entrada de Estoque.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cabeçalho da Ordem */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 tracking-widest uppercase ml-2">Fornecedor</label>
            <input 
              required
              value={supplier}
              onChange={e => setSupplier(e.target.value)}
              placeholder="Digite o nome do fornecedor..." 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-magenta/30" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-magenta tracking-widest uppercase ml-2 italic">Data de Vencimento (Boleto)</label>
            <input 
              required
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-500" 
            />
          </div>
        </div>

        {/* Lista de Itens */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-black text-slate-900 tracking-[0.2em] uppercase flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-magenta" /> Itens da Grade
            </h2>
            <p className="text-[10px] font-black text-slate-400">TOTAL DA ORDEM: <span className="text-slate-900">{calculateTotal()}</span></p>
          </div>

          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end bg-slate-50 p-6 rounded-3xl animate-in slide-in-from-right-2">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Modelo</label>
                <select 
                  required
                  className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold"
                  onChange={e => updateItem(index, 'product_id', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Cor</label>
                <input placeholder="Ex: Pink" className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" onChange={e => updateItem(index, 'color', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Tamanho</label>
                <input placeholder="Ex: M" className="w-full bg-white border-none rounded-xl p-3 text-xs font-bold" onChange={e => updateItem(index, 'size', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Qtd / Custo</label>
                <div className="flex gap-1">
                  <input type="number" placeholder="Qtd" className="w-1/2 bg-white border-none rounded-xl p-3 text-xs font-bold" onChange={e => updateItem(index, 'quantity', e.target.value)} />
                  <input type="number" step="0.01" placeholder="R$" className="w-1/2 bg-white border-none rounded-xl p-3 text-xs font-bold" onChange={e => updateItem(index, 'cost_price', e.target.value)} />
                </div>
              </div>
              <button type="button" onClick={() => removeItem(index)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          ))}

          <button 
            type="button" 
            onClick={addItem}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 tracking-widest uppercase hover:border-magenta hover:text-magenta transition-all"
          >
            + Adicionar novo item na grade
          </button>
        </div>

        <div className="flex justify-end">
          <button 
            disabled={loading}
            className="bg-slate-900 text-white px-16 py-5 rounded-2xl font-black text-[10px] tracking-[0.3em] hover:bg-magenta transition-all shadow-xl flex items-center gap-3"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {loading ? "PROCESSANDO..." : "CONCLUIR E LANÇAR NO FINANCEIRO"}
          </button>
        </div>
      </form>
    </div>
  );
}