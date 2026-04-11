import { useEffect, useState } from "react";
import { cline } from "@/api/clineClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   suppliers?: any[],
 *   products?: any[],
 *   onSuccess?: () => void
 * }} props
 */
export default function ManualInvoiceDialog({
  open,
  onOpenChange,
  suppliers = [],
  products = [],
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    number: "",
    supplier_id: "",
    supplier_name: "",
    total_amount: "",
    issue_date: "",
    due_date: "",
    notes: "",
    items: [],
  });

  useEffect(() => {
    if (!open) {
      setForm({
        number: "",
        supplier_id: "",
        supplier_name: "",
        total_amount: "",
        issue_date: "",
        due_date: "",
        notes: "",
        items: [],
      });
    }
  }, [open]);

  async function handleSave() {
    if (!form.number.trim()) return;

    setLoading(true);
    try {
      const supplier = suppliers.find((item) => item.id === form.supplier_id);

      const invoiceData = {
        number: form.number.trim(),
        supplier_id: form.supplier_id || "",
        supplier_name: supplier?.name || form.supplier_name || "",
        items: form.items,
        total_amount: Number(form.total_amount) || 0,
        issue_date: form.issue_date
          ? new Date(form.issue_date).toISOString()
          : new Date().toISOString(),
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        status: "Pendente",
        notes: form.notes || "",
      };

      await cline.entities.Invoice.create(invoiceData);

      if (invoiceData.due_date && invoiceData.total_amount > 0) {
        await cline.entities.Payment.create({
          type: "A Pagar",
          reference_type: "Nota Fiscal",
          person_name: invoiceData.supplier_name,
          amount: invoiceData.total_amount,
          due_date: invoiceData.due_date,
          status: "Pendente",
        });
      }

      if (typeof onSuccess === "function") {
        onSuccess();
      }

      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova NF Manual</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Número da NF *</Label>
              <Input
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
            </div>

            <div>
              <Label>Fornecedor</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(value) => {
                  const supplier = suppliers.find((item) => item.id === value);
                  setForm({
                    ...form,
                    supplier_id: value,
                    supplier_name: supplier?.name || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de Emissão</Label>
              <Input
                type="date"
                value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              />
            </div>

            <div>
              <Label>Vencimento</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          {!suppliers.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum fornecedor carregado no momento.
            </p>
          ) : null}

          <div>
            <Label>Valor Total</Label>
            <Input
              type="number"
              step="0.01"
              value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
              placeholder="0,00"
            />
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm text-muted-foreground">
            Produtos carregados: {products.length}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading || !form.number.trim()}>
              {loading ? "Salvando..." : "Salvar NF"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}