import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Loader2, Palette, Sun, Moon, Check, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cline } from "@/api/clineClient";
import jsPDF from "jspdf";

// All RGB values as [r,g,b] — NO opacity tricks to avoid jsPDF state leaks
const THEMES = [
  {
    id: "roxo", name: "Roxo Moderno", dark: false,
    preview: ["#7c3aed","#ede9fe","#f5f3ff"],
    header1: [80,28,155], header2: [105,45,195],
    headerText: [255,255,255], headerSubText: [210,190,255],
    pageBg: [250,248,255],
    cardBg: [255,255,255], cardBorder: [215,200,245], cardShadow: [195,178,235],
    stripe: [120,55,230],
    catBg: [235,228,252], catBorder: [190,170,248], catText: [75,25,175],
    chipBg: [120,55,230], chipText: [255,255,255],
    badgeBg: [242,238,254], badgeBorder: [190,170,248], badgeText: [100,40,200],
    nameText: [25,8,60], priceText: [100,40,200],
    sizesLabel: [140,110,195], footerBg: [238,232,252], footerText: [120,90,185],
    imgFrame: [240,235,255], placeholder: [185,165,240],
  },
  {
    id: "rosa", name: "Rosa Elegante", dark: false,
    preview: ["#be185d","#fce7f3","#fff0f7"],
    header1: [175,18,75], header2: [215,38,110],
    headerText: [255,255,255], headerSubText: [255,200,225],
    pageBg: [255,250,253],
    cardBg: [255,255,255], cardBorder: [248,195,225], cardShadow: [232,170,205],
    stripe: [215,38,110],
    catBg: [252,228,242], catBorder: [245,160,205], catText: [160,18,70],
    chipBg: [215,38,110], chipText: [255,255,255],
    badgeBg: [252,228,242], badgeBorder: [245,160,205], badgeText: [185,22,88],
    nameText: [55,8,30], priceText: [185,22,88],
    sizesLabel: [195,75,125], footerBg: [252,228,242], footerText: [175,55,105],
    imgFrame: [252,232,244], placeholder: [245,160,205],
  },
  {
    id: "azul", name: "Azul Profissional", dark: false,
    preview: ["#1d4ed8","#dbeafe","#eff6ff"],
    header1: [18,55,200], header2: [35,92,230],
    headerText: [255,255,255], headerSubText: [178,210,255],
    pageBg: [245,249,255],
    cardBg: [255,255,255], cardBorder: [175,210,252], cardShadow: [148,190,248],
    stripe: [35,92,230],
    catBg: [215,232,252], catBorder: [135,185,250], catText: [18,55,200],
    chipBg: [35,92,230], chipText: [255,255,255],
    badgeBg: [215,232,252], badgeBorder: [135,185,250], badgeText: [25,72,210],
    nameText: [8,22,75], priceText: [25,72,210],
    sizesLabel: [65,105,195], footerBg: [215,232,252], footerText: [35,80,195],
    imgFrame: [218,235,253], placeholder: [135,185,250],
  },
  {
    id: "verde", name: "Verde Natural", dark: false,
    preview: ["#047857","#d1fae5","#f0fdf4"],
    header1: [3,95,65], header2: [6,140,95],
    headerText: [255,255,255], headerSubText: [155,238,200],
    pageBg: [245,255,250],
    cardBg: [255,255,255], cardBorder: [155,230,195], cardShadow: [125,210,170],
    stripe: [6,140,95],
    catBg: [205,248,226], catBorder: [95,220,170], catText: [3,90,58],
    chipBg: [6,140,95], chipText: [255,255,255],
    badgeBg: [205,248,226], badgeBorder: [95,220,170], badgeText: [3,115,80],
    nameText: [6,42,26], priceText: [3,115,80],
    sizesLabel: [45,148,95], footerBg: [205,248,226], footerText: [3,95,65],
    imgFrame: [208,250,228], placeholder: [95,220,170],
  },
  {
    id: "dark", name: "Dark Premium", dark: true,
    preview: ["#4c1d95","#312e81","#0f0a28"],
    header1: [10,6,32], header2: [22,15,60],
    headerText: [205,188,255], headerSubText: [135,115,205],
    pageBg: [14,10,38],
    cardBg: [20,15,50], cardBorder: [52,42,108], cardShadow: [8,5,20],
    stripe: [95,55,205],
    catBg: [26,20,65], catBorder: [65,50,135], catText: [170,148,252],
    chipBg: [95,55,205], chipText: [238,228,255],
    badgeBg: [32,25,78], badgeBorder: [75,58,155], badgeText: [170,148,252],
    nameText: [225,215,252], priceText: [172,138,255],
    sizesLabel: [135,112,198], footerBg: [10,6,32], footerText: [115,95,185],
    imgFrame: [26,20,65], placeholder: [65,50,130],
  },
  {
    id: "dourado", name: "Dourado Luxo", dark: true,
    preview: ["#92400e","#fbbf24","#1c1008"],
    header1: [16,10,2], header2: [32,20,5],
    headerText: [248,188,35], headerSubText: [195,150,38],
    pageBg: [18,12,3],
    cardBg: [24,15,4], cardBorder: [108,78,16], cardShadow: [10,6,1],
    stripe: [175,125,18],
    catBg: [32,22,5], catBorder: [135,98,16], catText: [242,182,32],
    chipBg: [175,125,18], chipText: [18,10,1],
    badgeBg: [32,22,5], badgeBorder: [135,98,16], badgeText: [242,182,32],
    nameText: [238,212,168], priceText: [242,182,32],
    sizesLabel: [185,145,48], footerBg: [12,8,1], footerText: [165,125,32],
    imgFrame: [32,22,5], placeholder: [115,82,16],
  },
];

