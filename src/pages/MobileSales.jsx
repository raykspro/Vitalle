import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import LayoutContext from '../lib/LayoutContext';
import { supabase } from '../lib/supabaseClient';
import { formatPriceDisplay } from '../lib/formatters';
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
  const { setMobileOpen } = React.useContext(LayoutContext);
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
    fetchStock();
    setStats({ today: 1250.80, items: 45 });
  }, [isMobile, location.pathname, setMobileOpen]);

  const fetchStock = async () => {
    const { data } = await supabase
      .from('stock_items')
      .select('*, products(sell_price_cents)')
      .gt('quantity', 0);
    setProducts(data || []);
  };

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
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
    const price = item.products?.sell_price_cents || 0;
    return acc + (price * item.qty);
  }, 0);

  const finalizeSale = async () => {
    setLoading(true);
    try {
      for (const item of cart) {
        await supabase.from('stock_items').update({ quantity: item.quantity - item.qty }).eq('id', item.id);
      }
      alert("Venda Finalizada!");
      setCart([]);
      setIsSaleOpen(false);
      fetchStock();
    } catch (e) {
      alert("Erro: " + e.message);
    }
    setLoading(false);
  };

  return (
    <div className="w-full box-border mobile-sales-fullscreen bg-[#F8FAFC] min-h-screen flex flex-col overflow-hidden p-0 pt-4 lg:pt-0 lg:p-4">
      {/* Header Fixo e Automático */}
      <div className="p-4 sm:p-6 bg-white border-b border-slate-100 rounded-b-[2.5rem] shadow-sm max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black italic text-slate-800 uppercase tracking-tighter">VITALLE NEXUS</h1>
            <Badge className="bg-green-500/10 text-green-600 border-none">SISTEMA ONLINE</Badge>
          </div>
          {installPrompt && (
            <Button onClick={handleInstall} variant="ghost" className="rounded-full text-[#D946EF] p-2">
              <Download size={24} className="animate-bounce" />
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-3xl text-white">
            <p className="text-[10px] uppercase font-bold text-slate-400">Vendas Hoje</p>
            <p className="text-xl font-black italic">R$ {stats.today.toFixed(2)}</p>
          </div>
          <div className="bg-[#D946EF] p-4 rounded-3xl text-white">
            <p className="text-[10px] uppercase font-bold text-purple-200">Estoque</p>
            <p className="text-xl font-black italic">{stats.items} un</p>
          </div>
        </div>
      </div>

      {/* Feed de Movimentações com Scroll Interno */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32 max-w-md mx-auto">
        <h2 className="text-xs font-black uppercase text-slate-400 italic flex items-center gap-2">
          <TrendingUp size={14} /> Atividade Recente
        </h2>
        {[1, 2, 3, 4, 5].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-50 shadow-sm w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#D946EF]">
                <CheckCircle2 size={16} />
              </div>
              <p className="text-sm font-bold text-slate-700 uppercase">Venda #00{i+1}</p>
            </div>
            <p className="font-black text-slate-800 italic text-sm">R$ 159,80</p>
          </div>
        ))}
      </div>

      {/* BOTÃO NOVA VENDA - SEMPRE NO ALCANCE DO DEDO */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pb-[env(safe-area-inset-bottom)]">
        <Button 
          onClick={() => setIsSaleOpen(true)}
          className="w-full h-20 rounded-[2rem] bg-[#D946EF] hover:bg-[#C026D3] shadow-2xl shadow-purple-300 text-xl font-black uppercase italic tracking-tighter"
        >
          <ShoppingCart className="mr-2" /> NOVA VENDA
        </Button>
      </div>

      {/* Checkout Otimizado */}
      <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
        <DialogContent className="sm:max-w-md h-[100dvh] flex flex-col p-0 rounded-none border-none">
          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic text-slate-800">Checkout</DialogTitle>
            </DialogHeader>

            <div className="relative">
              <Search className="absolute left-4 top-4 text-slate-400" size={20} />
              <Input 
                placeholder="Buscar item..." 
                className="pl-12 h-14 rounded-2xl bg-slate-100 border-none text-lg"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {search && (
              <div className="space-y-2">
                {products.filter(p => p.product_name.toLowerCase().includes(search.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => { addToCart(p); setSearch(''); }} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="text-sm font-bold uppercase">{p.product_name}</p>
                      <p className="text-[10px] text-[#D946EF] font-black uppercase">{p.size} • R$ {formatPriceDisplay(p.products.sell_price_cents)}</p>
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
                    <p className="text-sm font-bold text-slate-700 uppercase leading-tight">{item.product_name}</p>
                    <p className="text-xs text-[#D946EF] font-black italic">R$ {formatPriceDisplay(item.products.sell_price_cents)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg"><Minus size={14}/></button>
                    <span className="font-black w-4 text-center">{item.qty}</span>
                    <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-[#D946EF] rounded-lg text-white"><Plus size={14}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-10 bg-slate-900 space-y-6 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase font-black text-xs">Total</span>
              <span className="text-2xl sm:text-3xl font-black text-white italic">R$ {formatPriceDisplay(totalSale)}</span>
            </div>
            <Button 
              disabled={cart.length === 0 || loading}
              onClick={finalizeSale}
              className="w-full h-16 rounded-2xl bg-[#D946EF] hover:bg-[#C026D3] text-lg font-black uppercase italic shadow-2xl shadow-purple-500"
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