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
    loadData(controller.signal).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Erro ao carregar dados do estoque:", error);
      }
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  async function loadData(signal) {
    const [items, prods] = await Promise.all([
      cline.entities.StockItem.list("-created_date", 500, { signal }),
      cline.entities.Product.list("-created_date", 200, { signal }),
    ]);
    setStockItems(items);
    setProducts(prods);
    setLoading(false);
  }

  function openNew() {
    setForm({ product_id: "", size: "", color: "", quantity: "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    const product = products.find((p) => p.id === form.product_id);
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
    loadData();
  }

  async function handleAdjust() {
    const qty = Number(adjustQty) || 0;
    if (qty <= 0) return;
    const delta = adjustType === "Entrada" ? qty : -qty;
    const newQty = Math.max(0, (adjustItem.quantity || 0) + delta);
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
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir este item do estoque?")) return;
    await cline.entities.StockItem.delete(id);
    loadData();
  }

  const filtered = stockItems.filter((s) =>
    s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.color?.toLowerCase().includes(search.toLowerCase()) ||
    s.size?.toLowerCase().includes(search.toLowerCase())
  );

  // Group by product
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
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar no estoque..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <CatalogExport stockItems={stockItems} products={products} />
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar ao Estoque
          </Button>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="Estoque vazio"
          description="Adicione itens ao estoque com tamanho, cor e quantidade"
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Adicionar Item</Button>}
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-3">
                {productImageMap[productName] ? (
                  <img src={productImageMap[productName]} alt={productName} className="h-12 w-12 rounded-lg object-cover border border-border flex-shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0">
                    <Shirt className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{productName}</h3>
                  <p className="text-xs text-muted-foreground">
                    {items.reduce((s, i) => s + (i.quantity || 0), 0)} unidades no total
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-3 font-medium">Tamanho</th>
                      <th className="text-left p-3 font-medium">Cor</th>
                      <th className="text-center p-3 font-medium">Quantidade</th>
                      <th className="text-right p-3 font-medium hidden sm:table-cell">Valor Venda</th>
                      <th className="text-right p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => (
                     <tr key={item.id} className={`hover:bg-muted/30 ${item.quantity === 0 ? "opacity-40" : ""}`}>
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                            {item.size}
                          </span>
                        </td>
                        <td className="p-3">{item.color}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center">
                            <span className={`font-semibold ${item.quantity > 0 ? "text-green-600" : "text-red-600"}`}>{item.quantity}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right hidden sm:table-cell">
                          {(() => { const p = products.find(pr => pr.name === item.product_name); return p?.sell_price ? <span className="text-sm font-medium text-primary">{new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(p.sell_price)}</span> : <span className="text-muted-foreground">—</span>; })()}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setAdjustItem(item); setAdjustType("Entrada"); setAdjustQty(1); }} className="p-1.5 rounded-lg hover:bg-muted" title="Modificar estoque">
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar ao Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Produto *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tamanho *</Label>
                <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor *</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ex: Preto" />
              </div>
            </div>
            <div>
              <Label>Quantidade *</Label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.product_id || !form.size || !form.color || !form.quantity}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust stock dialog */}
      <Dialog open={!!adjustItem} onOpenChange={(v) => !v && setAdjustItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Modificar Estoque</DialogTitle>
          </DialogHeader>
          {adjustItem && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{adjustItem.product_name}</span> — {adjustItem.size} / {adjustItem.color}
              </p>
              <p className="text-sm">Quantidade atual: <span className="font-bold">{adjustItem.quantity}</span></p>
              <div>
                <Label>Tipo de Ajuste</Label>
                <Select value={adjustType} onValueChange={setAdjustType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (adicionar)</SelectItem>
                    <SelectItem value="Saída">Saída (remover)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min="1" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
              </div>
              <Button onClick={handleAdjust} className="w-full" disabled={!adjustQty || Number(adjustQty) <= 0}>
                Confirmar Ajuste
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 