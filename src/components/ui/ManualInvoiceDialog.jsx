import { useState } from "react";
import { cline } from "@/api/clineClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, Plus, X, Truck, CreditCard, Calendar, DollarSign } from "lucide-react";

const STEPS = { FORM: "form", MATCHING: "matching", STOCK: "stock", PAYMENT: "payment", DONE: "done" };
const sizes = ["PP", "P", "M", "G", "GG", "3G", "Único"];
const categories = ["Camisetas", "Calças", "Vestidos", "Saias", "Blusas", "Jaquetas", "Shorts", "Acessórios", "Outros"];
const paymentMethods = ["PIX", "Dinheiro", "Cartão Crédito", "Boleto", "Transferência"];
const creditMethods = ["Cartão Crédito", "Boleto"];

function StockEntryRow({ entry, idx, onUpdate }) {
  function addDistribution() {
    onUpdate(idx, { distributions: [...(entry.distributions || []), { size: "Único", color: "", quantity: 1 }] });
  }
  function updateDist(dIdx, changes) {
    onUpdate(idx, { distributions: (entry.distributions || []).map((d, i) => i === dIdx ? { ...d, ...changes } : d) });
  }
  function removeDist(dIdx) {
    onUpdate(idx, { distributions: (entry.distributions || []).filter((_, i) => i !== dIdx) });
  }

  const totalAssigned = (entry.distributions || []).reduce((s, d) => s + (Number(d.quantity) || 0), 0);
  const totalNF = Number(entry.nfItem?.quantity) || 0;
  const remaining = totalNF - totalAssigned;

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            {entry.isNew && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded mr-2">NOVO</span>}
            {entry.isNew ? entry.newProductData.name : entry.product_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Total NF: {totalNF} un. · Distribuídos: {totalAssigned} ·{" "}
            <span className={remaining !== 0 ? "text-orange-500 font-medium" : "text-green-600 font-medium"}>
              {remaining !== 0 ? `${remaining} restantes` : "completo"}
            </span>
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addDistribution} className="gap-1 text-xs">
          <Plus className="h-3 w-3" /> Tamanho
        </Button>
      </div>
      {(entry.distributions || []).map((dist, dIdx) => (
        <div key={dIdx} className="grid grid-cols-4 gap-2 items-end bg-muted/30 p-2 rounded-lg">
          <div>
            <Label className="text-xs">Tamanho</Label>
            <Select value={dist.size} onValueChange={v => updateDist(dIdx, { size: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Cor *</Label>
            <Input className="h-8 text-xs" placeholder="Ex: Preto" value={dist.color} onChange={e => updateDist(dIdx, { color: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Qtd</Label>
            <div className="flex items-center gap-1">
              <Input className="h-8 text-xs" type="number" min="1" value={dist.quantity} onChange={e => updateDist(dIdx, { quantity: e.target.value })} />
              <button type="button" onClick={() => removeDist(dIdx)} className="text-destructive p-1"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </div>
      ))}
      {(!entry.distributions || entry.distributions.length === 0) && (
        <p className="text-xs text-muted-foreground italic">Clique em "+ Tamanho" para distribuir os itens</p>
      )}
    </div>
  );
}

function emptyInstallment(amount = 0, method = "") {
  return { amount, due_date: "", method, paid: false, notes: "" };
}

export default function ManualInvoiceDialog({ open, onOpenChange, suppliers, products, onSuccess }) {
  const [step, setStep] = useState(STEPS.FORM);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    number: "", supplier_id: "", issue_date: new Date().toISOString().split("T")[0], notes: "",
    freight: "", freightPaid: false, freightDivideByUnit: false,
  });
  const [currentItem, setCurrentItem] = useState({ product_name: "", quantity: "", unit_price: "" });
  const [items, setItems] = useState([]);
  const [matchings, setMatchings] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [localSuppliers, setLocalSuppliers] = useState(suppliers);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState("");
  const [creatingSupplier, setCreatingSupplier] = useState(false);

  // Payment section
  const [paymentMethod, setPaymentMethod] = useState("");
  const [installments, setInstallments] = useState([emptyInstallment()]);

  function reset() {
    setStep(STEPS.FORM); setLoading(false);
    setForm({ number: "", supplier_id: "", issue_date: new Date().toISOString().split("T")[0], notes: "", freight: "", freightPaid: false, freightDivideByUnit: false });
    setItems([]); setMatchings([]); setStockEntries([]);
    setLocalSuppliers(suppliers); setShowNewSupplier(false); setNewSupplierName("");
    setPaymentMethod(""); setInstallments([emptyInstallment()]);
    setCurrentItem({ product_name: "", quantity: "", unit_price: "" });
  }

  async function handleCreateSupplier() {
    if (!newSupplierName.trim()) return;
    setCreatingSupplier(true);
    const s = await cline.entities.Supplier.create({ name: newSupplierName.trim() });
    setLocalSuppliers(prev => [...prev, s]);
    setForm(prev => ({ ...prev, supplier_id: s.id }));
    setNewSupplierName(""); setShowNewSupplier(false); setCreatingSupplier(false);
  }

  function addItem() {
    if (!currentItem.product_name) return;
    const qty = Number(currentItem.quantity) || 1;
    const price = Number(currentItem.unit_price) || 0;
    setItems(prev => [...prev, { product_name: currentItem.product_name, quantity: qty, unit_price: price, total: qty * price }]);
    setCurrentItem({ product_name: "", quantity: "", unit_price: "" });
  }

  function proceedToMatching() {
    const initial = items.map(item => {
      const found = products.find(p =>
        p.name?.toLowerCase().includes(item.product_name?.toLowerCase()) ||
        item.product_name?.toLowerCase().includes(p.name?.toLowerCase())
      );
      return {
        nfItem: item,
        matchType: found ? "existing" : "new",
        product_id: found?.id || "",
        newProductData: { name: item.product_name, cost_price: item.unit_price || 0, sell_price: (item.unit_price || 0) * 2, category: "" },
      };
    });
    setMatchings(initial);
    setStep(STEPS.MATCHING);
  }

  function updateMatching(idx, changes) {
    setMatchings(prev => prev.map((m, i) => i === idx ? { ...m, ...changes } : m));
  }

  function proceedToStock() {
    const entries = matchings.filter(m => m.matchType !== "skip").map(m => {
      const product = products.find(p => p.id === m.product_id);
      return {
        product_id: m.product_id,
        product_name: m.matchType === "existing" ? (product?.name || "") : m.newProductData.name,
        isNew: m.matchType === "new",
        newProductData: m.newProductData,
        nfItem: m.nfItem,
        distributions: [{ size: "Único", color: "", quantity: m.nfItem.quantity || 1 }],
      };
    });
    setStockEntries(entries);
    setStep(STEPS.STOCK);
  }

  function updateStock(idx, changes) {
    setStockEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...changes } : e));
  }

  function proceedToPayment() {
    const totalItems = items.reduce((s, i) => s + i.total, 0);
    const freight = Number(form.freight) || 0;
    const grandTotal = totalItems + freight;
    setInstallments([emptyInstallment(grandTotal, "")]);
    setStep(STEPS.PAYMENT);
  }

  function setNumInstallments(n) {
    const num = Math.max(1, Math.min(24, Number(n) || 1));
    const grandTotal = items.reduce((s, i) => s + i.total, 0) + (Number(form.freight) || 0);
    const baseAmount = parseFloat((grandTotal / num).toFixed(2));
    setInstallments(Array.from({ length: num }, (_, i) => {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i + 1);
      return emptyInstallment(baseAmount, paymentMethod);
    }));
  }

  function updateInstallment(idx, changes) {
    setInstallments(prev => prev.map((inst, i) => i === idx ? { ...inst, ...changes } : inst));
  }

  async function handleFinalize() {
    setLoading(true);
    const createdProducts = {};

    for (const entry of stockEntries) {
      if (entry.isNew) {
        const p = await cline.entities.Product.create({
          name: entry.newProductData.name,
          cost_price: Number(entry.newProductData.cost_price) || 0,
          sell_price: Number(entry.newProductData.sell_price) || 0,
          category: entry.newProductData.category || "",
          status: "Ativo",
        });
        createdProducts[entry.newProductData.name] = p.id;
      }
    }

    // Calculate freight per unit if requested
    const freight = Number(form.freight) || 0;
    const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
    const freightPerUnit = form.freightDivideByUnit && totalUnits > 0 ? freight / totalUnits : 0;

    for (const entry of stockEntries) {
      const product_id = entry.isNew ? createdProducts[entry.newProductData.name] : entry.product_id;
      const product_name = entry.isNew ? entry.newProductData.name : entry.product_name;
      for (const dist of (entry.distributions || [])) {
        if (!dist.color || !dist.quantity) continue;
        await cline.entities.StockItem.create({ product_id, product_name, size: dist.size, color: dist.color, quantity: Number(dist.quantity) || 0 });
        await cline.entities.StockMovement.create({ type: "Entrada", product_id, product_name, size: dist.size, color: dist.color, quantity: Number(dist.quantity) || 0, reference_type: "Nota Fiscal", movement_date: new Date().toISOString() });
      }
    }

    const supplier = localSuppliers.find(s => s.id === form.supplier_id);
    const totalItems = items.reduce((s, i) => s + i.total, 0);
    const grandTotal = totalItems + freight;
    const allPaid = installments.every(inst => inst.paid);
    const isCredit = creditMethods.includes(paymentMethod);
    const invoiceStatus = allPaid || (!isCredit) ? "Paga" : "Pendente";

    await cline.entities.Invoice.create({
      number: form.number,
      supplier_id: form.supplier_id,
      supplier_name: supplier?.name || "",
      items,
      total_amount: grandTotal,
      freight,
      payment_method: paymentMethod,
      issue_date: form.issue_date ? new Date(form.issue_date).toISOString() : new Date().toISOString(),
      status: invoiceStatus,
      notes: form.notes,
    });

    // Create payment titles for credit methods
    if (isCredit) {
      for (const [i, inst] of installments.entries()) {
        if (inst.paid) continue;
        await cline.entities.Payment.create({
          type: "A Pagar",
          reference_type: "Nota Fiscal",
          person_name: supplier?.name || "",
          amount: Number(inst.amount) || 0,
          due_date: inst.due_date ? new Date(inst.due_date).toISOString() : null,
          status: "Pendente",
          payment_method: inst.method || paymentMethod,
          notes: inst.notes || `Parcela ${i + 1} de ${installments.length}`,
        });
      }
    }

    setLoading(false);
    setStep(STEPS.DONE);
    onSuccess();
  }

  function handleClose() { reset(); onOpenChange(false); }

  const totalItems = items.reduce((s, i) => s + i.total, 0);
  const freight = Number(form.freight) || 0;
  const grandTotal = totalItems + freight;
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === STEPS.FORM && "Nova NF Manual"}
            {step === STEPS.MATCHING && "Assimilar Produtos"}
            {step === STEPS.STOCK && "Distribuir Estoque por Tamanho/Cor"}
            {step === STEPS.PAYMENT && "Pagamento"}
            {step === STEPS.DONE && "Concluído!"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP: FORM */}
        {step === STEPS.FORM && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número da NF *</Label>
                <Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} />
              </div>
              <div>
                <Label>Data de Emissão</Label>
                <Input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Fornecedor</Label>
              <div className="flex gap-2">
                <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{localSuppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSupplier(!showNewSupplier)} className="shrink-0"><Plus className="h-4 w-4" /></Button>
              </div>
              {showNewSupplier && (
                <div className="flex gap-2 mt-2">
                  <Input placeholder="Nome do fornecedor" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
                  <Button type="button" size="sm" onClick={handleCreateSupplier} disabled={creatingSupplier || !newSupplierName.trim()}>
                    {creatingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar"}
                  </Button>
                </div>
              )}
            </div>

            {/* Freight section */}
            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Frete</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor do Frete (R$)</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={form.freight} onChange={e => setForm({ ...form, freight: e.target.value })} />
                </div>
                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.freightPaid} onChange={e => setForm({ ...form, freightPaid: e.target.checked })} className="rounded" />
                    Frete já pago
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.freightDivideByUnit} onChange={e => setForm({ ...form, freightDivideByUnit: e.target.checked })} className="rounded" />
                    Dividir por unidade
                  </label>
                </div>
              </div>
              {form.freightDivideByUnit && totalUnits > 0 && Number(form.freight) > 0 && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded px-2 py-1">
                  Frete por unidade: <strong>R$ {(Number(form.freight) / totalUnits).toFixed(2)}</strong> ({totalUnits} unidades)
                </p>
              )}
            </div>

            {/* Items */}
            <div>
              <Label>Itens da NF</Label>
              <div className="border border-border rounded-lg p-3 space-y-3 mt-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm bg-muted/40 px-3 py-2 rounded-md">
                    <span className="font-medium">{it.product_name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <span>x{it.quantity}</span>
                      <span>R$ {it.total.toFixed(2)}</span>
                      <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="text-destructive"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Produto" value={currentItem.product_name} onChange={e => setCurrentItem({ ...currentItem, product_name: e.target.value })} />
                  <Input type="number" placeholder="Qtd" value={currentItem.quantity} onChange={e => setCurrentItem({ ...currentItem, quantity: e.target.value })} />
                  <Input type="number" step="0.01" placeholder="Preço unit." value={currentItem.unit_price} onChange={e => setCurrentItem({ ...currentItem, unit_price: e.target.value })} />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={!currentItem.product_name} className="gap-1">
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </Button>
              </div>
            </div>

            {grandTotal > 0 && (
              <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>R$ {totalItems.toFixed(2)}</span></div>
                {freight > 0 && <div className="flex justify-between text-muted-foreground"><span>Frete {form.freightPaid ? "(já pago)" : ""}</span><span>R$ {freight.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-base border-t border-border pt-1"><span>Total</span><span>R$ {grandTotal.toFixed(2)}</span></div>
              </div>
            )}

            <div>
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <Button onClick={proceedToMatching} className="w-full" disabled={!form.number || items.length === 0}>
              Próximo: Assimilar Produtos →
            </Button>
          </div>
        )}

        {/* STEP: MATCHING */}
        {step === STEPS.MATCHING && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Assimile cada item com um produto cadastrado ou crie um novo.</p>
            <div className="space-y-3">
              {matchings.map((m, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.nfItem.product_name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {m.nfItem.quantity} · R$ {m.nfItem.unit_price?.toFixed(2)}</p>
                    </div>
                    <Select value={m.matchType} onValueChange={v => updateMatching(idx, { matchType: v, product_id: "" })}>
                      <SelectTrigger className="w-40 text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Produto existente</SelectItem>
                        <SelectItem value="new">Criar novo produto</SelectItem>
                        <SelectItem value="skip">Ignorar item</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {m.matchType === "existing" && (
                    <Select value={m.product_id} onValueChange={v => updateMatching(idx, { product_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione o produto" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                  {m.matchType === "new" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Nome</Label><Input className="h-8 text-xs" value={m.newProductData.name} onChange={e => updateMatching(idx, { newProductData: { ...m.newProductData, name: e.target.value } })} /></div>
                      <div>
                        <Label className="text-xs">Categoria</Label>
                        <Select value={m.newProductData.category} onValueChange={v => updateMatching(idx, { newProductData: { ...m.newProductData, category: v } })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                          <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-xs">Preço de Custo</Label><Input className="h-8 text-xs" type="number" step="0.01" value={m.newProductData.cost_price} onChange={e => updateMatching(idx, { newProductData: { ...m.newProductData, cost_price: e.target.value } })} /></div>
                      <div><Label className="text-xs">Preço de Venda</Label><Input className="h-8 text-xs" type="number" step="0.01" value={m.newProductData.sell_price} onChange={e => updateMatching(idx, { newProductData: { ...m.newProductData, sell_price: e.target.value } })} /></div>
                    </div>
                  )}
                  {m.matchType === "skip" && <p className="text-xs text-muted-foreground italic">Este item será ignorado</p>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(STEPS.FORM)} className="flex-1">← Voltar</Button>
              <Button onClick={proceedToStock} className="flex-1">Próximo: Estoque →</Button>
            </div>
          </div>
        )}

        {/* STEP: STOCK */}
        {step === STEPS.STOCK && (
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">Distribua os itens por tamanho e cor.</p>
            <div className="space-y-3">
              {stockEntries.map((entry, idx) => (
                <StockEntryRow key={idx} entry={entry} idx={idx} onUpdate={updateStock} />
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(STEPS.MATCHING)} className="flex-1">← Voltar</Button>
              <Button
                onClick={proceedToPayment}
                className="flex-1"
                disabled={stockEntries.some(e => !e.distributions?.length || e.distributions.some(d => !d.color))}
              >
                Próximo: Pagamento →
              </Button>
            </div>
          </div>
        )}

        {/* STEP: PAYMENT */}
        {step === STEPS.PAYMENT && (
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm">Condições de Pagamento</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={v => { setPaymentMethod(v); setInstallments(prev => prev.map(i => ({ ...i, method: v }))); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                {creditMethods.includes(paymentMethod) && (
                  <p className="text-xs text-orange-600 mt-1">Titulos serao lancados em Contas a Pagar</p>
                )}
                {(paymentMethod === "PIX" || paymentMethod === "Dinheiro" || paymentMethod === "Transferência") && (
                  <p className="text-xs text-green-600 mt-1">NF sera registrada como Paga</p>
                )}
              </div>
              {creditMethods.includes(paymentMethod) && (
                <div>
                  <Label>Número de Parcelas</Label>
                  <Input type="number" min="1" max="24" defaultValue={installments.length} onChange={e => setNumInstallments(e.target.value)} />
                </div>
              )}
            </div>

            {/* Installments */}
            {creditMethods.includes(paymentMethod) && installments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> PARCELAS ({installments.length}x)
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {installments.map((inst, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">PARCELA {idx + 1}</span>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                          <input type="checkbox" checked={inst.paid} onChange={e => updateInstallment(idx, { paid: e.target.checked })} className="rounded" />
                          <span className={inst.paid ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {inst.paid ? "Pago" : "Pendente"}
                          </span>
                        </label>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Valor (R$)</Label>
                          <Input className="h-8 text-xs" type="number" step="0.01" value={inst.amount} onChange={e => updateInstallment(idx, { amount: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Vencimento</Label>
                          <Input className="h-8 text-xs" type="date" value={inst.due_date} onChange={e => updateInstallment(idx, { due_date: e.target.value })} />
                        </div>
                        <div>
                          <Label className="text-xs">Método</Label>
                          <Select value={inst.method || paymentMethod} onValueChange={v => updateInstallment(idx, { method: v })}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Observações</Label>
                        <Input className="h-7 text-xs" placeholder="Opcional" value={inst.notes} onChange={e => updateInstallment(idx, { notes: e.target.value })} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-muted/30 rounded-lg px-3 py-2 text-xs flex justify-between">
                  <span className="text-muted-foreground">Total parcelado:</span>
                  <span className="font-bold">R$ {installments.reduce((s, i) => s + (Number(i.amount) || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Single payment (non-credit) */}
            {!creditMethods.includes(paymentMethod) && paymentMethod && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Pagamento à vista — R$ {grandTotal.toFixed(2)}</p>
                  <p className="text-xs text-green-600">A nota será registrada como Paga automaticamente</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(STEPS.STOCK)} className="flex-1">← Voltar</Button>
              <Button onClick={handleFinalize} className="flex-1" disabled={loading || !paymentMethod}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Finalizar e Dar Entrada
              </Button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === STEPS.DONE && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold">NF lançada com sucesso!</p>
            <p className="text-sm text-muted-foreground text-center">
              Estoque atualizado{creditMethods.includes(paymentMethod) ? " e títulos lançados em Contas a Pagar" : " e NF registrada como Paga"}.
            </p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}