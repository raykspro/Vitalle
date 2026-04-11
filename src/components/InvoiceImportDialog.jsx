import { useState } from "react";
import { AlertCircle, FileText, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   suppliers?: any[],
 *   products?: any[],
 *   onSuccess?: () => void
 * }} props
 */
export default function InvoiceImportDialog({
  open,
  onOpenChange,
  suppliers = [],
  products = [],
  onSuccess,
}) {
  const [fileName, setFileName] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
  }

  function handleClose() {
    setFileName("");
    onOpenChange(false);
  }

  function handleConfirm() {
    if (typeof onSuccess === "function") {
      onSuccess();
    }
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar nota fiscal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Selecionar arquivo</p>
                <p className="text-sm text-muted-foreground">
                  XML, PDF ou imagem da nota fiscal
                </p>
              </div>
              <input
                type="file"
                accept=".xml,.pdf,image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {fileName ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
              <FileText className="h-4 w-4 text-primary" />
              <span className="truncate">{fileName}</span>
            </div>
          ) : null}

          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Importação automática indisponível localmente</p>
              <p className="text-amber-800">
                Fornecedores carregados: {suppliers.length} • Produtos carregados: {products.length}
              </p>
              <p className="text-amber-800">
                Use a opção de cadastro manual enquanto a rotina completa de importação não for restaurada.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
            <Button onClick={handleConfirm} disabled={!fileName}>
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}