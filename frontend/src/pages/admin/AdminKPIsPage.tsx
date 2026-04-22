import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { api } from '@/lib/api'

interface KPI {
  id: string
  label: string
  value: string
  suffix?: string | null
  caption?: string | null
  isActive: boolean
  order: number
}

interface FormData {
  label: string
  value: string
  suffix?: string
  caption?: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = {
  label: '',
  value: '',
  suffix: '',
  caption: '',
  isActive: true,
}

export default function AdminKPIsPage() {
  const [items, setItems] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<KPI | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await api.get('/admin/kpis')
      setItems(res.data.kpis ?? [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(k: KPI) {
    setEditing(k)
    setForm({
      label: k.label,
      value: k.value,
      suffix: k.suffix ?? '',
      caption: k.caption ?? '',
      isActive: k.isActive,
      order: k.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      suffix: form.suffix || null,
      caption: form.caption || null,
    }
    if (editing) {
      await api.put(`/admin/kpis/${editing.id}`, payload)
    } else {
      await api.post('/admin/kpis', payload)
    }
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Remover este KPI?')) return
    await api.delete(`/admin/kpis/${id}`)
    load()
  }

  async function toggle(id: string) {
    await api.patch(`/admin/kpis/${id}/toggle`)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">KPIs da Home</h1>
          <p className="text-sm text-muted-foreground">Gerencie os números exibidos abaixo do hero na home.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo KPI
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {items.map((k) => (
            <div key={k.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs font-mono text-muted-foreground">{k.label}</div>
                  <div className="text-3xl font-medium mt-1">
                    {k.value}
                    {k.suffix && <span className="text-lg text-muted-foreground ml-1">{k.suffix}</span>}
                  </div>
                  {k.caption && <p className="text-sm text-muted-foreground mt-2">{k.caption}</p>}
                  {!k.isActive && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted">Inativo</span>}
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggle(k.id)} className="p-2 hover:bg-muted rounded">
                    {k.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(k)} className="p-2 hover:bg-muted rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(k.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground col-span-2">Nenhum KPI cadastrado.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar KPI' : 'Novo KPI'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Label (ex: EXPERIÊNCIA)</label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Valor (ex: 12)</label>
                  <input
                    type="text"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Sufixo (ex: +, /7)</label>
                  <input
                    type="text"
                    value={form.suffix ?? ''}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Legenda</label>
                <textarea
                  value={form.caption ?? ''}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ordem (opcional)</label>
                <input
                  type="number"
                  value={form.order ?? ''}
                  onChange={(e) => setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Ativo
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 hover:bg-muted rounded">
                  Cancelar
                </button>
                <button type="submit" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded">
                  <Save className="h-4 w-4" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
