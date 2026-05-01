import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { processStepsApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import DragList from '@/components/admin/DragList'
import { toast } from 'sonner'

interface Step {
  id: string
  number: string
  title: string
  description: string
  duration?: string | null
  isActive: boolean
  order: number
}

interface FormData {
  number: string
  title: string
  description: string
  duration?: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = {
  number: '',
  title: '',
  description: '',
  duration: '',
  isActive: true,
}

export default function AdminHomeTimelinePage() {
  const [items, setItems] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Step | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => { load({ silent: false }) }, [])

  async function load({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await processStepsApi.admin.list()
      setItems(res.steps ?? [])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, number: String(items.length + 1).padStart(2, '0') })
    setShowForm(true)
  }

  function openEdit(step: Step) {
    setEditing(step)
    setForm({
      number: step.number,
      title: step.title,
      description: step.description,
      duration: step.duration ?? '',
      isActive: step.isActive,
      order: step.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      duration: form.duration?.trim() ? form.duration : null,
    }
    try {
      if (editing) {
        await processStepsApi.admin.update(editing.id, payload)
        toast.success('Etapa atualizada')
      } else {
        await processStepsApi.admin.create(payload)
        toast.success('Etapa criada')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover esta etapa?')) return
    try {
      await processStepsApi.admin.remove(id)
      toast.success('Etapa removida')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao remover')
    }
  }

  async function toggle(id: string) {
    try {
      await processStepsApi.admin.toggle(id)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro')
    }
  }

  async function handleReorder(next: Step[]) {
    setItems(next)
    try {
      await processStepsApi.admin.reorder(
        next.map((s, idx) => ({ id: s.id, order: idx + 1 })),
      )
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
          <h1 className="text-2xl font-semibold">Timeline da home (ritmo de trabalho)</h1>
          <p className="text-sm text-muted-foreground">
            Etapas do processo exibidas na seção "Como trabalhamos" da home. Arraste para reordenar.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nova etapa
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">Nenhuma etapa cadastrada.</div>
      ) : (
        <DragList items={items} getKey={(s) => s.id} onReorder={handleReorder} className="grid gap-3">
          {(step, handle) => (
            <div className="glass p-4">
              <div className="flex items-start gap-4">
                {handle}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl font-mono text-muted-foreground shrink-0">{step.number}</span>
                    <h3 className="font-medium">{step.title}</h3>
                    {step.duration && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10">
                        {step.duration}
                      </span>
                    )}
                    {!step.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground">Inativo</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{step.description}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => toggle(step.id)} className="p-2 hover:bg-white/10 rounded">
                    {step.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(step)} className="p-2 hover:bg-white/10 rounded">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(step.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DragList>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div className="glass max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar etapa' : 'Nova etapa'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Número</label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="01"
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-center text-lg"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Título</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Diagnóstico"
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Breve descrição da etapa — o que acontece aqui."
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Duração (opcional)</label>
                <input
                  type="text"
                  value={form.duration ?? ''}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="1-2 semanas"
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                />
              </div>
              <Checkbox
                label="Ativo"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 hover:bg-white/10 rounded">
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
