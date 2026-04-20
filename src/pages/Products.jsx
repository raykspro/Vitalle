import React, { useState, useEffect } from "react";
import { Plus, X, Loader2, DollarSign, Tag, Image as ImageIcon, Camera, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parsePriceToCents,
  formatPriceDisplay,
  percentOfCents,
  subtractCents
} from "@/lib/formatters";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

export default function Products() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [products, setProducts] = useState([]);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    cost_price: "",
    sell_price: "",
    commission_percent: "5",
    brand: "Vitalle Exclusive",
    image_url: "",
    color: "",
    sku: "",
    status: "Ativo"
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [metrics, setMetrics] = useState({ profit_cents: 0n, margin: 0, commission_value_cents: 0n, net_profit_cents: 0n });

  // FUNÇÃO PARA BUSCAR PRODUTOS
  async function fetchProducts() {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Erro ao buscar:", error);
      toast.error("Erro ao carregar vitrine");
    } finally {
      setLoadingProducts(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const costCents = parsePriceToCents(formData.cost_price);
    const sellCents = parsePriceToCents(formData.sell_price);
    
    if (Number(sellCents) > 0) {
      const commValueCents = percentOfCents(sellCents, formData.commission_percent);
      const bruteProfitCents = subtractCents(sellCents, costCents);
      const netProfitCents = subtractCents(bruteProfitCents, commValueCents);
      const margin = (Number(netProfitCents) / Number(sellCents)) * 100;

      setMetrics({ 
        profit_cents: bruteProfitCents, 
        margin,
        commission_value_cents: commValueCents,
        net_profit_cents: netProfitCents
      });
    }
  }, [formData.cost_price, formData.sell_price, formData.commission_percent]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
      setFormData(prev => ({...prev, image_url: ''})); // Clear old URL
    }
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      toast.error("Erro no upload da imagem", { description: error.message });
      return null;
    } finally {
      setUploading(false);
    }
  };

  async function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    try {
      let finalImageUrl = formData.image_url;
      if (selectedFile) {
        finalImageUrl = await uploadImage(selectedFile);
        if (!finalImageUrl) {
          setLoading(false);
          return;
        }
      }

      const costCents = parsePriceToCents(formData.cost_price);
      const sellCents = parsePriceToCents(formData.sell_price);
      
      const { error } = await supabase.from('products').insert([{
        ...formData,
        image_url: finalImageUrl,
        price: parseFloat(formData.sell_price) || 0,
        cost_price: parseFloat(formData.cost_price) || 0,
        sell_price_cents: Number(sellCents),
        cost_price_cents: Number(costCents),
        commission_value_cents: Number(metrics.commission_value_cents),
        net_profit_cents: Number(metrics.net_profit_cents),
        stock_quantity: 0
      }]);

      if (error) throw error;

      toast.success("💎 VITALLE: PEÇA CADASTRADA!", {
        description: `${formData.name} já está no sistema.`,
      });

      setShowForm(false);
      setFormData({ name: "", category: "", cost_price: "", sell_price: "", commission_percent: "5", brand: "Vitalle Exclusive", image_url: "", color: "", sku: "", status: "Ativo" });
      setSelectedFile(null);
      setPreviewUrl("");
      fetchProducts();
    } catch (error) {
      toast.error("ERRO NO CADASTRO", { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">VITALLE GESTÃO</h1>
          <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">Inventário de Alto Padrão</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={cn(
            "w-full md:w-auto px-10 py-5 rounded-2xl font-black text-[11px] tracking-[0.3em] transition-all flex items-center justify-center gap-3", 
            showForm ? "bg-slate-900 text-white shadow-xl" : "bg-magenta text-white shadow-lg hover:scale-105"
          )}
        >
          {showForm ? <><X className="h-4 w-4" /> CANCELAR</> : <><Plus className="h-4 w-4" /> NOVO PRODUTO</>}
        </button>
      </header>

      {showForm && (
        <form onSubmit={handleSave} className="mx-auto max-w-4xl bg-white rounded-[2.5rem] p-6 lg:p-12 border border-slate-200 shadow-2xl space-y-10 animate-in zoom-in-95 duration-300">
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
            {/* COLUNA 1: IDENTIDADE */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-magenta tracking-widest uppercase flex items-center gap-2">
                <Tag className="h-4 w-4" /> Identidade da Peça
              </h3>
              <div className="space-y-4">
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-vitalle w-full" placeholder="Nome do Produto" />
                <input type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="input-vitalle w-full" placeholder="Marca" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="input-vitalle w-full" >
                    <option value="">Tamanho</option>
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                    <option value="GG">GG</option>
                    <option value="Único">Único</option>
                  </select>
                  <select value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="input-vitalle w-full" >
                    <option value="">Cor</option>
                    <option value="Preto">Preto</option>
                    <option value="Branco">Branco</option>
                    <option value="Satin">Satin</option>
                    <option value="Vinho">Vinho</option>
                    <option value="Azul Marinho">Azul Marinho</option>
                  </select>
                </div>
              </div>
            </div>

            {/* COLUNA 2: MÍDIA */}
            <div className="space-y-6">
              <h3 className="text-[11px] font-black text-magenta tracking-widest uppercase flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Visual & Categoria
              </h3>
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-md border-2 border-dashed border-slate-300 hover:border-magenta/50 transition-colors cursor-pointer group">
                  <label className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-magenta transition-colors">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileSelect} 
                      className="hidden"
                      disabled={uploading}
                    />
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="h-12 w-12 mb-2 opacity-50 group-hover:opacity-100" />
                        <div className="text-center">
                          <p className="font-black text-lg">📸</p>
                          <p className="text-sm font-bold uppercase tracking-wider">Foto do Produto</p>
                          <p className="text-xs text-slate-500">Aspecto 3:4 automático</p>
                        </div>
                      </>
                    )}
                  </label>
                </div>
{uploading && <p className="text-magenta text-sm font-bold flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</p>}
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="input-vitalle w-full rounded-[1.5rem] p-3 border border-slate-200 focus:border-magenta">
                  <option value="">Categoria</option>
                  <option value="Baby Doll">Baby Doll</option>
                  <option value="Baby Doll Infantil">Baby Doll Infantil</option>
                  <option value="Camisola">Camisola</option>
                </select>
              </div>
            </div>

            {/* COLUNA 3: FINANCEIRO */}
            <div className="bg-slate-50 rounded-[2rem] p-6 border-2 border-magenta/5 space-y-6">
              <h3 className="text-[11px] font-black text-magenta tracking-widest uppercase flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Precificação
              </h3>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-xl shadow-sm">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Custo R$</label>
                  <input required type="number" step="0.01" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: e.target.value})} className="w-full border-none p-0 font-black outline-none" />
                </div>
                <div className="bg-white p-3 rounded-xl shadow-md border-2 border-magenta/20">
                  <label className="text-[9px] font-black text-magenta uppercase">Venda R$</label>
                  <input required type="number" step="0.01" value={formData.sell_price} onChange={e => setFormData({...formData, sell_price: e.target.value})} className="w-full border-none p-0 font-black text-magenta outline-none" />
                </div>
              </div>
            </div>
          </div>

          {/* PAINEL DE PERFORMANCE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-magenta/20 blur-[80px] rounded-full" />
            <div className="relative z-10">
              <span className="text-[9px] font-black text-magenta uppercase">Lucro Líquido</span>
              <p className="text-3xl font-black italic text-green-400">{formatPriceDisplay(metrics.net_profit_cents)}</p>
            </div>
            <div className="relative z-10">
              <span className="text-[9px] font-black text-slate-400 uppercase">Margem</span>
              <p className={cn("text-3xl font-black italic", metrics.margin < 30 ? "text-rose-500" : "text-white")}>{metrics.margin.toFixed(1)}%</p>
            </div>
            <div className="relative z-10 text-right">
              <button disabled={loading} type="submit" className="btn-vitalle w-full flex items-center justify-center gap-4">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "REGISTRAR PEÇA"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* GALERIA DE PEÇAS VITALLE (Sempre visível) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loadingProducts ? (
          <div className="col-span-full py-20 text-center animate-pulse font-black text-slate-300 uppercase tracking-[0.5em]">
            Sincronizando Coleção...
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 italic font-medium">Nenhuma peça na vitrine virtual.</p>
          </div>
        ) : (
          products.map((item) => (
            <div key={item.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all border border-slate-100 relative">
              <div className="absolute top-4 left-4 z-10">
              <span className="bg-magenta/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
                  {item?.category || 'Peça Luxo'}
                </span>
              </div>

              <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                {item?.image_url ? (
                  <img src={item.image_url} alt={item?.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>

              <div className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{item.brand}</p>
                  </div>
                  <p className="font-black text-magenta italic">{formatPriceDisplay(item.sell_price_cents)}</p>
                </div>
                
                <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="text-slate-400">Estoque: <span className="text-slate-900">{item.stock_quantity || 0} un</span></span>
                  <button className="text-blue-500 hover:text-magenta transition-colors"><Edit3 className="h-4 w-4"/></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}