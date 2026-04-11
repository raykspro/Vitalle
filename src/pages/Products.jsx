import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Plus, Search, Package, Pencil, Trash2, Camera, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import EmptyState from "../components/EmptyState";
import { formatCurrency } from "../lib/formatters";

const categories = ["Camisetas", "Calças", "Vestidos", "Saias", "Blusas", "Jaquetas", "Shorts", "Acessórios", "Outros"];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", category: "", color: "", brand: "", cost_price: "", sell_price: "", sku: "", description: "", image_url: "", images: [] });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await cline.entities.Product.list("-created_date", 200);
      setProducts(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingImage(true);
    for (const file of files) {
      const { file_url } = await cline.integrations.Core.UploadFile({ file });
      setForm(prev => ({
        ...prev,
        images: [...(prev.images || []), file_url],
        image_url: prev.image_url || file_url,
      }));
    }
    setUploadingImage(false);
  }

  function setMainPhoto(url) {
    setForm(prev => ({ ...prev, image_url: url }));
  }

  function removePhoto(url) {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter(i => i !== url),
      image_url: prev.image_url === url ? (prev.images.find(i => i !== url) || "") : prev.image_url,
    }));
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", category: "", color: "", brand: "", cost_price: "", sell_price: "", sku: "", description: "", image_url: "", images: [] });
    setDialogOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name || "",
      category: p.category || "",
      color: p.color || "",
      brand: p.brand || "",
      cost_price: p.cost_price || "",
      sell_price: p.sell_price || "",
      sku: p.sku || "",
      description: p.description || "",
      image_url: p.image_url || "",
      images: p.images || (p.image_url ? [p.image_url] : []),
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    const data = {
      ...form,
      cost_price: form.cost_price ? Number(form.cost_price) : 0,
      sell_price: form.sell_price ? Number(form.sell_price) : 0,
      images: form.images || [],
      image_url: form.image_url || "",
      status: "Ativo",
    };
    if (editing) {
      await cline.entities.Product.update(editing.id, data);
    } else {
      await cline.entities.Product.create(data);
    }
    setDialogOpen(false);
    loadProducts();
  }

  async function handleDelete(id) {
    if (!confirm("Deseja excluir este produto?")) return;
    await cline.entities.Product.delete(id);
    loadProducts();
  }

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
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
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Produto
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto"
          description="Cadastre seu primeiro produto para começar"
          action={<Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Produto</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover" />}
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {p.category}
                      </span>
                    )}
                    {p.color && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground">
                        {p.color}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {p.sku && <p className="text-xs text-muted-foreground mb-1">SKU: {p.sku}</p>}
              {p.brand && <p className="text-xs text-muted-foreground mb-2">Marca: {p.brand}</p>}
              {p.images && p.images.length > 1 && (
                <div className="flex gap-1 mb-2">
                  {p.images.slice(0, 4).map((url, i) => (
                    <img key={i} src={url} alt="" className="h-7 w-7 rounded object-cover border border-border" />
                  ))}
                  {p.images.length > 4 && <span className="text-xs text-muted-foreground self-center">+{p.images.length - 4}</span>}
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground">Custo</p>
                  <p className="text-sm font-medium">{formatCurrency(p.cost_price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Venda</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(p.sell_price)}</p>
                </div>
              </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cor</Label>
                <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ex: Preto" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marca</Label>
                <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <Label>SKU/Código</Label>
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço de Custo</Label>
                <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              </div>
              <div>
                <Label>Preço de Venda *</Label>
                <Input type="number" step="0.01" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
              </div>
            </div>
            {form.cost_price && form.sell_price && Number(form.cost_price) > 0 && (
              <div className={`text-sm px-3 py-2 rounded-lg ${
                Number(form.sell_price) > Number(form.cost_price)
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                Margem de lucro:{" "}
                <strong>
                  {(((Number(form.sell_price) - Number(form.cost_price)) / Number(form.cost_price)) * 100).toFixed(1)}%
                </strong>
                {" "}(R$ {(Number(form.sell_price) - Number(form.cost_price)).toFixed(2)} por unidade)
              </div>
            )}
            {/* Photo upload */}
            <div>
              <Label>Fotos do Produto</Label>
              <div className="mt-2 space-y-3">
                {form.images && form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {form.images.map((url) => (
                      <div key={url} className="relative group">
                        <img src={url} alt="" className={`h-16 w-16 rounded-lg object-cover border-2 ${form.image_url === url ? "border-primary" : "border-border"}`} />
                        <button
                          type="button"
                          onClick={() => setMainPhoto(url)}
                          className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-0.5 rounded-b-lg hidden group-hover:flex items-center justify-center gap-1"
                          title="Definir como principal"
                        >
                          <Star className="h-2.5 w-2.5" /> Principal
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(url)}
                          className="absolute -top-1 -right-1 bg-destructive text-white rounded-full h-4 w-4 flex items-center justify-center hidden group-hover:flex"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                        {form.image_url === url && (
                          <div className="absolute top-0 left-0 bg-primary text-white text-xs px-1 rounded-br-md rounded-tl-md"><Star className="h-2.5 w-2.5" /></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <label className="cursor-pointer inline-block">
                  <Button asChild variant="outline" size="sm" disabled={uploadingImage}>
                    <span>{uploadingImage ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Camera className="h-4 w-4" /> Adicionar fotos</>}</span>
                  </Button>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
            <Button onClick={handleSave} className="w-full" disabled={!form.name || !form.sell_price}>
              {editing ? "Salvar Alterações" : "Cadastrar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}