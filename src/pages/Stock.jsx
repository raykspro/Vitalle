import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Shirt, Trash2, Loader2, X, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", size: "", color: "", quantity: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // MESTRE: Padronizamos para 'stock_items' que é onde a Entrada de Material salva
      const { data: itemsRes, error: stockError } = await supabase
        .from('stock_items')
        .select(`
          *,
          products ( name, sell_price_cents )
        `)
        .order('id', { ascending: false });

      const { data: prodsRes } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (stockError) throw stockError;

      const formattedItems = itemsRes?.map(item => ({
        ...item,
        product_name: item.products?.name || "Produto Removido",
        price: (item.products?.sell_price_cents || 0) / 100, // Converte centavos para Real
      })) || [];

      setStockItems(formattedItems);
      setProducts(prodsRes || []);
    } catch (error) {
      console.error("Erro Vitalle:", error);
      toast.error("Erro ao carregar inventário: Recarregue o Schema no Supabase");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.product_id || !form.size || !form.quantity) return toast.error("Preencha os campos!");
    
    try {
      // MESTRE: Upsert na tabela 'stock_items' para manter a sincronia
      const { error: insertError } = await supabase
        .from('stock_items')
        .upsert([{
          product_id: form.product_id,
          size: form.size,
          color: form.color.toUpperCase() || 'PADRÃO',
          quantity: Number(form.quantity)
        }], { onConflict: 'product_id, size, color' });

      if (insertError) throw insertError;
      
      toast.success("Estoque Vitalle Atualizado!");
      setDialogOpen(false);
      setForm({ product_id: "", size: "", color: "", quantity: "" });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Falha ao salvar. Verifique se o produto já existe.");
    }
  }

  const filtered = stockItems.filter((s) =>
    s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    s.color?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.product_name]) acc[item.product_name] = [];
    acc[item.product_name].push(item);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[#D946EF]" />
      <span className="font-black italic text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Vitalle...</span>
    </div>
  );

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto pb-32 bg-[#fcfcfc] min-h-screen">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Estoque Central</h1>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar modelo ou cor..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 rounded-2xl border-none shadow-md bg-white h-14 w-full font-bold" 
          />
        </div>
      </div>

      <Button 
        onClick={() => setDialogOpen(true)} 
        className="fixed bottom-24 right-4 z-50 bg-[#D946EF] hover:opacity-90 text-white font-black uppercase rounded-full shadow-2xl p-6 h-16 w-16 md:w-auto md:h-12 md:rounded-xl md:static"
      >
        <Plus className="h-6 w-6 md:mr-2" /> <span className="hidden md:inline">Lançar Avulso</span>
      </Button>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 rounded-[2rem] bg-white border-2 border-dashed border-slate-100 shadow-sm">
          <Package className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-bold uppercase italic">Nenhum item detectado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 bg-slate-900 flex justify-between items-center">
                <h3 className="font-black text-white uppercase italic text-lg truncate pr-2">{productName}</h3>
                <span className="bg-[#D946EF] text-white px-4 py-1 rounded-full text-[12px] font-black uppercase">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} TOTAL
                </span>
              </div>
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#D946EF] font-black shadow-sm border border-slate-100">
                        {item.size}
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 text-sm uppercase">{item.color}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase italic">Saldo: {item.quantity}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-red-500" onClick={async () => {
                      if(confirm('Excluir do inventário?')){
                        await supabase.from('stock_items').delete().eq('id', item.id);
                        loadData();
                      }
                    }}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] rounded-[2rem] p-6 bg-white outline-none">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-xl font-black uppercase italic text-slate-900">Ajuste de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Selecione o Modelo</Label>
              <Select value={form.product_id} onValueChange={v => setForm(p => ({...p, product_id: v}))}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Escolha um produto" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {products.map(p => <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-xs">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Tamanho</Label>
                <Select value={form.size} onValueChange={v => setForm(p => ({...p, size: v}))}>
                  <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                    <SelectValue placeholder="Tam" />
                  </SelectTrigger>
                  <SelectContent>
                    {['P', 'M', 'G', 'GG', 'ÚNICO'].map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Quantidade</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cor</Label>
              <Input value={form.color} onChange={e => setForm(p => ({...p, color: e.target.value}))} className="rounded-xl h-12 bg-slate-50 border-none font-bold" placeholder="Ex: PRETO" />
            </div>

            <Button onClick={handleSave} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase italic tracking-widest mt-4">
              Confirmar Alteração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}