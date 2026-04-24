import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { stackApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import DragList from '@/components/admin/DragList'
import { toast } from 'sonner'

interface Item {
  id: string
  name: string
  isActive: boolean
  order: number
}

interface FormData {
  name: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = { name: '', isActive: true }

export default function AdminStackPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await stackApi.admin.getItems()
      setItems(res.items ?? [])
    } finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }
  function openEdit(i: Item) {
    setEditing(i); setForm({ name: i.name, isActive: i.isActive, order: i.order }); setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (editing) await stackApi.admin.update(editing.id, form)
    else await stackApi.admin.create(form)
    setShowForm(false); load()
  }
  async function remove(id: string) {
    if (!confirm('Remover?')) return
    await stackApi.admin.remove(id); load()
  }
  async function toggle(id: string) { await stackApi.admin.toggle(id); load() }

  async function handleReorder(next: Item[]) {
    setItems(next)
    try {
      await stackApi.admin.reorder(next.map((i, idx) => ({ id: i.id, order: idx + 1 })))
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
          <h1 className="text-2xl font-semibold">Stack / Tecnologias</h1>
          <p className="text-sm text-muted-foreground">Itens do marquee infinito da home.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo item
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <DragList items={items} getKey={(i) => i.id} onReorder={handleReorder} className="grid gap-2">
          {(i, handle) => (
            <div className="glass p-3 flex items-center justify-between gap-2">
              {handle}
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium">{i.name}</span>
                {!i.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(i.id)} className="p-1.5 hover:bg-white/10 rounded">
                  {i.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => openEdit(i)} className="p-1.5 hover:bg-white/10 rounded"><Edit className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(i.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          )}
        </DragList>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar' : 'Novo'} item</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Ordem</label>
                <input type="number" value={form.order ?? ''} onChange={(e) => setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <Checkbox label="Ativo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 hover:bg-white/10 rounded">Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded"><Save className="h-4 w-4" /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
