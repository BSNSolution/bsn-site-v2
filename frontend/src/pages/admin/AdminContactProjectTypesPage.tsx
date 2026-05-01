import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import {
  contactProjectTypesApi,
  type ContactProjectType,
} from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import DragList from '@/components/admin/DragList'
import { toast } from 'sonner'

interface FormData {
  label: string
  description?: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = {
  label: '',
  description: '',
  isActive: true,
}

export default function AdminContactProjectTypesPage() {
  const [items, setItems] = useState<ContactProjectType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ContactProjectType | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load({ silent: false })
  }, [])

  // silent=true mantém a lista visível durante refetch pós-ação (preserva scroll)
  async function load({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await contactProjectTypesApi.admin.list()
      setItems(res.types ?? [])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(t: ContactProjectType) {
    setEditing(t)
    setForm({
      label: t.label,
      description: t.description ?? '',
      isActive: t.isActive,
      order: t.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      description: form.description || null,
    }
    try {
      if (editing) {
        await contactProjectTypesApi.admin.update(editing.id, payload)
      } else {
        await contactProjectTypesApi.admin.create(payload)
      }
      toast.success(editing ? 'Atualizado' : 'Criado')
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este tipo de projeto?')) return
    try {
      await contactProjectTypesApi.admin.remove(id)
      toast.success('Removido')
      load()
    } catch {
      toast.error('Erro ao remover')
    }
  }

  async function toggle(id: string) {
    try {
      await contactProjectTypesApi.admin.toggle(id)
      load()
    } catch {
      toast.error('Erro ao alternar')
    }
  }

  async function handleReorder(next: ContactProjectType[]) {
    setItems(next)
    try {
      await contactProjectTypesApi.admin.reorder(
        next.map((t, idx) => ({ id: t.id, order: idx + 1 }))
      )
      toast.success('Ordem salva')
    } catch {
      toast.error('Erro ao salvar ordem')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Tipos de projeto (página de Contato)
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerencia os "chips" exibidos no formulário de briefing. Substitui
            a derivação automática que gerava chips com palavras soltas.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo tipo
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">
          Carregando...
        </div>
      ) : (
        <DragList
          items={items}
          getKey={(t) => t.id}
          onReorder={handleReorder}
          className="grid gap-3"
        >
          {(t, handle) => (
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                {handle}
                <div className="flex-1">
                  <div className="text-base font-medium">{t.label}</div>
                  {t.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.description}
                    </p>
                  )}
                  {!t.isActive && (
                    <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => toggle(t.id)}
                    className="p-2 hover:bg-muted rounded"
                    title={t.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {t.isActive ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(t)}
                    className="p-2 hover:bg-muted rounded"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(t.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </DragList>
      )}
      {!loading && items.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          Nenhum tipo de projeto cadastrado.
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-card border border-border rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editing ? 'Editar tipo' : 'Novo tipo de projeto'}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">
                  Label (ex: "Desenvolvimento Web")
                </label>
                <input
                  type="text"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Descrição (opcional — exibida só no admin)
                </label>
                <textarea
                  value={form.description ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">
                  Ordem (opcional — vazio = último)
                </label>
                <input
                  type="number"
                  value={form.order ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      order: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded"
                />
              </div>
              <Checkbox
                label="Ativo"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 hover:bg-muted rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded"
                >
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
