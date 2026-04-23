import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, Camera, Edit3, Package, Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label"; 
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parsePriceToCents, formatPriceDisplay } from "@/lib/formatters";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

// Definição das categorias para uso no filtro e no formulário
const categories = [
  { id: 'all', name: 'Todos os Modelos', icon: '✨' },
  { id: 'baby-doll', name: 'Baby Doll Adulto', icon: '🌙' },
  { id: 'baby-doll-infantil', name: 'Baby Doll Infantil', icon: '👧' },
  { id: 'camisola', name: 'Camisolas', icon: '👗' },
  { id: 'lingerie', name: 'Lingeries', icon: '💝' },
  { id: 'conjuntos', name: 'Conjuntos', icon: '👔' },
  { id: 'acessorios', name: 'Acessórios', icon: '💍' },
];

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    model: "",
    category: "baby-doll",
    cost_price: "",
    sell_price: "",
    commission_percent: "5", 
    brand: "Vitalle Exclusive",
    image_url: "", 
    color: "", 
    sku: "", 
    status: "Ativo"
  };

  const [formData, setFormData] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [metrics, setMetrics] = useState({ margin: 0, net_profit_cents: 0 });

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const costCents = Number(parsePriceToCents(formData.cost_price || "0"));
    const sellCents = Number(parsePriceToCents(formData.sell_price || "0"));
    
    if (sellCents > 0) {
      const commValueCents = (sellCents * Number(formData.commission_percent)) / 100;
      const netProfitCents = sellCents - costCents - commValueCents;
      
      setMetrics({ 
        margin: (netProfitCents / sellCents) * 100,
        net_profit_cents: Math.round(netProfitCents)
      });
    }
  }, [formData.cost_price, formData.sell_price, formData.commission_percent]);

  async function fetchProducts() {
    setLoadingProducts(true);
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) toast.error("Erro ao carregar banco");
    setProducts(data || []);
    setLoadingProducts(false);
  }

  // Filtragem local baseada na categoria selecionada
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      model: item.model || item.name || "",
      category: item.category || "baby-doll",
      cost_price: (item.cost_price_cents / 100).toString(),
      sell_price: (item.sell_price_cents / 100).toString()
    });
    setPreviewUrl(item.image_url || "");
    setShowForm(true);
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    const fileName = `products/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    return publicUrl;
  };

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
        name: formData.model,
        model: formData.model,
        category: formData.category,
        brand: formData.brand,
        color: formData.color,
        sku: formData.sku,
        status: formData.status,
        image_url: finalImageUrl,
        sell_price_cents: Number(parsePriceToCents(formData.sell_price)),
        cost_price_cents: Number(parsePriceToCents(formData.cost_price)),
      };

      const { error } = editingId 
        ? await supabase.from('products').update(payload).eq('id', editingId)
        : await supabase.from('products').insert([payload]);

      if (error) throw error;

      toast.success(editingId ? "PEÇA ATUALIZADA!" : "PEÇA CADASTRADA!");
      setShowForm(false);
      setEditingId(null);
      setFormData(initialForm);
      setPreviewUrl("");
      setSelectedFile(null);
      fetchProducts();
    } catch (err) { 
      toast.error("Erro no Supabase: " + err.message); 
    }
    setLoading(false);
  }

  return (
    <div className="w-full px-4 py-8 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic uppercase">Vitalle Vitrine</h1>
          <div className="h-1 w-12 bg-magenta rounded-full mt-1" />
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); if(showForm) setEditingId(null); }}
          className={cn("px-6 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center gap-2 shadow-lg", 
            showForm ? "bg-slate-100 text-slate-500" : "bg-magenta text-white hover:scale-105")}
        >
          {showForm ? <X size={14}/> : <Plus size={14}/>} {showForm ? "FECHAR" : "NOVA PEÇA"}
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* LISTA VERTICAL DE CATEGORIAS */}
        <div className="w-full md:w-64 space-y-2">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest px-4">Categorias</h3>
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
              <span className="text-lg">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-8">
          {showForm && (
            <form onSubmit={handleSave} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-top-4">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Identidade</Label>
                  <input required value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-magenta/20" placeholder="Modelo da Peça" />
                  
                  <div className="grid grid-cols-1 gap-2">
                    <Label className="text-[9px] font-bold uppercase text-slate-400">Classificação</Label>
                    <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
                      <SelectTrigger className="rounded-xl border-none bg-slate-50 h-11"><SelectValue placeholder="Categoria" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.id !== 'all').map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Select value={formData.sku} onValueChange={v => setFormData({...formData, sku: v})}>
                      <SelectTrigger className="rounded-xl border-none bg-slate-50 h-11"><SelectValue placeholder="Tam" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P">P</SelectItem>
                        <SelectItem value="M">M</SelectItem>
                        <SelectItem value="G">G</SelectItem>
                        <SelectItem value="GG">GG</SelectItem>
                        <SelectItem value="Único">Único</SelectItem>
                      </SelectContent>
                    </Select>
                    <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-magenta/20" placeholder="Cor" />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Visual</Label>
                  <label className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if(file){ setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); } }} className="hidden" />
                    {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" /> : <Camera className="text-slate-300 group-hover:text-magenta transition-colors" />}
                  </label>
                </div>

                <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white space-y-4 shadow-xl">
                  <Label className="text-[10px] font-black uppercase text-magenta">Financeiro</Label>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1 uppercase">Custo de Fábrica</span>
                    <input type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="bg-white/10 w-full h-10 rounded-lg px-3 font-bold text-white outline-none focus:ring-1 ring-magenta" />
                  </div>
                  <div>
                    <span className="text-[9px] text-magenta block mb-1 uppercase">Preço de Venda</span>
                    <input type="number" step="0.01" value={formData.sell_price} onChange={e => setFormData({...formData, sell_price: e.target.value})} className="bg-white/10 w-full h-10 rounded-lg px-3 font-bold text-magenta outline-none focus:ring-1 ring-magenta" />
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase">Lucro Líquido Est.</p>
                    <p className="text-xl font-black text-green-400">{formatPriceDisplay(metrics.net_profit_cents)}</p>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-magenta hover:bg-magenta/90 text-white font-black uppercase italic text-[10px] h-11 rounded-xl transition-all">
                    {loading ? <Loader2 className="animate-spin" /> : editingId ? "ATUALIZAR PEÇA" : "CONFIRMAR CADASTRO"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingProducts ? (
              <div className="col-span-full text-center py-20 animate-pulse text-slate-300 font-black italic uppercase tracking-widest text-xs">Sincronizando Vitrine...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-20 text-slate-300 font-bold uppercase text-xs">Nenhuma peça nesta categoria.</div>
            ) : filteredProducts.map((item) => (
              <div key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
                <button onClick={() => handleEdit(item)} className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur p-2 rounded-full shadow-md text-slate-400 hover:text-magenta transition-all opacity-0 group-hover:opacity-100">
                  <Edit3 size={14} />
                </button>
                <div className="aspect-[3/4] bg-slate-50 overflow-hidden">
                  {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.model} /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={40} /></div>}
                </div>
                <div className="p-4">
                  <p className="text-[9px] font-black text-magenta uppercase tracking-tighter mb-1">{item.brand || 'VITALLE'}</p>
                  <h4 className="font-bold text-slate-800 text-xs truncate uppercase">{item.model || item.name}</h4>
                  <p className="font-black text-slate-900 mt-2 italic">{formatPriceDisplay(item.sell_price_cents)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}