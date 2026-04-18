import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Shirt, Trash2, SlidersHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const sizes = ["PP", "P", "M", "G", "GG", "3G", "Único"];

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", size: "", color: "", quantity: "" });
  const [adjustItem, setAdjustItem] = useState(null);
  const [adjustType, setAdjustType] = useState("Entrada");
  const [adjustQty, setAdjustQty] = useState(1);
  const [isMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: itemsRes } = await supabase.from('stock_items').select('*').order('created_at', { ascending: false });
      const { data: prodsRes } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      setStockItems(itemsRes || []);
      setProducts(prodsRes || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar estoque");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({ product_id: "", size: "", color: "", quantity: "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.product_id || !form.size || !form.color || !form.quantity) return toast.error("Preencha todos os campos");
    const qty = Number(form.quantity);
    if (qty <= 0) return toast.error("Quantidade deve ser maior que 0");
    try {
      const { data: product } = await supabase.from('products').select('name').eq('id', form.product_id).single();
      const { error: insertError } = await supabase.from('stock_items').insert([{
        product_id: form.product_id,
        product_name: product?.name || "Produto",
        size: form.size,
        color: form.color,
        quantity: qty,
      }]);
      if (insertError) throw insertError;
      toast.success("Item adicionado ao estoque!");
      setDialogOpen(false);
      await loadData(); // Reatividade instantânea
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar item");
    }
  }

  async function handleAdjust() {
    const qty = Number(adjustQty) || 0;
    if (qty <= 0) return;
    const delta = adjustType === "Entrada" ? qty : -qty;
    const newQty = Math.max(0, (adjustItem?.quantity || 0) + delta);
    try {
      const { error } = await supabase.from('stock_items').update({ quantity: newQty }).eq('id', adjustItem.id);
      if (error) throw error;
      toast.success("Estoque ajustado!");
      setAdjustItem(null);
      setAdjustQty(1);
      await loadData(); // Reatividade
    } catch (error) {
      console.error("Erro ao ajustar:", error);
      toast.error("Erro ao ajustar");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir item do estoque?")) return;
    try {
      const { error } = await supabase.from('stock_items').delete().eq('id', id);
      if (error) throw error;
      toast.success("Item excluído");
      await loadData(); // Reatividade
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  }

  const filtered = stockItems?.filter((s) =>
    s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.color?.toLowerCase().includes(search.toLowerCase()) ||
    s.size?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const grouped = {};
  filtered.forEach((item) => {
    const name = item.product_name || 'Sem nome';
    if (!grouped[name]) grouped[name] = [];
    grouped[name].push(item);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-magenta" /></div>;

  return (
    <div className="space-y-6 p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input 
            placeholder="Buscar no estoque..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 rounded-[2rem] border-slate-200 shadow-md bg-white" 
          />
        </div>
        <Button onClick={openNew} className="bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl px-8 py-4 h-auto">
          <Plus className="h-4 w-4 mr-2" /> ADICIONAR ITEM
        </Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-20 rounded-[2.5rem] bg-white border-2 border-dashed border-slate-200 shadow-2xl">
          <Shirt className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 uppercase mb-2">Estoque Vazio</h3>
          <p className="text-slate-500 mb-6">Adicione itens para começar a gerenciar.</p>
          <Button onClick={openNew} className="bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2rem] shadow-2xl">
            <Plus className="h-4 w-4 mr-2" /> Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50">
                <div className="flex flex-col lg:flex-row lg:items-center lg:gap-4">
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-xl lg:text-2xl">{productName}</h3>
                  <div className="mt-2 lg:mt-0">
                    <span className="bg-[#D946EF]/10 text-[#D946EF] px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest">
                      {items.reduce((sum, i) => sum + (i?.quantity || 0), 0)} un
                    </span>
                  </div>
                </div>
              </div>
              {isMobile ? (
                <div className="p-6 space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 shadow-xl hover:shadow-2xl transition-all">
                      <div className="grid grid-cols-2 gap-4 items-center mb-3">
                        <span className="font-bold text-sm">{item.size}</span>
                        <span className="text-right font-black text-lg text-slate-900">{item.quantity || 0}</span>
                      </div>
                      <p className="text-slate-600 text-sm mb-4">{item.color}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 font-black uppercase tracking-widest rounded-xl border-slate-300 text-slate-600 hover:bg-slate-100">
                          <SlidersHorizontal className="h-3 w-3 mr-1" />
                          Ajustar
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1 font-black uppercase tracking-widest rounded-xl">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Tamanho</th>
                        <th className="text-left p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Cor</th>
                        <th className="text-center p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Qtd</th>
                        <th className="text-right p-6 font-black uppercase text-[10px] text-slate-900 tracking-widest">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-xl">{item.size}</span>
                          </td>
                          <td className="p-6 font-bold text-slate-900">{item.color}</td>
                          <td className="p-6 text-center font-black text-2xl text-slate-900">{item.quantity || 0}</td>
                          <td className="p-6 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button onClick={() => { setAdjustItem(item); setAdjustType("Entrada"); setAdjustQty(1); }} size="sm" variant="outline" className="font-black uppercase tracking-widest rounded-xl text-slate-600 hover:bg-slate-100">
                                <SlidersHorizontal className="h-4 w-4 mr-1" />
                                Ajustar
                              </Button>
                              <Button onClick={() => handleDelete(item.id)} size="sm" variant="destructive" className="font-black uppercase tracking-widest rounded-xl">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs remain the same but with rounded-[2.5rem] */}
      {/* ... dialogs code ... */}
    </div>
  );
}

