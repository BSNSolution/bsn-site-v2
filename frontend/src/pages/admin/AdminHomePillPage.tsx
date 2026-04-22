import { useState, useEffect, FormEvent } from 'react'
import { Save } from 'lucide-react'
import { homeExtrasApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'

interface Pill {
  id?: string
  personName: string
  company: string
  quote: string
  avatarUrl: string
  isActive: boolean
}

const DEFAULT: Pill = {
  personName: 'Carolina Menezes',
  company: 'FinCo',
  quote: '"Ritmo de entrega 3× superior ao esperado."',
  avatarUrl: '',
  isActive: true,
}

export default function AdminHomePillPage() {
  const [form, setForm] = useState<Pill>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await homeExtrasApi.admin.getBrandPill()
      if (res.pill) setForm({ ...DEFAULT, ...res.pill, company: res.pill.company ?? '', avatarUrl: res.pill.avatarUrl ?? '' })
    } catch { /* vazio */ } finally { setLoading(false) }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await homeExtrasApi.admin.saveBrandPill({
        ...form,
        company: form.company || null,
        avatarUrl: form.avatarUrl || null,
      })
      alert('Salvo com sucesso')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">Card de depoimento da home</h1>
        <p className="text-sm text-muted-foreground">Cartão abaixo do "ao vivo" com nome, empresa e citação curta.</p>
      </div>

      <form onSubmit={submit} className="glass p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Nome</label>
          <input type="text" value={form.personName} onChange={(e) => setForm({ ...form, personName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Empresa</label>
          <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Citação</label>
          <textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">URL do avatar (opcional)</label>
          <input type="url" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
        </div>
        <Checkbox label="Visível no site" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
          <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
