import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePriceToCents, formatPriceDisplay } from '../lib/formatters';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Package, Truck, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from "sonner";

const CATEGORIES_MAP = [
  { id: 'baby-doll-infantil', label: 'Baby Doll Infantil' },
  { id: 'baby-doll', label: 'Baby Doll' },
  { id: 'camisola', label: 'Camisola' },
  { id: 'lingerie', label: 'Lingerie' },
  { id: 'conjuntos', label: 'Conjuntos' },
  { id: 'acessorios', label: 'Acessórios' }
];

const COLORS = [
  'Laranja', 'Preto', 'Branco', 'Satin', 'Vinho', 'Azul Marinho', 'Romance', 'Oncinha', 
  'Rosa', 'Vermelho', 'Verde', 'Pink', 'Azul', 'Amarelo', 'Bege', 'Chocolate', 'Cinza', 
  'Lilás', 'Fúcsia', 'Pistache', 'Tifany', 'Royal', 'Coral', 'Marrom'
];

const TAXA_COMISSAO = 0.15; // 15% fixos

const PurchaseOrder = () => {
  const [orderText, setOrderText] = useState('');
  const [items, setItems] = useState([]);
  const [freteTotal, setFreteTotal] = useState('0');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const lines = orderText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const regex = /^(\d+)\s*x\s*(.*)$/i;
      const match = line.match(regex);
      if (!match) return null;

      const [, qtyStr, fullDesc] = match;
      const descLower = fullDesc.toLowerCase();

      const sizeRegex = /\b(P|M|G|GG|Único)\b/i;
      const sizeMatch = fullDesc.match(sizeRegex);
      const size = sizeMatch ? sizeMatch[0].toUpperCase() : 'ÚNICO';

      const categoryObj = CATEGORIES_MAP.find(c => descLower.includes(c.label.toLowerCase())) || { id: 'baby-doll', label: 'Baby Doll' };
      const color = COLORS.find(c => descLower.includes(c.toLowerCase())) || 'Padrão';
      
      let model = fullDesc
        .replace(new RegExp(categoryObj.label, 'gi'), '')
        .replace(new RegExp(color, 'gi'), '')
        .replace(new RegExp(`\\b${size}\\b`, 'gi'), '')
        .replace(/[\d,.]+$/, '') 
        .trim();

      if (!model) model = "Básico";
      const fullName = `${categoryObj.label} ${model} - ${color}`.toUpperCase();

      return {
        qty: Number(qtyStr),
        category_id: categoryObj.id,
        category_label: categoryObj.label,
        model: model.toUpperCase(),
        color: color.toUpperCase(),
        size,
        productName: fullName,
        unitCost: '15.00',
        sellPrice: '79.90'
      };
    }).filter(Boolean);

    setItems(parsed);
  }, [orderText]);

  const calculateFinancials = (item) => {
    const totalQty = items.reduce((acc, i) => acc + i.qty, 0) || 1;
    const freteCents = Number(parsePriceToCents(freteTotal.toString().replace(',', '.')));
    const rateioFrete = freteCents / totalQty;
    
    const unitCostCents = Number(parsePriceToCents(item.unitCost.replace(',', '.')));
    const totalCostCents = unitCostCents + rateioFrete;
    
    const sellCents = Number(parsePriceToCents(item.sellPrice.replace(',', '.')));
    
    const comissao = sellCents * TAXA_COMISSAO; 
    const profit = sellCents - totalCostCents - comissao;
    const margin = sellCents > 0 ? (profit / sellCents) * 100 : 0;

    return { 
      totalCostCents: Math.round(totalCostCents), 
      profit: Math.round(profit), 
      margin, 
      sellCents: Math.round(sellCents) 
    };
  };

  const updateItemField = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = value;
    setItems(newItems);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      for (const item of items) {
        const { totalCostCents, sellCents } = calculateFinancials(item);
        
        // CORREÇÃO MESTRE: Busca inteligente para evitar duplicidade de produto
        const { data: prod } = await supabase
          .from('products')
          .select('id')
          .ilike('model', item.model)
          .ilike('color', item.color)
          .maybeSingle();

        let pId;
        if (!prod) {
          const { data: newP, error: insErr } = await supabase.from('products').insert([{
            name: item.productName,
            model: item.model, 
            category: item.category_id,
            color: item.color,
            cost_price_cents: totalCostCents, 
            sell_price_cents: sellCents,
            sku: `${item.model.substring(0,3)}-${item.color.substring(0,3)}`.toUpperCase(),
            status: 'Ativo'
          }]).select().single();
          
          if (insErr) throw insErr;
          pId = newP.id;
        } else {
          pId = prod.id;
          // Atualiza dados financeiros do produto já existente
          await supabase.from('products').update({
            cost_price_cents: totalCostCents, 
            sell_price_cents: sellCents,
            name: item.productName
          }).eq('id', pId);
        }

        // CORREÇÃO MESTRE: Soma real de estoque (Update se existir, Insert se não)
        const { data: st } = await supabase.from('stock_items')
          .select('id, quantity')
          .eq('product_id', pId)
          .eq('size', item.size)
          .eq('color', item.color) // Adicionado check de cor no estoque também
          .maybeSingle();

        if (st) {
          const { error: upErr } = await supabase.from('stock_items')
            .update({ quantity: st.quantity + item.qty })
            .eq('id', st.id);
          if (upErr) throw upErr;
        } else {
          const { error: inStErr } = await supabase.from('stock_items').insert([{
            product_id: pId, 
            size: item.size, 
            color: item.color, 
            quantity: item.qty
          }]);
          if (inStErr) throw inStErr;
        }
      }
      
      toast.success("Estoque Vitalle atualizado mestre!");
      setOrderText('');
      setConfirmOpen(false);
    } catch (e) { 
      console.error(e);
      toast.error("Erro no processo: " + (e.message || "Verifique o console")); 
    }
    setLoading(false);
  };

  return (
    <div className="p-6 w-full space-y-6 bg-[#fcfcfc] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">Entrada de Material</h1>
          <p className="text-slate-400 font-bold text-sm uppercase">Vitalle Stock Intelligence</p>
        </div>
        <Badge className="bg-magenta px-6 py-2 text-sm rounded-full shadow-xl text-white">MODO INTELIGENTE ATIVO</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white p-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3 text-slate-700 uppercase italic font-black">
              <Package className="w-5 h-5 text-magenta"/> Lista do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Ex: 3x Baby Doll Love Rosa M" 
              className="min-h-[300px] rounded-[1.5rem] border-slate-100 bg-slate-50/50 p-6 focus:ring-2 ring-magenta text-sm font-medium" 
              value={orderText} 
              onChange={e => setOrderText(e.target.value)} 
            />
            <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white shadow-xl">
              <Label className="flex items-center gap-2 mb-2 font-bold uppercase text-[10px] text-slate-400">
                <Truck className="w-4 h-4 text-magenta"/> Frete da Carga R$
              </Label>
              <Input 
                placeholder="0,00" 
                value={freteTotal} 
                onChange={e => setFreteTotal(e.target.value)} 
                className="bg-transparent border-none text-3xl font-black focus:ring-0 p-0 h-auto text-white"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
            <CardTitle className="flex justify-between items-center text-slate-700 uppercase italic font-black text-base">
              <span className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-green-500"/> Conferência de Entrada</span>
              <Badge variant="outline" className="rounded-full px-3">{items.length} Peças Detectadas</Badge>
            </CardTitle>
          </CardHeader>
          
          <div className="flex-1 overflow-x-auto p-4 max-h-[550px]">
            <Table>
              <TableHeader>
                <TableRow className="border-none">
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Identificação do Produto</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px] text-center">Tamanho</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px] text-center">Qtd</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Custo Un.</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Venda</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Lucro Est.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-64 text-center italic text-slate-300 uppercase text-xs">Aguardando padrão: QTDx CATEGORIA MODELO COR TAM</TableCell></TableRow>
                ) : items.map((item, idx) => {
                  const { profit, margin } = calculateFinancials(item);
                  return (
                    <TableRow key={idx} className="border-b border-slate-50">
                      <TableCell className="font-bold text-slate-700 uppercase text-[11px]">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-slate-100 text-slate-800 border-none">{item.size}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-black text-slate-900">{item.qty}</TableCell>
                      <TableCell>
                        <Input className="w-20 h-8 text-[11px] font-bold" value={item.unitCost} onChange={e => updateItemField(idx, 'unitCost', e.target.value)}/>
                      </TableCell>
                      <TableCell>
                        <Input className="w-20 h-8 text-[11px] font-bold" value={item.sellPrice} onChange={e => updateItemField(idx, 'sellPrice', e.target.value)}/>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-md px-2 py-1 text-[9px] font-black text-white ${margin > 30 ? 'bg-green-500' : 'bg-orange-500'}`}>
                          R${(profit/100).toFixed(2)} ({margin.toFixed(0)}%)
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {items.length > 0 && (
            <div className="p-6 bg-slate-50/30 border-t border-slate-100">
              <Button onClick={() => setConfirmOpen(true)} className="w-full h-14 bg-magenta hover:opacity-90 text-white text-lg font-black uppercase italic shadow-xl">
                CONFIRMAR E LANÇAR ({items.reduce((acc, i) => acc + i.qty, 0)} PEÇAS)
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md bg-white p-8 rounded-[2rem]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic">Atualizar Inventário?</DialogTitle>
            </DialogHeader>
            <p className="text-slate-500 text-sm italic font-medium">Isso vai criar novos produtos ou atualizar o estoque dos existentes na Vitalle.</p>
            <div className="flex flex-col w-full gap-2 pt-4">
              <Button onClick={handleConfirm} disabled={loading} className="bg-magenta text-white font-black h-12 rounded-xl text-base italic uppercase">
                {loading ? <Loader2 className="animate-spin" /> : 'SIM, ATUALIZAR AGORA'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="font-bold text-slate-400">CANCELAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrder;