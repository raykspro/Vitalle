import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import { LayoutContext } from '../components/Layout'; 
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { usePWA } from '../lib/PWAContext';
import { 
  ShoppingCart, Plus, Minus, Search, 
  Download, TrendingUp, AlertCircle, Menu 
} from 'lucide-react';
import { toast } from "sonner";

const MobileSales = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const layoutContext = useContext(LayoutContext);
  const setMobileOpen = layoutContext?.setMobileOpen;

  const { installPrompt } = usePWA();
  
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [stats, setStats] = useState({ today: 0, items: 0 });

  useEffect(() => {
    if (isMobile && setMobileOpen) {
      setMobileOpen(false);
    }
    fetchProducts();
    fetchTodayStats();
  }, [location, isMobile, setMobileOpen]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active') 
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
      setDbError(false);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      const total = data?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0;
      setStats({ today: total, items: data?.length || 0 });
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} adicionado!`);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const totalSale = cart.reduce((acc, item) => {
    const price = (item.sale_price_cents || 0) / 100;
    return acc + (price * item.qty);
  }, 0);

  const finalizeSale = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.from('sales').insert([{
        total_amount: totalSale,
        items: cart,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;

      toast.success("VENDA FINALIZADA COM SUCESSO!");
      setCart([]);
      setIsSaleOpen(false);
      fetchTodayStats();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar venda.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] overflow-hidden">
      {/* HEADER PDV */}
      <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden text-[#D946EF]"
            onClick={() => setMobileOpen?.(true)}
          >
            <Menu size={24} />
          </Button>
          <div>
            <h1 className="text-xl font-black italic text-[#D946EF] tracking-tighter">PDV VITALLE</h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Operação de Vendas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {installPrompt && (
            <Button onClick={installPrompt} variant="outline" size="sm" className="rounded-full border-[#D946EF] text-[#D946EF] text-[10px] font-black h-8">
              <Download size={14} className="mr-1" /> INSTALAR
            </Button>
          )}
          <div className="relative cursor-pointer" onClick={() => setIsSaleOpen(true)}>
            <ShoppingCart className="text-slate-800" size={24} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#D946EF] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                {cart.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH & STATS */}
      <div className="p-4 space-y-4 overflow-y-auto pb-32">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <TrendingUp size={16} className="text-[#D946EF] mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Hoje</p>
            <p className="text-lg font-black italic">R$ {stats.today.toFixed(2)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <ShoppingCart size={16} className="text-[#D946EF] mb-2" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Pedidos</p>
            <p className="text-lg font-black italic">{stats.items}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Buscar produto ou categoria..." 
            className="h-14 pl-12 rounded-2xl bg-white border-slate-100 font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* LISTA DE PRODUTOS */}
        <div className="grid grid-cols-1 gap-3">
          {loading ? (
             <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-[#D946EF] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400 font-bold italic text-sm">Sincronizando estoque...</p>
             </div>
          ) : filteredProducts.map(product => (
            <div 
              key={product.id} 
              className="bg-white p-3 rounded-2xl border border-slate-50 flex items-center gap-4 shadow-sm active:scale-95 transition-transform cursor-pointer" 
              onClick={() => addToCart(product)}
            >
              <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200"><ShoppingCart size={20}/></div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-[#D946EF] uppercase tracking-tighter">{product.category || 'Geral'}</p>
                <h3 className="font-bold text-slate-800 leading-tight">{product.name}</h3>
                <p className="font-black text-slate-900 italic">R$ {((product.sale_price_cents || 0) / 100).toFixed(2)}</p>
              </div>
              <Button size="icon" className="rounded-xl bg-slate-50 text-slate-400 hover:bg-[#D946EF] hover:text-white transition-colors">
                <Plus size={20} />
              </Button>
            </div>
          ))}

          {!loading && filteredProducts.length === 0 && !dbError && (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-bold italic">Nenhum produto disponível.</p>
            </div>
          )}

          {dbError && (
            <div className="p-8 text-center space-y-3">
              <AlertCircle size={40} className="mx-auto text-red-400" />
              <p className="text-slate-500 font-bold italic">Erro ao conectar com o banco.</p>
              <Button variant="outline" onClick={fetchProducts} className="rounded-xl font-bold">Tentar Novamente</Button>
            </div>
          )}
        </div>
      </div>

      {/* DRAWER DO CARRINHO */}
      <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-t-[2.5rem] border-none">
          <div className="p-6 bg-white max-h-[70vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Carrinho</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs font-black text-[#D946EF]">R$ {((item.sale_price_cents || 0) / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm"><Minus size={12}/></button>
                    <span className="font-black text-xs w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-[#D946EF] rounded-lg text-white shadow-sm"><Plus size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-900 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 uppercase font-black text-[10px]">Total Venda</span>
              <span className="text-2xl font-black text-white italic">R$ {totalSale.toFixed(2)}</span>
            </div>
            <Button 
              disabled={cart.length === 0 || loading}
              onClick={finalizeSale}
              className="w-full h-14 rounded-2xl bg-[#D946EF] hover:bg-[#C026D3] text-base font-black uppercase italic"
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