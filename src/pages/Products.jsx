import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, DollarSign, Tag, Image as ImageIcon, Camera, Edit3, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { parsePriceToCents, formatPriceDisplay, percentOfCents, subtractCents } from "@/lib/formatters";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  
  const initialForm = {
    name: "", category: "", cost_price: "", sell_price: "",
    commission_percent: "5", brand: "Vitalle Exclusive",
    image_url: "", color: "", sku: "", status: "Ativo"
  };
  const [formData, setFormData] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [metrics, setMetrics] = useState({ profit_cents: 0n, margin: 0, net_profit_cents: 0n });

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const costCents = parsePriceToCents(formData.cost_price);
    const sellCents = parsePriceToCents(formData.sell_price);
    if (Number(sellCents) > 0) {
      const commValueCents = percentOfCents(sellCents, formData.commission_percent);
      const bruteProfitCents = subtractCents(sellCents, costCents);
      const netProfitCents = subtractCents(bruteProfitCents, commValueCents);
      setMetrics({ 
        margin: (Number(netProfitCents) / Number(sellCents)) * 100,
        net_profit_cents: netProfitCents
      });
    }
  }, [formData.cost_price, formData.sell_price]);

  async function fetchProducts() {
    setLoadingProducts(true);
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoadingProducts(false);
  }

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      ...item,
      cost_price: item.cost_price?.toString() || "",
      sell_price: item.sell_price?.toString() || ""
    });
    setPreviewUrl(item.image_url || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    setUploading(true);
    const fileName = `products/${Date.now()}.${file.name.split('.').pop()}`;
    const { data, error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) return null;
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
    setUploading(false);
    return publicUrl;
  };

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;
      if (selectedFile) finalImageUrl = await uploadImage(selectedFile);

      const payload = {
        ...formData,
        image_url: finalImageUrl,
        price: parseFloat(formData.sell_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        sell_price_cents: Number(parsePriceToCents(formData.sell_price)),
        cost_price_cents: Number(parsePriceToCents(formData.cost_price)),
        net_profit_cents: Number(metrics.net_profit_cents)
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
      fetchProducts();
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
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

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-2xl space-y-8 animate-in slide-in-from-top-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Identidade</Label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-vitalle w-full h-11" placeholder="Nome da Peça" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={formData.sku} onValueChange={v => setFormData({...formData, sku: v})}>
                  <SelectTrigger className="rounded-xl border-none bg-slate-50 h-11"><SelectValue placeholder="Tam" /></SelectTrigger>
                  <SelectContent><SelectItem value="P">P</SelectItem><SelectItem value="M">M</SelectItem><SelectItem value="G">G</SelectItem><SelectItem value="GG">GG</SelectItem><SelectItem value="Único">Único</SelectItem></SelectContent>
                </Select>
                <input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="input-vitalle w-full h-11" placeholder="Cor" />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400">Visual</Label>
              <label className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files[0]; if(file){ setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); } }} className="hidden" />
                {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" /> : <Camera className="text-slate-300 group-hover:text-magenta transition-colors" />}
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
                <p className="text-[9px] text-slate-500 uppercase">Lucro Líquido</p>
                <p className="text-xl font-black text-green-400">{formatPriceDisplay(metrics.net_profit_cents)}</p>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-magenta hover:bg-magenta/90 text-white font-black uppercase italic text-[10px] h-11 rounded-xl">
                {loading ? <Loader2 className="animate-spin" /> : editingId ? "ATUALIZAR PEÇA" : "CONFIRMAR CADASTRO"}
              </Button>
            </div>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {loadingProducts ? (
          <div className="col-span-full text-center py-20 animate-pulse text-slate-300 font-black italic">SINCRONIZANDO ESTOQUE...</div>
        ) : products.map((item) => (
          <div key={item.id} className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all relative">
            <button onClick={() => handleEdit(item)} className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur p-2 rounded-full shadow-md text-slate-400 hover:text-magenta transition-all opacity-0 group-hover:opacity-100">
              <Edit3 size={14} />
            </button>
            <div className="aspect-[3/4] bg-slate-50 overflow-hidden">
              {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><ImageIcon /></div>}
            </div>
            <div className="p-4">
              <p className="text-[9px] font-black text-magenta uppercase tracking-tighter mb-1">{item.category || 'VITALLE'}</p>
              <h4 className="font-bold text-slate-800 text-xs truncate uppercase">{item.name}</h4>
              <p className="font-black text-slate-900 mt-2 italic">{formatPriceDisplay(item.sell_price_cents)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}