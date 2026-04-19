import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { cline } from '../api/clineClient';
import { createCompleteSale } from '../api/finance';
import { ShoppingCart, FileText, DollarSign, Plus, Trash2, User, Search, X } from 'lucide-react';
import { formatPriceDisplay, parsePriceToCents } from '@/lib/formatters';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const Vendas = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ total: 0, lancamentos: 0, comissoes: 0n });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stockByProduct, setStockByProduct] = useState({});
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_id: '',
    items: [],
    discount: 0,
    payment_method: 'PIX',
    notes: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [custs, prods, salesRes, invoicesRes, commRes] = await Promise.all([
        cline.entities.Customer.list(),
        cline.entities.Product.list(),
        supabase.from('sales').select('*, customers(name), products(name, price)', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('sales').select('*, customers(name), products(name, price)').eq('status', 'Concluída')
      ]);
      setCustomers(custs || []);
      setProducts(prods || []);
      const totalComissoes = commRes.data?.reduce((sum, s) => sum + BigInt(s?.commission_cents ?? 0), 0n) || 0n;
      setStats({ total: salesRes.count, lancamentos: invoicesRes.count, comissoes: totalComissoes });

      // Load stock grouped by product
      const stockItems = await cline.entities.StockItem.list();
      const stockMap = {};
      stockItems.forEach(item => {
        if (!stockMap[item.product_id]) stockMap[item.product_id] = [];
        if (item.quantity > 0) stockMap[item.product_id].push({size: item.size, color: item.color, quantity: item.quantity});
      });
      setStockByProduct(stockMap);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleCustomerSearch = (term) => {
    // Simple client search
    return customers.filter(c => c.name.toLowerCase().includes(term.toLowerCase())).slice(0,10);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', product_name: '', size: '', color: '', quantity: 1, unit_price: 0, commission_percent: 0, total: 0, available: [] }]
    }));
  };

  const updateItem = (index, field, value) => {
    const items = [...formData.items];
    if (field === 'product_id') {
      const prod = products.find(p => p.id === value);
      items[index] = {
        ...items[index],
        product_id: value,
        product_name: prod?.name || '',
        commission_percent: parseFloat(prod?.commission_percent || '0'),
        available: stockByProduct[value] || []
      };
    } else if (field === 'quantity') {
      items[index].quantity = parseInt(value) || 0;
    } else if (field === 'unit_price') {
      items[index].unit_price = parseFloat(value) || 0;
    } else {
      items[index][field] = value;
    }
    // Recalc total
    const unitCents = parsePriceToCents(items[index].unit_price.toString());
    items[index].total = Number(unitCents) * items[index].quantity / 100;
    setFormData({...formData, items});
  };

  const removeItem = (index) => {
    const items = formData.items.filter((_, i) => i !== index);
    setFormData({...formData, items});
  };

  const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = totalAmount - formData.discount;
  const commissionCents = Math.round(formData.items.reduce((sum, item) => sum + (item.total * (item.commission_percent / 100) * 100), 0));

  const validateForm = () => {
    if (!formData.customer_name) return 'Selecione o cliente';
    if (formData.items.length === 0) return 'Adicione itens';
    for (let item of formData.items) {
      if (item.quantity <= 0 || item.unit_price <= 0) return 'Verifique quantidades e preços';
      const avail = item.available.find(a => a.size === item.size && a.color === item.color);
      if (avail && item.quantity > avail.quantity) return `Estoque insuficiente para ${item.product_name}`;
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    try {
      const payload = {
        customer_id: formData.customer_id,
        customer_name: formData.customer_name,
        items: formData.items.map(i => ({product_id: i.product_id, product_name: i.product_name, size: i.size, color: i.color, quantity: i.quantity, unit_price: i.unit_price, total: i.total})),
        total_amount: totalAmount,
        discount: formData.discount,
        final_amount: finalAmount,
        payment_method: formData.payment_method,
        notes: formData.notes,
        commission_cents: commissionCents
      };
      await createCompleteSale(payload, user.id);
      alert('Venda concluída com sucesso!');
      setFormMode(false);
      setFormData({customer_name: '', customer_id: '', items: [], discount: 0, payment_method: 'PIX', notes: ''});
      loadData(); // Refresh stats/stock
    } catch (err) {
      setError(err.message);
    }
  };

  const customerOptions = formData.customer_name ? handleCustomerSearch(formData.customer_name).map(c => ({id: c.id, name: c.name})) : [];

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="space-y-10">
      <header>
        <div className="h-1.5 w-20 bg-magenta mb-3 rounded-full" />
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Vendas</h1>
        <p className="text-slate-500 font-medium italic">Registre vendas e acompanhe estatísticas.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-xl hover:shadow-2xl">
          <CardHeader>
            <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-400">Total Vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-magenta">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl hover:shadow-2xl">
          <CardHeader>
            <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-400">Lançamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-magenta">{stats.lancamentos}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-xl hover:shadow-2xl">
          <CardHeader>
            <CardDescription className="text-[10px] font-black tracking-widest uppercase text-slate-400">Comissões Totais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-magenta">{formatPriceDisplay(stats.comissoes)}</div>
          </CardContent>
        </Card>
      </div>

      {/* New Sale Form Toggle */}
      <Button 
        onClick={() => setFormMode(!formMode)} 
        className="h-16 text-lg font-black rounded-[2.5rem] shadow-xl hover:shadow-2xl w-full md:w-auto bg-[#D946EF] hover:bg-[#D946EF]/90 text-white"
        variant={formMode ? 'destructive' : 'default'}
      >
        {formMode ? <X className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
        {formMode ? 'Cancelar Nova Venda' : 'Nova Venda'}
      </Button>

      {formMode && (
        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">Nova Venda</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {error && <Badge variant="destructive" className="w-full justify-center text-xs py-2 rounded-[2.5rem]">{error}</Badge>}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer */}
              <div>
                <Label className="text-sm font-black uppercase tracking-wider text-slate-500 mb-2 block">Cliente</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Select value={formData.customer_id} onValueChange={(v) => {
                    const cust = customers.find(c => c.id === v);
                    setFormData(prev => ({...prev, customer_id: v, customer_name: cust ? cust.name : ''}));
                  }}>
                    <SelectTrigger className="pl-10 rounded-[2.5rem]">
                      <SelectValue placeholder="Pesquise ou selecione cliente..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-2xl z-[9999] border-slate-200 rounded-[1rem]">
                      {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-3">
                <Label className="text-sm font-black uppercase tracking-wider text-slate-500">Itens da Venda</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tam/Cor</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit</TableHead>
                      <TableHead>Total Item</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Select value={item.product_id} onValueChange={v => updateItem(idx, 'product_id', v)}>
                            <SelectTrigger className="z-50 rounded-[2.5rem]">
                              <SelectValue placeholder="Selecione produto" />
                            </SelectTrigger>
                            <SelectContent className="bg-white shadow-2xl z-[9999] border-slate-200 rounded-[1rem]">
                              {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500 mt-1">{item.product_name}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Select value={item.size} onValueChange={v => updateItem(idx, 'size', v)}>
                              <SelectTrigger className="w-16 h-10 z-50 rounded-[2.5rem]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white shadow-2xl z-[9999] border-slate-200 rounded-[1rem]">
                                {item.available?.map((a, i) => <SelectItem key={i} value={a.size}>{a.size}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Input className="w-20 h-10 rounded-[2.5rem]" value={item.color} onChange={e => updateItem(idx, 'color', e.target.value)} placeholder="Cor" />
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Disp: {item.available?.find(a => a.size === item.size)?.quantity || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="w-16 rounded-[2.5rem]" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" className="w-24 rounded-[2.5rem]" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} />
                        </TableCell>
                        <TableCell className="font-black text-magenta">
                          R$ {item.total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button type="button" variant="ghost" size="icon" className="rounded-[2.5rem]" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button type="button" variant="outline" onClick={addItem} className="w-full rounded-[2.5rem]">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              {/* Totals */}
              <div className="mt-8 mb-6 grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-[2.5rem]">
                <div>
                  <p className="text-sm text-slate-500">Subtotal</p>
                  <p className="text-2xl font-black text-slate-900">R$ {totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Desconto</p>
                  <Input type="number" step="0.01" value={formData.discount} onChange={e => setFormData(prev => ({...prev, discount: parseFloat(e.target.value) || 0}))} className="text-xl font-black rounded-[2.5rem]" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Final</p>
                  <p className="text-2xl font-black text-magenta">R$ {finalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Comissão</p>
                  <p className="text-2xl font-black text-emerald-600">{formatPriceDisplay(BigInt(commissionCents))}</p>
                </div>
              </div>

              {/* Payment & Notes */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-black uppercase">Forma de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={v => setFormData(prev => ({...prev, payment_method: v}))}>
                    <SelectTrigger className="rounded-[2.5rem]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-2xl z-[9999] border-slate-200 rounded-[1rem]">
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão Crédito">Cartão Crédito</SelectItem>
                      <SelectItem value="Cartão Débito">Cartão Débito</SelectItem>
                      <SelectItem value="Fiado">Fiado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-black uppercase">Observações</Label>
                  <Input value={formData.notes} onChange={e => setFormData(prev => ({...prev, notes: e.target.value}))} placeholder="Opcional" className="rounded-[2.5rem]" />
                </div>
              </div>

              <Button type="submit" className="h-16 w-full text-lg font-black rounded-[2.5rem] bg-[#D946EF] hover:bg-[#D946EF]/90 shadow-2xl text-white">
                <DollarSign className="h-5 w-5 mr-2" />
                CONCLUIR VENDA (R$ {finalAmount.toFixed(2)})
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Previous buttons */}
      <div className="grid md:grid-cols-2 gap-6">
        <Button className="h-20 text-lg font-black rounded-[2.5rem] shadow-xl hover:shadow-2xl">
          → Ver Relatório de Comissões
        </Button>
        <Button className="h-20 text-lg font-black rounded-[2.5rem] shadow-xl hover:shadow-2xl bg-[#D946EF] text-white hover:bg-[#D946EF]/90">
          Lançamentos / Histórico
        </Button>
      </div>
    </div>
  );
};

export default Vendas;

