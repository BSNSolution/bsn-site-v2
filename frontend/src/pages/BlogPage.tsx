import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import { blogApi } from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'

const BLOG_SECTION_KEYS = ['hero', 'featured', 'posts'] as const

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  coverImage?: string | null
  tags: string[]
  publishedAt?: string | null
  isFeatured?: boolean
}

const POST_CLASSES = ['a', 'b', 'c', 'd', 'e', 'f'] as const

function formatDate(iso?: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = date
    .toLocaleDateString('pt-BR', { month: 'short' })
    .replace('.', '')
    .toUpperCase()
  const year = date.getFullYear()
  return `${day} · ${month} · ${year}`
}

export default function BlogPage() {
  const { data } = useQuery<{ posts?: BlogPost[] }>({
    queryKey: ['blog-public'],
    queryFn: () => blogApi.getPosts({ limit: 12 }),
    staleTime: 5 * 60 * 1000,
  })

  const posts = data?.posts ?? []
  const isEmpty = posts.length === 0
  const featured = posts.find((p) => p.isFeatured) ?? posts[0]
  const list = posts.filter((p) => p.id !== featured?.id).slice(0, 6)
  const { effectiveKeys } = usePageSections('blog', BLOG_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Blog · engenharia aplicada"
        title={
          <>
            Ideias, cases
            <br />
            e <em>aprendizados</em>.
          </>
        }
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
              <p>{featured.excerpt ?? 'Um estudo com 14 administradoras mostrou que o ROI de soluções customizadas supera o de SaaS em até 3× ao longo de 24 meses — e explicamos por quê.'}</p>
              <Link to={`/blog/${featured.slug}`} className="cta">
                Ler análise ↗
              </Link>
            </div>
            <div className="art">
              <span>long-read cover</span>
            </div>
          </div>
        </section>
      ),

    posts: () => {
      if (isEmpty) {
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
      return (
        <section key="posts" className="posts shell">
          {list.map((post, i) => (
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
        </section>
      )
    },
  }

  return (
    <div className="page">
      <Header />
      {effectiveKeys.map((key) => sectionRenderers[key]?.() ?? null)}
      <Footer />
    </div>
  )
}
