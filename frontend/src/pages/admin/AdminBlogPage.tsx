import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save, Star } from 'lucide-react'
import { blogApi } from '@/lib/api'

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content: string
  coverImage?: string | null
  tags: string[]
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: string | null
}

interface FormData {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string
  isPublished: boolean
  isFeatured: boolean
}

const EMPTY_FORM: FormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: '',
  isPublished: false,
  isFeatured: false,
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminBlogPage() {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Post | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await blogApi.admin.getPosts()
      setItems(res.posts ?? [])
    } finally { setLoading(false) }
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true)
  }

  function openEdit(p: Post) {
    setEditing(p)
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      content: p.content,
      coverImage: p.coverImage ?? '',
      tags: p.tags.join(', '),
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      excerpt: form.excerpt || null,
      coverImage: form.coverImage || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      publishedAt: form.isPublished ? new Date().toISOString() : null,
    }
    try {
      if (editing) await blogApi.admin.updatePost(editing.id, payload)
      else await blogApi.admin.createPost(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este post?')) return
    await blogApi.admin.deletePost(id); load()
  }

  async function togglePublished(id: string) {
    await blogApi.admin.togglePublished(id); load()
  }

  async function toggleFeatured(id: string) {
    await blogApi.admin.toggleFeatured(id); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-muted-foreground">Posts exibidos em /blog.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo post
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {p.isFeatured && <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">Destaque</span>}
                  <h3 className="font-medium">{p.title}</h3>
                  {!p.isPublished && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Rascunho</span>}
                </div>
                {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-1">{p.excerpt}</p>}
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span>/{p.slug}</span>
                  {p.tags.map((t) => <span key={t}>· {t}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleFeatured(p.id)} className={`p-2 rounded hover:bg-white/10 ${p.isFeatured ? 'text-primary' : ''}`} title="Destaque">
                  <Star className="h-4 w-4" />
                </button>
                <button onClick={() => togglePublished(p.id)} className="p-2 hover:bg-white/10 rounded" title={p.isPublished ? 'Despublicar' : 'Publicar'}>
                  {p.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(p.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum post.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar post' : 'Novo post'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Slug</label>
                <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Resumo (excerpt)</label>
                <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Conteúdo</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL da imagem de capa</label>
                <input type="url" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Tags (separadas por vírgula)</label>
                <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Arquitetura, Produto" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
                  Publicado
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                  Em destaque (long read)
                </label>
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
