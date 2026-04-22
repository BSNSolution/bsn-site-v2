import { useState, useEffect, FormEvent } from 'react'
import { Save } from 'lucide-react'
import { homeExtrasApi } from '@/lib/api'

interface Band {
  id?: string
  eyebrow: string
  title: string
  ctaLabel: string
  ctaUrl: string
  mono: string
  isActive: boolean
}

const DEFAULT: Band = {
  eyebrow: 'FILOSOFIA',
  title: 'Software fácil de usar. <em>Difícil de ignorar.</em><br>Feito para durar tanto quanto sua empresa.',
  ctaLabel: 'Conversar com um especialista ↗',
  ctaUrl: '/contato',
  mono: 'Diagnóstico inicial gratuito · 45 min',
  isActive: true,
}

export default function AdminHomeBandPage() {
  const [form, setForm] = useState<Band>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await homeExtrasApi.admin.getBand()
      if (res.band) setForm(res.band)
    } catch { /* vazio */ } finally { setLoading(false) }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await homeExtrasApi.admin.saveBand(form)
      alert('Salvo com sucesso')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Seção "Filosofia" da home</h1>
        <p className="text-sm text-muted-foreground">Banda intermediária com frase da filosofia e CTA. Suporta tags HTML (&lt;em&gt;, &lt;br&gt;).</p>
      </div>

      <form onSubmit={submit} className="glass p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Eyebrow (ex: FILOSOFIA)</label>
          <input type="text" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Título (aceita HTML simples)</label>
          <textarea value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-sm" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Label do CTA</label>
            <input type="text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">URL do CTA</label>
            <input type="text" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Subtítulo mono (ao lado do CTA)</label>
          <input type="text" value={form.mono} onChange={(e) => setForm({ ...form, mono: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          Visível no site
        </label>
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
          <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
