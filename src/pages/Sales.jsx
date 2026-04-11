import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Plus, Search, ShoppingCart, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "../components/EmptyState";
import { formatCurrency, formatDate } from "../lib/formatters";

const paymentMethods = ["Dinheiro", "PIX", "Cartão Crédito", "Cartão Débito", "Fiado", "Boleto"];

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewSale, setViewSale] = useState(null);
  const [form, setForm] = useState({ customer_id: "", customer_name: "", payment_method: "", discount: 0, notes: "", items: [] });
  const [currentItem, setCurrentItem] = useState({ stock_item_id: "", quantity: 1 });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [s, c, st] = await Promise.all([
      cline.entities.Sale.list("-created_date", 200),
      cline.entities.Customer.list("-created_date", 500),
      cline.entities.StockItem.list("-created_date", 500),
    ]);
    setSales(s);
    setCustomers(c);
    setStockItems(st);
    setLoading(false);
  }

  function openNew() {
    setForm({ customer_id: "", customer_name: "", payment_method: "", discount: 0, notes: "", items: [] });
    setCurrentItem({ stock_item_id: "", quantity: 1 });
    setDialogOpen(true);
  }

  function addItem() {
    const stock = stockItems.find((s) => s.id === currentItem.stock_item_id);
    if (!stock) return;
    // We need product sell_price - we'll use stock info
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, {
        product_id: stock.product_id,
        product_name: stock.product_name,
        size: stock.size,
        color: stock.color,
        quantity: Number(currentItem.quantity),
        unit_price: 0, // will be set in save
        total: 0,
      }],
    }));
    setCurrentItem({ stock_item_id: "", quantity: 1 });
  }

  function removeItem(idx) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    // Fetch product prices
    const products = await cline.entities.Product.list("-created_date", 200);
    const priceMap = {};
    products.forEach((p) => { priceMap[p.id] = p.sell_price || 0; });

    const items = form.items.map((item) => ({
      ...item,
      unit_price: priceMap[item.product_id] || 0,
      total: (priceMap[item.product_id] || 0) * item.quantity,
    }));

    const totalAmount = items.reduce((s, i) => s + i.total, 0);
    const finalAmount = totalAmount - (Number(form.discount) || 0);

    const customer = customers.find((c) => c.id === form.customer_id);

    const saleData = {
      customer_id: form.customer_id,
      customer_name: customer?.name || form.customer_name || "Cliente Avulso",
      items,
      total_amount: totalAmount,
      discount: Number(form.discount) || 0,
      final_amount: finalAmount,
      payment_method: form.payment_method,
      status: form.payment_method === "Fiado" ? "Pendente" : "Concluída",
      sale_date: new Date().toISOString(),
      notes: form.notes,
    };

    const created = await cline.entities.Sale.create(saleData);

    // Update stock and log movements
    for (const item of form.items) {
      const stock = stockItems.find((s) =>
        s.product_id === item.product_id && s.size === item.size && s.color === item.color
      );
      if (stock) {
        await cline.entities.StockItem.update(stock.id, {
          quantity: Math.max(0, (stock.quantity || 0) - item.quantity),
        });
      }
      await cline.entities.StockMovement.create({
        type: "Saída",
        product_id: item.product_id,
        product_name: item.product_name,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        reference_type: "Venda",
        reference_id: created.id,
        movement_date: new Date().toISOString(),
      });
    }

    // Create payment if "Fiado"
    if (form.payment_method === "Fiado") {
      await cline.entities.Payment.create({
        type: "A Receber",
        reference_type: "Venda",
        reference_id: created.id,
        person_name: saleData.customer_name,
        amount: finalAmount,
        due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: "Pendente",
      });
    }

    setDialogOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir esta venda?")) return;
    await cline.entities.Sale.delete(id);
    loadData();
  }

  const filtered = sales.filter((s) =>
    s.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const itemTotal = form.items.reduce((sum, item) => {
    return sum; // Will show after price lookup
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar vendas..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Venda</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhuma venda"
          description="Registre sua primeira venda"
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Venda</Button>}
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Data</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Pagamento</th>
                  <th className="text-right p-3 font-medium">Valor</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.customer_name}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{formatDate(s.sale_date || s.created_date)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{s.payment_method}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(s.final_amount)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.status === "Concluída" ? "bg-green-100 text-green-700" :
                        s.status === "Pendente" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{s.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewSale(s)} className="p-1.5 rounded-lg hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Sale Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Cliente</Label>
              <Select value={form.customer_id} onValueChange={(v) => {
                const c = customers.find((c) => c.id === v);
                setForm({ ...form, customer_id: v, customer_name: c?.name || "" });
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Add items */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <Label className="text-sm font-semibold">Itens da Venda</Label>
              <div className="flex gap-2">
                <Select value={currentItem.stock_item_id} onValueChange={(v) => setCurrentItem({ ...currentItem, stock_item_id: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Produto (tam/cor)" /></SelectTrigger>
                  <SelectContent>
                    {stockItems.filter((s) => s.quantity > 0).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.product_name} - {s.size}/{s.color} ({s.quantity} disp.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" min="1" value={currentItem.quantity} onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })} className="w-20" />
                <Button type="button" variant="outline" onClick={addItem} disabled={!currentItem.stock_item_id}>+</Button>
              </div>
              {form.items.length > 0 && (
                <div className="space-y-2">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg text-sm">
                      <span>{item.product_name} ({item.size}/{item.color}) x{item.quantity}</span>
                      <button onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Forma de Pagamento *</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={form.items.length === 0 || !form.payment_method}>
              Registrar Venda
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={!!viewSale} onOpenChange={() => setViewSale(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-4 mt-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Cliente</span>
                <span className="text-sm font-medium">{viewSale.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="text-sm">{formatDate(viewSale.sale_date || viewSale.created_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pagamento</span>
                <span className="text-sm">{viewSale.payment_method}</span>
              </div>
              <div className="border-t border-border pt-3 space-y-2">
                {viewSale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.product_name} ({item.size}/{item.color}) x{item.quantity}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(viewSale.total_amount)}</span>
                </div>
                {viewSale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-destructive">-{formatCurrency(viewSale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-1">
                  <span>Total</span>
                  <span>{formatCurrency(viewSale.final_amount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}