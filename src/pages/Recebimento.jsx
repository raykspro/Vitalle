import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePriceToCents, formatPriceDisplay } from '@/lib/formatters';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, FileText, Save, CheckCircle2, Upload, Edit3, Trash2, Camera } from 'lucide-react';

const CATEGORIES = ['Baby Doll', 'Baby Doll Infantil', 'Camisola'];
const SIZES = ['P', 'M', 'G', 'GG', 'Único'];
const COLORS = ['Preto', 'Branco', 'Satin', 'Vinho', 'Azul Marinho', 'Romance', 'Laranja'];

const Recebimento = () => {
  const supabaseClient = supabase;
  const [orderText, setOrderText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [freteValue, setFreteValue] = useState('');
  const [custoNFValue, setCustoNFValue] = useState('');
  const [margemValue, setMargemValue] = useState('0.4');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState('');
  const [items, setItems] = useState([]);

  // Load existing products for price memory
  useEffect(() => {
    if (parsedItems.length > 0) {
      loadExistingProducts();
    }
  }, [parsedItems]);

  useEffect(() => {
    if (orderText || fileContent) {
      const text = orderText || fileContent;
      const parsed = parseOrder(text);
      setParsedItems(parsed);
      setItems(parsed.map(item => ({ 
        ...item, 
        baseCostEditable: '0,00', 
        finalCostCents: 0n, 
        sellSuggestedCents: 0n,
        sellPriceEditable: '0,00',
        sellPriceCents: 0n,
        isNewProduct: true,
        existingSellPrice: null
      })));
    }
  }, [orderText, fileContent]);

  useEffect(() => {
    calculateCosts();
  }, [items, freteValue, custoNFValue, margemValue]);

  const parseOrderLine = (line) => {
    const regex = /(\d+)\s*x\s+([Baby Doll|Baby Doll Infantil|Camisola].*?)(?:\s+([Preto|Branco|Satin|Vinho|Azul Marinho|Romance|Laranja].*?))?\s*([P|M|G|GG|Único])?/i;
    const match = line.match(regex);
    if (!match) return null;

    const [, qtyStr, rawCatModel, rawColor, size] = match;
    const qty = parseInt(qtyStr);
    let category = '';
    let model = '';
    let color = '';

    for (const cat of CATEGORIES) {
      if (rawCatModel.includes(cat)) {
        category = cat;
        model = rawCatModel.replace(cat, '').trim();
        break;
      }
    }
    if (!category) return null;

    if (rawColor) {
      for (const col of COLORS) {
        if (rawColor.includes(col)) {
          color = col;
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

  const loadExistingProducts = async () => {
    const productNames = parsedItems.map(item => `${item.category} ${item.model || 'Padrão'} - ${item.color} ${item.size}`.trim());
    const { data: products } = await supabaseClient
      .from('products')
      .select('name, sell_price_cents')
      .in('name', productNames.slice(0, 50)); // Limit to avoid too many queries

    const updatedItems = items.map(item => {
      const existing = products?.find(p => p.name === `${item.category} ${item.model || 'Padrão'} - ${item.color} ${item.size}`.trim());
      return {
        ...item,
        existingSellPrice: existing ? Number(existing.sell_price_cents) / 100 : null,
        sellPriceEditable: existing ? (Number(existing.sell_price_cents) / 100).toFixed(2) : item.sellPriceEditable,
        isNewProduct: !existing
      };
    });
    setItems(updatedItems);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setFileContent(event.target.result);
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
      const sellPriceCents = parsePriceToCents(item.sellPriceEditable);

      // Calculate profit
      const commissionCents = (sellPriceCents * 15n) / 100n;
      const lucroCents = sellPriceCents - finalCostCents - commissionCents;
      const lucroMargin = Number(lucroCents) / Number(sellPriceCents) * 100;

      return { 
        ...item, 
        baseCostCents: baseCost, 
        finalCostCents, 
        sellSuggestedCents,
        sellPriceCents,
        lucroCents,
        lucroMargin: lucroMargin > 0 ? lucroMargin : 0,
        healthStatus: lucroMargin > 40 ? 'verde' : lucroMargin >= 20 ? 'amarelo' : 'vermelho'
      };
    });

    setItems(updatedItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const confirmRecebimento = async () => {
    if (!freteValue.trim()) {
      toast.error('Preencha o Valor do Frete (pode ser R$ 0,00)');
      return;
    }

    setLoading(true);
    try {
      for (const item of items) {
        const productName = `${item.category} ${item.model || 'Padrão'} - ${item.color} ${item.size}`.trim();

        let { data: existingProd } = await supabaseClient
          .from('products')
          .select('id, cost_price_cents, sell_price_cents')
          .eq('name', productName)
          .single();

        let productId;
        if (!existingProd) {
          const { data: newProd, error } = await supabaseClient
            .from('products')
            .insert([{
              name: productName,
              category: item.category,
              model: item.model,
              color: item.color,
              size: item.size,
              cost_price_cents: Number(item.finalCostCents),
              sell_price_cents: Number(item.sellPriceCents),
              status: 'Ativo'
            }])
            .select()
            .single();

          if (error) throw error;
          productId = newProd.id;
        } else {
          productId = existingProd.id;
          if (item.finalCostCents > BigInt(existingProd.cost_price_cents || 0)) {
            await supabaseClient
              .from('products')
              .update({ 
                cost_price_cents: Number(item.finalCostCents),
                sell_price_cents: Number(item.sellPriceCents)
              })
              .eq('id', productId);
          }
        }

        const { data: stockItem } = await supabaseClient
          .from('stock_items')
          .select('*')
          .eq('product_id', productId)
          .eq('size', item.size)
          .eq('color', item.color)
          .single();

        if (stockItem) {
          await supabaseClient
            .from('stock_items')
            .update({ quantity: stockItem.quantity + item.qty })
            .eq('id', stockItem.id);
        } else {
          await supabaseClient
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

      toast.success('Recebimento confirmado com inteligência! 📈 Estoque + Preços atualizados.');
      setOrderText('');
      setFileContent('');
      setFreteValue('');
      setCustoNFValue('');
      setItems([]);
      setParsedItems([]);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro no recebimento');
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);
  const totalFinalCost = items.reduce((sum, i) => sum + Number(i.finalCostCents || 0n), 0) / 100;

  const getHealthBadge = (item) => {
    const { healthStatus, lucroCents } = item;
    const colorClass = healthStatus === 'verde' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                      healthStatus === 'amarelo' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                      'bg-red-100 text-red-800 border-red-200';
    return (
      <Badge className={`font-black text-xs ${colorClass}`}>
        {formatPriceDisplay(item.lucroCents)} ({item.lucroMargin.toFixed(1)}%)
      </Badge>
    );
  };

  const blinkingCamera = <Camera className="h-5 w-5 text-amber-500 animate-pulse" />;

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Recebimento</h1>
        <p className="text-xl text-slate-600 font-medium">🧠 Inteligência Artificial + Pulo do Gato = Lucro Máximo Garantido</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#D946EF]/10 to-violet-500/10 border-b border-slate-200">
            <CardTitle className="font-black text-slate-900 flex items-center gap-3">
              <Package className="h-8 w-8 text-[#D946EF]" />
              Cole o Pedido ou Upload
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Textarea
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              placeholder="Exemplo:&#10;2x Baby Doll Laranja Oncinha M&#10;3x Camisola Vinho P"
              className="min-h-[200px] rounded-[2.5rem] resize-vertical font-mono text-sm border-2 border-slate-200 shadow-md focus:border-[#D946EF]"
            />
            <div className="flex gap-4">
              <Input
                id="file-upload"
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                className="rounded-[2.5rem] border-2 border-dashed border-slate-300 file:bg-[#D946EF]/90 file:text-white file:font-black"
              />
              <label htmlFor="file-upload" className="flex-1 cursor-pointer">
                <div className="h-14 flex items-center justify-center rounded-[2.5rem] bg-gradient-to-r from-[#D946EF]/20 border-2 border-dashed border-slate-300 hover:border-[#D946EF]">
                  <Upload className="h-6 w-6 text-slate-500 mr-2" />
                  <span className="font-black uppercase text-sm">Upload</span>
                </div>
              </label>
            </div>
            {parsedItems.length > 0 && (
              <Badge variant="secondary" className="text-lg px-6 py-3 rounded-full bg-[#D946EF]/20 text-[#D946EF] font-black">
                {parsedItems.length} itens • {totalItems} und
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-b border-slate-200">
            <CardTitle className="font-black flex items-center gap-3">
              <Truck className="h-8 w-8 text-emerald-600" />
              Rateio Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="font-black uppercase tracking-wider text-sm text-slate-700 block mb-2">Frete *</Label>
                <Input
                  value={freteValue}
                  onChange={(e) => setFreteValue(e.target.value)}
                  placeholder="R$ 45,00"
                  className="rounded-[2.5rem] h-14 text-xl font-black shadow-md"
                />
              </div>
              <div>
                <Label className="font-black uppercase tracking-wider text-sm text-slate-700 block mb-2">Custo NF</Label>
                <Input
                  value={custoNFValue}
                  onChange={(e) => setCustoNFValue(e.target.value)}
                  placeholder="R$ 1.250,00"
                  className="rounded-[2.5rem] h-14 text-xl font-black shadow-md"
                />
              </div>
              <div>
                <Label className="font-black uppercase tracking-wider text-sm text-slate-700 block mb-2">Margem (%)</Label>
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
              <p className="text-3xl font-black">Total: R$ {totalFinalCost.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {items.length > 0 && (
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <CardTitle className="font-black text-slate-900 uppercase tracking-wider text-2xl flex items-center gap-3">
                🧠 PULO DO GATO • {items.length} itens
              </CardTitle>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={loading || !freteValue.trim()}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black uppercase tracking-widest rounded-[2.5rem] shadow-2xl px-8 py-3 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Processando...' : 'Confirmar Recebimento'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow className="bg-slate-50 border-b-2 border-slate-200">
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 w-80">Produto</TableHead>
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-center">Qtd</TableHead>
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">Custo Base</TableHead>
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">Custo Final</TableHead>
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">PV Sugerido</TableHead>
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">Preço Venda</TableHead>
                  <TableHead className="font-black uppercase text-xs text-slate-900 tracking-widest p-6 text-right">Saúde Financeira</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index} className="hover:bg-slate-50/50 border-b border-slate-100 group">
                    <TableCell className="p-6 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        {item.isNewProduct && (
                          <div className="animate-pulse flex items-center gap-1 bg-amber-100 px-2 py-1 rounded-full">
                            📸 {blinkingCamera}
                          </div>
                        )}
                        <div className="space-y-1 min-w-0">
                          <div className="truncate font-black text-lg">{item.category} {item.model}</div>
                          <div className="flex gap-1">
                            <Badge className="text-xs bg-blue-100 text-blue-800">{item.color}</Badge>
                            <Badge variant="outline" className="text-xs">{item.size}</Badge>
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {item.existingSellPrice && `Memória: R$ ${item.existingSellPrice}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-6 text-center">
                      <Input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                        className="w-20 mx-auto rounded-[1.5rem] font-black text-lg h-12"
                        min="1"
                      />
                    </TableCell>
                    <TableCell className="p-6">
                      <Input
                        value={item.baseCostEditable}
                        onChange={(e) => updateItem(index, 'baseCostEditable', e.target.value)}
                        className="w-full rounded-[1.5rem] font-black text-right h-12"
                      />
                    </TableCell>
                    <TableCell className="p-6 text-right font-black text-emerald-700 text-lg">
                      {formatPriceDisplay(item.finalCostCents)}
                    </TableCell>
                    <TableCell className="p-6 text-right font-black text-[#D946EF] text-lg">
                      {formatPriceDisplay(item.sellSuggestedCents)}
                    </TableCell>
                    <TableCell className="p-6">
                      <Input
                        value={item.sellPriceEditable}
                        onChange={(e) => updateItem(index, 'sellPriceEditable', e.target.value)}
                        className="w-full rounded-[1.5rem] font-black text-right h-12 bg-gradient-to-r from-slate-50"
                        placeholder={item.existingSellPrice ? `R$ ${item.existingSellPrice}` : 'R$ 0,00'}
                      />
                    </TableCell>
                    <TableCell className="p-6 text-right">
                      {getHealthBadge(item)}
                    </TableCell>
                    <TableCell className="p-6">
                      <Button size="sm" variant="ghost" className="rounded-full h-10 w-10 opacity-70 hover:opacity-100">
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

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-2xl p-0 shadow-2xl border-none">
          <DialogHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-8 rounded-t-[2.5rem]">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10" />
              Confirmar Pulo do Gato?
            </DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <p className="text-xl font-semibold text-slate-900 mb-6 text-center">
              {items.length} produtos nomeados profissionalmente • Frete rateado • Preços otimizados •{' '}
              <span className="text-emerald-600 font-black">Pronto para Lucrar! 💰</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
              <div className="p-6 bg-slate-50 rounded-[2rem] shadow-lg">
                <p className="text-3xl font-black text-slate-900">{items.length}</p>
                <p className="text-xs uppercase font-black text-slate-600 tracking-wider">Produtos</p>
              </div>
              <div className="p-6 bg-emerald-50 rounded-[2rem] shadow-lg">
                <p className="text-3xl font-black text-emerald-700">{totalItems}</p>
                <p className="text-xs uppercase font-black text-emerald-600 tracking-wider">Unidades</p>
              </div>
              <div className="p-6 bg-gradient-to-r from-[#D946EF] to-violet-600 text-white rounded-[2rem] shadow-2xl">
                <p className="text-xl font-black">{formatPriceDisplay(BigInt(Math.round(totalFinalCost * 100)))}</p>
                <p className="text-xs uppercase font-black tracking-wider">Investimento Total</p>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 bg-slate-50 rounded-b-[2.5rem] border-t gap-4">
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
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black uppercase tracking-widest rounded-[2.5rem] shadow-2xl flex-1 h-14 text-lg"
            >
              {loading ? <span>🚀 Salvando...</span> : <span>✅ CONFIRMAR & LUCRAR</span>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recebimento;

