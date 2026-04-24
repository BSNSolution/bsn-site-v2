import { useState, useEffect, FormEvent } from 'react'
import { Save, Plus, Trash2 } from 'lucide-react'
import { homeExtrasApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import Select from '@/components/admin/Select'

interface Row {
  label: string
  value: string
  highlight?: string | null
}

interface LiveCard {
  id?: string
  label: string
  title: string
  rows: Row[]
  isActive: boolean
}

const DEFAULT: LiveCard = {
  label: 'Ao vivo · operação 24/7',
  title: 'Monitoramos 32 projetos em produção agora mesmo.',
  rows: [
    { label: 'Uptime · ano', value: '99.97%', highlight: 'up' },
    { label: 'Deploys · semana', value: '147', highlight: null },
    { label: 'Tickets resolvidos', value: '↑ 12%', highlight: 'up' },
  ],
  isActive: true,
}

export default function AdminHomeLivePage() {
  const [form, setForm] = useState<LiveCard>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await homeExtrasApi.admin.getLiveCard()
      if (res.card) setForm(res.card)
    } catch { /* primeira vez, sem dado */ } finally {
      setLoading(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await homeExtrasApi.admin.saveLiveCard(form)
      alert('Salvo com sucesso')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function updateRow(idx: number, field: keyof Row, value: string) {
    const rows = [...form.rows]
    rows[idx] = { ...rows[idx], [field]: value }
    setForm({ ...form, rows })
  }

  function addRow() {
    setForm({ ...form, rows: [...form.rows, { label: '', value: '', highlight: null }] })
  }

  function removeRow(idx: number) {
    const rows = [...form.rows]
    rows.splice(idx, 1)
    setForm({ ...form, rows })
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Card "Ao vivo" da home</h1>
        <p className="text-sm text-muted-foreground">O card com ticker de métricas exibido no hero direito da home.</p>
      </div>

      <form onSubmit={submit} className="glass p-6 space-y-4">
        <div>
          <label className="text-xs text-muted-foreground">Eyebrow</label>
          <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Título</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground">Linhas do ticker</label>
            <button type="button" onClick={addRow} className="inline-flex items-center gap-1 text-xs px-2 py-1 hover:bg-white/10 rounded">
              <Plus className="h-3 w-3" /> adicionar
            </button>
          </div>
          <div className="space-y-2">
            {form.rows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input type="text" value={row.label} onChange={(e) => updateRow(idx, 'label', e.target.value)} placeholder="Label" className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded text-sm" />
                <input type="text" value={row.value} onChange={(e) => updateRow(idx, 'value', e.target.value)} placeholder="Valor" className="w-32 px-3 py-2 bg-black/40 border border-white/10 rounded text-sm" />
                <div className="w-32">
                  <Select
                    size="sm"
                    value={row.highlight ?? ''}
                    onChange={(v) => updateRow(idx, 'highlight', (v || null) as any)}
                    options={[
                      { value: '', label: '—' },
                      { value: 'up', label: 'up', color: '#10b981' },
                    ]}
                  />
                </div>
                <button type="button" onClick={() => removeRow(idx)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
        <Checkbox label="Visível no site" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
          <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
