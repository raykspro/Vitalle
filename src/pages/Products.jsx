import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, Loader2, Camera, Edit3, Package, Image as ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parsePriceToCents, formatPriceDisplay } from "@/lib/formatters";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

const categories = [
  { id: "baby-doll", name: "Baby Doll Adulto" },
  { id: "baby-doll-infantil", name: "Baby Doll Infantil" },
  { id: "camisola", name: "Camisolas" },
  { id: "lingerie", name: "Lingeries" },
  { id: "conjuntos", name: "Conjuntos" },
  { id: "acessorios", name: "Acessórios" },
];

function toNumberFromCents(cents) {
  if (cents == null || cents === "" || typeof cents === "undefined") return 0;
  return Number(cents) / 100;
}

function hasSellPrice(p) {
  return p.sell_price_cents != null && p.sell_price_cents !== 0;
}

export default function Products() {
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // [{ product, total_stock, pending: { photo, sellPrice, category, any }}]
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  const initialForm = {
    image_url: "",
    cost_price: "",
    margin_percent: "30",
    sell_price: "",
    category: "baby-doll",
    description: "",
  };

  const [formData, setFormData] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [metrics, setMetrics] = useState({ net_profit_cents: 0, margin: 0 });

  useEffect(() => {
    fetchEnrichmentItems();
  }, []);

  const filteredItems = useMemo(() => {
    if (activeCategory === "all") return items;
    return items.filter((row) => row.product.category === activeCategory);
  }, [items, activeCategory]);

  // Margem (%) -> vende automaticamente (margem = lucro/sell)
  useEffect(() => {
    const costCents = Number(parsePriceToCents(formData.cost_price || "0"));
    const marginPct = Number(formData.margin_percent || 0);
    const marginFrac = marginPct / 100;

    if (!Number.isFinite(costCents) || costCents <= 0 || marginFrac >= 1) {
      setMetrics({ net_profit_cents: 0, margin: marginPct });
      setFormData((prev) => ({ ...prev, sell_price: prev.sell_price }));
      return;
    }

    // sell = cost / (1 - margin)
    const sellCents = Math.round(costCents / (1 - marginFrac));

    // métrica (mantém comissão fixa legado apenas para visual)
    const commPercent = 5;
    const commValue = Math.round((sellCents * commPercent) / 100);
    const netProfitCents = sellCents - costCents - commValue;
    const realizedMarginPct = sellCents > 0 ? (netProfitCents / sellCents) * 100 : 0;

    setMetrics({ net_profit_cents: netProfitCents, margin: realizedMarginPct });

    setFormData((prev) => ({
      ...prev,
      sell_price: (sellCents / 100).toFixed(2),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cost_price, formData.margin_percent]);

  async function fetchEnrichmentItems() {
    setLoadingProducts(true);
    try {
      const { data: productsRes, error: prodErr } = await supabase
        .from("products")
        .select("id, model, name, category, image_url, cost_price_cents, sell_price_cents, description")
        .order("created_at", { ascending: false });

      if (prodErr) throw prodErr;

      const { data: stockRes, error: stockErr } = await supabase
        .from("stock_items")
        .select("product_id, quantity")
        .order("id", { ascending: true });

      if (stockErr) throw stockErr;

      const stockMap = new Map();
      for (const s of stockRes || []) {
        const pid = s.product_id;
        const prev = stockMap.get(pid) ?? 0;
        stockMap.set(pid, prev + (Number(s.quantity) || 0));
      }

      const enriched = (productsRes || []).map((p) => {
        const total_stock = stockMap.get(p.id) ?? 0;

        const photoMissing = !p.image_url;
        const sellMissing = !hasSellPrice(p);
        const categoryMissing = !p.category;

        const any = photoMissing || sellMissing || categoryMissing;

        return {
          product: p,
          total_stock,
          pending: {
            photo: photoMissing,
            sellPrice: sellMissing,
            category: categoryMissing,
            any,
          },
        };
      });

      setItems(enriched.filter((x) => x.pending.any));
    } catch (e) {
      toast.error("Erro ao carregar itens: " + e.message);
    } finally {
      setLoadingProducts(false);
    }
  }

  const handleEdit = (row) => {
    const p = row.product;
    setEditingId(p.id);

    setFormData({
      image_url: p.image_url || "",
      cost_price: p.cost_price_cents ? (Number(p.cost_price_cents) / 100).toFixed(2) : "",
      margin_percent: "30",
      sell_price: p.sell_price_cents ? (Number(p.sell_price_cents) / 100).toFixed(2) : "",
      category: p.category || "baby-doll",
      description: p.description || "",
    });

    setPreviewUrl(p.image_url || "");
    setSelectedFile(null);
    setShowForm(true);
  };

  async function uploadImage(file) {
    if (!file) return null;
    const fileName = `products/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("products").upload(fileName, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
    return publicUrl;
  }

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;
      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const payload = {
        image_url: finalImageUrl,
        cost_price_cents: Number(parsePriceToCents(formData.cost_price || "0")),
        sell_price_cents: Number(parsePriceToCents(formData.sell_price || "0")),
        category: formData.category,
        description: formData.description || "",
      };

      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) throw error;

      toast.success("ENRIQUECIMENTO ATUALIZADO!");
      setShowForm(false);
      setEditingId(null);
      setFormData(initialForm);
      setPreviewUrl("");
      setSelectedFile(null);
      fetchEnrichmentItems();
    } catch (err) {
      toast.error("Erro no Supabase: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full px-4 py-8 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase">Vitalle Vitrine</h1>
          <div className="h-1 w-12 bg-magenta rounded-full mt-1" />
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) setEditingId(null);
          }}
          className={cn(
            "px-6 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-lg",
            showForm ? "bg-slate-100 text-slate-500" : "bg-magenta text-white hover:scale-105"
          )}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />} {showForm ? "FECHAR" : "ENRIQUECER"}
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest px-4">
            Pendências
          </h3>
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all",
              activeCategory === "all"
                ? "bg-magenta text-white shadow-lg shadow-magenta/20 scale-105"
                : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <span className="text-lg">✨</span>
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all",
                activeCategory === cat.id
                  ? "bg-magenta text-white shadow-lg shadow-magenta/20 scale-105"
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <span className="text-lg">{cat.id === "baby-doll" ? "🌙" : cat.id === "camisola" ? "👗" : "💎"}</span>
              {cat.name}
            </button>
          ))}

          <div className="pt-6 px-4">
            <div className="text-[10px] font-black uppercase text-slate-500">Status de enriquecimento</div>
            <div className="mt-2 flex flex-col gap-2 text-[10px] font-bold">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500/90" /> Foto
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500/90" /> Preço
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500/90" /> Categoria
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-8">
          {showForm && (
            <form
              onSubmit={handleSave}
              className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-top-4"
            >
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Foto</Label>
                  <label className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    {previewUrl ? (
                      <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <Camera className="text-slate-300 group-hover:text-magenta transition-colors" />
                    )}
                  </label>

                  <div className="pt-2 border-t border-slate-100">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Categoria</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}>
                      <SelectTrigger className="rounded-xl border-none bg-slate-50 h-11">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-[10px] font-black uppercase text-slate-400">Descrição</Label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full bg-[#F8FAFC] border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-[#D946EF]/20 resize-none"
                      placeholder="Detalhes comerciais, tecido, diferenciais..."
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Precificação</Label>

                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1 uppercase">Preço de Custo</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cost_price: e.target.value }))}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-magenta/20"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] text-magenta block mb-1 uppercase">Margem desejada (%)</span>
                    <input
                      type="number"
                      step="1"
                      value={formData.margin_percent}
                      onChange={(e) => setFormData((prev) => ({ ...prev, margin_percent: e.target.value }))}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-magenta/20"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1 uppercase">Preço de Venda (calculado)</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sell_price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sell_price: e.target.value }))}
                      className="flex h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 ring-magenta/20"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[9px] text-slate-500 uppercase font-bold">Lucro Estimado</div>
                    <div className="text-xl font-black text-green-600">{formatPriceDisplay(metrics.net_profit_cents)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-[#0B1220] rounded-[1.5rem] p-6 text-white space-y-4 shadow-xl">
                    <Label className="text-[10px] font-black uppercase text-magenta">Ação</Label>
                    <Button
                      type="submit"
                      disabled={loading || !editingId}
                      className="w-full bg-magenta hover:bg-magenta/90 text-white font-black uppercase italic text-[10px] h-11 rounded-xl transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "SALVAR ENRIQUECIMENTO"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingProducts ? (
              <div className="col-span-full text-center py-20 animate-pulse text-slate-300 font-black italic uppercase tracking-widest text-xs">
                Sincronizando Vitrine...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-300 font-bold uppercase text-xs">
                Nenhuma peça pendente nesta categoria.
              </div>
            ) : (
              filteredItems.map((row) => {
                const item = row.product;
                const missingPhoto = row.pending.photo;
                const missingSell = row.pending.sellPrice;
                const missingCategory = row.pending.category;

                const badge = missingPhoto
                  ? { bg: "bg-red-500/15", fg: "text-red-500", bd: "border-red-500/25", label: "Foto" }
                  : missingSell
                    ? { bg: "bg-orange-500/15", fg: "text-orange-500", bd: "border-orange-500/25", label: "Preço" }
                    : missingCategory
                      ? { bg: "bg-emerald-500/15", fg: "text-emerald-500", bd: "border-emerald-500/25", label: "Categoria" }
                      : { bg: "bg-slate-100", fg: "text-slate-700", bd: "border-slate-200", label: "OK" };

                return (
                  <div key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
                    <button
                      type="button"
                      onClick={() => handleEdit(row)}
                      className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur p-2 rounded-full shadow-md text-slate-400 hover:text-magenta transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Edit3 size={14} />
                    </button>

                    <div className="aspect-[3/4] bg-slate-50 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          alt={item.model}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                          <Package size={40} />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black text-magenta uppercase tracking-tighter mb-1">VITALLE</p>
                        <div
                          className={`border ${badge.bd} ${badge.bg} ${badge.fg} px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border`}
                        >
                          {badge.label}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-xs truncate uppercase mt-2">{item.model || item.name}</h4>
                      <p className="font-black text-slate-900 mt-2 italic">{formatPriceDisplay(item.sell_price_cents)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

