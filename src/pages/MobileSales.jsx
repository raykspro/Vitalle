import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import { LayoutContext } from '../components/ui/Layout'; // Importação Corrigida
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { usePWA } from '../lib/PWAContext';
import { 
  ShoppingCart, Plus, Minus, Search, CheckCircle2, 
  Download, TrendingUp 
} from 'lucide-react';

const MobileSales = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { setMobileOpen } = useContext(LayoutContext);
  const { installPrompt } = usePWA();
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ today: 0, items: 0 });

  useEffect(() => {
    if (isMobile && location.pathname === '/vendas') {
      setMobileOpen(false);
    }
    fetchProducts();
    // Simulação de stats (depois pode vir do banco)
    setStats({ today: 0.00, items: 0 });
  }, [isMobile, location.pathname, setMobileOpen]);

  const fetchProducts = async () => {
    // Ajustado para a tabela 'products' em inglês
    const { data } = await supabase
      .from('products')
      .select('*')
      .gt('stock_current', 0);
    setProducts(data || []);
    setStats(prev => ({ ...prev, items: data?.length || 0 }));
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
    ).filter(i => i.qty > 0));
  };

  const totalSale = cart.reduce((acc, item) => {
    return acc + (item.price_sale * item.qty);
  }, 0);

  const finalizeSale = async () => {
    setLoading(true);
    try {
      // Registrar venda e atualizar estoque
      for (const item of cart) {
        await supabase
          .from('products')
          .update({ stock_current: item.stock_current - item.qty })
          .eq('id', item.id);
      }
      
      alert("Venda Finalizada, Mestre!");
      setCart([]);
      setIsSaleOpen(false);
      fetchProducts();
    } catch (e) {
      alert("Erro: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen flex flex-col p-0">
      {/* Header Estilo Boutique */}
      <div className="p-6 bg-white border-b border-slate-100 rounded-b-[2.5rem] shadow-sm max-w-md mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">VITALLE NEXUS</h1>
            <Badge className="bg-pink-500/10 text-[#D946EF] border-none">BOUTIQUE MESTRE</Badge>
          </div>
          {installPrompt && (
            <Button onClick={() => installPrompt.prompt()} variant="ghost" className="rounded-full text-[#D946EF]">
              <Download size={24} className="animate-bounce" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-3xl text-white">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Vendas Hoje</p>
            <p className="text-xl font-black italic">R$ {stats.today.toFixed(2)}</p>
          </div>
          <div className="bg-[#D946EF] p-4 rounded-3xl text-white">
            <p className="text-[10px] uppercase font-bold text-pink-200 tracking-widest">Itens Loja</p>
            <p className="text-xl font-black italic">{stats.items} un</p>
          </div>
        </div>
      </div>

      {/* Feed de Atividade */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 max-w-md mx-auto w-full">
        <h2 className="text-xs font-black uppercase text-slate-400 italic flex items-center gap-2">
          <TrendingUp size={14} /> Atividade Recente
        </h2>
        {/* Placeholder para vendas recentes */}
        <div className="bg-white p-6 rounded-2xl text-center border border-dashed border-slate-200 text-slate-400 text-sm">
          Nenhuma venda registrada agora.
        </div>
      </div>

      {/* Botão de Ação Flutuante */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pb-[env(safe-area-inset-bottom)] flex justify-center">
        <Button 
          onClick={() => setIsSaleOpen(true)}
          className="w-full max-w-md h-20 rounded-[2rem] bg-[#D946EF] hover:bg-[#C026D3] shadow-2xl shadow-pink-200 text-xl font-black uppercase italic tracking-tighter"
        >
          <ShoppingCart className="mr-2" /> NOVA VENDA
        </Button>
      </div>

      {/* Checkout Modal */}
      <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
        <DialogContent className="sm:max-w-md h-[100dvh] flex flex-col p-0 rounded-none border-none">
          <div className="p-8 space-y-6 flex-1 overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic text-slate-800">Checkout</DialogTitle>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-4 top-4 text-slate-400" size={20} />
              <Input 
                placeholder="Buscar produto..." 
                className="pl-12 h-14 rounded-2xl bg-slate-100 border-none text-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {search && (
              <div className="space-y-2">
                {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => { addToCart(p); setSearch(''); }} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100 active:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-sm font-bold uppercase">{p.name}</p>
                      <p className="text-[10px] text-[#D946EF] font-black uppercase tracking-widest">R$ {p.price_sale.toFixed(2)}</p>
                    </div>
                    <Plus size={20} className="text-[#D946EF]" />
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 uppercase leading-tight">{item.name}</p>
                    <p className="text-xs text-[#D946EF] font-black italic">R$ {item.price_sale.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm"><Minus size={14}/></button>
                    <span className="font-black w-4 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-[#D946EF] rounded-lg text-white shadow-sm"><Plus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-10 bg-slate-900 space-y-6 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase font-black text-xs">Total</span>
              <span className="text-3xl font-black text-white italic">R$ {totalSale.toFixed(2)}</span>
            </div>
            <Button 
              disabled={cart.length === 0 || loading}
              onClick={finalizeSale}
              className="w-full h-16 rounded-2xl bg-[#D946EF] hover:bg-[#C026D3] text-lg font-black uppercase italic shadow-2xl shadow-pink-500/20"
            >
              {loading ? 'PROCESSANDO...' : 'FINALIZAR VENDA'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileSales;