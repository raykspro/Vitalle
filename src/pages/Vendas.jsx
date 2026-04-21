import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShoppingCart, Plus, Trash2, X, CheckCircle2, Loader2, User, CreditCard } from 'lucide-react';
import { formatPriceDisplay } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Vendas = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '', items: [], discount: 0, payment_method: 'PIX'
  });

  useEffect(() => { loadInitialData(); }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [custs, prods] = await Promise.all([
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('products').select('id, name, sell_price_cents, stock_quantity')
      ]);
      setCustomers(custs.data || []);
      setProducts(prods.data || []);
    } catch (err) {
      toast.error("Erro ao carregar dados da Vitalle.");
    }
    setLoading(false);
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const updateItem = (index, prodId) => {
    const product = products.find(p => p.id === prodId);
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_id: prodId,
      unit_price: product ? product.sell_price_cents / 100 : 0
    };
    setFormData({ ...formData, items: updatedItems });
  };

  const totalAmount = formData.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
  const finalAmount = totalAmount - formData.discount;

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!formData.customer_id || formData.items.length === 0) return toast.error("Mestre, preencha o cliente e os itens!");

    setLoading(true);
    try {
      // 1. Criar a Venda
      const { data: sale, error: saleErr } = await supabase.from('sales').insert([{
        customer_id: formData.customer_id,
        total_amount: totalAmount,
        final_amount: finalAmount,
        payment_method: formData.payment_method,
        user_id: user?.id,
        status: 'completed'
      }]).select().single();

      if (saleErr) throw saleErr;

      // 2. Vincular Itens (Histórico de Compras)
      const saleItems = formData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      await supabase.from('sale_items').insert(saleItems);

      toast.success("VENDA REGISTRADA NO HISTÓRICO!", { icon: <CheckCircle2 className="text-green-500" /> });
      setFormMode(false);
      setFormData({ customer_id: '', items: [], discount: 0, payment_method: 'PIX' });
    } catch (err) {
      toast.error("Erro crítico ao salvar venda.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-8 bg-[#FAFAFA] min-h-screen">
      <header className="flex justify-between items-center border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter">Vitalle</h1>
          <p className="text-xs font-bold text-[#D946EF] uppercase tracking-[0.4em]">Boutique Luxury • PDV</p>
        </div>
        <Button 
          onClick={() => setFormMode(!formMode)}
          className={cn("h-16 px-8 rounded-2xl font-black italic text-lg transition-all shadow-xl", 
          formMode ? "bg-slate-800" : "bg-[#D946EF] hover:bg-[#C026D3] text-white")}
        >
          {formMode ? <X className="mr-2"/> : <Plus className="mr-2"/>}
          {formMode ? "CANCELAR" : "NOVA VENDA"}
        </Button>
      </header>

      {formMode ? (
        <form onSubmit={handleFinalize} className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
          {/* Coluna Esquerda: Dados e Itens */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cliente Vitalle</Label>
                  <Select value={formData.customer_id} onValueChange={v => setFormData({...formData, customer_id: v})}>
                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-none font-bold text-slate-700">
                      <SelectValue placeholder="Selecione o Cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={v => setFormData({...formData, payment_method: v})}>
                    <SelectTrigger className="h-14 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão de Crédito/Débito</SelectItem>
                      <SelectItem value="Dinheiro">Espécie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <h3 className="text-xs font-black text-[#D946EF] uppercase italic">Produtos na Sacola</h3>
                  <Button type="button" onClick={addItem} variant="ghost" className="text-[10px] font-black text-slate-400">
                    + ADICIONAR ITEM
                  </Button>
                </div>
                {formData.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex-1">
                      <Select value={item.product_id} onValueChange={v => updateItem(idx, v)}>
                        <SelectTrigger className="bg-white border-none h-10 font-bold text-xs">
                          <SelectValue placeholder="Escolha o produto..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.stock_quantity} un)</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <input 
                      type="number" 
                      className="w-16 h-10 rounded-lg border-none bg-white text-center font-black text-xs"
                      value={item.quantity}
                      onChange={e => {
                        const newItems = [...formData.items];
                        newItems[idx].quantity = parseInt(e.target.value) || 0;
                        setFormData({...formData, items: newItems});
                      }}
                    />
                    <div className="w-24 text-right font-black text-slate-700 italic">
                      R$ {(item.unit_price * item.quantity).toFixed(2)}
                    </div>
                    <button type="button" onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Resumo Financeiro */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
              <h3 className="text-center font-black italic uppercase tracking-widest text-slate-500 text-xs">Resumo do Pedido</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-slate-400 text-sm font-bold">
                  <span>Subtotal</span>
                  <span>R$ {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#D946EF] text-sm font-black italic uppercase">Desconto R$</span>
                  <input 
                    type="number" 
                    className="bg-white/10 border-none w-20 rounded-lg px-3 py-1 font-black text-right outline-none"
                    value={formData.discount}
                    onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase text-center mb-1">Total a Receber</p>
                  <p className="text-5xl font-black text-[#D946EF] italic text-center">R$ {finalAmount.toFixed(2)}</p>
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-16 rounded-2xl bg-white text-slate-900 hover:bg-[#D946EF] hover:text-white font-black italic text-xl transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : "FINALIZAR VENDA"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cards de métricas podem ser adicionados aqui como no seu design original */}
          <div className="col-span-3 bg-white p-20 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
            <ShoppingCart size={48} className="text-slate-100 mb-4" />
            <p className="text-slate-300 font-black italic uppercase">Pronto para a próxima venda, Mestre?</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendas;