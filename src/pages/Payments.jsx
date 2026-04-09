import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Wallet, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "../components/EmptyState";
import { formatCurrency, formatDate } from "../lib/formatters";

const paymentMethods = ["Dinheiro", "PIX", "Cartão Crédito", "Cartão Débito", "Boleto", "Transferência"];

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: "", person_name: "", amount: "", due_date: "", payment_method: "", notes: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const data = await base44.entities.Payment.list("-created_date", 500);
    setPayments(data);
    setLoading(false);
  }

  function openNew() {
    setForm({ type: "", person_name: "", amount: "", due_date: "", payment_method: "", notes: "" });
    setDialogOpen(true);
  }

  async function handleSave() {
    await base44.entities.Payment.create({
      ...form,
      amount: Number(form.amount) || 0,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
      status: "Pendente",
    });
    setDialogOpen(false);
    loadData();
  }

  async function markAsPaid(payment) {
    await base44.entities.Payment.update(payment.id, {
      status: "Pago",
      paid_date: new Date().toISOString(),
    });
    loadData();
  }

  const filtered = payments.filter((p) => {
    const matchSearch = p.person_name?.toLowerCase().includes(search.toLowerCase());
    if (tab === "receive") return matchSearch && p.type === "A Receber";
    if (tab === "pay") return matchSearch && p.type === "A Pagar";
    if (tab === "pending") return matchSearch && p.status === "Pendente";
    if (tab === "paid") return matchSearch && p.status === "Pago";
    return matchSearch;
  });

  const totalPendingReceive = payments.filter((p) => p.type === "A Receber" && p.status === "Pendente").reduce((s, p) => s + (p.amount || 0), 0);
  const totalPendingPay = payments.filter((p) => p.type === "A Pagar" && p.status === "Pendente").reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">A Receber (Pendente)</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalPendingReceive)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-sm text-muted-foreground">A Pagar (Pendente)</p>
          <p className="text-2xl font-bold text-destructive mt-1">{formatCurrency(totalPendingPay)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar pagamentos..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Pagamento</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="receive">A Receber</TabsTrigger>
          <TabsTrigger value="pay">A Pagar</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="paid">Pagos</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Nenhum pagamento"
              description="Registre pagamentos a receber e a pagar"
              action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo</Button>}
            />
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="text-left p-3 font-medium">Tipo</th>
                      <th className="text-left p-3 font-medium">Pessoa</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Vencimento</th>
                      <th className="text-right p-3 font-medium">Valor</th>
                      <th className="text-center p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            p.type === "A Receber" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>{p.type}</span>
                        </td>
                        <td className="p-3 font-medium">{p.person_name}</td>
                        <td className="p-3 hidden sm:table-cell text-muted-foreground">{formatDate(p.due_date)}</td>
                        <td className={`p-3 text-right font-semibold ${p.type === "A Receber" ? "text-green-600" : "text-destructive"}`}>
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            p.status === "Pago" ? "bg-green-100 text-green-700" :
                            p.status === "Pendente" ? "bg-yellow-100 text-yellow-700" :
                            p.status === "Vencido" ? "bg-red-100 text-red-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>{p.status}</span>
                        </td>
                        <td className="p-3 text-right">
                          {p.status === "Pendente" && (
                            <Button size="sm" variant="outline" onClick={() => markAsPaid(p)} className="gap-1 text-xs h-7">
                              <CheckCircle className="h-3 w-3" /> Pagar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="A Receber">A Receber (Cliente)</SelectItem>
                  <SelectItem value="A Pagar">A Pagar (Fornecedor)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome (Cliente/Fornecedor) *</Label>
              <Input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.type || !form.person_name || !form.amount}>
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}