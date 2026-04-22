import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { solutionsApi } from '@/lib/api'

interface Solution {
  id: string
  title: string
  tag?: string | null
  description: string
  bullets: string[]
  colorClass?: string | null
  ctaLabel?: string | null
  isActive: boolean
  isFeatured: boolean
  order: number
}

interface FormData {
  title: string
  tag: string
  description: string
  bullets: string
  colorClass: string
  ctaLabel: string
  isActive: boolean
  isFeatured: boolean
  order?: number
}

const COLOR_OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f']

const EMPTY_FORM: FormData = {
  title: '',
  tag: '',
  description: '',
  bullets: '',
  colorClass: 'a',
  ctaLabel: 'Ver demo →',
  isActive: true,
  isFeatured: false,
}

export default function AdminSolutionsPage() {
  const [items, setItems] = useState<Solution[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Solution | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await solutionsApi.admin.getSolutions()
      setItems(res.solutions ?? [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(sol: Solution) {
    setEditing(sol)
    setForm({
      title: sol.title,
      tag: sol.tag ?? '',
      description: sol.description,
      bullets: (sol.bullets ?? []).join('\n'),
      colorClass: sol.colorClass ?? 'a',
      ctaLabel: sol.ctaLabel ?? 'Ver demo →',
      isActive: sol.isActive,
      isFeatured: sol.isFeatured,
      order: sol.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      bullets: form.bullets.split('\n').map((b) => b.trim()).filter(Boolean),
      technologies: [],
    }
    try {
      if (editing) {
        await solutionsApi.admin.updateSolution(editing.id, payload)
      } else {
        await solutionsApi.admin.createSolution(payload)
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover esta solução?')) return
    await solutionsApi.admin.deleteSolution(id)
    load()
  }

  async function toggle(id: string) {
    await solutionsApi.admin.toggleSolution(id)
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Soluções verticais</h1>
          <p className="text-sm text-muted-foreground">Plataformas por setor exibidas em /solucoes.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova solução
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {items.map((sol) => (
            <div key={sol.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {sol.tag && <span className="text-xs font-mono text-muted-foreground">{sol.tag}</span>}
                  <h3 className="font-medium">{sol.title}</h3>
                  {!sol.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
                  {sol.isFeatured && <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">Destaque</span>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{sol.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                  <span>cor: {sol.colorClass}</span>
                  <span>· bullets: {(sol.bullets ?? []).length}</span>
                  <span>· ordem: {sol.order}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(sol.id)} className="p-2 hover:bg-white/10 rounded">
                  {sol.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(sol)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(sol.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhuma solução.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar solução' : 'Nova solução'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tag (ex: COOPERATIVISMO)</label>
                  <input type="text" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cor (a–f)</label>
                  <select value={form.colorClass} onChange={(e) => setForm({ ...form, colorClass: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                    {COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bullets (um por linha)</label>
                <textarea value={form.bullets} onChange={(e) => setForm({ ...form, bullets: e.target.value })} rows={4} placeholder="Votação remota com trilha de auditoria
Feed de comunicação segmentado
Autoatendimento integrado ao ERP" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">CTA label</label>
                <input type="text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Em destaque
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
