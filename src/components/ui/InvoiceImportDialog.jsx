import { useState } from "react";
import { cline } from "@/api/clineClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Plus } from "lucide-react";

const STEPS = { UPLOAD: "upload", MATCHING: "matching", STOCK: "stock", DONE: "done" };
const sizes = ["PP", "P", "M", "G", "GG", "3G", "Único"];

export default function InvoiceImportDialog({ open, onOpenChange, suppliers, products: existingProducts, onSuccess }) {
  const [step, setStep] = useState(STEPS.UPLOAD);
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [matchings, setMatchings] = useState([]); // { nfItem, matchType: "existing"|"new"|"skip", product_id, newProductData }
  const [stockEntries, setStockEntries] = useState([]); // { product_id, product_name, size, color, quantity }
  const [invoiceInfo, setInvoiceInfo] = useState({ number: "", supplier_id: "", due_date: "", total_amount: "" });

  function reset() {
    setStep(STEPS.UPLOAD);
    setLoading(false);
    setExtractedData(null);
    setMatchings([]);
    setStockEntries([]);
    setInvoiceInfo({ number: "", supplier_id: "", due_date: "", total_amount: "" });
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const { file_url } = await cline.integrations.Core.UploadFile({ file });
      const result = await cline.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            number: { type: "string", description: "Número da nota fiscal" },
            supplier_name: { type: "string", description: "Nome do fornecedor/emitente" },
            issue_date: { type: "string", description: "Data de emissão" },
            due_date: { type: "string", description: "Data de vencimento" },
            total_amount: { type: "number", description: "Valor total da nota" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  quantity: { type: "number" },
                  unit_price: { type: "number" },
                  total: { type: "number" },
                }
              }
            }
          }
        }
      });

      if (result.status === "success") {
        const data = result.output;
        setExtractedData(data);
        setInvoiceInfo({
          number: data.number || "",
          supplier_id: suppliers.find(s => s.name?.toLowerCase().includes((data.supplier_name || "").toLowerCase()))?.id || "",
          due_date: data.due_date ? data.due_date.split("T")[0] : "",
          total_amount: data.total_amount || "",
        });

        // Auto-match items
        const initialMatchings = (data.items || []).map((item) => {
          const found = existingProducts.find(p =>
            p.name?.toLowerCase().includes(item.name?.toLowerCase()) ||
            item.name?.toLowerCase().includes(p.name?.toLowerCase())
          );
          return {
            nfItem: item,
            matchType: found ? "existing" : "new",
            product_id: found?.id || "",
            newProductData: { name: item.name, sell_price: (item.unit_price || 0) * 2, cost_price: item.unit_price || 0, category: "" },
          };
        });
        setMatchings(initialMatchings);
        setStep(STEPS.MATCHING);
      }
    } finally {
      setLoading(false);
    }
  }

  function updateMatching(idx, changes) {
    setMatchings(prev => prev.map((m, i) => i === idx ? { ...m, ...changes } : m));
  }

  function proceedToStock() {
    const entries = matchings
      .filter(m => m.matchType !== "skip")
      .map(m => {
        const product = existingProducts.find(p => p.id === m.product_id);
        return {
          product_id: m.product_id,
          product_name: m.matchType === "existing" ? (product?.name || "") : m.newProductData.name,
          isNew: m.matchType === "new",
          newProductData: m.newProductData,
          nfItem: m.nfItem,
          size: "Único",
          color: "",
          quantity: m.nfItem.quantity || 1,
        };
      });
    setStockEntries(entries);
    setStep(STEPS.STOCK);
  }

  function updateStock(idx, changes) {
    setStockEntries(prev => prev.map((e, i) => i === idx ? { ...e, ...changes } : e));
  }

  async function handleFinalize() {
    setLoading(true);
    try {
      // 1. Create new products
      const createdProducts = {};
      for (const entry of stockEntries) {
        if (entry.isNew) {
          const p = await cline.entities.Product.create({
            name: entry.newProductData.name,
            sell_price: Number(entry.newProductData.sell_price) || 0,
            cost_price: Number(entry.newProductData.cost_price) || 0,
            category: entry.newProductData.category || "",
            status: "Ativo",
          });
          createdProducts[entry.newProductData.name] = p.id;
        }
      }

      // 2. Add stock entries
      for (const entry of stockEntries) {
        const product_id = entry.isNew ? createdProducts[entry.newProductData.name] : entry.product_id;
        const product_name = entry.isNew ? entry.newProductData.name : entry.product_name;
        if (!entry.color) continue;
        await cline.entities.StockItem.create({
          product_id,
          product_name,
          size: entry.size,
          color: entry.color,
          quantity: Number(entry.quantity) || 0,
        });
      }

      // 3. Create invoice
      const supplier = suppliers.find(s => s.id === invoiceInfo.supplier_id);
      await cline.entities.Invoice.create({
        number: invoiceInfo.number,
        supplier_id: invoiceInfo.supplier_id,
        supplier_name: supplier?.name || extractedData?.supplier_name || "",
        items: extractedData?.items || [],
        total_amount: Number(invoiceInfo.total_amount) || 0,
        issue_date: new Date().toISOString(),
        due_date: invoiceInfo.due_date ? new Date(invoiceInfo.due_date).toISOString() : null,
        status: "Pendente",
      });

      // 4. Create payment if due_date
      if (invoiceInfo.due_date) {
        await cline.entities.Payment.create({
          type: "A Pagar",
          reference_type: "Nota Fiscal",
          person_name: supplier?.name || extractedData?.supplier_name || "",
          amount: Number(invoiceInfo.total_amount) || 0,
          due_date: new Date(invoiceInfo.due_date).toISOString(),
          status: "Pendente",
        });
      }

      setStep(STEPS.DONE);
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Nota Fiscal</DialogTitle>
        </DialogHeader>

        {/* STEP: UPLOAD */}
        {step === STEPS.UPLOAD && (
          <div className="space-y-6 mt-2">
            <div className="border-2 border-dashed border-border rounded-xl p-10 text-center">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Lendo nota fiscal com IA...</p>
                </div>
              ) : (
                <>
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm font-medium mb-1">Envie a nota fiscal</p>
                  <p className="text-xs text-muted-foreground mb-4">PDF, imagem ou XML</p>
                  <label className="cursor-pointer">
                    <Button asChild variant="outline">
                      <span><Upload className="h-4 w-4 mr-2" /> Selecionar arquivo</span>
                    </Button>
                    <input type="file" accept=".pdf,.png,.jpg,.jpeg,.xml,.csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP: MATCHING */}
        {step === STEPS.MATCHING && (
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número da NF</Label>
                <Input value={invoiceInfo.number} onChange={e => setInvoiceInfo({ ...invoiceInfo, number: e.target.value })} />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Select value={invoiceInfo.supplier_id} onValueChange={v => setInvoiceInfo({ ...invoiceInfo, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={invoiceInfo.due_date} onChange={e => setInvoiceInfo({ ...invoiceInfo, due_date: e.target.value })} />
              </div>
              <div>
                <Label>Valor Total</Label>
                <Input type="number" step="0.01" value={invoiceInfo.total_amount} onChange={e => setInvoiceInfo({ ...invoiceInfo, total_amount: e.target.value })} />
              </div>
            </div>

            <p className="text-sm font-semibold pt-2">Itens da Nota — Assimilar com Produtos</p>
            <div className="space-y-3">
              {matchings.map((m, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{m.nfItem.name}</p>
                      <p className="text-xs text-muted-foreground">Qtd: {m.nfItem.quantity} · R$ {m.nfItem.unit_price?.toFixed(2)}</p>
                    </div>
                    <Select value={m.matchType} onValueChange={v => updateMatching(idx, { matchType: v, product_id: "" })}>
                      <SelectTrigger className="w-36 text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
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
                      <SelectContent>
                        {existingProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {m.matchType === "new" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input className="h-8 text-xs" value={m.newProductData.name} onChange={e => updateMatching(idx, { newProductData: { ...m.newProductData, name: e.target.value } })} />
                      </div>
                      <div>
                        <Label className="text-xs">Categoria</Label>
                        <Select value={m.newProductData.category} onValueChange={v => updateMatching(idx, { newProductData: { ...m.newProductData, category: v } })}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
                          <SelectContent>
                            {["Camisetas","Calças","Vestidos","Saias","Blusas","Jaquetas","Shorts","Acessórios","Outros"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Preço de Custo</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={m.newProductData.cost_price} onChange={e => updateMatching(idx, { newProductData: { ...m.newProductData, cost_price: e.target.value } })} />
                      </div>
                      <div>
                        <Label className="text-xs">Preço de Venda</Label>
                        <Input className="h-8 text-xs" type="number" step="0.01" value={m.newProductData.sell_price} onChange={e => updateMatching(idx, { newProductData: { ...m.newProductData, sell_price: e.target.value } })} />
                      </div>
                    </div>
                  )}

                  {m.matchType === "skip" && (
                    <p className="text-xs text-muted-foreground italic">Este item será ignorado</p>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={proceedToStock} className="w-full">
              Próximo: Definir Estoque →
            </Button>
          </div>
        )}

        {/* STEP: STOCK */}
        {step === STEPS.STOCK && (
          <div className="space-y-4 mt-2">
            <p className="text-sm font-semibold">Definir grade de estoque para cada item</p>
            <div className="space-y-3">
              {stockEntries.map((entry, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-3">
                  <p className="text-sm font-medium">
                    {entry.isNew ? <span className="text-xs text-primary mr-1">[NOVO]</span> : null}
                    {entry.isNew ? entry.newProductData.name : entry.product_name}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Tamanho</Label>
                      <Select value={entry.size} onValueChange={v => updateStock(idx, { size: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Cor *</Label>
                      <Input className="h-8 text-xs" placeholder="Ex: Preto" value={entry.color} onChange={e => updateStock(idx, { color: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Quantidade</Label>
                      <Input className="h-8 text-xs" type="number" value={entry.quantity} onChange={e => updateStock(idx, { quantity: e.target.value })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={handleFinalize} className="w-full" disabled={loading || stockEntries.some(e => !e.color)}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Finalizar e Dar Entrada
            </Button>
          </div>
        )}

        {/* STEP: DONE */}
        {step === STEPS.DONE && (
          <div className="flex flex-col items-center gap-4 py-8">
            <CheckCircle className="h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold">Nota fiscal importada com sucesso!</p>
            <p className="text-sm text-muted-foreground text-center">Estoque atualizado, produtos criados e pagamento registrado.</p>
            <Button onClick={handleClose}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}