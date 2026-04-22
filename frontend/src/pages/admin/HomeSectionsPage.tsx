import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { homeApi } from '@/lib/api'

interface Section {
  id: string
  type: string
  title?: string | null
  subtitle?: string | null
  content?: string | null
  imageUrl?: string | null
  ctaText?: string | null
  ctaUrl?: string | null
  isVisible: boolean
  order: number
}

interface FormData {
  type: string
  title: string
  subtitle: string
  content: string
  imageUrl: string
  ctaText: string
  ctaUrl: string
  isVisible: boolean
  order?: number
}

const TYPES = ['HERO', 'ABOUT', 'SERVICES_PREVIEW', 'SOLUTIONS_PREVIEW', 'TESTIMONIALS_PREVIEW', 'CALL_TO_ACTION', 'STATS']

const EMPTY: FormData = {
  type: 'HERO',
  title: '',
  subtitle: '',
  content: '',
  imageUrl: '',
  ctaText: '',
  ctaUrl: '',
  isVisible: true,
}

export default function HomeSectionsPage() {
  const [items, setItems] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await homeApi.admin.getSections()
      setItems(Array.isArray(res?.sections) ? res.sections : [])
    } catch { setItems([]) } finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }
  function openEdit(s: Section) {
    setEditing(s)
    setForm({
      type: s.type,
      title: s.title ?? '',
      subtitle: s.subtitle ?? '',
      content: s.content ?? '',
      imageUrl: s.imageUrl ?? '',
      ctaText: s.ctaText ?? '',
      ctaUrl: s.ctaUrl ?? '',
      isVisible: s.isVisible,
      order: s.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload: any = {
      ...form,
      title: form.title || null,
      subtitle: form.subtitle || null,
      content: form.content || null,
      imageUrl: form.imageUrl || null,
      ctaText: form.ctaText || null,
      ctaUrl: form.ctaUrl || null,
    }
    try {
      if (editing) await homeApi.admin.updateSection(editing.id, payload)
      else await homeApi.admin.createSection(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover esta seção?')) return
    await homeApi.admin.deleteSection(id); load()
  }
  async function toggle(id: string) { await homeApi.admin.toggleSection(id); load() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Seções da Home</h1>
          <p className="text-sm text-muted-foreground">Hero, about preview, CTAs e outras seções top-level da home.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova seção
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">Nenhuma seção.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => (
            <div key={s.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-white/5">{s.type}</span>
                  {s.title && <h3 className="font-medium truncate">{s.title}</h3>}
                  {!s.isVisible && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Oculto</span>}
                </div>
                {s.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{s.subtitle}</p>}
                {s.content && <p className="text-xs text-muted-foreground line-clamp-1">{s.content}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(s.id)} className="p-2 hover:bg-white/10 rounded">
                  {s.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(s)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(s.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar seção' : 'Nova seção'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Subtítulo</label>
                <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Conteúdo</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">CTA texto</label>
                  <input type="text" value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">CTA URL</label>
                  <input type="text" value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Imagem URL</label>
                <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isVisible} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} />
                  Visível
                </label>
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
