import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import Seo from '@/components/Seo'
import { blogApi } from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'

const BLOG_SECTION_KEYS = ['hero', 'featured', 'posts'] as const

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: string
  coverImage?: string | null
  tags: string[]
  publishedAt?: string | null
  isFeatured?: boolean
}

interface PaginationMeta {
  page: number
  limit: number
  total: number
  pages: number
}

type DateFilter = 'all' | '7d' | '30d' | '90d' | '1y' | 'custom'

const POST_CLASSES = ['a', 'b', 'c', 'd', 'e', 'f'] as const
const PAGE_SIZE = 9

function formatDate(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
  const year = date.getFullYear()
  return `${day} · ${month} · ${year}`
}

function dateFilterCutoff(filter: DateFilter): Date | null {
  if (filter === 'all' || filter === 'custom') return null
  const map: Record<'7d' | '30d' | '90d' | '1y', number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
  const days = map[filter]
  return new Date(Date.now() - days * 86400000)
}

export default function BlogPage() {
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [page, setPage] = useState(1)

  // Featured: sempre pega o mais recente com isFeatured (ou fallback pro primeiro)
  const { data: featuredData } = useQuery<{ posts?: BlogPost[] }>({
    queryKey: ['blog-featured'],
    queryFn: () => blogApi.getPosts({ limit: 1, featured: true }),
    staleTime: 5 * 60 * 1000,
  })

  // Listagem paginada (traz TODOS — filtramos client-side já que API não tem search)
  const { data: listData } = useQuery<{ posts?: BlogPost[]; pagination?: PaginationMeta }>({
    queryKey: ['blog-all'],
    queryFn: () => blogApi.getPosts({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: tagsData } = useQuery<{ tags?: string[] }>({
    queryKey: ['blog-tags'],
    queryFn: () => blogApi.getTags(),
    staleTime: 10 * 60 * 1000,
  })

  const featured = featuredData?.posts?.[0] ?? listData?.posts?.[0]
  const allPosts = listData?.posts ?? []
  const availableTags = tagsData?.tags ?? []

  // Aplicar filtros client-side
  const filtered = useMemo(() => {
    const cutoff = dateFilter === 'custom' ? null : dateFilterCutoff(dateFilter)
    const fromDate = dateFilter === 'custom' && dateFrom ? new Date(dateFrom + 'T00:00:00') : null
    const toDate = dateFilter === 'custom' && dateTo ? new Date(dateTo + 'T23:59:59') : null
    const q = search.trim().toLowerCase()
    return allPosts
      .filter((p) => p.id !== featured?.id)
      .filter((p) => {
        if (selectedTag && !p.tags.includes(selectedTag)) return false
        if (p.publishedAt) {
          const pub = new Date(p.publishedAt)
          if (cutoff && pub < cutoff) return false
          if (fromDate && pub < fromDate) return false
          if (toDate && pub > toDate) return false
        }
        if (q) {
          const hay = `${p.title} ${p.excerpt ?? ''} ${p.tags.join(' ')}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
  }, [allPosts, featured?.id, search, selectedTag, dateFilter, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, selectedTag, dateFilter, dateFrom, dateTo])

  const hasActiveFilter =
    !!search ||
    !!selectedTag ||
    dateFilter !== 'all' ||
    !!dateFrom ||
    !!dateTo

  function clearFilters() {
    setSearch('')
    setSelectedTag('')
    setDateFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const { effectiveKeys } = usePageSections('blog', BLOG_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Blog · engenharia aplicada"
        title={<>Ideias, cases e <em>aprendizados</em>.</>}
        lede="Registros técnicos e estratégicos dos projetos e das discussões internas da BSN. Curto, direto e sem fluff."
      />
    ),

    featured: () =>
      !featured ? null : (
        <section key="featured" className="feat shell">
          <div className="feat-card glass">
            <div className="shard" />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="meta">
                {featured.isFeatured ? 'EM DESTAQUE · ' : ''}LONG READ · 12 MIN
              </div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt ?? ''}</p>
              <Link to={`/blog/${featured.slug}`} className="cta">Ler análise ↗</Link>
            </div>
            <div
              className={`art${featured.coverImage ? ' has-image' : ''}`}
              style={featured.coverImage ? { backgroundImage: `url(${featured.coverImage})` } : undefined}
            >
              {!featured.coverImage && <span>long-read cover</span>}
            </div>
          </div>
        </section>
      ),

    filters: () => (
      <section key="filters" className="shell blog-filters-wrap">
        <div className="blog-filters glass">
          <div className="blog-filters-row">
            <div className="blog-filter-search">
              <Search className="w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por título, resumo ou tag..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Limpar busca">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <select
              className="blog-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="all">Qualquer período</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 3 meses</option>
              <option value="1y">Último ano</option>
              <option value="custom">Período personalizado</option>
            </select>

            {dateFilter === 'custom' && (
              <div className="blog-filter-daterange">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="blog-filter-date"
                  aria-label="Data inicial"
                />
                <span className="blog-filter-date-sep">até</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="blog-filter-date"
                  aria-label="Data final"
                />
              </div>
            )}

            {hasActiveFilter && (
              <button className="blog-filter-clear" onClick={clearFilters}>
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>

          {availableTags.length > 0 && (
            <div className="blog-filter-tags">
              <button
                className={`tag-pill${selectedTag === '' ? ' active' : ''}`}
                onClick={() => setSelectedTag('')}
              >
                Todas
              </button>
              {availableTags.slice(0, 20).map((tag) => (
                <button
                  key={tag}
                  className={`tag-pill${selectedTag === tag ? ' active' : ''}`}
                  onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="blog-filter-stats mono">
            {filtered.length} {filtered.length === 1 ? 'post encontrado' : 'posts encontrados'}
          </div>
        </div>
      </section>
    ),

    posts: () => {
      if (allPosts.length === 0) {
        return (
          <section key="posts" className="shell" style={{ paddingTop: 40, paddingBottom: 80 }}>
            <div className="glass" style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div className="mono" style={{ marginBottom: 12 }}>EM BREVE</div>
              <h3 style={{ fontSize: 24, letterSpacing: '-0.02em', fontWeight: 500 }}>
                Nenhum artigo publicado ainda
              </h3>
              <p style={{ color: 'var(--ink-dim)', marginTop: 10 }}>
                Volte em breve — estamos escrevendo os primeiros posts.
              </p>
            </div>
          </section>
        )
      }

      if (filtered.length === 0) {
        return (
          <section key="posts" className="shell" style={{ paddingTop: 20, paddingBottom: 80 }}>
            <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>
              <div className="mono" style={{ marginBottom: 12 }}>NADA ENCONTRADO</div>
              <p style={{ color: 'var(--ink-dim)' }}>
                Não encontramos posts com esses filtros. Tente ajustar ou limpar os critérios.
              </p>
            </div>
          </section>
        )
      }

      return (
        <section key="posts">
          <div className="posts shell">
            {paginated.map((post, i) => (
              <Link key={post.id} to={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article className={`post glass ${POST_CLASSES[i % POST_CLASSES.length]}`}>
                  <div
                    className="thumb"
                    style={post.coverImage ? { backgroundImage: `url(${post.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  />
                  <div className="tag">{post.tags?.[0]?.toUpperCase() ?? 'ARTIGO'}</div>
                  <h3>{post.title}</h3>
                  <div className="date">{formatDate(post.publishedAt)}</div>
                </article>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="shell blog-pagination">
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`page-num${n === page ? ' active' : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <button
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )
    },
  }

  return (
    <div className="page">
      <Seo
        title="Blog — Ideias, Cases e Aprendizados"
        description="Registros técnicos e estratégicos dos projetos da BSN Solution. Artigos curtos e diretos sobre arquitetura, IA aplicada, engenharia de dados e decisões de produto — sem fluff."
        path="/blog"
      />
      <Header />
      {effectiveKeys.map((key) => {
        const node = sectionRenderers[key]?.() ?? null
        // Injeta a seção de filtros automaticamente logo após `featured`
        // (ou após `hero` se featured estiver oculto) — sem depender do backend
        const injectFilters =
          key === 'featured' ||
          (key === 'hero' && !effectiveKeys.includes('featured'))
        if (injectFilters) {
          return (
            <div key={key}>
              {node}
              {sectionRenderers.filters?.()}
            </div>
          )
        }
        return <div key={key}>{node}</div>
      })}
      <Footer />
    </div>
  )
}
