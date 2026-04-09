import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Save, Store } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ store_name: "", logo_url: "", phone: "", address: "", instagram: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  async function loadSettings() {
    const data = await base44.entities.Settings.list();
    if (data.length > 0) {
      setSettings(data[0]);
      setForm({
        store_name: data[0].store_name || "",
        logo_url: data[0].logo_url || "",
        phone: data[0].phone || "",
        address: data[0].address || "",
        instagram: data[0].instagram || "",
      });
    }
    setLoading(false);
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, logo_url: file_url }));
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    if (settings) {
      await base44.entities.Settings.update(settings.id, form);
    } else {
      const s = await base44.entities.Settings.create(form);
      setSettings(s);
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-card rounded-xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Dados da Loja</h2>
            <p className="text-xs text-muted-foreground">Aparecem no catálogo e documentos</p>
          </div>
        </div>

        {/* Logo */}
        <div>
          <Label>Logo da Loja</Label>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden">
              {form.logo_url
                ? <img src={form.logo_url} alt="Logo" className="h-full w-full object-cover rounded-xl" />
                : <Store className="h-8 w-8 text-muted-foreground" />
              }
            </div>
            <label className="cursor-pointer">
              <Button asChild variant="outline" size="sm" disabled={uploading}>
                <span>{uploading ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Enviando...</> : <><Camera className="h-4 w-4 mr-1" />Upload Logo</>}</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </label>
          </div>
        </div>

        <div>
          <Label>Nome da Loja *</Label>
          <Input className="mt-1" value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} placeholder="Ex: Boutique Ella" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Telefone</Label>
            <Input className="mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input className="mt-1" value={form.instagram} onChange={e => setForm({ ...form, instagram: e.target.value })} placeholder="@sujaloja" />
          </div>
        </div>
        <div>
          <Label>Endereço</Label>
          <Input className="mt-1" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rua, número - Cidade/UF" />
        </div>

        <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}