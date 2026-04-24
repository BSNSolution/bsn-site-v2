import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { aboutCardsApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import DragList from '@/components/admin/DragList'
import ColorSelect from '@/components/admin/ColorSelect'
import { toast } from 'sonner'

// Paleta específica dos about-cards (c1..c4)
const ABOUT_CARD_PALETTE = [
  { slug: 'c1', label: 'Violeta', hex: '#a78bfa' },
  { slug: 'c2', label: 'Ciano', hex: '#22d3ee' },
  { slug: 'c3', label: 'Magenta', hex: '#ec4899' },
  { slug: 'c4', label: 'Âmbar', hex: '#f59e0b' },
]

interface Card {
  id: string
  tag: string
  title: string
  description: string
  colorClass: string
  isActive: boolean
  order: number
}

interface FormData {
  tag: string
  title: string
  description: string
  colorClass: string
  isActive: boolean
  order?: number
}

const EMPTY_FORM: FormData = { tag: '', title: '', description: '', colorClass: 'c1', isActive: true }

export default function AdminAboutCardsPage() {
  const [items, setItems] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await aboutCardsApi.admin.getCards()
      setItems(res.cards ?? [])
    } finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true) }
  function openEdit(c: Card) {
    setEditing(c)
    setForm({ tag: c.tag, title: c.title, description: c.description, colorClass: c.colorClass, isActive: c.isActive, order: c.order })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (editing) await aboutCardsApi.admin.update(editing.id, form)
    else await aboutCardsApi.admin.create(form)
    setShowForm(false); load()
  }
  async function remove(id: string) {
    if (!confirm('Remover este card?')) return
    await aboutCardsApi.admin.remove(id); load()
  }
  async function toggle(id: string) { await aboutCardsApi.admin.toggle(id); load() }

  async function handleReorder(next: Card[]) {
    setItems(next)
    try {
      await aboutCardsApi.admin.reorder(next.map((c, idx) => ({ id: c.id, order: idx + 1 })))
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
          <h1 className="text-2xl font-semibold">Cards "Sobre" (Missão / Visão / etc.)</h1>
          <p className="text-sm text-muted-foreground">4 cards exibidos em /sobre abaixo do hero.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo card
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <DragList items={items} getKey={(c) => c.id} onReorder={handleReorder} className="grid gap-3">
          {(c, handle) => (
            <div className="glass p-4 flex items-start justify-between gap-4">
              {handle}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{c.tag}</span>
                  <h3 className="font-medium">{c.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-muted-foreground">{c.colorClass}</span>
                  {!c.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
                </div>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(c.id)} className="p-2 hover:bg-white/10 rounded">
                  {c.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(c)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(c.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          )}
        </DragList>
      )}
      {!loading && items.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">Nenhum card.</div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar card' : 'Novo card'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tag (ex: MISSÃO)</label>
                  <input type="text" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
                </div>
                <ColorSelect
                  label="Cor"
                  options={ABOUT_CARD_PALETTE}
                  value={form.colorClass}
                  onChange={(v) => setForm({ ...form, colorClass: v })}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div className="flex items-center gap-4">
                <Checkbox label="Ativo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">Ordem:</span>
                  <input type="number" value={form.order ?? ''} onChange={(e) => setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })} className="w-20 px-2 py-1 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>
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
