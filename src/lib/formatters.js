export function formatCurrency(value) {
  if (value == null) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export function formatPhone(phone) {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// ===== DECIMAL PRECISION UTILS (CENTS as BigInt) =====
export function parsePriceToCents(priceStr) {
  const val = parseFloat(priceStr ?? '0') || 0;
  return BigInt(Math.round(val * 100));
}

export function formatPriceDisplay(cents) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(cents ?? 0n) / 100);
}

export function formatPriceInput(cents) {
  return (Number(cents ?? 0n) / 100).toFixed(2);
}

export function addCents(...values) {
  return values.reduce((acc, v) => acc + (typeof v === 'bigint' ? v : BigInt(v ?? 0)), 0n);
}

export function subtractCents(a, b) {
  return (typeof a === 'bigint' ? a : BigInt(a ?? 0)) - (typeof b === 'bigint' ? b : BigInt(b ?? 0));
}

export function percentOfCents(baseCents, percentStr) {
  const percent = parseFloat(percentStr ?? '0') / 100;
  return BigInt(Math.round(Number(baseCents) * percent));
}

