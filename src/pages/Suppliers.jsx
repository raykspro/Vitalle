import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Plus, Search, Truck, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "../components/EmptyState";
import { formatPhone } from "../lib/formatters";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", cnpj: "", phone: "", email: "", contact_person: "", address: "", notes: "" });

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Erro ao carregar dados dos fornecedores:", error);
      }
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

   async function loadData(signal) {
     const data = await cline.entities.Supplier.list("-created_date", 200, { signal });
    setSuppliers(data);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", cnpj: "", phone: "", email: "", contact_person: "", address: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(s) {
    setEditing(s);
    setForm({
      name: s.name || "", cnpj: s.cnpj || "", phone: s.phone || "",
      email: s.email || "", contact_person: s.contact_person || "",
      address: s.address || "", notes: s.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (editing) {
      await cline.entities.Supplier.update(editing.id, form);
    } else {
      await cline.entities.Supplier.create(form);
    }
    setDialogOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir este fornecedor?")) return;
    await cline.entities.Supplier.delete(id);
    loadData();
  }

  const filtered = suppliers.filter((s) =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.cnpj?.includes(search)
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
          <Input placeholder="Buscar fornecedores..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Fornecedor</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="Nenhum fornecedor"
          description="Cadastre seus fornecedores para gerenciar compras e pagamentos"
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Fornecedor</Button>}
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">CNPJ</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Contato</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Telefone</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">{s.cnpj || "-"}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{s.contact_person || "-"}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{formatPhone(s.phone)}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome/Razão Social *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Pessoa de Contato</Label>
                <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name}>
              {editing ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}