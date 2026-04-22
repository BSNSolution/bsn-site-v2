import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Eye, EyeOff, Star, StarOff } from 'lucide-react'
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
  createdAt: string
}

export default function AdminBlogPage() {
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await blogApi.admin.getPosts({ limit: 100 })
      setItems(Array.isArray(res?.posts) ? res.posts : [])
    } catch (err) {
      console.error(err)
      setItems([])
    } finally { setLoading(false) }
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-muted-foreground">Posts exibidos em /blog. Marque um como "Destaque" para aparecer como long-read.</p>
        </div>
        <button
          onClick={() => navigate('/admin/blog/new')}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo post
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">
          Nenhum post cadastrado. Clique em "Novo post" para criar o primeiro.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((p) => (
            <div key={p.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {p.coverImage && (
                  <div
                    className="w-16 h-16 rounded-lg shrink-0 bg-black/40"
                    style={{ background: `url(${p.coverImage}) center/cover` }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {p.isFeatured && <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-mono uppercase">Destaque</span>}
                    <h3 className="font-medium truncate">{p.title}</h3>
                    {!p.isPublished && <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60 font-mono uppercase">Rascunho</span>}
                  </div>
                  {p.excerpt && <p className="text-sm text-muted-foreground line-clamp-1">{p.excerpt}</p>}
                  <div className="flex gap-2 mt-1 text-[11px] text-muted-foreground font-mono">
                    <span>/{p.slug}</span>
                    {p.tags?.slice(0, 3).map((t) => <span key={t}>· {t}</span>)}
                    {p.publishedAt && <span>· {new Date(p.publishedAt).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleFeatured(p.id)} className={`p-2 hover:bg-white/10 rounded ${p.isFeatured ? 'text-primary' : ''}`} title="Destaque">
                  {p.isFeatured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                </button>
                <button onClick={() => togglePublished(p.id)} className="p-2 hover:bg-white/10 rounded" title={p.isPublished ? 'Despublicar' : 'Publicar'}>
                  {p.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => navigate(`/admin/blog/${p.id}/edit`)} className="p-2 hover:bg-white/10 rounded" title="Editar">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => remove(p.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded" title="Remover">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
