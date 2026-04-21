import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createCompleteSale } from '../api/finance';
import { ShoppingCart, Plus, Trash2, X, CheckCircle2, Loader2 } from 'lucide-react';
import { formatPriceDisplay, parsePriceToCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { cn } from "@/lib/utils"; 

const Vendas = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ total: 0, comissoes: 0n });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '', items: [], discount: 0, payment_method: 'PIX', notes: ''
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [custs, prods, salesStats] = await Promise.all([
        supabase.from('customers').select('id, name'),
        supabase.from('products').select('*'),
        supabase.from('sales').select('commission_cents')
      ]);
      setCustomers(custs.data || []);
      setProducts(prods.data || []);
      
      const totalComissoes = salesStats.data?.reduce((sum, s) => sum + BigInt(s?.commission_cents ?? 0), 0n) || 0n;
      setStats({ total: salesStats.data?.length || 0, comissoes: totalComissoes });
    } catch (error) { 
      console.error(error);
      toast.error("Erro na sincronização"); 
    }
    setLoading(false);
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0, total: 0 }]
    }));
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      const price = prod ? (prod.sell_price_cents / 100) : 0;
      items[index] = { 
        ...items[index], 
        product_id: value, 
        unit_price: price,
        total: price * items[index].quantity
      };
    } else {
      items[index][field] = value;
      if (field === 'quantity') {
        items[index].total = items[index].unit_price * items[index].quantity;
      }
    }
    setFormData({...formData, items});
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = totalAmount - formData.discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || formData.items.length === 0) return toast.error("A sacola está vazia!");
    
    setLoading(true);
    try {
      const salePayload = {
        ...formData,
        total_amount: totalAmount,
        final_amount: finalAmount,
        commission_cents: Number(parsePriceToCents((finalAmount * 0.1).toString()))
      };
      await createCompleteSale(salePayload, user.id);
      toast.success("VENDA FINALIZADA!");
      setFormMode(false);
      setFormData({ customer_id: '', items: [], discount: 0, payment_method: 'PIX', notes: '' });
      loadData();
    } catch (err) { 
      toast.error("Erro ao salvar venda."); 
    }
    setLoading(false);
  };

  if (loading && !formMode) return <div className="p-20 text-center font-black animate-pulse text-slate-200 italic uppercase">Vitalle Carregando...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 min-h-screen pb-24">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Vitalle Vendas</h1>
          <p className="text-[10px] font-bold text-[#D946EF] tracking-[0.3em] uppercase italic">Operação de Caixa</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Comissões Acumuladas</p>
            <p className="text-2xl font-black text-green-500 italic">{formatPriceDisplay(stats.comissoes)}</p>
        </div>
      </header>

      {/* Botão de Ação Corrigido - Menor e Elegante */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button 
          onClick={() => setFormMode(!formMode)} 
          className={cn(
            "h-14 rounded-2xl text-sm font-black transition-all shadow-lg uppercase italic", 
            formMode ? "bg-slate-800" : "bg-[#D946EF] hover:bg-[#C026D3] text-white"
          )}
        >
          {formMode ? <X className="mr-2 w-4 h-4"/> : <Plus className="mr-2 w-4 h-4"/>}
          {formMode ? "CANCELAR" : "NOVA VENDA"}
        </Button>
        <div className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center justify-between shadow-sm">
            <span className="font-black text-slate-300 text-[10px] uppercase tracking-widest">Vendas Registradas</span>
            <span className="text-3xl font-black italic text-slate-900">{stats.total}</span>
        </div>
      </div>

      {formMode && (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-50 space-y-8 animate-in slide-in-from-bottom-2">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Cliente</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Selecione o comprador" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 italic">Pagamento</Label>
              <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                <Label className="text-[10px] font-black uppercase text-[#D946EF] ml-2 italic">Itens da Sacola</Label>
                <Button type="button" onClick={addItem} variant="ghost" className="text-[10px] font-black text-slate-400 hover:text-[#D946EF]">
                  + ADICIONAR PRODUTO
                </Button>
            </div>
            
            <div className="space-y-3">
              {formData.items.length === 0 ? (
                <p className="text-center py-10 text-slate-200 font-bold italic text-xs uppercase">Aguardando produtos...</p>
              ) : formData.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  <div className="col-span-6">
                    <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)}>
                      <SelectTrigger className="bg-white border-none rounded-lg h-9 font-bold text-[11px]"><SelectValue placeholder="Escolha..." /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} 
                      className="w-full h-9 rounded-lg border-none bg-white px-2 text-center font-black text-xs placeholder:text-slate-200" 
                      placeholder="0" 
                    />
                  </div>
                  <div className="col-span-3 font-black text-slate-700 text-xs text-right italic">
                    R$ {item.total.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right">
                    <button type="button" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
            <div className="flex gap-8">
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subtotal</p>
                    <p className="text-lg font-bold">R$ {totalAmount.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-[9px] font-black text-[#D946EF] uppercase tracking-widest">Desconto</p>
                    <input 
                      type="number" 
                      value={formData.discount} 
                      onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} 
                      className="bg-white/10 border-none w-16 rounded-lg px-2 font-black text-sm outline-none placeholder:text-slate-700" 
                      placeholder="0.00"
                    />
                </div>
            </div>
            <div className="text-center md:text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Vitalle</p>
                <p className="text-4xl font-black italic text-[#D946EF]">R$ {finalAmount.toFixed(2)}</p>
            </div>
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full md:w-auto px-10 h-14 rounded-xl bg-white text-slate-900 hover:bg-[#D946EF] hover:text-white font-black italic transition-all"
            >
                {loading ? <Loader2 className="animate-spin" /> : "FINALIZAR VENDA"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Vendas;