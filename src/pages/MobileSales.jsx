import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import { LayoutContext } from '../components/Layout'; 
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ShoppingCart, Plus, Minus, Search, Download, TrendingUp, AlertCircle, Menu, User, Image as ImageIcon } from 'lucide-react';
import { toast } from "sonner";

const MobileSales = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const layoutContext = useContext(LayoutContext);
  const setMobileOpen = layoutContext?.setMobileOpen;

  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]); // NOVO: Lista de clientes
  const [selectedCustomerId, setSelectedCustomerId] = useState(null); // NOVO: Cliente da venda
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ today: 0, items: 0 });

  useEffect(() => {
    if (isMobile && setMobileOpen) setMobileOpen(false);
    fetchData();
    fetchTodayStats();
  }, [location, isMobile]);

  async function fetchData() {
    setLoading(true);
    try {
      // Busca Produtos e Clientes em paralelo para ganhar tempo
      const [prods, custs] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'active').order('name'),
        supabase.from('customers').select('id, name').order('name')
      ]);

      if (prods.error) throw prods.error;
      setProducts(prods.data || []);
      setCustomers(custs.data || []);
    } catch (err) {
      toast.error("Erro ao sincronizar dados do PDV");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data } = await supabase
      .from('sales')
      .select('total_amount') // Ajustado para bater com seu banco
      .gte('created_at', today.toISOString());
    
    const total = data?.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0) || 0;
    setStats({ today: total, items: data?.length || 0 });
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} no carrinho!`, { duration: 800 });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(i => i.qty > 0));
  };

  const totalSale = cart.reduce((acc, item) => acc + ((item.sale_price_cents / 100) * item.qty), 0);

  const finalizeSale = async () => {
    if (!selectedCustomerId) return toast.error("Selecione um cliente primeiro!");
    setLoading(true);
    try {
      const { error } = await supabase.from('sales').insert([{
        customer_id: selectedCustomerId,
        total_amount: totalSale,
        items: cart, // Armazena o snapshot dos itens vendidos
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success("VENDA REGISTRADA COM SUCESSO!");
      setCart([]);
      setSelectedCustomerId(null);
      setIsSaleOpen(false);
      fetchTodayStats();
    } catch (err) {
      toast.error("Erro ao processar venda.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* HEADER DINÂMICO */}
      <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen?.(true)}>
            <Menu size={24} className="text-slate-900" />
          </Button>
          <h1 className="text-xl font-black italic text-slate-900 tracking-tighter">PDV VITALLE</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer bg-slate-100 p-2 rounded-xl" onClick={() => setIsSaleOpen(true)}>
            <ShoppingCart size={22} className="text-slate-900" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#D946EF] text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
        {/* DASHBOARD MINI */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 p-4 rounded-[2rem] text-white">
            <p className="text-[9px] font-black uppercase text-slate-400">Vendas Hoje</p>
            <p className="text-lg font-black italic">R$ {stats.today.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black uppercase text-slate-400">Pedidos</p>
            <p className="text-lg font-black italic text-slate-900">{stats.items}</p>
          </div>
        </div>

        {/* BUSCA */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="O que vamos vender hoje?" 
            className="h-14 pl-12 rounded-2xl bg-white border-none shadow-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* GRID DE PRODUTOS COM FOTO */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {loading ? (
             <div className="col-span-full py-12 text-center animate-pulse">Sincronizando Vitrine...</div>
          ) : filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white p-2 rounded-3xl border border-slate-50 shadow-sm active:scale-95 transition-transform cursor-pointer overflow-hidden group"
              onClick={() => addToCart(product)}
            >
              <div className="aspect-square bg-slate-50 rounded-2xl mb-2 overflow-hidden relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon size={32}/></div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black">
                  R$ {(product.sale_price_cents / 100).toFixed(2)}
                </div>
              </div>
              <div className="px-1">
                <p className="text-[8px] font-black text-[#D946EF] uppercase truncate">{product.category}</p>
                <h3 className="font-bold text-slate-800 text-xs leading-tight line-clamp-1">{product.name}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DRAWER DO CARRINHO & CLIENTE */}
      <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="p-6 bg-white space-y-6">
            <DialogTitle className="text-2xl font-black italic uppercase text-slate-900 tracking-tighter">Checkout</DialogTitle>
            
            {/* SELEÇÃO DE CLIENTE */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                <User size={12} /> Vincular Cliente
              </label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none outline-none">
                  <SelectValue placeholder="Selecione o comprador" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* ITENS NO CARRINHO */}
            <div className="max-h-[30vh] overflow-y-auto space-y-3 pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{item.name}</p>
                    <p className="text-[10px] font-black text-[#D946EF]">R$ {(item.sale_price_cents / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl p-1 shadow-sm">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-50"><Minus size={14}/></button>
                    <span className="font-black text-sm">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-slate-900 text-white rounded-lg"><Plus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ DE FECHAMENTO */}
          <div className="p-6 bg-slate-900 text-white space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase font-black text-[10px]">Total do Pedido</span>
              <span className="text-3xl font-black italic tracking-tighter">
                R$ {totalSale.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Button 
              disabled={cart.length === 0 || !selectedCustomerId || loading}
              onClick={finalizeSale}
              className="w-full h-16 rounded-2xl bg-[#D946EF] hover:bg-[#C026D3] text-white font-black uppercase italic tracking-widest text-lg shadow-xl disabled:opacity-30"
            >
              {loading ? 'PROCESSANDO...' : 'FECHAR VENDA'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileSales;