import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Trash2, Loader2, Package, Tag } from "lucide-react";
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
      const { data: itemsRes, error: stockError } = await supabase
        .from('stock_items')
        .select(`*, products ( name, sell_price_cents )`)
        .order('id', { ascending: false });

      const { data: prodsRes } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (stockError) throw stockError;

      const formattedItems = itemsRes?.map(item => ({
        ...item,
        product_name: item.products?.name || "Produto Removido",
        price: (item.products?.sell_price_cents || 0) / 100,
      })) || [];

      setStockItems(formattedItems);
      setProducts(prodsRes || []);
    } catch (error) {
      console.error("Erro Vitalle:", error);
      toast.error("Erro de conexão com o banco.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.product_id || !form.size || !form.quantity) return toast.error("Preencha os campos!");
    
    const colorUpper = form.color.toUpperCase() || 'PADRÃO';
    const qtyToAdd = Number(form.quantity);

    try {
      // MESTRE: Lógica de Soma Inteligente (Verifica se já existe para somar)
      const { data: existingItem } = await supabase
        .from('stock_items')
        .select('id, quantity')
        .eq('product_id', form.product_id)
        .eq('size', form.size)
        .eq('color', colorUpper)
        .maybeSingle();

      if (existingItem) {
        // Se existe, soma a quantidade atual com a nova
        const { error: updateError } = await supabase
          .from('stock_items')
          .update({ quantity: existingItem.quantity + qtyToAdd })
          .eq('id', existingItem.id);
        
        if (updateError) throw updateError;
      } else {
        // Se não existe, cria o registro novo
        const { error: insertError } = await supabase
          .from('stock_items')
          .insert([{
            product_id: form.product_id,
            size: form.size,
            color: colorUpper,
            quantity: qtyToAdd
          }]);
        
        if (insertError) throw insertError;
      }
      
      toast.success("Estoque Vitalle Atualizado!");
      setDialogOpen(false);
      setForm({ product_id: "", size: "", color: "", quantity: "" });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Falha ao atualizar estoque.");
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
    <div className="space-y-6 p-4 max-w-7xl mx-auto pb-32 bg-[#fcfcfc] min-h-screen font-sans">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Estoque Central</h1>
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="BUSCAR MODELO OU COR..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 rounded-2xl border-none shadow-md bg-white h-14 w-full font-bold text-slate-700" 
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
          <p className="text-slate-400 font-bold uppercase italic">Nenhum item em estoque</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-[#0f172a] rounded-[2rem] shadow-2xl border border-slate-800 overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-3">
                   <Tag size={18} className="text-[#D946EF]" />
                   <h3 className="font-black text-white uppercase italic text-lg truncate pr-2">{productName}</h3>
                </div>
                <span className="bg-[#D946EF] text-white px-4 py-1 rounded-full text-[12px] font-black uppercase tracking-tighter shadow-lg shadow-[#D946EF]/20">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} TOTAL
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D946EF]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#0f172a] font-black text-xl shadow-xl">
                        {item.size}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm uppercase italic">{item.color}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">Saldo: <span className="text-[#D946EF]">{item.quantity}</span></p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-full" onClick={async () => {
                      if(confirm('Excluir esta variação do estoque?')){
                        await supabase.from('stock_items').delete().eq('id', item.id);
                        loadData();
                      }
                    }}>
                      <Trash2 size={18} />
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
        <DialogContent className="max-w-[95vw] rounded-[2rem] p-6 bg-white outline-none border-none">
          <DialogHeader className="mb-4 text-center">
            <DialogTitle className="text-xl font-black uppercase italic text-slate-900">Ajuste de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Modelo</Label>
              <Select value={form.product_id} onValueChange={v => setForm(p => ({...p, product_id: v}))}>
                <SelectTrigger className="rounded-xl h-12 bg-slate-50 border-none font-bold">
                  <SelectValue placeholder="Escolha um produto" />
                </SelectTrigger>
                <SelectContent className="max-h-60 rounded-xl">
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
                  <SelectContent className="rounded-xl">
                    {['P', 'M', 'G', 'GG', 'ÚNICO'].map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Adicionar Qtd</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} className="rounded-xl h-12 bg-slate-50 border-none font-bold" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cor</Label>
              <Input value={form.color} onChange={e => setForm(p => ({...p, color: e.target.value}))} className="rounded-xl h-12 bg-slate-50 border-none font-bold" placeholder="EX: PRETO" />
            </div>

            <Button onClick={handleSave} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase italic tracking-widest mt-4 shadow-xl active:scale-95 transition-transform">
              Confirmar Alteração
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}