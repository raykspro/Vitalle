import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Plus, Trash2, X, CheckCircle2, Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Vendas = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formMode, setFormMode] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: '', 
    items: [], 
    discount: 0, 
    payment_method: 'PIX'
  });

  useEffect(() => { loadVitalleData(); }, []);

  async function loadVitalleData() {
    try {
      const [custs, prods] = await Promise.all([
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('products').select('id, name, sell_price_cents, stock_quantity')
      ]);
      setCustomers(custs.data || []);
      setProducts(prods.data || []);
    } catch (err) {
      toast.error("Erro na conexão com a base Vitalle.");
    } finally {
      setInitialLoading(false);
    }
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
      unit_price: product ? (product.sell_price_cents / 100) : 0
    };
    setFormData({ ...formData, items: updatedItems });
  };

  const totalAmount = formData.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
  const finalAmount = totalAmount - formData.discount;

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) return toast.error("Selecione o Cliente, mestre!");
    if (formData.items.length === 0) return toast.error("A sacola está vazia!");

    setLoading(true);
    try {
      // 1. Registrar a Venda Principal
      const { data: sale, error: saleErr } = await supabase.from('sales').insert([{
        customer_id: formData.customer_id,
        total_amount: finalAmount, // Usando total_amount para o valor final com desconto
        payment_method: formData.payment_method,
        status: 'completed'
      }]).select().single();

      if (saleErr) throw saleErr;

      // 2. Registrar Itens e Vincular ao Cliente
      const saleItems = formData.items.map(item => ({
        sale_id: sale.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price
      }));

      const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems);
      if (itemsErr) throw itemsErr;

      // 3. Baixa no Estoque (Opcional, mas recomendado)
      for (const item of formData.items) {
        const prod = products.find(p => p.id === item.product_id);
        if (prod) {
          await supabase.from('products')
            .update({ stock_quantity: prod.stock_quantity - item.quantity })
            .eq('id', item.product_id);
        }
      }

      toast.success("VITALLE: VENDA CONCLUÍDA!", {
        style: { background: '#D946EF', color: '#fff' }
      });
      
      setFormMode(false);
      setFormData({ customer_id: '', items: [], discount: 0, payment_method: 'PIX' });
      loadVitalleData(); // Recarrega para atualizar estoque na tela
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar venda no banco.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-[#D946EF]" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8 bg-[#FDFDFF] min-h-screen">
      <header className="flex justify-between items-end border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-7xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Vitalle</h1>
          <p className="text-sm font-bold text-[#D946EF] uppercase tracking-[0.5em] mt-2 ml-1">Boutique Luxury Store</p>
        </div>
        <Button 
          onClick={() => setFormMode(!formMode)}
          className={cn("h-20 px-12 rounded-full font-black italic text-xl transition-all shadow-2xl uppercase", 
          formMode ? "bg-slate-200 text-slate-600" : "bg-[#D946EF] hover:bg-black text-white")}
        >
          {formMode ? "Fechar" : "Nova Venda"}
        </Button>
      </header>

      {formMode ? (
        <form onSubmit={handleFinalize} className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in zoom-in-95 duration-300">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Selecionar Mestre Cliente</Label>
                  <Select value={formData.customer_id} onValueChange={v => setFormData({...formData, customer_id: v})}>
                    <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#D946EF] font-bold text-lg">
                      <SelectValue placeholder="Quem está comprando?" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">Meio de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={v => setFormData({...formData, payment_method: v})}>
                    <SelectTrigger className="h-16 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-[#D946EF] font-bold text-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX" className="font-bold text-green-600">PIX (Imediato)</SelectItem>
                      <SelectItem value="Cartão" className="font-bold">Cartão de Crédito</SelectItem>
                      <SelectItem value="Dinheiro" className="font-bold text-amber-600">Espécie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
                  <h3 className="text-xl font-black text-slate-900 uppercase italic">Itens da Coleção</h3>
                  <Button type="button" onClick={addItem} className="bg-slate-900 text-white rounded-xl hover:bg-[#D946EF]">
                    <Plus className="mr-2" size={18}/> ADICIONAR PRODUTO
                  </Button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="group flex gap-4 items-center bg-white p-6 rounded-3xl border-2 border-slate-50 hover:border-[#D946EF]/30 transition-all shadow-sm">
                      <div className="flex-1">
                        <Select value={item.product_id} onValueChange={v => updateItem(idx, v)}>
                          <SelectTrigger className="bg-slate-50 border-none h-12 font-bold">
                            <SelectValue placeholder="Escolha o modelo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                                {p.name} — {p.stock_quantity} em estoque
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 rounded-xl px-4 h-12">
                        <Label className="text-[10px] font-black uppercase">Qtd</Label>
                        <input 
                          type="number" 
                          min="1"
                          className="w-12 bg-transparent border-none text-center font-black text-lg focus:ring-0"
                          value={item.quantity}
                          onChange={e => {
                            const newItems = [...formData.items];
                            newItems[idx].quantity = parseInt(e.target.value) || 1;
                            setFormData({...formData, items: newItems});
                          }}
                        />
                      </div>
                      <div className="w-32 text-right font-black text-2xl text-slate-900 italic">
                        R$ {(item.unit_price * item.quantity).toFixed(2)}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, items: formData.items.filter((_, i) => i !== idx)})}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={20}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShoppingBag size={120} />
              </div>
              
              <h3 className="font-black italic uppercase tracking-[0.3em] text-[#D946EF] text-sm mb-10">Checkout Vitalle</h3>
              
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center text-slate-400 font-bold">
                  <span>Subtotal</span>
                  <span className="text-xl">R$ {totalAmount.toFixed(2)}</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-[#D946EF]">Desconto Especial (R$)</Label>
                  <input 
                    type="number" 
                    className="bg-white/10 border-2 border-white/5 w-full h-14 rounded-2xl px-6 font-black text-2xl text-white outline-none focus:border-[#D946EF] transition-all"
                    value={formData.discount}
                    onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="pt-10 border-t border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Valor Final do Pedido</p>
                  <p className="text-6xl font-black text-white italic leading-none">
                    <span className="text-[#D946EF] text-2xl not-italic mr-2">R$</span>
                    {finalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading || formData.items.length === 0}
                className="w-full h-24 rounded-3xl bg-[#D946EF] hover:bg-white hover:text-black text-white font-black italic text-2xl transition-all shadow-xl mt-10 group"
              >
                {loading ? <Loader2 className="animate-spin" /> : (
                  <span className="flex items-center justify-center gap-3">
                    CONCLUIR VENDA <CheckCircle2 className="group-hover:text-[#D946EF]" />
                  </span>
                )}
              </Button>
            </div>
            
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Sistema Vitalle v3.0 • Acesso Master
            </p>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="col-span-3 bg-white p-32 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-[#D946EF]/20 transition-all" onClick={() => setFormMode(true)}>
            <div className="p-8 rounded-full bg-slate-50 text-slate-200 group-hover:text-[#D946EF] group-hover:bg-[#D946EF]/5 transition-all mb-6">
              <ShoppingBag size={80} />
            </div>
            <p className="text-slate-400 font-black italic uppercase text-2xl tracking-tighter">Aguardando comando para nova venda, Mestre.</p>
            <p className="text-[#D946EF] font-bold text-sm uppercase tracking-widest mt-4 opacity-0 group-hover:opacity-100 transition-all">Clique para iniciar</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vendas;