import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Plus, Search, Shirt, Trash2, SlidersHorizontal } from "lucide-react";
import CatalogExport from "../components/CatalogExport";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import EmptyState from "../components/EmptyState";
import { cn } from "@/lib/utils"; // Certifique-se de ter essa utilidade

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

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function loadData(signal) {
    try {
      const [items, prods] = await Promise.all([
        cline.entities.StockItem.list("-created_date", 500, { signal }),
        cline.entities.Product.list("-created_date", 200, { signal }),
      ]);
      setStockItems(items || []);
      setProducts(prods || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({ product_id: "", size: "", color: "", quantity: "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    const product = products.find((p) => p.id === form.product_id);
    try {
      await cline.entities.StockItem.create({
        product_id: form.product_id,
        product_name: product?.name || "",
        size: form.size,
        color: form.color,
        quantity: Number(form.quantity) || 0,
      });
      await cline.entities.StockMovement.create({
        type: "Entrada",
        product_id: form.product_id,
        product_name: product?.name || "",
        size: form.size,
        color: form.color,
        quantity: Number(form.quantity) || 0,
        reference_type: "Ajuste Manual",
        movement_date: new Date().toISOString(),
      });
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }

  async function handleAdjust() {
    const qty = Number(adjustQty) || 0;
    if (qty <= 0) return;
    const delta = adjustType === "Entrada" ? qty : -qty;
    const newQty = Math.max(0, (adjustItem.quantity || 0) + delta);
    try {
      await cline.entities.StockItem.update(adjustItem.id, { quantity: newQty });
      await cline.entities.StockMovement.create({
        type: adjustType,
        product_id: adjustItem.product_id,
        product_name: adjustItem.product_name,
        size: adjustItem.size,
        color: adjustItem.color,
        quantity: qty,
        reference_type: "Ajuste Manual",
        movement_date: new Date().toISOString(),
      });
      setAdjustItem(null);
      setAdjustQty(1);
      await loadData();
    } catch (error) {
      console.error("Erro ao ajustar:", error);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir este item do estoque?")) return;
    try {
      await cline.entities.StockItem.delete(id);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  }

  const filtered = stockItems.filter((s) =>
    s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.color?.toLowerCase().includes(search.toLowerCase()) ||
    s.size?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = {};
  filtered.forEach((item) => {
    if (!grouped[item.product_name]) grouped[item.product_name] = [];
    grouped[item.product_name].push(item);
  });

  const productImageMap = {};
  products.forEach(p => { productImageMap[p.name] = p.image_url; });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-magenta/30 border-t-magenta rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar no estoque..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pl-10 bg-white border-slate-200 rounded-xl" 
          />
        </div>
        <div className="flex gap-2">
          <CatalogExport stockItems={stockItems} products={products} />
          <Button onClick={openNew} className="btn-vitalle gap-2 h-11">
            <Plus className="h-4 w-4" /> ADICIONAR AO ESTOQUE
          </Button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="Estoque vazio"
          description="Adicione itens ao estoque com tamanho, cor e quantidade"
          action={<Button onClick={openNew} className="btn-vitalle gap-2"><Plus className="h-4 w-4" /> ADICIONAR ITEM</Button>}
        />
      ) : (
        <div className="grid gap-6">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
                {productImageMap[productName] ? (
                  <img src={productImageMap[productName]} alt={productName} className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className="h-14 w-14 rounded-2xl border-2 border-white bg-slate-200 flex items-center justify-center shadow-sm">
                    <Shirt className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-slate-800 uppercase tracking-tighter text-lg">{productName}</h3>
                  <p className="text-[10px] font-bold text-magenta uppercase tracking-widest">
                    {items.reduce((s, i) => s + (i.quantity || 0), 0)} unidades em estoque
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-50">
                      <th className="text-left p-4 font-black uppercase text-[10px] tracking-widest">Tamanho</th>
                      <th className="text-left p-4 font-black uppercase text-[10px] tracking-widest">Cor</th>
                      <th className="text-center p-4 font-black uppercase text-[10px] tracking-widest">Qtd</th>
                      <th className="text-right p-4 font-black uppercase text-[10px] tracking-widest hidden sm:table-cell">Preço</th>
                      <th className="text-right p-4 font-black uppercase text-[10px] tracking-widest">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                      <tr key={item.id} className={cn("hover:bg-slate-50/50 transition-colors", item.quantity === 0 && "opacity-40")}>
                        <td className="p-4">
                          <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-black">
                            {item.size}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-600">{item.color}</td>
                        <td className="p-4 text-center">
                          <span className={cn("font-black text-base", item.quantity > 0 ? "text-slate-800" : "text-red-500")}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="p-4 text-right hidden sm:table-cell">
                          {(() => { 
                            const p = products.find(pr => pr.name === item.product_name); 
                            return p?.sell_price ? <span className="font-bold text-magenta">R$ {p.sell_price.toLocaleString('pt-BR')}</span> : <span className="text-slate-300">—</span>; 
                          })()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setAdjustItem(item); setAdjustType("Entrada"); setAdjustQty(1); }} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-magenta hover:text-white transition-all">
                              <SlidersHorizontal className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG: ADICIONAR AO ESTOQUE */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-magenta p-8 text-white">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Novo Item</DialogTitle>
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-[0.2em] mt-1">Abastecimento de Estoque</p>
          </div>
          <div className="p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione o Produto *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger className="input-vitalle h-14"><SelectValue placeholder="Escolha a peça..." /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tamanho *</Label>
                <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
                  <SelectTrigger className="input-vitalle h-14"><SelectValue placeholder="Tam" /></SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor / Estampa *</Label>
                <Input className="input-vitalle h-14" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ex: Oncinha" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade de Peças *</Label>
              <Input type="number" className="input-vitalle h-14 text-center text-lg" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <Button 
              onClick={handleSave} 
              className="btn-vitalle w-full h-16 mt-4 text-base" 
              disabled={!form.product_id || !form.size || !form.color || !form.quantity}
            >
              CONFIRMAR ENTRADA
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: AJUSTE DE ESTOQUE */}
      <Dialog open={!!adjustItem} onOpenChange={(v) => !v && setAdjustItem(null)}>
        <DialogContent className="max-w-sm bg-white rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">Ajustar Estoque</DialogTitle>
            {adjustItem && (
              <p className="text-[10px] font-bold text-magenta uppercase tracking-widest mt-1">
                {adjustItem.product_name} — {adjustItem.size}
              </p>
            )}
          </div>
          {adjustItem && (
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Saldo Atual</span>
                <span className="text-2xl font-black text-slate-800">{adjustItem.quantity}</span>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Movimentação</Label>
                <Select value={adjustType} onValueChange={setAdjustType}>
                  <SelectTrigger className="input-vitalle h-14"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (Reposição)</SelectItem>
                    <SelectItem value="Saída">Saída (Ajuste/Perda)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantidade</Label>
                <Input type="number" min="1" className="input-vitalle h-14 text-center text-lg" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
              </div>
              <Button onClick={handleAdjust} className="btn-vitalle w-full h-14" disabled={!adjustQty || Number(adjustQty) <= 0}>
                ATUALIZAR SALDO
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}