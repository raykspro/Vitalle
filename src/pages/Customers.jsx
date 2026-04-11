import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/EmptyState";
import { formatPhone } from "@/lib/formatters";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", cpf: "", address: "", city: "", state: "", notes: "" });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
setLoading(true);
try {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Erro ao carregar clientes:", error);
  }
  setCustomers(data || []);
} finally {
  setLoading(false);
}
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", cpf: "", address: "", city: "", state: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(c) {
    setEditing(c);
    setForm({
      name: c.name || "", phone: c.phone || "", email: c.email || "", cpf: c.cpf || "",
      address: c.address || "", city: c.city || "", state: c.state || "", notes: c.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (editing) {
const { error } = await supabase.from('customers').update(form).eq('id', editing.id);
if (error) console.error("Erro ao atualizar cliente:", error);
    } else {
const { error } = await supabase.from('customers').insert([form]);
if (error) console.error("Erro ao inserir cliente:", error);
    }
    setDialogOpen(false);
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir este cliente?")) return;
const { error } = await supabase.from('customers').delete().eq('id', id);
if (error) console.error("Erro ao excluir cliente:", error);
    loadData();
  }

  const filtered = customers.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.cpf?.includes(search)
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
          <Input placeholder="Buscar clientes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente"
          description="Cadastre seus clientes para facilitar suas vendas"
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>}
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Nome</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Telefone</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">E-mail</th>
                  <th className="text-left p-3 font-medium hidden lg:table-cell">Cidade</th>
                  <th className="text-right p-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{c.name}</p>
                      {c.cpf && <p className="text-xs text-muted-foreground">CPF: {c.cpf}</p>}
                    </td>
                    <td className="p-3 hidden sm:table-cell">{formatPhone(c.phone)}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{c.email || "-"}</td>
                    <td className="p-3 hidden lg:table-cell text-muted-foreground">{c.city ? `${c.city}${c.state ? ` - ${c.state}` : ""}` : "-"}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
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
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cidade</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
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