import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePriceToCents, formatPriceDisplay } from '../lib/formatters';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Package, Truck, TrendingUp, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['Baby Doll', 'Baby Doll Infantil', 'Camisola', 'Lingerie', 'Pijama', 'Calcinha', 'Sutiã'];
const COLORS = [
  'Laranja', 'Preto', 'Branco', 'Satin', 'Vinho', 'Azul Marinho', 'Romance', 'Oncinha', 
  'Rosa', 'Vermelho', 'Verde', 'Pink', 'Azul', 'Amarelo', 'Bege', 'Chocolate', 'Cinza', 
  'Lilás', 'Fúcsia', 'Pistache', 'Tifany', 'Royal', 'Coral', 'Marrom'
];

const PurchaseOrder = () => {
  const [orderText, setOrderText] = useState('');
  const [items, setItems] = useState([]);
  const [freteTotal, setFreteTotal] = useState('0');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const lines = orderText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      // Regex que foca na Quantidade e no resto do texto
      const regex = /^(\d+)\s*x\s*(.*)$/i;
      const match = line.match(regex);
      if (!match) return null;

      const [, qtyStr, fullDesc] = match;
      const descLower = fullDesc.toLowerCase();

      // Identifica Tamanho (P, M, G, GG, Único)
      const sizeRegex = /\b(P|M|G|GG|Único)\b/i;
      const sizeMatch = fullDesc.match(sizeRegex);
      const size = sizeMatch ? sizeMatch[0].toUpperCase() : 'ÚNICO';

      // Identifica Categoria
      const category = CATEGORIES.find(c => descLower.includes(c.toLowerCase())) || 'Baby Doll';
      
      // Identifica Cor (Busca inteligente em toda a linha)
      const color = COLORS.find(c => descLower.includes(c.toLowerCase())) || 'Padrão';
      
      // Limpa o modelo removendo categoria, cor e tamanho do texto
      const model = fullDesc
        .replace(new RegExp(category, 'gi'), '')
        .replace(new RegExp(color, 'gi'), '')
        .replace(new RegExp(`\\b${size}\\b`, 'gi'), '')
        .replace(/[\d,.]+$/, '') // Remove preços no final da linha
        .trim() || 'Básico';

      return {
        qty: Number(qtyStr),
        category,
        model,
        color,
        size,
        productName: `${category} ${model} - ${color}`.trim(),
        unitCost: '0',
        sellPrice: '79.90'
      };
    }).filter(Boolean);

    setItems(parsed);
  }, [orderText]);

  const calculateFinancials = (item) => {
    const totalQty = items.reduce((acc, i) => acc + i.qty, 0) || 1;
    const freteLimpo = freteTotal.toString().replace(',', '.');
    const freteCents = parsePriceToCents(isNaN(freteLimpo) ? '0' : freteLimpo);
    const rateioFrete = freteCents / BigInt(totalQty);
    
    const unitCostCents = parsePriceToCents(item.unitCost.replace(',', '.'));
    const totalCostCents = unitCostCents + rateioFrete;
    
    const sellCents = parsePriceToCents(item.sellPrice.replace(',', '.'));
    const comissao = (sellCents * 15n) / 100n; 
    const profit = sellCents - totalCostCents - comissao;
    const margin = sellCents > 0n ? Number((profit * 10000n) / sellCents) / 100 : 0;

    return { totalCostCents, profit, margin, sellCents };
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
        let { data: prod } = await supabase.from('products').select('id').eq('name', item.productName).single();
        let pId;

        if (!prod) {
          const { data: newP } = await supabase.from('products').insert([{
            name: item.productName, category: item.category, model: item.model, color: item.color,
            cost_price_cents: Number(totalCostCents), sell_price_cents: Number(sellCents), status: 'Ativo'
          }]).select().single();
          pId = newP.id;
        } else {
          pId = prod.id;
          await supabase.from('products').update({
            cost_price_cents: Number(totalCostCents), sell_price_cents: Number(sellCents)
          }).eq('id', pId);
        }

        const { data: st } = await supabase.from('stock_items')
          .select('id, quantity').eq('product_id', pId).eq('size', item.size).single();

        if (st) {
          await supabase.from('stock_items').update({ quantity: st.quantity + item.qty }).eq('id', st.id);
        } else {
          await supabase.from('stock_items').insert([{
            product_id: pId, product_name: item.productName, size: item.size, color: item.color, quantity: item.qty
          }]);
        }
      }
      alert("Estoque atualizado, mestre!");
      setOrderText('');
      setConfirmOpen(false);
    } catch (e) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-[#fcfcfc] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 uppercase italic tracking-tighter">Ordens de Compra</h1>
          <p className="text-slate-400 font-bold text-sm uppercase">Entrada inteligente Vitalle</p>
        </div>
        <Badge className="bg-[#D946EF] px-6 py-2 text-sm rounded-full shadow-xl animate-pulse">MODO INTELIGENTE ATIVO</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-4">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3 text-slate-700 uppercase italic font-black text-center">
              <Package className="w-6 h-6 text-[#D946EF]"/> Lista do Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Textarea 
              placeholder="FORMATO: QTDx Categoria Modelo Cor Tamanho&#10;Ex: 3x Baby Doll LOVE Rosa M" 
              className="min-h-[350px] rounded-[2rem] border-slate-100 bg-slate-50/50 p-6 focus:ring-2 ring-[#D946EF] text-sm font-medium" 
              value={orderText} 
              onChange={e => setOrderText(e.target.value)} 
            />
            <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-xl">
              <Label className="flex items-center gap-2 mb-4 font-bold uppercase text-[10px] text-slate-400">
                <Truck className="w-4 h-4 text-[#D946EF]"/> Valor Total do Frete
              </Label>
              <Input 
                placeholder="0,00" 
                value={freteTotal} 
                onChange={e => setFreteTotal(e.target.value)} 
                className="bg-transparent border-none text-4xl font-black focus:ring-0 p-0 h-auto"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
            <CardTitle className="flex justify-between items-center text-slate-700 uppercase italic font-black">
              <span className="flex items-center gap-3"><TrendingUp className="w-6 h-6 text-green-500"/> Conferência e Lucro Real</span>
              <Badge className="bg-slate-200 text-slate-600 rounded-full px-4">{items.length} itens detectados</Badge>
            </CardTitle>
          </CardHeader>
          
          <div className="flex-1 overflow-x-auto p-4 max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Produto / Cor</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px] text-center">Tam</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px] text-center">Qtd</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Custo Nota</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Venda R$</TableHead>
                  <TableHead className="uppercase font-black text-slate-400 text-[10px]">Margem/Lucro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                       <p className="italic text-slate-300 font-bold uppercase text-xs animate-pulse">Sincronizando fluxo em tempo real...</p>
                    </TableCell>
                  </TableRow>
                ) : items.map((item, idx) => {
                  const { profit, margin } = calculateFinancials(item);
                  return (
                    <TableRow key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700 uppercase text-[11px]">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-black border-slate-200">{item.size}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-black text-lg text-slate-800">{item.qty}</TableCell>
                      <TableCell>
                        <Input className="w-20 h-9 rounded-xl font-bold bg-slate-50" value={item.unitCost} onChange={e => updateItemField(idx, 'unitCost', e.target.value)}/>
                      </TableCell>
                      <TableCell>
                        <Input className="w-20 h-9 rounded-xl font-bold bg-slate-50" value={item.sellPrice} onChange={e => updateItemField(idx, 'sellPrice', e.target.value)}/>
                      </TableCell>
                      <TableCell>
                        <Badge className={`rounded-lg px-3 py-2 text-[10px] font-black ${margin > 35 ? 'bg-green-500' : 'bg-orange-500'}`}>
                          R${formatPriceDisplay(profit)} ({margin.toFixed(0)}%)
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {items.length > 0 && (
            <div className="p-8 bg-slate-50/30 border-t border-slate-100">
              <Button 
                onClick={() => setConfirmOpen(true)} 
                className="w-full h-20 rounded-2xl bg-[#D946EF] hover:bg-[#C026D3] text-2xl font-black shadow-2xl shadow-purple-200 transition-all uppercase italic tracking-tighter"
              >
                FINALIZAR ENTRADA DE {items.reduce((acc, i) => acc + i.qty, 0)} PEÇAS
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-[3rem] p-12 border-none">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase italic text-slate-800">Confirmar Carga?</DialogTitle>
            <p className="text-slate-500 font-medium italic">O estoque da Vitalle será atualizado com os novos preços e quantidades agora.</p>
            <div className="flex flex-col w-full gap-3">
              <Button onClick={handleConfirm} disabled={loading} className="h-14 rounded-2xl bg-[#D946EF] font-black text-lg uppercase italic shadow-lg">
                {loading ? 'PROCESSANDO...' : 'SIM, CONFIRMAR CARGA'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmOpen(false)} className="h-14 rounded-2xl font-bold text-slate-400 uppercase">CANCELAR</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrder;