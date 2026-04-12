import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Search, ArrowDownCircle, ArrowUpCircle, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "../components/EmptyState";

function formatDateTime(dt) {
  if (!dt) return "-";
  return new Date(dt).toLocaleString("pt-BR");
}

export default function StockHistory() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      cline.entities.StockMovement.list("-movement_date", 500, { signal: controller.signal }).catch((error) => {
        console.error("Erro ao carregar movimentos de estoque:", error);
        return [];
      }),
      cline.entities.Product.list("-created_date", 200, { signal: controller.signal }).catch((error) => {
        console.error("Erro ao carregar produtos:", error);
        return [];
      }),
    ]).then(([movs, prods]) => {
      setMovements(movs || []);
      const map = {};
      (prods || []).forEach((p) => { map[p.id] = p; });
      setProducts(map);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = movements.filter((m) => {
    const matchSearch =
      m.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.color?.toLowerCase().includes(search.toLowerCase()) ||
      m.size?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "Todos" || m.type === "Entrada" || m.reference_type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por produto, cor, tamanho..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Entrada">Entradas</SelectItem>
            <SelectItem value="Saída">Saídas</SelectItem>
            <SelectItem value="Venda">Vendas</SelectItem>
            <SelectItem value="Nota Fiscal">Notas Fiscais</SelectItem>
            <SelectItem value="Ajuste Manual">Ajustes Manuais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum movimento"
          description="Os movimentos de entrada e saída do estoque aparecerão aqui"
        />
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="text-left p-3 font-medium">Tipo</th>
                  <th className="text-left p-3 font-medium">Produto</th>
                  <th className="text-left p-3 font-medium hidden sm:table-cell">Tam/Cor</th>
                  <th className="text-center p-3 font-medium">Qtd</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Valor Venda</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Custo na Época</th>
                  <th className="text-left p-3 font-medium hidden md:table-cell">Origem</th>
                  <th className="text-left p-3 font-medium">Data/Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {m.type === "Entrada" ? (
                          <ArrowDownCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={m.type === "Entrada" ? "text-green-700 font-medium" : "text-red-600 font-medium"}>
                          {m.type}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {products[m.product_id]?.image_url ? (
                          <img src={products[m.product_id].image_url} alt={m.product_name} className="h-8 w-8 rounded-md object-cover border border-border flex-shrink-0" />
                        ) : null}
                        <span className="font-medium">{m.product_name}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell text-muted-foreground">
                      {m.size && m.color ? `${m.size} / ${m.color}` : m.size || m.color || "-"}
                    </td>
                    <td className="p-3 text-center font-semibold">{m.quantity}</td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {products[m.product_id]?.sell_price
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(products[m.product_id].sell_price)
                        : "-"}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">
                      {m.unit_cost
                        ? <span className="text-orange-600 font-medium">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(m.unit_cost)}</span>
                        : products[m.product_id]?.cost_price
                          ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(products[m.product_id].cost_price)
                          : "-"}
                    </td>
                    <td className="p-3 hidden md:table-cell text-muted-foreground">{m.reference_type || "-"}</td>
                    <td className="p-3 text-muted-foreground">{formatDateTime(m.movement_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}