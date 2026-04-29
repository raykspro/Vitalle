import React, { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useIsMobile } from '../hooks/use-mobile';
import { LayoutContext } from '../components/Layout'; 
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ShoppingCart, Plus, Minus, Search, TrendingUp, AlertCircle, Menu, User } from 'lucide-react';
import { toast } from "sonner";

const MOCK_SELLER_ID = 'mock-vitalle-seller-001';

const MobileSales = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const layoutContext = useContext(LayoutContext);
  const setMobileOpen = layoutContext?.setMobileOpen;

  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ today: 0, items: 0 });
  const [totalCents, setTotalCents] = useState(0);

  const currencyFormat = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  useEffect(() => {
    if (isMobile && setMobileOpen) setMobileOpen(false);
    fetchData();
    fetchTodayStats();
  }, [location, isMobile]);

  // Recalculate total whenever cart changes
  useEffect(() => {
    const cents = cart.reduce((acc, item) => acc + (item.sale_price_cents * item.qty), 0);
    setTotalCents(cents);
  }, [cart]);

  async function fetchData() {
    setLoading(true);
    try {
      const [stockRes, custRes] = await Promise.all([
        supabase
          .from('stock_items')
          .select(`
            id,
            quantity,
            size,
            color,
            products (
              id,
              name,
              sell_price_cents,
              image_url,
              category
            )
            )

          `)
          .gt('quantity', 0)
          .order('name', { foreignTable: 'products', ascending: true }),

        supabase.from('customers').select('id, name').order('name')
      ]);

      if (stockRes.error) throw stockRes.error;
      if (custRes.error) throw custRes.error;

      const stockItems = stockRes.data.map(item => ({
        stock_id: item.id,
        product_id: item.products.id,
        name: item.products?.name || 'Produto Sem Nome',
        sell_price_cents: item.products?.sell_price_cents || 0,
        image_url: item.products.image_url,
        category: item.products.category,
        size: item.size || 'Único',
        color: item.color || 'N/A',
        stock_quantity: item.quantity
      })) || [];

      setProducts(stockItems);
      setCustomers(custRes.data || []);
    } catch (err) {
      toast.error("Erro ao sincronizar estoque e clientes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('final_amount')
        .gte('sale_date', today.toISOString())
        .or('status.eq.Concluída,status.eq.Pendente');
      
      if (error) throw error;
      
      const totalCentsToday = data?.reduce((sum, s) => sum + Number(s.final_amount || 0), 0) || 0;
      setStats({ 
        today: totalCentsToday / 100, 
        items: data?.length || 0 
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  }

  const addToCart = (product) => {
    if (product.stock_quantity < 1) {
      toast.error('Sem estoque disponível');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.stock_id === product.stock_id);
      if (existing) {
        const newQty = existing.qty + 1;
        if (newQty > product.stock_quantity) {
          toast.error('Estoque insuficiente');
          return prev;
        }
        return prev.map(item => 
          item.stock_id === product.stock_id ? { ...item, qty: newQty } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const updateQty = (stock_id, delta) => {
    setCart(prev => {
      const item = prev.find(i => i.stock_id === stock_id);
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty > item.stock_quantity || newQty <= 0) return prev;
      return prev.map(i => 
        i.stock_id === stock_id ? { ...i, qty: newQty } : i
      ).filter(i => i.qty > 0);

    });
  };

  const removeFromCart = (stock_id) => {
    setCart(prev => prev.filter(i => i.stock_id !== stock_id));
  };

  const getTotalReal = () => totalCents / 100;

  const finalizeSale = async () => {
    if (!selectedCustomerId || !cart.length) {
      toast.error('Selecione cliente e adicione itens');
      return;
    }
    setLoading(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomerId);
      const finalCents = totalCents; // No discount

      // Insert main sale
      const { data: saleData, error: saleErr } = await supabase
        .from('sales')
        .insert([{
          customer_id: selectedCustomerId,
          customer_name: customer?.name || 'Cliente Walk-in',
          total_amount: totalCents,
          final_amount: finalCents,
          payment_method: paymentMethod,
          status: 'Concluída',
          sale_date: new Date().toISOString(),
          notes: '',
          seller_id: MOCK_SELLER_ID,
          commission_value_cents: 0,
        }])
        .select()
        .single();

      if (saleErr) throw saleErr;

      const saleId = saleData.id;

      // Insert sale_items
      const saleItemsData = cart.map(item => ({
        sale_id: saleId,
        product_id: item.product_id,
        product_name: item.name,
        size: item.size,
        color: item.color,
        quantity: item.qty,
        unit_price: item.sale_price_cents,
        total: item.sale_price_cents * item.qty
      }));

      const { error: itemsErr } = await supabase.from('sale_items').insert(saleItemsData);
      if (itemsErr) throw itemsErr;

      // Update stock_items
      const stockUpdatePromises = cart.map(item =>
        supabase
          .from('stock_items')
          .update({ quantity: item.stock_quantity - item.qty })
          .eq('id', item.stock_id)
      );

      const stockResults = await Promise.all(stockUpdatePromises);
      const stockErr = stockResults.find(r => r.error);
      if (stockErr) throw stockErr.error;

      toast.success(`Venda ${saleId.slice(-8).toUpperCase()} ✅\n${currencyFormat.format(getTotalReal())}`);

      // Reset
      setCart([]);
      setSelectedCustomerId(null);
      setPaymentMethod('PIX');
      setIsSaleOpen(false);
      fetchData();
      fetchTodayStats();
    } catch (err) {
      toast.error(`Erro na venda: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.size.toLowerCase().includes(search.toLowerCase()) ||
    p.color.toLowerCase().includes(search.toLowerCase())
  );

  const hasCart = cart.length > 0;

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen?.(true)}>
            <Menu size={24} className="text-slate-900" />
          </Button>
          <h1 className="text-xl font-black italic text-slate-900 tracking-tighter">PDV VITALLE</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            size="icon" 
            variant="outline" 
            className="relative h-12 w-12 p-0" 
            onClick={() => setIsSaleOpen(true)} 
            disabled={cart.length === 0}
          >
            <ShoppingCart size={24} className="text-slate-900" />
{hasCart && (
              <span className="absolute -top-1 -right-1 bg-[#D946EF] text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                {cart.length}
              </span>
            )}

          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${hasCart ? 'pb-48' : 'pb-28'}`} >
        {/* Dashboard mini */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-[2rem] text-white shadow-xl">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Vendas Hoje</p>
            <p className="text-xl font-black italic">{currencyFormat.format(stats.today)}</p>
          </div>
          <div className="bg-white/70 p-4 rounded-[2rem] border border-slate-100 shadow-sm backdrop-blur-sm">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pedidos</p>
            <p className="text-xl font-black italic text-slate-900">{stats.items}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            placeholder="Busque por nome, tamanho ou cor..." 
            className="h-14 pl-12 rounded-2xl bg-white border-slate-200 shadow-sm font-semibold text-slate-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-2 py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D946EF] mb-2"></div>
              <p className="text-slate-500 font-medium">Sincronizando estoque...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-2 text-center py-12 text-slate-400">
              <AlertCircle size={48} className="mx-auto mb-2 opacity-40" />
              <p className="font-medium">Sem produtos em estoque ou tente outra busca</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div 
                key={product.stock_id}
                className="bg-white p-3 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer overflow-hidden group"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-slate-50 rounded-2xl mb-3 overflow-hidden relative">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100">
                      <TrendingUp size={24} className="text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white/95 backdrop-blur px-2 py-1 rounded-xl shadow-sm">
                    <p className="text-[10px] font-black text-[#D946EF]">
                      R$ {(product.sale_price_cents / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-sm">
                    Est {product.stock_quantity}
                  </div>
                </div>
                <div>
                  <p className="text-[9px] font-black text-[#D946EF] uppercase mb-1">{product.category}</p>
                  <p className="font-bold text-sm leading-tight line-clamp-2 text-slate-900">
                    {product.name}
                    {product.size !== 'Único' && ` • ${product.size}`}
                    {product.color !== 'N/A' && ` • ${product.color}`}
                  </p>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom cart summary bar - iPhone thumb-friendly */}
{hasCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-r from-slate-900 via-[#D946EF] to-purple-600 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="text-white">
              <p className="text-xs font-black uppercase tracking-wider opacity-90">{cart.length} item{ cart.length !== 1 ? 's' : ''}</p>
              <p className="text-lg font-black italic">{currencyFormat.format(getTotalReal())}</p>
            </div>
            <Button 
              onClick={() => setIsSaleOpen(true)}
              className="h-14 px-6 rounded-2xl bg-white text-slate-900 font-black uppercase tracking-widest text-base shadow-2xl hover:scale-105 active:scale-95 transition-all"
              disabled={loading}
            >
              Finalizar
            </Button>
          </div>
        </div>
      )}


      {/* Sale Dialog */}
      <Dialog open={isSaleOpen} onOpenChange={setIsSaleOpen}>
        <DialogContent className="max-w-[95vw] p-1 sm:max-w-md rounded-[3rem] border-none bg-gradient-to-b from-white to-slate-50 shadow-2xl max-h-[90vh] overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic uppercase text-slate-900 tracking-tightest">
                Checkout Vitalle
              </DialogTitle>
            </DialogHeader>

            {/* Customer */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-1">
                <User size={14} /> Cliente
              </label>
              <Select value={selectedCustomerId || ''} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-medium">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-200">
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="font-medium">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-500">Pagamento</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                  <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                  <SelectItem value="Fiado">Fiado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cart items */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {cart.map((item) => (
                <div key={item.stock_id} className="flex items-stretch gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex-1 min-w-0 py-2">
                    <p className="font-bold text-sm leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      {item.size !== 'Único' && item.size} {item.color !== 'N/A' && item.color}
                    </p>

                    <p className="text-[11px] font-black text-[#D946EF] tracking-tight">
                      R$ {(item.sale_price_cents / 100).toFixed(2)} x{item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 shadow-sm">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-12 w-12 p-0 hover:bg-slate-200 rounded-xl"
                      onClick={() => updateQty(item.stock_id, -1)}
                    >
                      <Minus size={18} />
                    </Button>
                    <span className="w-8 text-center font-black text-lg text-slate-900">{item.qty}</span>
                    <Button 
                      size="sm" 
                      className="h-12 w-12 p-0 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black"
                      onClick={() => updateQty(item.stock_id, 1)}
                      disabled={item.qty >= item.stock_quantity}
                    >
                      <Plus size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total preview */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-black uppercase text-slate-500">Total</span>
                <span className="text-2xl font-black italic text-slate-900">
                  {currencyFormat.format(getTotalReal())}
                </span>
              </div>
            </div>
          </div>

          {/* Footer button */}
          <div className="p-6 bg-slate-900/5 border-t">
            <Button 
              onClick={finalizeSale}
              disabled={!selectedCustomerId || cart.length === 0 || loading}
              className="w-full h-16 rounded-3xl bg-gradient-to-r from-[#D946EF] to-purple-600 hover:from-[#C026D3] text-white font-black uppercase tracking-widest text-lg shadow-2xl disabled:opacity-50"
            >
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>Processando...</>
              ) : (
                'FECHAR VENDA'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileSales;
