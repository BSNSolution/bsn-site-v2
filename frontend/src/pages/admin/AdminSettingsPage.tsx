import { useState, useEffect, FormEvent } from 'react'
import { Save } from 'lucide-react'
import { settingsApi } from '@/lib/api'
import ImageInput from '@/components/admin/ImageInput'

interface Settings {
  siteName: string
  siteDescription: string
  logoUrl: string
  faviconUrl: string
  email: string
  phone: string
  address: string
  facebookUrl: string
  instagramUrl: string
  linkedinUrl: string
  twitterUrl: string
  youtubeUrl: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  maintenanceMode: boolean
  allowContactForm: boolean
}

const EMPTY: Settings = {
  siteName: 'BSN Solution',
  siteDescription: '',
  logoUrl: '',
  faviconUrl: '',
  email: '',
  phone: '',
  address: '',
  facebookUrl: '',
  instagramUrl: '',
  linkedinUrl: '',
  twitterUrl: '',
  youtubeUrl: '',
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  maintenanceMode: false,
  allowContactForm: true,
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Settings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await settingsApi.admin.getSettings()
      if (data) {
        setForm({
          ...EMPTY,
          ...data,
          siteDescription: data.siteDescription ?? '',
          logoUrl: data.logoUrl ?? '',
          faviconUrl: data.faviconUrl ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          address: data.address ?? '',
          facebookUrl: data.facebookUrl ?? '',
          instagramUrl: data.instagramUrl ?? '',
          linkedinUrl: data.linkedinUrl ?? '',
          twitterUrl: data.twitterUrl ?? '',
          youtubeUrl: data.youtubeUrl ?? '',
          metaTitle: data.metaTitle ?? '',
          metaDescription: data.metaDescription ?? '',
          metaKeywords: data.metaKeywords ?? '',
        })
      }
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  function setField<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = { ...form }
      // converter strings vazias em null pras URLs
      const urlKeys = ['logoUrl', 'faviconUrl', 'facebookUrl', 'instagramUrl', 'linkedinUrl', 'twitterUrl', 'youtubeUrl']
      urlKeys.forEach((k) => { if (!payload[k]) payload[k] = null })
      await settingsApi.admin.updateSettings(payload)
      alert('Configurações salvas!')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações do site</h1>
        <p className="text-sm text-muted-foreground">Informações gerais, contato, redes e SEO.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Section title="Identidade">
          <Field label="Nome do site"><input type="text" value={form.siteName} onChange={(e) => setField('siteName', e.target.value)} required className="input" /></Field>
          <Field label="Descrição"><textarea rows={2} value={form.siteDescription} onChange={(e) => setField('siteDescription', e.target.value)} className="input" /></Field>
          <ImageInput
            label="Logo"
            value={form.logoUrl}
            onChange={(url) => setField('logoUrl', url ?? '')}
          />
          <ImageInput
            label="Favicon"
            value={form.faviconUrl}
            onChange={(url) => setField('faviconUrl', url ?? '')}
            previewHeight={48}
          />
        </Section>

        <Section title="Contato">
          <div className="grid grid-cols-2 gap-3">
            <Field label="E-mail"><input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} className="input" /></Field>
            <Field label="Telefone"><input type="text" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="input" /></Field>
          </div>
          <Field label="Endereço"><input type="text" value={form.address} onChange={(e) => setField('address', e.target.value)} className="input" /></Field>
        </Section>

        <Section title="Redes sociais">
          <div className="grid grid-cols-2 gap-3">
            <Field label="LinkedIn"><input type="url" value={form.linkedinUrl} onChange={(e) => setField('linkedinUrl', e.target.value)} className="input" /></Field>
            <Field label="Instagram"><input type="url" value={form.instagramUrl} onChange={(e) => setField('instagramUrl', e.target.value)} className="input" /></Field>
            <Field label="Facebook"><input type="url" value={form.facebookUrl} onChange={(e) => setField('facebookUrl', e.target.value)} className="input" /></Field>
            <Field label="Twitter / X"><input type="url" value={form.twitterUrl} onChange={(e) => setField('twitterUrl', e.target.value)} className="input" /></Field>
            <Field label="YouTube"><input type="url" value={form.youtubeUrl} onChange={(e) => setField('youtubeUrl', e.target.value)} className="input" /></Field>
          </div>
        </Section>

        <Section title="SEO">
          <Field label="Meta title"><input type="text" value={form.metaTitle} onChange={(e) => setField('metaTitle', e.target.value)} className="input" /></Field>
          <Field label="Meta description"><textarea rows={2} value={form.metaDescription} onChange={(e) => setField('metaDescription', e.target.value)} className="input" /></Field>
          <Field label="Meta keywords"><input type="text" value={form.metaKeywords} onChange={(e) => setField('metaKeywords', e.target.value)} className="input" /></Field>
        </Section>

        <Section title="Flags">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setField('maintenanceMode', e.target.checked)} />
            Modo manutenção (esconde o site público)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allowContactForm} onChange={(e) => setField('allowContactForm', e.target.checked)} />
            Formulário de contato habilitado
          </label>
        </Section>
      </div>

      <div className="flex justify-end gap-2 sticky bottom-4">
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
          <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          background: rgba(0,0,0,0.4);
          border: 1px solid var(--line);
          border-radius: 10px;
          color: var(--ink);
          font-size: 14px;
          outline: none;
          transition: 0.2s;
        }
        .input:focus { border-color: rgba(122,91,255,0.6); }
      `}</style>
    </form>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5 space-y-3">
      <h2 className="text-base font-medium">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      {children}
    </div>
  )
}
