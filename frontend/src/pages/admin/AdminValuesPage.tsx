import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'

interface Value {
  id: string
  number: string
  title: string
  description: string
  isActive: boolean
  order: number
}

interface FormData {
  number: string
  title: string
  description: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = {
  number: '',
  title: '',
  description: '',
  isActive: true,
}

export default function AdminValuesPage() {
  const [values, setValues] = useState<Value[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Value | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await api.get('/admin/values')
      setValues(res.data.values ?? [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(v: Value) {
    setEditing(v)
    setForm({
      number: v.number,
      title: v.title,
      description: v.description,
      isActive: v.isActive,
      order: v.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (editing) {
      await api.put(`/admin/values/${editing.id}`, form)
    } else {
      await api.post('/admin/values', form)
    }
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Remover este valor?')) return
    await api.delete(`/admin/values/${id}`)
    load()
  }

  async function toggle(id: string) {
    await api.patch(`/admin/values/${id}/toggle`)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Valores / Princípios</h1>
          <p className="text-sm text-muted-foreground">Gerencie os 4 princípios exibidos na página Sobre.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo valor
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {values.map((v) => (
            <div key={v.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{v.number}</span>
                  <h3 className="font-medium">{v.title}</h3>
                  {!v.isActive && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Inativo</span>}
                </div>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(v.id)} className="p-2 hover:bg-muted rounded" title={v.isActive ? 'Desativar' : 'Ativar'}>
                  {v.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(v)} className="p-2 hover:bg-muted rounded" title="Editar">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => remove(v.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded" title="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {values.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum valor cadastrado.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar valor' : 'Novo valor'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Número (ex: 01)</label>
                <input
                  type="text"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                  required
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
              <Checkbox label="Ativo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
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
