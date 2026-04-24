import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit, Trash2, Star, StarOff, Send, Archive, Search, ChevronLeft, ChevronRight, Sparkles, X, Loader2 } from 'lucide-react'
import { blogApi, aiConfigsApi } from '@/lib/api'
import { toast } from 'sonner'
import { useAiEnabled } from '@/hooks/use-ai-enabled'
import { useAuth } from '@/contexts/AuthContext'
import PermissionGate from '@/components/PermissionGate'

const ADMIN_PAGE_SIZE = 10

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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all')
  const [datePreset, setDatePreset] = useState<'all' | '7d' | '30d' | '90d' | '1y' | 'custom'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [showAiModal, setShowAiModal] = useState(false)
  const [aiUrl, setAiUrl] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const navigate = useNavigate()
  const { enabled: aiEnabled } = useAiEnabled()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission('blog.write')
  const canPublish = hasPermission('blog.publish')
  const canDelete = hasPermission('blog.delete')
  const canUseAi = hasPermission('ai.use')

  useEffect(() => { load() }, [])
  useEffect(() => { setPage(1) }, [search, statusFilter, datePreset, dateFrom, dateTo])

  async function load() {
    try {
      setLoading(true)
      const res = await blogApi.admin.getPosts({ limit: 500 })
      setItems(Array.isArray(res?.posts) ? res.posts : [])
    } catch (err) {
      console.error(err)
      setItems([])
    } finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const now = Date.now()
    const presetDays: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    const cutoff = datePreset in presetDays ? new Date(now - presetDays[datePreset] * 86400000) : null
    const from = datePreset === 'custom' && dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const to = datePreset === 'custom' && dateTo ? new Date(dateTo + 'T23:59:59') : null

    return items.filter((p) => {
      if (statusFilter === 'published' && !p.isPublished) return false
      if (statusFilter === 'draft' && p.isPublished) return false
      const pubOrCreated = p.publishedAt || p.createdAt
      if (pubOrCreated) {
        const d = new Date(pubOrCreated)
        if (cutoff && d < cutoff) return false
        if (from && d < from) return false
        if (to && d > to) return false
      }
      if (q) {
        const hay = `${p.title} ${p.slug} ${p.tags?.join(' ') ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, search, statusFilter, datePreset, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE)

  async function remove(id: string) {
    if (!confirm('Remover este post?')) return
    await blogApi.admin.deletePost(id); load()
  }

  async function togglePublished(post: Post) {
    const action = post.isPublished ? 'Despublicar' : 'Publicar'
    if (!confirm(`${action} "${post.title}"?`)) return
    try {
      await blogApi.admin.togglePublished(post.id)
      toast.success(post.isPublished ? 'Post despublicado' : 'Post publicado')
      load()
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  async function toggleFeatured(id: string) {
    await blogApi.admin.toggleFeatured(id); load()
  }

  async function generateWithAi() {
    if (!aiUrl) {
      toast.error('Informe a URL de referência')
      return
    }
    try {
      setAiGenerating(true)
      const { post } = await aiConfigsApi.generatePost(aiUrl)
      // Cria o post como rascunho usando os dados retornados
      const created: any = await blogApi.admin.createPost({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags ?? [],
        isPublished: false,
        isFeatured: false,
      })
      toast.success('Post gerado! Abrindo editor para revisão.')
      setShowAiModal(false)
      setAiUrl('')
      const newId = created?.post?.id ?? created?.id
      if (newId) {
        navigate(`/admin/blog/${newId}/edit`)
      } else {
        load()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao gerar com IA')
    } finally {
      setAiGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Blog</h1>
          <p className="text-sm text-muted-foreground">Posts exibidos em /blog. Marque um como "Destaque" para aparecer como long-read.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {aiEnabled && canWrite && canUseAi && (
            <button
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20 text-sm"
            >
              <Sparkles className="h-4 w-4" /> Criar novo post com IA
            </button>
          )}
          <PermissionGate permission="blog.write">
            <button
              onClick={() => navigate('/admin/blog/new')}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Novo post
            </button>
          </PermissionGate>
        </div>
      </div>

      {!loading && items.length > 0 && (
        <div className="glass p-3 flex flex-col gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por título, slug ou tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 text-sm outline-none focus:border-white/25 transition-colors"
              />
            </div>
            <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'published', label: 'Publicados' },
                { key: 'draft', label: 'Rascunhos' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setStatusFilter(t.key as typeof statusFilter)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === t.key
                      ? 'bg-white/10 text-white'
                      : 'text-muted-foreground hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as typeof datePreset)}
              className="h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-white/25"
            >
              <option value="all">Qualquer período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 3 meses</option>
              <option value="1y">Último ano</option>
              <option value="custom">Período personalizado</option>
            </select>
            <div className="text-xs font-mono text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'post' : 'posts'}
            </div>
          </div>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-white/25"
                style={{ colorScheme: 'dark' }}
              />
              <span className="text-xs font-mono text-muted-foreground">até</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-white/25"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">
          Nenhum post cadastrado. Clique em "Novo post" para criar o primeiro.
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">
          Nenhum post encontrado com esses filtros.
        </div>
      ) : (
        <div className="grid gap-3">
          {paginated.map((p) => (
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
                {canPublish && (
                  !p.isPublished ? (
                    <button
                      onClick={() => togglePublished(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 text-sm font-medium"
                      title="Publicar post"
                    >
                      <Send className="h-4 w-4" /> Publicar
                    </button>
                  ) : (
                    <button
                      onClick={() => togglePublished(p)}
                      className="p-2 hover:bg-amber-500/10 text-amber-300/70 hover:text-amber-300 rounded"
                      title="Despublicar (voltar a rascunho)"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )
                )}
                {canPublish && (
                  <button onClick={() => toggleFeatured(p.id)} className={`p-2 hover:bg-white/10 rounded ${p.isFeatured ? 'text-primary' : ''}`} title={p.isFeatured ? 'Remover destaque' : 'Marcar como destaque'}>
                    {p.isFeatured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                  </button>
                )}
                {canWrite && (
                  <button onClick={() => navigate(`/admin/blog/${p.id}/edit`)} className="p-2 hover:bg-white/10 rounded" title="Editar">
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {canDelete && (
                  <button onClick={() => remove(p.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`min-w-[36px] h-9 px-2 rounded-md text-xs font-mono transition-colors ${
                      n === page
                        ? 'bg-primary/20 border border-primary/40 text-primary'
                        : 'border border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {showAiModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => !aiGenerating && setShowAiModal(false)}
        >
          <div
            className="glass p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                  Criar post com IA
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Cole a URL de um artigo de referência. A IA vai reescrever o conteúdo como
                  se fosse um post original da BSN Solution — com voz própria, exemplos BSN e
                  sem menção ao site original.
                </p>
              </div>
              <button
                onClick={() => !aiGenerating && setShowAiModal(false)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="block text-sm mb-1">URL do artigo de referência</label>
            <input
              type="url"
              value={aiUrl}
              onChange={(e) => setAiUrl(e.target.value)}
              placeholder="https://exemplo.com/artigo-interessante"
              disabled={aiGenerating}
              className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-white/25 disabled:opacity-60"
            />
            <p className="text-[11px] text-muted-foreground mt-2 font-mono">
              Levará 30–60s para gerar. O post será criado como rascunho e você vai direto para o editor.
            </p>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowAiModal(false)}
                disabled={aiGenerating}
                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={generateWithAi}
                disabled={aiGenerating || !aiUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-200 hover:bg-violet-500/30 text-sm disabled:opacity-60"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Gerar post
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
