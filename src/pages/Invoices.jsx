import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Plus, Search, FileText, Trash2, Eye, Upload } from "lucide-react";
import InvoiceImportDialog from "../components/InvoiceImportDialog";
import ManualInvoiceDialog from "../components/ManualInvoiceDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "../components/EmptyState";
import { formatCurrency, formatDate } from "../lib/formatters";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [form, setForm] = useState({
    number: "", supplier_id: "", supplier_name: "", total_amount: "",
    issue_date: "", due_date: "", notes: "", items: [],
  });
  const [currentItem, setCurrentItem] = useState({ product_name: "", quantity: "", unit_price: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [inv, sup, prods] = await Promise.all([
      cline.entities.Invoice.list("-created_date", 200),
      cline.entities.Supplier.list("-created_date", 200),
      cline.entities.Product.list("-created_date", 200),
    ]);
    setInvoices(inv);
    setSuppliers(sup);
    setProducts(prods);
    setLoading(false);
  }

  function openNew() {
    setForm({ number: "", supplier_id: "", supplier_name: "", total_amount: "", issue_date: "", due_date: "", notes: "", items: [] });
    setCurrentItem({ product_name: "", quantity: "", unit_price: "" });
    setDialogOpen(true);
  }

  function addItem() {
    if (!currentItem.product_name) return;
    const qty = Number(currentItem.quantity) || 0;
    const price = Number(currentItem.unit_price) || 0;
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { product_name: currentItem.product_name, quantity: qty, unit_price: price, total: qty * price }],
    }));
    setCurrentItem({ product_name: "", quantity: "", unit_price: "" });
  }

  function removeItem(idx) {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  }

  async function handleSave() {
    const totalFromItems = form.items.reduce((s, i) => s + i.total, 0);
    const totalAmount = Number(form.total_amount) || totalFromItems;

    const supplier = suppliers.find((s) => s.id === form.supplier_id);
    const invoiceData = {
      number: form.number,
      supplier_id: form.supplier_id,
      supplier_name: supplier?.name || form.supplier_name,
      items: form.items,
      total_amount: totalAmount,
      issue_date: form.issue_date ? new Date(form.issue_date).toISOString() : new Date().toISOString(),
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      status: "Pendente",
      notes: form.notes,
    };

    await cline.entities.Invoice.create(invoiceData);

    // Create payment for supplier
    if (form.due_date) {
      await cline.entities.Payment.create({
        type: "A Pagar",
        reference_type: "Nota Fiscal",
        person_name: invoiceData.supplier_name,
        amount: totalAmount,
        due_date: invoiceData.due_date,
        status: "Pendente",
      });
    }

    setDialogOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir esta nota fiscal?")) return;
    await cline.entities.Invoice.delete(id);
    loadData();
  }

  const filtered = invoices.filter((i) =>
    i.number?.toLowerCase().includes(search.toLowerCase()) ||
    i.supplier_name?.toLowerCase().includes(search.toLowerCase())
  );

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
          <Input placeholder="Buscar notas fiscais..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline" className="gap-2"><Upload className="h-4 w-4" /> Importar NF</Button>
          <Button onClick={() => setManualDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova NF Manual</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma nota fiscal"
          description="Registre as notas fiscais de entrada dos seus fornecedores"
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova NF</Button>}
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Número</th>
                  <th className="text-left p-3 font-medium">Fornecedor</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Emissão</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Vencimento</th>
                  <th className="text-right p-3 font-medium">Valor</th>
                  <th className="text-center p-3 font-medium">Status</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{inv.number}</td>
                    <td className="p-3">{inv.supplier_name}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{formatDate(inv.issue_date)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{formatDate(inv.due_date)}</td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(inv.total_amount)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        inv.status === "Paga" ? "bg-green-100 text-green-700" :
                        inv.status === "Pendente" ? "bg-yellow-100 text-yellow-700" :
                        inv.status === "Vencida" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewInvoice(inv)} className="p-1.5 rounded-lg hover:bg-muted"><Eye className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InvoiceImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        suppliers={suppliers}
        products={products}
        onSuccess={loadData}
      />

      <ManualInvoiceDialog
        open={manualDialogOpen}
        onOpenChange={setManualDialogOpen}
        suppliers={suppliers}
        products={products}
        onSuccess={loadData}
      />

      {/* View Invoice Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova NF Manual</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número da NF *</Label>
                <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select value={form.supplier_id} onValueChange={v => {
                  const s = suppliers.find(s => s.id === v);
                  setForm({ ...form, supplier_id: v, supplier_name: s?.name || "" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Itens</Label>
              <div className="border border-border rounded-lg p-3 space-y-3">
                {form.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span>{it.product_name} x{it.quantity}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{it.total?.toFixed(2)}</span>
                      <button onClick={() => removeItem(idx)} className="text-destructive text-xs">✕</button>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Produto" value={currentItem.product_name} onChange={e => setCurrentItem({ ...currentItem, product_name: e.target.value })} />
                  <Input type="number" placeholder="Qtd" value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Preço unit." value={currentItem.unit_price} onChange={e => setCurrentItem({ ...currentItem, unit_price: e.target.value })} />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={!currentItem.product_name}>+ Adicionar item</Button>
              </div>
            </div>

            <div>
              <Label>Valor Total</Label>
              <Input type="number" step="0.01" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} placeholder="Deixe vazio para calcular pelos itens" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.number}>
              Salvar Nota Fiscal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={!!viewInvoice} onOpenChange={() => setViewInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>NF {viewInvoice?.number}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 mt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fornecedor</span>
                <span className="font-medium">{viewInvoice.supplier_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Emissão</span>
                <span>{formatDate(viewInvoice.issue_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vencimento</span>
                <span>{formatDate(viewInvoice.due_date)}</span>
              </div>
              {viewInvoice.items?.length > 0 && (
                <div className="border-t border-border pt-3 space-y-2">
                  {viewInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.product_name} x{item.quantity}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(viewInvoice.total_amount)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}