import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Shirt, Trash2, SlidersHorizontal, Loader2, X } from "lucide-react";
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
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fazemos um JOIN para pegar o nome do produto diretamente da tabela products
      const { data: itemsRes, error: stockError } = await supabase
        .from('stock_items')
        .select(`
          *,
          products ( name )
        `)
        .order('last_updated', { ascending: false });

      const { data: prodsRes } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (stockError) throw stockError;

      // Mapeia os dados para facilitar o uso no filtro
      const formattedItems = itemsRes?.map(item => ({
        ...item,
        product_name: item.products?.name || "Produto Removido"
      })) || [];

      setStockItems(formattedItems);
      setProducts(prodsRes || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!form.product_id || !form.size || !form.quantity) return toast.error("Preencha os campos obrigatórios");
    
    try {
      const { error: insertError } = await supabase
        .from('stock_items')
        .upsert([{
          product_id: form.product_id,
          size: form.size,
          color: form.color || 'Padrão',
          quantity: Number(form.quantity),
          last_updated: new Date()
        }], { onConflict: 'product_id, size' }); // Evita duplicados, apenas soma ou atualiza

      if (insertError) throw insertError;
      
      toast.success("Estoque atualizado com sucesso!");
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error("Erro ao salvar: Verifique as colunas no Supabase.");
    }
  }

  const filtered = stockItems.filter((s) =>
    s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    s.color?.toLowerCase().includes(search.toLowerCase())
  );

  // Agrupamento para exibição em Cards
  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.product_name]) acc[item.product_name] = [];
    acc[item.product_name].push(item);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-[#D946EF]" />
      <span className="font-black italic text-slate-400 uppercase tracking-widest">Sincronizando Inventário...</span>
    </div>
  );

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto pb-20">
      {/* Header e Busca */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Procurar modelo ou cor..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-12 rounded-full border-none shadow-lg bg-white h-12" 
          />
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-[#D946EF] hover:bg-[#C026D3] text-white font-black uppercase tracking-widest rounded-full shadow-lg px-8 h-12 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Adicionar ao Estoque
        </Button>
      </div>

      {/* Lista de Itens */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-32 rounded-[3rem] bg-white border-2 border-dashed border-slate-100 shadow-xl">
          <Shirt className="h-20 w-20 text-slate-200 mx-auto mb-4" />
          <h3 className="text-2xl font-black text-slate-900 uppercase italic">Estoque Vazio</h3>
          <p className="text-slate-400">Nenhum item encontrado na busca atual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden">
              <div className="p-6 bg-slate-900 flex justify-between items-center">
                <h3 className="font-black text-white uppercase italic tracking-tighter text-xl">{productName}</h3>
                <span className="bg-[#D946EF] text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  Total: {items.reduce((sum, i) => sum + i.quantity, 0)}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-black text-[#D946EF] uppercase italic">{item.size}</p>
                      <p className="font-bold text-slate-700">{item.color || 'Sem cor'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-black text-slate-900">{item.quantity}</span>
                      <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={async () => {
                          if(confirm('Remover do sistema?')){
                            await supabase.from('stock_items').delete().eq('id', item.id);
                            loadData();
                          }
                        }}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-0 rounded-[2.5rem] bg-white shadow-2xl border-none overflow-hidden sm:max-w-lg">
          <DialogHeader className="bg-slate-900 text-white p-8 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-black uppercase italic tracking-widest">Entrada de Peça</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Modelo do Produto</Label>
                <Select value={form.product_id} onValueChange={v => setForm(p => ({...p, product_id: v}))}>
                  <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tamanho</Label>
                  <Select value={form.size} onValueChange={v => setForm(p => ({...p, size: v}))}>
                    <SelectTrigger className="rounded-2xl h-12 bg-slate-50 border-none">
                      <SelectValue placeholder="Tam." />
                    </SelectTrigger>
                    <SelectContent>
                      {['P', 'M', 'G', 'GG', 'Único'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Quantidade</Label>
                  <Input type="number" value={form.quantity} onChange={e => setForm(p => ({...p, quantity: e.target.value}))} className="rounded-2xl h-12 bg-slate-50 border-none" placeholder="0" />
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cor (Opcional)</Label>
                <Input value={form.color} onChange={e => setForm(p => ({...p, color: e.target.value}))} className="rounded-2xl h-12 bg-slate-50 border-none" placeholder="Ex: Preto, Floral..." />
              </div>
            </div>

            <Button onClick={handleSave} className="w-full h-14 rounded-full bg-[#D946EF] hover:bg-[#C026D3] font-black uppercase italic tracking-widest shadow-xl">
              Confirmar Entrada
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}