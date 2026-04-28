import { useState, useEffect } from "react";
import { supabase } from '../lib/supabaseClient';
import { Plus, Search, Trash2, Loader2, Package, Tag, AlertCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// MESTRE: Importações para o PDF (precisa rodar: npm install jspdf jspdf-autotable)
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Stock() {
  const [stockItems, setStockItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", size: "", color: "", quantity: "" });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: itemsRes, error: stockError } = await supabase
        .from('stock_items')
        .select(`*, products ( name, sell_price_cents )`)
        .order('id', { ascending: false });

      const { data: prodsRes } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (stockError) throw stockError;

      const formattedItems = itemsRes?.map(item => ({
        ...item,
        product_name: item.products?.name || "Produto Removido",
        price: (item.products?.sell_price_cents || 0) / 100,
      })) || [];

      setStockItems(formattedItems);
      setProducts(prodsRes || []);
    } catch (error) {
      console.error("Erro Vitalle:", error);
      toast.error("Erro de conexão mestre.");
    } finally {
      setLoading(false);
    }
  }

  // --- FUNÇÃO DE EXPORTAR CATÁLOGO ---
  const exportCatalogue = () => {
    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');
    
    // Header do PDF
    doc.setFontSize(22);
    doc.setTextColor(217, 70, 239); // Magenta Vitalle
    doc.text("VITALLE - CATÁLOGO DE PRODUTOS", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${date} | Curitiba - PR`, 14, 28);

    // Preparando os dados (Agrupando para o PDF)
    const tableData = Object.entries(grouped).map(([name, items]) => {
      // Pega tamanhos únicos e ordena
      const sizes = [...new Set(items.map(i => i.size))].sort().join(", ");
      const price = items[0]?.price ? `R$ ${items[0].price.toFixed(2)}` : "Consulte";
      return [name.toUpperCase(), sizes, price];
    });

    doc.autoTable({
      startY: 35,
      head: [['MODELO / DESCRIÇÃO', 'TAMANHOS DISPONÍVEIS', 'PREÇO']],
      body: tableData,
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [50, 50, 50], fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 60, halign: 'center' },
        2: { cellWidth: 30, halign: 'right', fontStyle: 'bold' }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    doc.save(`Catalogo_Vitalle_${date.replace(/\//g, '-')}.pdf`);
    toast.success("Catálogo pronto, Senhor!");
  };

  async function handleSave() {
    if (!form.product_id || !form.size || !form.quantity) return toast.error("Preencha tudo, mestre!");
    const colorUpper = (form.color || 'PADRÃO').toUpperCase();
    const qtyToAdd = Number(form.quantity);

    try {
      const { data: existingItem } = await supabase
        .from('stock_items')
        .select('id, quantity')
        .eq('product_id', form.product_id)
        .eq('size', form.size)
        .eq('color', colorUpper)
        .maybeSingle();

      if (existingItem) {
        const { error: updateError } = await supabase
          .from('stock_items')
          .update({ quantity: existingItem.quantity + qtyToAdd })
          .eq('id', existingItem.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('stock_items')
          .insert([{ product_id: form.product_id, size: form.size, color: colorUpper, quantity: qtyToAdd }]);
        if (insertError) throw insertError;
      }
      toast.success("Estoque Vitalle Atualizado!");
      setDialogOpen(false);
      setForm({ product_id: "", size: "", color: "", quantity: "" });
      loadData();
    } catch (error) {
      toast.error("Falha ao salvar no banco.");
    }
  }

  const filtered = stockItems.filter((s) =>
    s.product_name.toLowerCase().includes(search.toLowerCase()) ||
    s.color?.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, item) => {
    if (!acc[item.product_name]) acc[item.product_name] = [];
    acc[item.product_name].push(item);
    return acc;
  }, {});

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-magenta" />
      <span className="font-black italic text-slate-400 uppercase tracking-widest animate-pulse">Sincronizando Vitalle...</span>
    </div>
  );

  return (
    <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto pb-40 bg-[#fcfcfc] min-h-screen font-sans">
      
      {/* HEADER VITRINE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Estoque Central</h1>
          <p className="text-[10px] font-black text-magenta uppercase tracking-widest">Painel de Controle & Vitrine</p>
        </div>
        
        <Button 
          onClick={exportCatalogue}
          className="bg-white border-2 border-slate-200 text-slate-900 hover:border-magenta hover:text-magenta font-black uppercase italic rounded-2xl h-12 px-6 transition-all shadow-md gap-2"
        >
          <FileDown size={20} /> Exportar Catálogo PDF
        </Button>
      </div>

      <div className="relative w-full shadow-2xl rounded-2xl overflow-hidden">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input 
          placeholder="BUSCAR MODELO OU COR..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-12 border-none bg-white h-16 w-full font-bold text-slate-700 text-base" 
        />
      </div>

      <Button 
        onClick={() => setDialogOpen(true)} 
        className="fixed bottom-28 right-6 z-50 bg-magenta hover:opacity-90 text-white font-black uppercase rounded-full shadow-[0_10px_40px_rgba(217,70,239,0.4)] p-0 h-16 w-16 md:w-auto md:px-8 md:h-14 md:rounded-2xl"
      >
        <Plus className="h-8 w-8 md:mr-2" /> <span className="hidden md:inline">Lançar Avulso</span>
      </Button>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-24 rounded-[3rem] bg-white border-2 border-dashed border-slate-100 shadow-sm flex flex-col items-center">
          <Package className="h-20 w-20 text-slate-100 mb-4" />
          <p className="text-slate-400 font-bold uppercase italic tracking-widest">Nada no estoque, mestre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {Object.entries(grouped).map(([productName, items]) => (
            <div key={productName} className="bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 overflow-hidden transition-all">
              
              {/* HEADER DO CARD - ESTILO VITRINE */}
              <div className="p-6 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex justify-between items-center border-b border-white/5">
                <div className="flex items-center gap-4">
                   <Tag size={20} className="text-magenta" />
                   <h3 className="font-black text-white uppercase italic text-lg md:text-xl tracking-tight">{productName}</h3>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-black text-slate-400 uppercase">Preço Vitrine</span>
                  <span className="text-magenta font-black text-xl italic">R$ {items[0]?.price.toFixed(2)}</span>
                </div>
              </div>

              {/* LISTA DE VARIAÇÕES */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-magenta/30 transition-all">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0f172a] font-black text-2xl shadow-2xl">
                        {item.size}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm uppercase italic tracking-wide">{item.color}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase mt-1">Saldo: <span className="text-magenta text-xs ml-1">{item.quantity}</span></p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-full h-10 w-10" onClick={async () => {
                      if(confirm('Mestre, deseja remover esta variação?')){
                        await supabase.from('stock_items').delete().eq('id', item.id);
                        loadData();
                      }
                    }}>
                      <Trash2 size={20} />
                    </Button>
                  </div>
                ))}
              </div>

              {/* RODAPÉ DO CARD */}
              <div className="px-6 py-3 bg-black/20 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-slate-500 uppercase">Total em estoque: {items.reduce((sum, i) => sum + i.quantity, 0)} unidades</span>
                 <div className="flex gap-1">
                    {[...new Set(items.map(i => i.size))].map(s => (
                      <span key={s} className="text-[9px] font-black bg-white/10 text-white px-2 py-0.5 rounded-md">{s}</span>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE AJUSTE (MANTIDO ORIGINAL) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md rounded-[2.5rem] p-8 bg-white outline-none border-none shadow-3xl">
          <DialogHeader className="mb-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-magenta/10 rounded-full flex items-center justify-center mb-2">
                <AlertCircle className="text-magenta w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Ajuste de Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest">Modelo do Produto</Label>
              <Select value={form.product_id} onValueChange={v => setForm(p => ({...p, product_id: v}))}>
                <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none font-bold text-slate-700 shadow-inner">
                  <SelectValue placeholder="Selecione o produto..." />
                </SelectTrigger>
                <SelectContent className="max-h-64 rounded-2xl border-none shadow-2xl">
                  {products.map(p => <SelectItem key={p.id} value={p.id} className="font-bold uppercase text-[11px] py-3">{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest">Tamanho</Label>
                <Select value={form.size} onValueChange={v => setForm(p => ({...p, size: v}))}>
                  <SelectTrigger className="rounded-2xl h-14 bg-slate-50 border-none font-bold shadow-inner">
                    <SelectValue placeholder="Tam" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {['P', 'M', 'G', 'GG', 'ÚNICO'].map(s => <SelectItem key={s} value={s} className="font-bold">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest">Quantidade</Label>
                <Input 
                    type="number" 
                    inputMode="numeric"
                    value={form.quantity} 
                    onChange={e => setForm(p => ({...p, quantity: e.target.value}))} 
                    className="rounded-2xl h-14 bg-slate-50 border-none font-black text-lg text-center shadow-inner" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase text-slate-400 ml-2 tracking-widest">Cor da Peça</Label>
              <Input 
                value={form.color} 
                onChange={e => setForm(p => ({...p, color: e.target.value}))} 
                className="rounded-2xl h-14 bg-slate-50 border-none font-bold uppercase shadow-inner" 
                placeholder="EX: ROSA PINK" 
              />
            </div>

            <Button onClick={handleSave} className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black uppercase italic tracking-widest mt-6 shadow-2xl active:scale-95 transition-all text-base">
              Confirmar Estoque
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}