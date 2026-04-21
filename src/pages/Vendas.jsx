import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createCompleteSale } from '../api/finance';
import { ShoppingCart, DollarSign, Plus, Trash2, User, X, CheckCircle2 } from 'lucide-react';
import { formatPriceDisplay, parsePriceToCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";

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
        supabase.from('sales').select('commission_cents, status')
      ]);
      setCustomers(custs.data || []);
      setProducts(prods.data || []);
      
      const totalComissoes = salesStats.data?.reduce((sum, s) => sum + BigInt(s?.commission_cents ?? 0), 0n) || 0n;
      setStats({ total: salesStats.data?.length || 0, comissoes: totalComissoes });
    } catch (error) { toast.error("Erro ao carregar dados"); }
    setLoading(false);
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0, total: 0, size: 'M', color: 'Preto' }]
    }));
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      items[index] = { 
        ...items[index], 
        product_id: value, 
        unit_price: prod?.price || 0,
        total: (prod?.price || 0) * items[index].quantity
      };
    } else {
      items[index][field] = value;
      if (field === 'quantity' || field === 'unit_price') {
        items[index].total = items[index].unit_price * items[index].quantity;
      }
    }
    setFormData({...formData, items});
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = totalAmount - formData.discount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || formData.items.length === 0) return toast.error("Preencha cliente e itens!");
    
    setLoading(true);
    try {
      const salePayload = {
        ...formData,
        total_amount: totalAmount,
        final_amount: finalAmount,
        commission_cents: Number(parsePriceToCents((finalAmount * 0.1).toString())) // 10% padrão se não houver
      };
      await createCompleteSale(salePayload, user.id);
      toast.success("VENDA REALIZADA!", { icon: <CheckCircle2 className="text-green-500"/> });
      setFormMode(false);
      setFormData({ customer_id: '', items: [], discount: 0, payment_method: 'PIX', notes: '' });
      loadData();
    } catch (err) { toast.error("Erro ao processar venda"); }
    setLoading(false);
  };

  if (loading && !formMode) return <div className="p-20 text-center font-black animate-pulse text-slate-300">SINCRONIZANDO VENDAS...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Vitalle Caixa</h1>
          <p className="text-[10px] font-bold text-magenta tracking-[0.3em] uppercase">Fluxo de Faturamento</p>
        </div>
        <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase">Comissões Acumuladas</p>
            <p className="text-2xl font-black text-green-500 italic">{formatPriceDisplay(stats.comissoes)}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button onClick={() => setFormMode(!formMode)} className={cn("h-20 rounded-[2rem] text-lg font-black transition-all shadow-xl", formMode ? "bg-slate-800" : "bg-magenta hover:scale-105 text-white")}>
          {formMode ? <X className="mr-2"/> : <ShoppingCart className="mr-2"/>}
          {formMode ? "CANCELAR" : "NOVA VENDA"}
        </Button>
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 flex items-center justify-between shadow-sm">
            <span className="font-black text-slate-400 text-xs uppercase tracking-widest">Total de Vendas</span>
            <span className="text-4xl font-black italic text-slate-900">{stats.total}</span>
        </div>
      </div>

      {formMode && (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cliente Vitalle</Label>
              <Select value={formData.customer_id} onValueChange={(v) => setFormData({...formData, customer_id: v})}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue placeholder="Selecione o comprador" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Pagamento</Label>
              <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
                <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black uppercase text-magenta ml-2">Itens da Sacola</Label>
                <Button type="button" onClick={addItem} variant="ghost" className="text-xs font-black text-slate-400 hover:text-magenta"><Plus size={14} className="mr-1"/> ADD ITEM</Button>
            </div>
            {formData.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="col-span-5">
                  <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)}>
                    <SelectTrigger className="bg-white border-none rounded-xl h-10 font-medium text-xs"><SelectValue placeholder="Produto" /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full h-10 rounded-xl border-none bg-white px-2 text-center font-bold text-xs" placeholder="Qtd" />
                </div>
                <div className="col-span-4 font-black text-slate-900 text-sm text-right">
                  {formatPriceDisplay(parsePriceToCents(item.total.toString()))}
                </div>
                <div className="col-span-1 text-right">
                  <button type="button" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex gap-8">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Subtotal</p>
                    <p className="text-xl font-bold">R$ {totalAmount.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-black text-magenta uppercase">Desconto</p>
                    <input type="number" value={formData.discount} onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} className="bg-white/10 border-none w-20 rounded-lg px-2 font-bold outline-none" />
                </div>
            </div>
            <div className="text-center md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Total Final</p>
                <p className="text-4xl font-black italic text-magenta">R$ {finalAmount.toFixed(2)}</p>
            </div>
            <Button type="submit" disabled={loading} className="w-full md:w-auto px-12 h-16 rounded-2xl bg-white text-slate-900 hover:bg-magenta hover:text-white font-black italic transition-all shadow-xl">
                {loading ? <Loader2 className="animate-spin" /> : "FINALIZAR VENDA"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Vendas;