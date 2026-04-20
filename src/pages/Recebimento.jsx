import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePriceToCents, formatPriceDisplay } from '@/lib/formatters';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCell as TableHeadCell } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, FileText, Save, CheckCircle2, Upload, Edit3, Trash2 } from 'lucide-react';

const CATEGORIES = ['Baby Doll', 'Baby Doll Infantil', 'Camisola'];
const SIZES = ['P', 'M', 'G', 'GG', 'Único'];
const COLORS = ['Preto', 'Branco', 'Satin', 'Vinho', 'Azul Marinho', 'Romance', 'Laranja'];

const Recebimento = () => {
  const [orderText, setOrderText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [freteValue, setFreteValue] = useState('');
  const [custoNFValue, setCustoNFValue] = useState('');
  const [margemValue, setMargemValue] = useState('0.4'); // 40% default
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState('');

  // Editable items state
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Parse on text change
    if (orderText || fileContent) {
      const text = orderText || fileContent;
      const parsed = parseOrder(text);
      setParsedItems(parsed);
      setItems(parsed.map(item => ({ ...item, baseCostEditable: formatPriceDisplay(item.baseCostCents), finalCostCents: 0n, sellSuggestedCents: 0n })));
    }
  }, [orderText, fileContent]);

  useEffect(() => {
    calculateCosts();
  }, [items, freteValue, custoNFValue, margemValue]);

  const parseOrderLine = (line) => {
    // Regex: qty x category [color] [model] size
    const regex = /(\d+)\s*x\s+([Baby Doll|Baby Doll Infantil|Camisola].*?)(?:\s+([Preto|Branco|Satin|Vinho|Azul Marinho|Romance|Laranja].*?))?\s*([P|M|G|GG|Único])?/i;
    const match = line.match(regex);
    if (!match) return null;

    const [, qtyStr, rawCatModel, rawColor, size] = match;
    const qty = parseInt(qtyStr);
    let category = '';
    let model = '';
    let color = '';

    // Extract category
    for (const cat of CATEGORIES) {
      if (rawCatModel.includes(cat)) {
        category = cat;
        model = rawCatModel.replace(cat, '').trim();
        break;
      }
    }
    if (!category) return null;

    // Extract color
    if (rawColor) {
      for (const col of COLORS) {
        if (rawColor.includes(col)) {
          color = col;
          model = model || rawColor.replace(col, '').trim();
          break;
        }
      }
    }

    if (!SIZES.includes(size)) return null;

    return { qty, category, model: model || 'Padrão', color: color || 'N/A', size };
  };

  const parseOrder = (text) => {
    const lines = text.split(/[\n\r]+/).filter(line => line.trim());
    return lines.map(line => parseOrderLine(line.trim())).filter(Boolean);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const calculateCosts = () => {
    const freteCents = parsePriceToCents(freteValue);
    const custoNFCs = parsePriceToCents(custoNFValue);
    const margem = parseFloat(margemValue) || 0.4;
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

    if (totalQty === 0) return;

    const freightPerUnit = freteCents / BigInt(totalQty);
    const nfPerUnit = custoNFCs / BigInt(totalQty);

    const updatedItems = items.map(item => {
      const baseCost = parsePriceToCents(item.baseCostEditable);
      const finalCostCents = baseCost + freightPerUnit + nfPerUnit;
      const denominator = 1 - (margem + 0.15);
      const sellSuggestedCents = denominator > 0 ? (finalCostCents * 100n / BigInt(Math.round(denominator * 100))) : 0n;

      return { ...item, baseCostCents: baseCost, finalCostCents, sellSuggestedCents };
    });

    setItems(updatedItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const confirmRecebimento = async () => {
    setLoading(true);
    try {
      const totalQty = items.reduce((sum, item) => sum + item.qty, 0);

      for (const item of items) {
        const productName = `${item.category} ${item.model} ${item.color} ${item.size}`.trim();

        // Check if product exists
        let { data: existingProd } = await supabase
          .from('products')
          .select('id, cost_price_cents')
          .eq('name', productName)
          .single();

        let productId;
        if (!existingProd) {
          // Create new product
          const { data: newProd, error: insertError } = await supabase
            .from('products')
            .insert([{ 
              name: productName,
              category: item.category,
              model: item.model,
              color: item.color,
              size: item.size,
              cost_price_cents: Number(item.finalCostCents),
              sell_price_cents: Number(item.sellSuggestedCents),
              status: 'Ativo'
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          productId = newProd.id;
        } else {
          productId = existingProd.id;
          // Update cost if higher
          if (item.finalCostCents > BigInt(existingProd.cost_price_cents || 0)) {
            await supabase
              .from('products')
              .update({ cost_price_cents: Number(item.finalCostCents) })
              .eq('id', productId);
          }
        }

        // Update stock
        const { data: stockItem } = await supabase
          .from('stock_items')
          .select('*')
          .eq('product_id', productId)
          .eq('size', item.size)
          .eq('color', item.color)
          .single();

        if (stockItem) {
          // Increment
          await supabase
            .from('stock_items')
            .update({ quantity: stockItem.quantity + item.qty })
            .eq('id', stockItem.id);
        } else {
          // Create new stock item
          await supabase
            .from('stock_items')
            .insert([{
              product_id: productId,
              product_name: productName,
              size: item.size,
              color: item.color,
              quantity: item.qty
            }]);
        }
      }

      toast.success('Recebimento confirmado! Estoque atualizado.');
      // Reset form
      setOrderText('');
      setFileContent('');
      setFreteValue('');
      setCustoNFValue('');
      setItems([]);
      setParsedItems([]);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao processar recebimento');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalFinalCost = items.reduce((sum, i) => sum + Number(i.finalCostCents || 0n), 0) / 100;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Recebimento</h1>
        <p className="text-xl text-slate-600 font-medium">Ordem de Compra → Inteligente Parser + Rateio Automático</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Area */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#D946EF]/10 to-violet-500/10 border-b border-slate-200">
            <CardTitle className="font-black text-slate-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-[#D946EF]" />
              Cole o Pedido ou Upload NF
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Textarea
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              placeholder="Cole aqui:&#10;2x Baby Doll Laranja Oncinha M&#10;3x Camisola Vinho P&#10;1x Baby Doll Infantil Preto GG"
              className="min-h-[200px] rounded-[2.5rem] resize-vertical font-mono text-sm border-2 border-slate-200 shadow-md focus:border-[#D946EF] focus:shadow-magenta"
            />
            <div className="flex gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="rounded-[2.5rem] border-2 border-dashed border-slate-300 file:rounded-[2rem] file:bg-[#D946EF]/90 file:text-white file:font-black"
              />
              <label htmlFor="file-upload" className="flex-1">
                <div className="h-14 flex items-center justify-center rounded-[2.5rem] bg-gradient-to-r from-[#D946EF]/20 to-violet-500/20 border-2 border-dashed border-slate-300 hover:border-[#D946EF] hover:shadow-magenta cursor-pointer transition-all">
                  <Upload className="h-6 w-6 text-slate-500 mr-2" />
                  <span className="font-black text-slate-900 uppercase tracking-wider text-sm">Upload Arquivo</span>
                </div>
              </label>
            </div>
            {parsedItems.length > 0 && (
              <Badge variant="secondary" className="text-lg px-6 py-3 rounded-full bg-[#D946EF]/20 text-[#D946EF] font-black">
                {parsedItems.length} itens detectados • {totalItems} unidades
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Financial Inputs */}
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-slate-200">
            <CardTitle className="font-black text-slate-900 flex items-center gap-3">
              <Truck className="h-8 w-8 text-emerald-600" />
              Rateio Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="font-black uppercase tracking-wider text-sm text-slate-700 block mb-2">Valor do Frete</Label>
                <Input
                  value={freteValue}
                  onChange={(e) => setFreteValue(e.target.value)}
                  placeholder="R$ 45,00"
                  className="rounded-[2.5rem] h-14 text-xl font-black shadow-md"
                />
              </div>
              <div>
                <Label className="font-black uppercase tracking-wider text-sm text-slate-700 block mb-2">Custo Total da NF</Label>
                <Input
                  value={custoNFValue}
                  onChange={(e) => setCustoNFValue(e.target.value)}
                  placeholder="R$ 1.250,00"
                  className="rounded-[2.5rem] h-14 text-xl font-black shadow-md"
                />
              </div>
              <div>
                <Label className="font-black uppercase tracking-wider text-sm text-slate-700 block mb-2">Margem Desejada (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={margemValue}
                  onChange={(e) => setMargemValue(e.target.value)}
                  placeholder="0.40"
                  className="rounded-[2.5rem] h-14 text-xl font-black shadow-md"
                />
              </div>
            </div>
            <div className="text-center py-6 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200">
              <p className="text-3xl font-black text-slate-900">Total Conferido: R$ {totalFinalCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editable Table */}
      {items.length > 0 && (
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-200">
            <CardTitle className="font-black text-slate-900 uppercase tracking-wider flex items-center gap-3">
              📋 Conferência Editável • {items.length} itens
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={loading}
                className="ml-auto bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2.5rem] shadow-2xl px-8 py-3 h-auto"
              >
                <Save className="h-5 w-5 mr-3" />
                Confirmar Recebimento
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                  <TableHeadCell className="font-black uppercase text-xs text-slate-900 tracking-widest p-6">Produto</TableHeadCell>
                  <TableHeadCell className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-center">Qtd</TableHeadCell>
                  <TableHeadCell className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">Custo Base (edit)</TableHeadCell>
                  <TableHeadCell className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">Custo Final</TableHeadCell>
                  <TableHeadCell className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">PV Sugerido</TableHeadCell>
                  <TableHeadCell className="w-20"></TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-100">
                    <TableCell className="p-6 font-bold text-slate-900">
                      <div className="space-y-1">
                        <div>{item.category} {item.model}</div>
                        <Badge className="text-xs bg-blue-100 text-blue-800">{item.color}</Badge>
                        <Badge variant="outline" className="text-xs ml-2">{item.size}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-center">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                        className="w-20 mx-auto rounded-[1.5rem] font-black text-lg"
                        min="1"
                      />
                    </TableCell>
                    <TableCell className="p-6">
                      <Input
                        value={item.baseCostEditable}
                        onChange={(e) => updateItem(index, 'baseCostEditable', e.target.value)}
                        className="w-full rounded-[1.5rem] font-black text-right"
                      />
                    </TableCell>
                    <TableCell className="p-6 text-right font-black text-emerald-700 text-lg">
                      {formatPriceDisplay(item.finalCostCents)}
                    </TableCell>
                    <TableCell className="p-6 text-right font-black text-[#D946EF] text-xl">
                      {formatPriceDisplay(item.sellSuggestedCents)}
                    </TableCell>
                    <TableCell className="p-6">
                      <Button size="sm" variant="ghost" className="rounded-full h-10 w-10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl p-0 bg-white shadow-2xl border-none">
          <DialogHeader className="bg-[#D946EF] text-white p-8 rounded-t-[2.5rem]">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10" />
              Confirmar Recebimento?
            </DialogTitle>
          </DialogHeader>
<div className="p-8">
            <p className="text-2xl font-black text-slate-900 mb-8 text-center">
              RESUMO DA ENTRADA: {items.length} Itens identificados | Frete por unidade: {formatPriceDisplay(freteCents / BigInt(items.reduce((sum, i) => sum + i.qty, 0)) || 0n)}. Deseja confirmar a criação de produtos e atualização de estoque?
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 text-center">
              <div className="p-4 bg-slate-50 rounded-[1.5rem]">
                <p className="text-3xl font-black text-slate-900">{items.length}</p>
                <p className="text-xs uppercase font-black text-slate-600 tracking-wider">Itens</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-[1.5rem]">
                <p className="text-3xl font-black text-emerald-700">{totalItems}</p>
                <p className="text-xs uppercase font-black text-emerald-600 tracking-wider">Unidades</p>
              </div>
              <div className="p-4 bg-[#D946EF]/20 rounded-[1.5rem]">
                <p className="text-xl font-black text-[#D946EF]">{formatPriceDisplay(BigInt(Math.round(totalFinalCost * 100)))}</p>
                <p className="text-xs uppercase font-black text-slate-700 tracking-wider">Custo Total</p>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 bg-slate-50 rounded-b-[2.5rem] border-t border-slate-200 gap-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              className="rounded-[2.5rem] font-black uppercase tracking-widest flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmRecebimento}
              disabled={loading}
              className="bg-[#D946EF] hover:bg-[#D946EF]/90 text-white font-black uppercase tracking-widest rounded-[2.5rem] shadow-2xl flex-1 h-14 text-lg"
            >
              {loading ? 'Processando...' : `CONFIRMAR RECEBIMENTO`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recebimento;

