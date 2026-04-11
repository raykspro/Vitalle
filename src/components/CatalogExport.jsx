import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @typedef {object} StockItem
 * @property {string} [product_id]
 * @property {string} [product_name]
 * @property {string} [size]
 * @property {string} [color]
 * @property {number} [quantity]
 */

/**
 * @typedef {object} Product
 * @property {string} [id]
 * @property {string} [name]
 * @property {number} [sell_price]
 * @property {number} [cost_price]
 * @property {string} [category]
 * @property {string} [brand]
 * @property {string} [sku]
 */

/**
 * @param {{
 *   stockItems?: StockItem[],
 *   products?: Product[]
 * }} props
 */
export default function CatalogExport({
  stockItems = [],
  products = [],
}) {
  function escapeCsv(value) {
    const text = String(value ?? "");
    if (text.includes('"') || text.includes(",") || text.includes("\n")) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function handleExport() {
    const productMap = new Map(products.map((product) => [product.id, product]));

    const rows = stockItems.map((item) => {
      const product = productMap.get(item.product_id);

      return {
        produto: item.product_name || product?.name || "",
        categoria: product?.category || "",
        marca: product?.brand || "",
        sku: product?.sku || "",
        tamanho: item.size || "",
        cor: item.color || "",
        quantidade: Number(item.quantity) || 0,
        preco_custo: Number(product?.cost_price) || 0,
        preco_venda: Number(product?.sell_price) || 0,
      };
    });

    const headers = [
      "produto",
      "categoria",
      "marca",
      "sku",
      "tamanho",
      "cor",
      "quantidade",
      "preco_custo",
      "preco_venda",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "catalogo-estoque.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Exportar Catálogo
    </Button>
  );
}