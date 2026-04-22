import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { blogApi } from '@/lib/api'

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

const DEFAULT_POSTS: BlogPost[] = [
  { id: '1', title: 'Quando microserviços param de fazer sentido', slug: 'microservicos-deixam-de-fazer-sentido', tags: ['ARQUITETURA'], publishedAt: '2026-04-18T00:00:00.000Z' },
  { id: '2', title: 'Do briefing ao MVP em 6 semanas: roteiro', slug: 'briefing-mvp-6-semanas', tags: ['PRODUTO'], publishedAt: '2026-04-11T00:00:00.000Z' },
  { id: '3', title: 'Observabilidade pragmática em times pequenos', slug: 'observabilidade-pragmatica', tags: ['INFRA'], publishedAt: '2026-04-04T00:00:00.000Z' },
  { id: '4', title: 'Como dizer "não" a features sem perder o cliente', slug: 'nao-a-features-sem-perder-cliente', tags: ['LIDERANÇA'], publishedAt: '2026-03-28T00:00:00.000Z' },
  { id: '5', title: 'Agentes úteis vs. agentes teatrais', slug: 'agentes-uteis-vs-teatrais', tags: ['IA APLICADA'], publishedAt: '2026-03-21T00:00:00.000Z' },
  { id: '6', title: 'Assembleia digital auditada em cooperativa com 40k membros', slug: 'assembleia-digital-coop-40k', tags: ['CASE'], publishedAt: '2026-03-14T00:00:00.000Z' },
]

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

  const posts = data?.posts?.length ? data.posts : DEFAULT_POSTS
  const featured = posts.find((p) => p.isFeatured) ?? posts[0]
  const list = posts.filter((p) => p.id !== featured?.id).slice(0, 6)

  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Blog · engenharia aplicada</span>
        </div>
        <h1>
          Ideias, cases
          <br />
          e <em>aprendizados</em>.
        </h1>
        <p>
          Registros técnicos e estratégicos dos projetos e das discussões internas da BSN. Curto, direto e sem fluff.
        </p>
      </section>

      {featured && (
        <section className="feat shell">
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
      )}

      <section className="posts shell">
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

      <Footer />
    </div>
  )
}
