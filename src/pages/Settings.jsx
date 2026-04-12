import { useState, useEffect } from "react";
import { cline } from "@/api/clineClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Save, Store } from "lucide-react";

/**
 * @typedef {object} SettingsForm
 * @property {string} store_name
 * @property {string} logo_url
 * @property {string} phone
 * @property {string} address
 * @property {string} instagram
 */

/**
 * @typedef {SettingsForm & { id: string | number }} StoreSettings
 */

export default function Settings() {
  const [settings, setSettings] = useState(/** @type {StoreSettings | null} */ (null));
  const [form, setForm] = useState(/** @type {SettingsForm} */ ({ store_name: "", logo_file: "", phone: "", address: "", instagram: "" }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    loadSettings(controller.signal);
    return () => controller.abort();
  }, []);

  async function loadSettings(signal) {
    const data = await cline.entities.Settings.list({ signal });
    if (data.length > 0) {
      const loadedSettings = /** @type {StoreSettings} */ (data[0]);
      setSettings(loadedSettings);
      setForm({
        store_name: loadedSettings.store_name || "",
         logo_file: loadedSettings.logo_file || "",
        phone: loadedSettings.phone || "",
        address: loadedSettings.address || "",
        instagram: loadedSettings.instagram || "",
      });
    }
    setLoading(false);
  }

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  async function handleLogoUpload(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploading(true);
     const { file_url } = await cline.integrations.Core.UploadFile({ file });
     setForm(prev => ({ ...prev, logo_file: file_url }));
    setUploading(false);
  }

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  function handleStoreNameChange(e) {
    setForm({ ...form, store_name: e.target.value });
  }

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  function handlePhoneChange(e) {
    const formattedPhone = e.target.value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/g, "($1) $2")
      .replace(/(\d)(\d{4})$/, "$1-$2");

    setForm({ ...form, phone: formattedPhone });
  }

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  function handleInstagramChange(e) {
    setForm({ ...form, instagram: e.target.value });
  }

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} e
   */
  function handleAddressChange(e) {
    setForm({ ...form, address: e.target.value });
  }

  async function handleSave() {
    setSaving(true);
    if (settings) {
      await cline.entities.Settings.update(String(settings.id), form);
    } else {
      const s = await cline.entities.Settings.create(form);
      setSettings(/** @type {StoreSettings} */ (s));
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
               {form.logo_file
                 ? <img src={form.logo_file} alt="Logo" className="h-full w-full object-cover rounded-xl" />
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
          <Input className="mt-1" value={form.store_name} onChange={handleStoreNameChange} placeholder="Ex: Boutique Ella" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Telefone</Label>
            <Input
              className="mt-1"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="(11) 99999-9999"
            />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input className="mt-1" value={form.instagram} onChange={handleInstagramChange} placeholder="@sujaloja" />
          </div>
        </div>
        <div>
          <Label>Endereço</Label>
          <Input className="mt-1" value={form.address} onChange={handleAddressChange} placeholder="Rua, número - Cidade/UF" />
        </div>

        <Button onClick={handleSave} className="w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}