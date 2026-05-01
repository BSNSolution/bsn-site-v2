import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import DragList from '@/components/admin/DragList'
import { toast } from 'sonner'

interface Perk {
  id: string
  title: string
  description: string
  isActive: boolean
  order: number
}

interface FormData {
  title: string
  description: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  isActive: true,
}

export default function AdminPerksPage() {
  const [items, setItems] = useState<Perk[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Perk | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load({ silent: false })
  }, [])

  // silent=true mantém a lista visível durante refetch pós-ação (preserva scroll)
  async function load({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await api.get('/admin/perks')
      setItems(res.data.perks ?? [])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(p: Perk) {
    setEditing(p)
    setForm({ title: p.title, description: p.description, isActive: p.isActive, order: p.order })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (editing) {
      await api.put(`/admin/perks/${editing.id}`, form)
    } else {
      await api.post('/admin/perks', form)
    }
    setShowForm(false)
    load()
  }

  async function remove(id: string) {
    if (!confirm('Remover este benefício?')) return
    await api.delete(`/admin/perks/${id}`)
    load()
  }

  async function toggle(id: string) {
    await api.patch(`/admin/perks/${id}/toggle`)
    load()
  }

  async function handleReorder(next: Perk[]) {
    setItems(next)
    try {
      await api.patch('/admin/perks/reorder', {
        items: next.map((p, idx) => ({ id: p.id, order: idx + 1 })),
      })
      toast.success('Ordem salva')
    } catch {
      toast.error('Erro ao salvar ordem')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Benefícios (Carreiras)</h1>
          <p className="text-sm text-muted-foreground">Gerencie os perks exibidos na página Carreiras.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo benefício
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <DragList items={items} getKey={(p) => p.id} onReorder={handleReorder} className="grid gap-3">
          {(p, handle) => (
            <div className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-4">
              {handle}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{p.title}</h3>
                  {!p.isActive && <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">Inativo</span>}
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(p.id)} className="p-2 hover:bg-muted rounded">
                  {p.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 hover:bg-muted rounded">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => remove(p.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </DragList>
      )}
      {!loading && items.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">Nenhum benefício cadastrado.</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar benefício' : 'Novo benefício'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-muted rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
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
