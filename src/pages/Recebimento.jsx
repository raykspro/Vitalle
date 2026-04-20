import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { parsePriceToCents, formatPriceDisplay } from '../lib/formatters';
import { toast } from '../components/ui/toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Package, Save, CheckCircle2 } from 'lucide-react';

const CATEGORIES = ['Baby Doll', 'Baby Doll Infantil', 'Camisola', 'Lingerie', 'Pijama'];
const SIZES = ['P', 'M', 'G', 'GG', 'Único'];
const COLORS = ['Laranja', 'Preto', 'Branco', 'Satin', 'Vinho', 'Azul Marinho', 'Romance', 'Oncinha'];

const Recebimento = () => {
  const [orderText, setOrderText] = useState('');
  const [items, setItems] = useState([]);
  const [freteTotal, setFreteTotal] = useState('');
  const [custoNota, setCustoNota] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    parseAndProcess();
  }, [orderText, freteTotal, custoNota]);

  const parseAndProcess = () => {
    try {
      const lines = orderText.split(/\n|\r/).map(l => l.trim()).filter(Boolean);
      const parsed = lines.map(line => {
        const regex = /^(\d+)\s*x\s*([\w\s]+?)(?:\s+([\w\s]+?))?\s*([P|M|G|GG|Único])$/i;
        const match = line.match(regex);
        if (!match) return null;

        const [, qtyStr, catRaw, colorRaw, sizeRaw] = match;
        const qty = Number(qtyStr) || 0;
        const size = (sizeRaw || '').toUpperCase();
        if (!SIZES.includes(size)) return null;

        let category = CATEGORIES.find(c => catRaw.toLowerCase().includes(c.toLowerCase())) || 'Baby Doll';
        let color = COLORS.find(c => catRaw.toLowerCase().includes(c.toLowerCase())) || 'N/A';
        let model = catRaw.replace(category, '').replace(color, '').trim() || 'Padrão';

        const productName = `${category} ${model} - ${color} ${size}`.trim();
        return { qty, category, model, color, size, productName, unitCost: 0, sellPrice: 79.90 };
      }).filter(Boolean);

      const totalQ = parsed.reduce((s, i) => s + i.qty, 0) || 1;
      const freteC = parsePriceToCents(freteTotal || '0');
      const notaC = parsePriceToCents(custoNota || '0');
      const rateioFrete = freteC / BigInt(totalQ);
      const rateioNota = notaC / BigInt(totalQ);

      const processed = parsed.map(item => {
        const unitCostC = parsePriceToCents(item.unitCost.toString() || '0');
        const finalCost = unitCostC + rateioFrete + rateioNota;
        const sellC = parsePriceToCents(item.sellPrice.toString() || '0');
        const comm = (sellC * 15n) / 100n;
        const profit = sellC > 0n ? sellC - finalCost - comm : 0n;
        const margin = sellC > 0n ? Number(profit * 100n / sellC) / 100 : 0;

        let health = 'vermelho';
        if (margin > 40) health = 'verde';
        else if (margin >= 20) health = 'amarelo';

        return { ...item, finalCostCents: finalCost, sellCents: sellC, profitCents: profit, profitMargin: margin, health };
      });

      setItems(processed);
    } catch (e) {
      console.error('Parse error:', e);
      setItems([]);
    }
  };

  const updateItem = (idx, field, value) => {
    const newItems = [...items];
    newItems[idx][field] = Number(value) || 0;
    setItems(newItems);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      let newProds = 0;
      for (const item of items) {
        const { data: prod } = await supabase
          .from('products')
          .select('*')
          .eq('name', item.productName)
          .single();

        let productId;
        if (!prod) {
          const { data } = await supabase.from('products').insert([{
            name: item.productName,
            category: item.category,
            color: item.color,
            size: item.size,
            model: item.model,
            cost_price_cents: Number(item.finalCostCents),
            sell_price_cents: Number(item.sellCents),
            status: 'Ativo'
          }]).select().single();
          productId = data.id;
          newProds++;
        } else {
          productId = prod.id;
          await supabase.from('products').update({
            cost_price_cents: Number(item.finalCostCents),
            sell_price_cents: Number(item.sellCents)
          }).eq('id', productId);
        }

        const { data: stock } = await supabase
          .from('stock_items')
          .select('*')
          .eq('product_id', productId)
          .eq('size', item.size)
          .eq('color', item.color)
          .single();

        if (stock) {
          await supabase.from('stock_items').update({
            quantity: stock.quantity + item.qty
          }).eq('id', stock.id);
        } else {
          await supabase.from('stock_items').insert([{
            product_id: productId,
            product_name: item.productName,
            size: item.size,
            color: item.color,
            quantity: item.qty
          }]);
        }
      }
      toast.success(`Recebimento confirmado! ${newProds} novos produtos criados.`);
      setOrderText('');
      setFreteTotal('');
      setCustoNota('');
      setItems([]);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
    setLoading(false);
    setConfirmOpen(false);
  };

  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const newProds = items.filter(i => true).length; // Simplified

  const HealthBadge = ({ item }) => {
    const color = item.health === 'verde' ? 'bg-green-500' : item.health === 'amarelo' ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <Badge className={`${color} text-white font-bold`}>
        R$ {formatPriceDisplay(item.profitCents)} ({item.profitMargin.toFixed(1)}%)
      </Badge>
    );
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold text-center">Recebimento Inteligente</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>COLE SEU PEDIDO AQUI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={orderText}
            onChange={(e) => setOrderText(e.target.value)}
            placeholder="2x Baby Doll Laranja Oncinha M"
            className="h-32"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frete Total</Label>
              <Input value={freteTotal} onChange={(e) => setFreteTotal(e.target.value)} />
            </div>
            <div>
              <Label>Custo Nota</Label>
              <Input value={custoNota} onChange={(e) => setCustoNota(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tabela de Conferência ({items.length} itens)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Custo Final</TableHead>
                  <TableHead>Preço Venda</TableHead>
                  <TableHead>Saúde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>
                      <Input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} />
                    </TableCell>
                    <TableCell>{formatPriceDisplay(item.finalCostCents)}</TableCell>
                    <TableCell>
                      <Input type="number" value={item.sellPrice} onChange={(e) => updateItem(idx, 'sellPrice', e.target.value)} />
                    </TableCell>
                    <TableCell><HealthBadge item={item} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button onClick={() => setConfirmOpen(true)} className="mt-4 w-full" disabled={loading || !freteTotal}>
              CONFIRMAR ENTRADA
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recebimento;

