import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, ShoppingBag, Truck, Calendar, DollarSign } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { formatPriceDisplay, parsePriceToCents } from "@/lib/formatters";
import { toast } from "sonner";

export default function PurchaseOrder() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    product_id: "",
    supplier_id: "",
    quantity: "",
    unit_cost: "",
    status: "Pendente",
    expected_at: ""
  });

  // 1. CARREGAR DADOS PARA CONECTAR OS CAMINHOS
  async function loadInitialData() {
    setLoadingData(true);
    try {
      const [prodRes, suppRes, orderRes] = await Promise.all([
        supabase.from('products').select('id, name, brand, cost_price_cents'),
        supabase.from('suppliers').select('id, name'),
        supabase.from('purchase_orders').select(`
          *,
          products (name, brand),
          suppliers (name)
        `).order('created_at', { ascending: false })
      ]);

      if (prodRes.error) throw prodRes.error;
      if (suppRes.error) throw suppRes.error;
      if (orderRes.error) throw orderRes.error;

      setProducts(prodRes.data || []);
      setSuppliers(suppRes.data || []);
      setOrders(orderRes.data || []);
    } catch (error) {
      console.error("Erro na conexão:", error);
      toast.error("Erro ao conectar caminhos de dados");
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadInitialData();
  }, []);

  // 2. SALVAR ORDEM E ATUALIZAR ESTOQUE
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const costCents = parsePriceToCents(formData.unit_cost);
      const qty = parseInt(formData.quantity);

      // Inserir a Ordem
      const { error: orderError } = await supabase.from('purchase_orders').insert([{
        product_id: formData.product_id,
        supplier_id: formData.supplier_id,
        quantity: qty,
        unit_cost_cents: Number(costCents),
        total_cost_cents: Number(costCents) * qty,
        status: formData.status,
        expected_at: formData.expected_at
      }]);

      if (orderError) throw orderError;

      // SE O STATUS FOR 'RECEBIDO', JÁ ATUALIZA O ESTOQUE DO PRODUTO
      if (formData.status === "Recebido") {
        const { data: currentProd } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', formData.product_id)
          .single();

        const newQty = (currentProd?.stock_quantity || 0) + qty;

        await supabase
          .from('products')
          .update({ stock_quantity: newQty })
          .eq('id', formData.product_id);
      }

      toast.success("ORDEM REGISTRADA COM SUCESSO!");
      setShowForm(false);
      loadInitialData();
    } catch (error) {
      toast.error("Erro ao processar ordem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">ORDENS DE COMPRA</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase">Entrada de Mercadoria Vitalle</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-magenta text-white px-8 py-4 rounded-2xl font-black text-[11px] tracking-widest shadow-lg hover:scale-105 transition-all"
        >
          {showForm ? "CANCELAR" : "NOVA ENTRADA"}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-2xl space-y-6 animate-in slide-in-from-top-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PRODUTO */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peça Vitalle</label>
              <select 
                required
                className="input-vitalle w-full appearance-none"
                value={formData.product_id}
                onChange={e => setFormData({...formData, product_id: e.target.value})}
              >
                <option value="">Escolha a peça...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                ))}
              </select>
            </div>

            {/* FORNECEDOR */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fornecedor</label>
              <select 
                required
                className="input-vitalle w-full"
                value={formData.supplier_id}
                onChange={e => setFormData({...formData, supplier_id: e.target.value})}
              >
                <option value="">Escolha o fornecedor...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* QUANTIDADE */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantidade</label>
              <input 
                type="number" required className="input-vitalle w-full"
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: e.target.value})}
              />
            </div>

            {/* CUSTO UNITÁRIO */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custo Unit. (R$)</label>
              <input 
                type="number" step="0.01" required className="input-vitalle w-full"
                value={formData.unit_cost}
                onChange={e => setFormData({...formData, unit_cost: e.target.value})}
              />
            </div>

            {/* STATUS */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Ordem</label>
              <select 
                className="input-vitalle w-full"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <option value="Pendente">Pendente</option>
                <option value="Em Trânsito">Em Trânsito</option>
                <option value="Recebido">Recebido (Soma no Estoque)</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-vitalle w-full">
            {loading ? "PROCESSANDO..." : "CONFIRMAR ENTRADA DE ESTOQUE"}
          </button>
        </form>
      )}

      {/* LISTA DE ORDENS */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Produto / Fornecedor</th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Qtd</th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Total</th>
              <th className="p-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loadingData ? (
              <tr><td colSpan="4" className="p-20 text-center font-black text-slate-300">SINCRONIZANDO FLUXO...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="4" className="p-20 text-center text-slate-400 italic">Nenhuma ordem de compra ativa.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-slate-900 uppercase text-sm">{order.products?.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{order.suppliers?.name}</div>
                  </td>
                  <td className="p-6 font-mono text-sm">{order.quantity} un</td>
                  <td className="p-6 font-black text-magenta">{formatPriceDisplay(order.total_cost_cents)}</td>
                  <td className="p-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                      order.status === 'Recebido' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                    )}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}