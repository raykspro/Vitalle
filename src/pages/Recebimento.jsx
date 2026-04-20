import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { parsePriceToCents, formatPriceDisplay } from '@/lib/formatters';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, Save, CheckCircle2, Upload, Trash2, Plus } from 'lucide-react';
import * as api from '@/api/supabase.js';

const CATEGORIES = ['Baby Doll', 'Baby Doll Infantil', 'Camisola', 'Lingerie', 'Pijama'];
const SIZES = ['P', 'M', 'G', 'GG', 'Único'];
const COLORS = ['Laranja', 'Preto', 'Branco', 'Satin', 'Vinho', 'Azul Marinho', 'Romance', 'Oncinha'];

const Recebimento = () => {
  const [orderText, setOrderText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [freteTotal, setFreteTotal] = useState('');
  const [custoNota, setCustoNota] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);

  // Load products for lookup
  useEffect(() => {
    const loadProducts = async () => {
      const { data } = await api.getProducts();
      setProducts(data || []);
    };
    loadProducts();
  }, []);

  // Parse on text change
  useEffect(() => {
    if (orderText.trim()) {
      const items = parseOrder(orderText);
      setParsedItems(items);
    } else {
      setParsedItems([]);
    }
  }, [orderText]);

  const parseOrder = (text) => {
    const lines = text.split(/\\n|\\r/g).map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      // Regex: qty x category [color] [model] size
      const regex = /^(\\d+)\\s*x\\s*([\\w\\s]+?)(?:\\s+([\\w\\s]+?))?\\s*([P|M|G|GG|Único])$/i;
      const match = line.match(regex);
      if (!match) return null;

      const [, qtyStr, categoryRaw, colorRaw, size] = match;
      const qty = parseInt(qtyStr);

      if (!SIZES.includes(size?.toUpperCase())) return null;

      // Extract category
      let category = CATEGORIES.find(cat => categoryRaw.toLowerCase().includes(cat.toLowerCase()));
      if (!category) category = 'Baby Doll'; // Default

      // Extract color and model
      let color = 'N/A';
      let model = 'Padrão';
      const remaining = categoryRaw.replace(category, '').trim();
      for (const col of COLORS) {
        if (remaining.toLowerCase().includes(col.toLowerCase())) {
          color = col;
          model = remaining.replace(col, '').trim() || 'Padrão';
          break;
        }
      }
      if (!model || model === color) model = 'Padrão';

      const productKey = `${category} ${model} - ${color} ${size}`.trim();
      const exists = products.find(p => p.name === productKey);

      return {
        qty,
        category,
        model,
        color,
        size: size.toUpperCase(),
        productName: productKey,
        isNew: !exists,
        unitCostEditable: '0.00',
        sellPriceEditable: exists ? (Number(exists.sell_price_cents) / 100).toFixed(2) : '79.90'
      };
    }).filter(Boolean);
  };

  const calculateCosts = (items) => {
    const freteCents = parsePriceToCents(freteTotal);
    const notaCents = parsePriceToCents(custoNota);
    const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
    if (totalQty === 0) return items;

    const fretePerUnit = freteCents / BigInt(totalQty);
    const notaPerUnit = notaCents / BigInt(totalQty);

    return items.map(item => {
      const unitCostCents = parsePriceToCents(item.unitCostEditable);
      const finalCostCents = unitCostCents + fretePerUnit + notaPerUnit;
      const sellCents = parsePriceToCents(item.sellPriceEditable);

      // Lucro after 15% commission
      const commission = (sellCents * 15n) / 100n;
      const profitCents = sellCents - finalCostCents - commission;
      const profitMargin = profitCents > 0n ? Number(profitCents * 100n / sellCents) / 100 : 0;

      let health = 'vermelho';
      if (profitMargin > 40) health = 'verde';
      else if (profitMargin >= 20) health = 'amarelo';

      return {
        ...item,
        finalCostCents,
        sellCents,
        profitCents,
        profitMargin,
        health,
        fretePerUnit,
        notaPerUnit
      };
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...parsedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setParsedItems(calculateCosts(newItems));
  };

  const confirmEntry = async () => {
    if (!freteTotal.trim()) {
      toast.error('Informe o Valor Total do Frete');
      return;
    }
    setLoading(true);
    try {
      const finalItems = calculateCosts(parsedItems);
      let newProductsCount = 0;
      let stockUpdates = 0;

      for (const item of finalItems) {
        // Check/create product
        let product = products.find(p => p.name === item.productName);
        if (!product) {
          const newProd = await api.addProduct({
            name: item.productName,
            category: item.category,
            model: item.model,
            color: item.color,
            size: item.size,
            cost_price_cents: Number(item.finalCostCents),
            sell_price_cents: Number(item.sellCents),
            status: 'Ativo'
          });
          if (newProd.data) {
            product = newProd.data;
            newProductsCount++;
          }
        } else {
          // Update price if changed
          if (Number(product.cost_price_cents) !== Number(item.finalCostCents)) {
            await api.updateProduct(product.id, {
              cost_price_cents: Number(item.finalCostCents),
              sell_price_cents: Number(item.sellCents)
            });
          }
        }

        if (product) {
          // Update stock_items
          const { data: existingStock } = await supabase
            .from('stock_items')
            .select('*')
            .eq('product_id', product.id)
            .eq('size', item.size)
            .eq('color', item.color)
            .single();

          if (existingStock) {
            await supabase
              .from('stock_items')
              .update({ quantity: existingStock.quantity + item.qty })
              .eq('id', existingStock.id);
          } else {
            await supabase
              .from('stock_items')
              .insert([{
                product_id: product.id,
                product_name: item.productName,
                size: item.size,
                color: item.color,
                quantity: item.qty
              }]);
          }
          stockUpdates++;
        }
      }

      toast.success(`✅ Recebimento confirmado! ${newProductsCount} novos produtos criados, ${stockUpdates} itens no estoque.`);
      setOrderText('');
      setFreteTotal('');
      setCustoNota('');
      setParsedItems([]);
      setConfirmDialog(false);
    } catch (error) {
      toast.error('Erro ao processar recebimento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processedItems = calculateCosts(parsedItems);
  const totalQty = processedItems.reduce((s, i) => s + i.qty, 0);
  const newCount = processedItems.filter(i => i.isNew).length;

  const healthBadge = (item) => {
    const colors = {
      verde: 'bg-emerald-500 text-white',
      amarelo: 'bg-amber-500 text-white',
      vermelho: 'bg-red-500 text-white'
    };
    return (
      <Badge className={`font-bold px-3 py-1 ${colors[item.health]}`}>
        R$ {(Number(item.profitCents)/100).toFixed(2)} ({item.profitMargin.toFixed(1)}%)
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-[#D946EF] to-violet-600 bg-clip-text text-transparent tracking-tight uppercase">
            Vitalle Hub - Recebimento Inteligente
          </h1>
          <p className="text-xl text-slate-600 mt-4 font-semibold">O Pulo do Gato: Parser AI + Criação Automática + Lucro Máximo</p>
        </div>

        {/* Input Section */}
        <Card className="border-0 shadow-2xl overflow-hidden rounded-[2.5rem]">
          <CardHeader className="bg-gradient-to-r from-[#D946EF] to-violet-600 text-white p-8">
            <CardTitle className="text-3xl font-black flex items-center gap-4">
              <Package className="h-12 w-12" />
              1. COLE SEU PEDIDO AQUI
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Textarea
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              placeholder="COLE SEU PEDIDO AQUI (Ex: 2x Baby Doll Laranja Oncinha M&#10;1x Camisola Vinho G&#10;3x Baby Doll Infantil Preto P)"
              className="w-full h-64 p-8 text-xl font-mono rounded-[2.5rem] border-2 border-slate-200 resize-none focus:border-[#D946EF] focus:ring-4 focus:ring-[#D946EF]/20"
            />
            <div className="grid md:grid-cols-2 gap-6 mt-8 p-8 bg-slate-50 rounded-[2.5rem]">
              <div>
                <Label className="text-lg font-bold text-slate-700 block mb-3">Valor Total do Frete</Label>
                <Input
                  type="text"
                  value={freteTotal}
                  onChange={(e) => setFreteTotal(e.target.value)}
                  placeholder="R$ 150,00"
                  className="h-16 text-2xl font-black rounded-[2.5rem] text-right"
                />
              </div>
              <div>
                <Label className="text-lg font-bold text-slate-700 block mb-3">Custo da Nota</Label>
                <Input
                  type="text"
                  value={custoNota}
                  onChange={(e) => setCustoNota(e.target.value)}
                  placeholder="R$ 2.500,00"
                  className="h-16 text-2xl font-bold rounded-[2.5rem] text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conference Table */}
        {processedItems.length > 0 && (
          <Card className="border-0 shadow-2xl overflow-hidden rounded-[2.5rem]">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-8">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <CardTitle className="text-3xl font-black flex items-center gap-4">
                  <CheckCircle2 className="h-12 w-12" />
                  2. TABELA DE CONFERÊNCIA ({processedItems.length} itens • {totalQty} und)
                </CardTitle>
                <Badge className="text-2xl px-8 py-4 bg-white/20 backdrop-blur-sm rounded-[2.5rem] font-black">
                  {newCount} NOVOS PRODUTOS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="w-[300px] font-black uppercase text-slate-700 text-lg p-6">PRODUTO</TableHead>
                      <TableHead className="text-center font-black uppercase text-slate-700 text-lg p-6">QTD</TableHead>
                      <TableHead className="text-right font-black uppercase text-slate-700 text-lg p-6">CUSTO UNIT.</TableHead>
                      <TableHead className="text-right font-black uppercase text-slate-700 text-lg p-6">CUSTO FINAL</TableHead>
                      <TableHead className="text-right font-black uppercase text-slate-700 text-lg p-6">PV SUGERIDO</TableHead>
                      <TableHead className="text-right font-black uppercase text-slate-700 text-lg p-6">PREÇO VENDA</TableHead>
                      <TableHead className="text-right font-black uppercase text-slate-700 text-lg p-6 w-[200px]">SAÚDE FINANCEIRA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedItems.map((item, idx) => (
                      <TableRow key={idx} className="border-b-2 border-slate-100 hover:bg-slate-50 group">
                        <TableCell className="p-6 font-black text-xl">
                          <div className="space-y-2">
                            <div>{item.category} {item.model} <span className="text-[#D946EF] font-black">•</span> {item.color} {item.size}</div>
                            <div className="flex gap-2">
                              {item.isNew && <Badge variant="destructive" className="font-black">NOVO</Badge>}
                              <Badge className="bg-slate-200 text-slate-800 font-black">{formatPriceDisplay(item.finalCostCents)}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-6">
                          <Input
                            type="number"
                            value={item.qty}
                            onChange={e => updateItem(idx, 'qty', parseInt(e.target.value))}
                            className="w-24 mx-auto h-14 text-2xl font-black rounded-[2rem] text-center"
                            min={1}
                          />
                        </TableCell>
                        <TableCell className="p-6">
                          <Input
                            type="text"
                            value={item.unitCostEditable}
                            onChange={e => updateItem(idx, 'unitCostEditable', e.target.value)}
                            className="w-full h-14 text-xl font-black rounded-[2rem] text-right"
                          />
                        </TableCell>
                        <TableCell className="p-6 text-2xl font-black text-emerald-600 text-right">
                          {formatPriceDisplay(item.finalCostCents)}
                        </TableCell>
                        <TableCell className="p-6 text-2xl font-black text-[#D946EF] text-right">
                          {formatPriceDisplay((item.finalCostCents * 240n) / 100n)} {/* Suggested 2.4x */}
                        </TableCell>
                        <TableCell className="p-6">
                          <Input
                            type="text"
                            value={item.sellPriceEditable}
                            onChange={e => updateItem(idx, 'sellPriceEditable', e.target.value)}
                            className="w-full h-14 text-xl font-black rounded-[2rem] text-right bg-slate-50"
                          />
                        </TableCell>
                        <TableCell className="p-6 text-right">
                          {healthBadge(item)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardContent className="p-8 pt-0 bg-gradient-to-r from-emerald-50 to-green-50">
              <Button
                onClick={() => setConfirmDialog(true)}
                disabled={loading || !freteTotal || processedItems.length === 0}
                size="lg"
                className="w-full h-20 text-2xl font-black bg-gradient-to-r from-[#D946EF] to-violet-600 hover:from-violet-600 hover:to-[#D946EF] rounded-[2.5rem] shadow-2xl uppercase tracking-widest"
              >
                <Save className="h-8 w-8 mr-4" />
                CONFIRMAR ENTRADA DE ESTOQUE
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirm Dialog */}
        <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
          <DialogContent className="rounded-[2.5rem] p-0 max-w-2xl border-0 shadow-2xl bg-white">
            <DialogHeader className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-10 rounded-t-[2.5rem]">
              <DialogTitle className="text-4xl font-black flex items-center justify-center gap-4">
                <CheckCircle2 className="h-16 w-16" />
                Confirmar Recebimento?
              </DialogTitle>
              <DialogDescription className="text-2xl font-semibold mt-4 opacity-90">
                {newCount} Novos produtos serão criados | {totalQty} Itens adicionados ao estoque
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="p-10 gap-6 bg-slate-50 rounded-b-[2.5rem]">
              <Button
                variant="outline"
                onClick={() => setConfirmDialog(false)}
                className="flex-1 h-16 text-xl font-black rounded-[2.5rem]"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmEntry}
                disabled={loading}
                className="flex-1 h-16 text-xl font-black bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-[2.5rem] shadow-2xl"
              >
                {loading ? 'Processando...' : '🚀 EXECUTAR'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Recebimento;