function r(...c) { return c; } // helper: returns array as-is

export default function CatalogExport({ stockItems, products }) {
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("roxo");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    cline.entities.Settings.list().then(data => { if (data.length > 0) setSettings(data[0]); });
  }, [open]);

  async function exportCatalog() {
    setLoading(true);
    const T = THEMES.find(t => t.id === selectedTheme) || THEMES[0];

    // Group by category
    const byCategory = {};
    stockItems.forEach(item => {
      if ((item.quantity || 0) <= 0) return;
      const prod = products.find(p => p.name === item.product_name);
      const cat = prod?.category || "Outros";
      if (!byCategory[cat]) byCategory[cat] = {};
      const key = `${item.product_name}__${item.color}`;
      if (!byCategory[cat][key]) {
        byCategory[cat][key] = {
          name: item.product_name, color: item.color,
          image_url: prod?.image_url || "",
          sell_price: prod?.sell_price || 0,
          sizes: [],
        };
      }
      byCategory[cat][key].sizes.push(item.size);
    });

    const allItems = Object.values(byCategory).flatMap(c => Object.values(c));
    if (allItems.length === 0) {
      alert("Nenhum item com estoque disponível.");
      setLoading(false);
      return;
    }

    const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const W = 210, H = 297, ML = 12, MR = 12;
    const storeName = settings?.store_name || "Catalogo";

    // Pre-load logo
    let logoData = null;
    if (settings?.logo_url) {
      try { logoData = await loadImg(settings.logo_url); } catch {}
    }

    const months = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const now = new Date();
    const dateStr = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;

    function fill(c) { pdf.setFillColor(c[0], c[1], c[2]); }
    function stroke(c) { pdf.setDrawColor(c[0], c[1], c[2]); }
    function textColor(c) { pdf.setTextColor(c[0], c[1], c[2]); }

    function drawHeader() {
      // Header band
      fill(T.header1); pdf.rect(0, 0, W, 13, "F");
      fill(T.header2); pdf.rect(0, 13, W, 13, "F");

      // Logo circle
      fill([255,255,255]); pdf.circle(19, 13, 9, "F");
      if (logoData) {
        pdf.addImage(logoData, "JPEG", 11, 5, 16, 16);
      } else {
        textColor(T.header1);
        pdf.setFontSize(10); pdf.setFont("helvetica","bold");
        pdf.text(storeName.charAt(0).toUpperCase(), 19, 17, { align: "center" });
      }

      // Store name
      textColor(T.headerText);
      pdf.setFontSize(15); pdf.setFont("helvetica","bold");
      pdf.text(storeName, 32, 11);

      // Subtitle
      textColor(T.headerSubText);
      pdf.setFontSize(7); pdf.setFont("helvetica","normal");
      pdf.text("Catalogo de Produtos  —  Itens disponíveis em estoque", 32, 20);

      // Date pill (right side) — simple bordered box, no opacity
      const dW = 55, dH = 7, dX = W - MR - dW, dY = 10;
      stroke(T.headerSubText); pdf.setLineWidth(0.3);
      pdf.roundedRect(dX, dY, dW, dH, 2, 2, "D");
      textColor(T.headerText);
      pdf.setFontSize(7); pdf.setFont("helvetica","bold");
      pdf.text(dateStr, dX + dW/2, dY + 4.8, { align: "center" });

      // Bottom border
      stroke(T.headerSubText); pdf.setLineWidth(0.15);
      pdf.line(0, 26, W, 26);
    }

    function drawFooter(pg) {
      fill(T.footerBg); pdf.rect(0, H - 10, W, 10, "F");
      stroke(T.catBorder); pdf.setLineWidth(0.15);
      pdf.line(ML, H - 10, W - MR, H - 10);
      textColor(T.footerText);
      pdf.setFontSize(7); pdf.setFont("helvetica","normal");
      pdf.text(`${allItems.length} produto(s) disponível(eis)`, ML, H - 3.5);
      if (settings?.instagram) pdf.text(settings.instagram, W/2, H - 3.5, { align: "center" });
      pdf.text(`Pagina ${pg}`, W - MR, H - 3.5, { align: "right" });
    }

    function drawCategoryHeader(label, y) {
      fill(T.catBg); stroke(T.catBorder); pdf.setLineWidth(0.3);
      pdf.roundedRect(ML, y, W - ML - MR, 10, 3, 3, "FD");
      // Accent bar
      fill(T.stripe);
      pdf.roundedRect(ML, y, 4, 10, 2, 2, "F");
      pdf.rect(ML + 2, y, 2, 10, "F");
      // Label
      textColor(T.catText);
      pdf.setFontSize(8.5); pdf.setFont("helvetica","bold");
      pdf.text(label.toUpperCase(), ML + 9, y + 7);
    }

    const CW = (W - ML - MR - 8) / 2;
    const CH = 68;
    const colX = [ML, ML + CW + 8];

    async function drawCard(item, cx, cy) {
      // Shadow
      fill(T.cardShadow);
      pdf.roundedRect(cx + 1.2, cy + 1.5, CW, CH, 4, 4, "F");
      // Card
      fill(T.cardBg); stroke(T.cardBorder); pdf.setLineWidth(0.35);
      pdf.roundedRect(cx, cy, CW, CH, 4, 4, "FD");
      // Stripe
      fill(T.stripe);
      pdf.roundedRect(cx, cy, 3.5, CH, 3, 3, "F");
      pdf.rect(cx + 1.5, cy, 2, CH, "F");

      // Image
      const IS = 46, IX = cx + 8, IY = cy + (CH - IS) / 2;
      fill(T.imgFrame);
      pdf.roundedRect(IX - 1, IY - 1, IS + 2, IS + 2, 3, 3, "F");
      if (item.image_url) {
        try {
          const id = await loadImg(item.image_url);
          pdf.addImage(id, "JPEG", IX, IY, IS, IS);
          stroke(T.cardBorder); pdf.setLineWidth(0.15);
          pdf.roundedRect(IX, IY, IS, IS, 2, 2, "D");
        } catch { drawPlaceholder(pdf, IX, IY, IS, T, fill, stroke); }
      } else {
        drawPlaceholder(pdf, IX, IY, IS, T, fill, stroke);
      }

      // Text
      const TX = cx + IS + 13, TW = CW - IS - 17;
      let ty = cy + 11;

      // Name
      textColor(T.nameText);
      pdf.setFontSize(9.5); pdf.setFont("helvetica","bold");
      const nl = pdf.splitTextToSize(item.name, TW);
      pdf.text(nl.slice(0, 2), TX, ty);
      ty += nl.slice(0, 2).length * 5.5 + 1;

      // Color badge
      if (item.color) {
        const bw = Math.min(pdf.getTextWidth(item.color) + 6, TW);
        fill(T.badgeBg); stroke(T.badgeBorder); pdf.setLineWidth(0.25);
        pdf.roundedRect(TX, ty, bw, 5.5, 2, 2, "FD");
        textColor(T.badgeText);
        pdf.setFontSize(6.5); pdf.setFont("helvetica","normal");
        pdf.text(item.color, TX + 3, ty + 4);
        ty += 8;
      }

      // Sizes label
      textColor(T.sizesLabel);
      pdf.setFontSize(6); pdf.setFont("helvetica","bold");
      pdf.text("TAMANHOS:", TX, ty);
      ty += 3.5;

      let chipX = TX;
      const uniq = [...new Set(item.sizes)];
      uniq.forEach(sz => {
        const cw2 = pdf.getTextWidth(sz) * 1.05 + 5;
        if (chipX + cw2 > TX + TW) { chipX = TX; ty += 7; }
        fill(T.chipBg); pdf.roundedRect(chipX, ty, cw2, 5.5, 1.5, 1.5, "F");
        textColor(T.chipText);
        pdf.setFontSize(6); pdf.setFont("helvetica","bold");
        pdf.text(sz, chipX + 2.5, ty + 4);
        chipX += cw2 + 2;
      });

      // Price
      if (item.sell_price) {
        const ps = `R$ ${Number(item.sell_price).toFixed(2).replace(".", ",")}`;
        textColor(T.priceText);
        pdf.setFontSize(11); pdf.setFont("helvetica","bold");
        pdf.text(ps, TX, cy + CH - 8);
      }
    }

    let col = 0, y = 30, page = 1;
    drawHeader();

    for (const [cat, catObj] of Object.entries(byCategory)) {
      const citems = Object.values(catObj);
      if (col > 0) { col = 0; y += CH + 6; }
      if (y + 14 > H - 12) {
        drawFooter(page++); pdf.addPage(); drawHeader(); y = 30;
      }
      drawCategoryHeader(cat, y);
      y += 14; col = 0;

      for (const item of citems) {
        if (col === 0 && y + CH > H - 12) {
          drawFooter(page++); pdf.addPage(); drawHeader(); y = 30;
        }
        await drawCard(item, colX[col], y);
        col++;
        if (col >= 2) { col = 0; y += CH + 6; }
      }
      if (col > 0) { col = 0; y += CH + 6; }
      y += 3;
    }

    drawFooter(page);
    pdf.save("catalogo-produtos.pdf");
    setLoading(false);
    setOpen(false);
  }

  const activeTheme = THEMES.find(t => t.id === selectedTheme);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <BookOpen className="h-4 w-4" /> Exportar Catálogo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Tema do Catálogo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {settings?.store_name ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
                {settings.logo_url
                  ? <img src={settings.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />
                  : <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">{settings.store_name.charAt(0)}</div>
                }
                <div>
                  <p className="text-sm font-semibold">{settings.store_name}</p>
                  <p className="text-xs text-muted-foreground">Sera exibido no cabecalho do catalogo</p>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-sm text-orange-700">
                Configure o nome e logo em <strong>Configuracoes</strong> para aparecer no catalogo.
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-2"><Sun className="h-3.5 w-3.5" /> TEMAS CLAROS</p>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.filter(t => !t.dark).map(t => <ThemeCard key={t.id} theme={t} selected={selectedTheme === t.id} onSelect={() => setSelectedTheme(t.id)} />)}
              </div>
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mt-4 mb-2"><Moon className="h-3.5 w-3.5" /> TEMAS ESCUROS</p>
              <div className="grid grid-cols-2 gap-3">
                {THEMES.filter(t => t.dark).map(t => <ThemeCard key={t.id} theme={t} selected={selectedTheme === t.id} onSelect={() => setSelectedTheme(t.id)} />)}
              </div>
            </div>

            {activeTheme && <ThemePreview theme={activeTheme} settings={settings} />}

            <Button onClick={exportCatalog} className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando PDF...</> : <><Download className="h-4 w-4" /> Exportar Catálogo PDF</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ThemeCard({ theme: T, selected, onSelect }) {
  return (
    <button onClick={onSelect} className="relative rounded-2xl p-3.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] border-2"
      style={{
        background: T.dark ? `rgb(${T.cardBg.join(",")})` : "#fff",
        borderColor: selected ? `rgb(${T.stripe.join(",")})` : `rgb(${T.cardBorder.join(",")})`,
        boxShadow: selected ? `0 0 0 3px rgba(${T.stripe.join(",")},0.2)` : "none",
      }}>
      {selected && (
        <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full flex items-center justify-center" style={{ background: `rgb(${T.stripe.join(",")})` }}>
          <Check className="h-3 w-3 text-white" />
        </div>
      )}
      <div className="flex gap-1 mb-3 h-3 rounded-full overflow-hidden">
        {T.preview.map((c, i) => <div key={i} className="flex-1" style={{ background: c }} />)}
      </div>
      <div className="rounded-lg p-2 mb-2" style={{ background: `rgb(${T.header1.join(",")})` }}>
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded-full bg-white/90" />
          <div className="h-1.5 rounded w-20" style={{ background: `rgba(${T.headerText.join(",")},0.8)` }} />
        </div>
      </div>
      <div className="rounded-lg p-2 border" style={{ background: `rgb(${T.cardBg.join(",")})`, borderColor: `rgb(${T.cardBorder.join(",")})` }}>
        <div className="flex gap-1.5">
          <div className="h-8 w-8 rounded" style={{ background: `rgb(${T.imgFrame.join(",")})` }} />
          <div className="flex-1 space-y-1.5 pt-0.5">
            <div className="h-1.5 rounded w-4/5" style={{ background: `rgba(${T.nameText.join(",")},0.75)` }} />
            <div className="flex gap-1">
              {["P","M","G"].map(s => <span key={s} className="px-1 rounded text-[7px] font-bold" style={{ background: `rgb(${T.chipBg.join(",")})`, color: `rgb(${T.chipText.join(",")})` }}>{s}</span>)}
            </div>
            <div className="h-2 rounded w-1/2" style={{ background: `rgba(${T.priceText.join(",")},0.85)` }} />
          </div>
        </div>
      </div>
      <p className="text-xs font-bold mt-2.5" style={{ color: `rgb(${T.nameText.join(",")})` }}>{T.name}</p>
    </button>
  );
}

function ThemePreview({ theme: T, settings }) {
  const months = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const now = new Date();
  const dateStr = `${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`;
  const storeName = settings?.store_name || "Nome da Loja";
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-2">PRÉVIA DO TEMA</p>
      <div className="rounded-2xl overflow-hidden border border-border shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(180deg, rgb(${T.header1.join(",")}) 50%, rgb(${T.header2.join(",")}) 100%)` }}>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
              {settings?.logo_url
                ? <img src={settings.logo_url} alt="" className="h-full w-full object-cover" />
                : <span className="font-bold text-sm" style={{ color: `rgb(${T.header1.join(",")})` }}>{storeName.charAt(0)}</span>
              }
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: `rgb(${T.headerText.join(",")})` }}>{storeName}</p>
              <p className="text-[9px]" style={{ color: `rgb(${T.headerSubText.join(",")})` }}>Catalogo de Produtos</p>
            </div>
          </div>
          <div className="rounded px-2.5 py-1 border text-[9px] font-semibold"
            style={{ borderColor: `rgba(${T.headerSubText.join(",")},0.5)`, color: `rgb(${T.headerText.join(",")})` }}>
            {dateStr}
          </div>
        </div>
        <div className="px-3 pt-2 pb-1" style={{ background: `rgb(${T.pageBg.join(",")})` }}>
          <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 mb-2 border"
            style={{ background: `rgb(${T.catBg.join(",")})`, borderColor: `rgb(${T.catBorder.join(",")})` }}>
            <div className="h-4 w-1.5 rounded-full" style={{ background: `rgb(${T.stripe.join(",")})` }} />
            <span className="text-[9px] font-black tracking-wider" style={{ color: `rgb(${T.catText.join(",")})` }}>CAMISETAS</span>
          </div>
          <div className="rounded-xl p-2.5 border mb-2"
            style={{ background: `rgb(${T.cardBg.join(",")})`, borderColor: `rgb(${T.cardBorder.join(",")})` }}>
            <div className="flex gap-2.5">
              <div className="h-12 w-12 rounded-lg flex-shrink-0" style={{ background: `rgb(${T.imgFrame.join(",")})` }} />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-2 rounded w-3/4" style={{ background: `rgba(${T.nameText.join(",")},0.75)` }} />
                <div className="inline-flex px-2 py-0.5 rounded text-[8px] border"
                  style={{ background: `rgb(${T.badgeBg.join(",")})`, color: `rgb(${T.badgeText.join(",")})`, borderColor: `rgb(${T.badgeBorder.join(",")})` }}>Preto</div>
                <div className="flex gap-1 mt-0.5">
                  {["P","M","G","GG"].map(s => (
                    <span key={s} className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                      style={{ background: `rgb(${T.chipBg.join(",")})`, color: `rgb(${T.chipText.join(",")})` }}>{s}</span>
                  ))}
                </div>
                <p className="text-sm font-black" style={{ color: `rgb(${T.priceText.join(",")})` }}>R$ 89,90</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-4 py-1.5 flex justify-between" style={{ background: `rgb(${T.footerBg.join(",")})` }}>
          <span className="text-[9px]" style={{ color: `rgb(${T.footerText.join(",")})` }}>6 produtos disponíveis</span>
          <span className="text-[9px]" style={{ color: `rgb(${T.footerText.join(",")})` }}>Pagina 1</span>
        </div>
      </div>
    </div>
  );
}

function drawPlaceholder(pdf, x, y, s, T, fill, stroke) {
  fill(T.imgFrame); pdf.roundedRect(x, y, s, s, 3, 3, "F");
  stroke(T.placeholder); pdf.setLineWidth(0.8);
  const cx = x + s/2, cy = y + s/2;
  // Simple shirt outline
  pdf.line(cx-6,cy-8,cx-10,cy-4); pdf.line(cx+6,cy-8,cx+10,cy-4);
  pdf.line(cx-10,cy-4,cx-8,cy+8); pdf.line(cx+10,cy-4,cx+8,cy+8);
  pdf.line(cx-8,cy+8,cx+8,cy+8);
  pdf.line(cx-6,cy-8,cx-3,cy-3); pdf.line(cx+6,cy-8,cx+3,cy-3);
  pdf.line(cx-3,cy-3,cx+3,cy-3);
}

function loadImg(url) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      res(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = rej;
    img.src = url;
  });
}