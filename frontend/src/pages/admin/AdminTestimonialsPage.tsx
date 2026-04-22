import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { testimonialsApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import { Rating } from '@/components/ui/rating'

interface Testimonial {
  id: string
  clientName: string
  clientRole?: string | null
  company?: string | null
  content: string
  rating: number
  avatarUrl?: string | null
  isActive: boolean
  order: number
}

interface FormData {
  clientName: string
  clientRole: string
  company: string
  content: string
  rating: number
  avatarUrl: string
  isActive: boolean
  order?: number
}

const EMPTY: FormData = {
  clientName: '',
  clientRole: '',
  company: '',
  content: '',
  rating: 5,
  avatarUrl: '',
  isActive: true,
}

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await testimonialsApi.admin.getTestimonials()
      setItems(Array.isArray(res?.testimonials) ? res.testimonials : [])
    } catch (err) {
      console.error(err); setItems([])
    } finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }

  function openEdit(t: Testimonial) {
    setEditing(t)
    setForm({
      clientName: t.clientName,
      clientRole: t.clientRole ?? '',
      company: t.company ?? '',
      content: t.content,
      rating: t.rating,
      avatarUrl: t.avatarUrl ?? '',
      isActive: t.isActive,
      order: t.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      clientRole: form.clientRole || null,
      company: form.company || null,
      avatarUrl: form.avatarUrl || null,
    }
    try {
      if (editing) await testimonialsApi.admin.updateTestimonial(editing.id, payload)
      else await testimonialsApi.admin.createTestimonial(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este depoimento?')) return
    await testimonialsApi.admin.deleteTestimonial(id); load()
  }
  async function toggle(id: string) {
    await testimonialsApi.admin.toggleTestimonial(id); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Depoimentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os depoimentos de clientes.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo depoimento
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">Nenhum depoimento.</div>
      ) : (
        <div className="grid gap-3">
          {items.map((t) => (
            <div key={t.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{t.clientName}</h3>
                  {t.company && <span className="text-xs text-muted-foreground">· {t.company}</span>}
                  <Rating value={t.rating} readOnly size="sm" />
                  {!t.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
                </div>
                {t.clientRole && <div className="text-xs text-muted-foreground">{t.clientRole}</div>}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.content}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(t.id)} className="p-2 hover:bg-white/10 rounded">
                  {t.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(t)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(t.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-lg w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar depoimento' : 'Novo depoimento'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nome</label>
                  <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Cargo</label>
                  <input type="text" value={form.clientRole} onChange={(e) => setForm({ ...form, clientRole: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Empresa</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Depoimento</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-xs text-muted-foreground">Rating</label>
                  <div className="mt-2">
                    <Rating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} size="lg" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ordem</label>
                  <input type="number" value={form.order ?? ''} onChange={(e) => setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Avatar URL (opcional)</label>
                <input type="url" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
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
