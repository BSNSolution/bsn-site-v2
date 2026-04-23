import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { ArrowLeft, Clock, Share2, Twitter, Linkedin, Link as LinkIcon } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { blogApi } from '@/lib/api'

interface Author {
  id: string
  name: string
}

interface BlogPost {
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
  author?: Author | null
}

marked.setOptions({ gfm: true, breaks: true })

function formatDate(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function calcReadTime(content: string) {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 220))
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!slug) return
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        // Backend retorna o post achatado (sem wrapper { post })
        const data = await blogApi.getPost(slug)
        const p: BlogPost | null = data?.post ?? data
        if (p && p.id && p.title) {
          setPost(p)
          document.title = `${p.title} — BSN Solution`
        } else {
          setError('Post não encontrado')
        }
      } catch (err: any) {
        setError(err?.response?.status === 404 ? 'Post não encontrado' : 'Erro ao carregar post')
      } finally {
        setLoading(false)
      }
    })()
  }, [slug])

  const html = useMemo(() => {
    if (!post) return ''
    try {
      return DOMPurify.sanitize(marked.parse(post.content || '') as string)
    } catch {
      return ''
    }
  }, [post])

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  function shareTwitter() {
    if (!post) return
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400')
  }
  function shareLinkedIn() {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400')
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('Link copiado!')
    } catch {
      prompt('URL do post:', shareUrl)
    }
  }

  return (
    <div className="page">
      <Header />

      <article className="shell" style={{ padding: '80px 32px 40px', maxWidth: 820 }}>
        <Link to="/blog" className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft className="h-3 w-3" /> Voltar ao blog
        </Link>

        {loading && (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-dim)' }}>
            Carregando post...
          </div>
        )}

        {error && !loading && (
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <div className="mono" style={{ marginBottom: 12 }}>404 · ERRO</div>
            <h1 style={{ fontSize: 28, letterSpacing: '-0.02em', fontWeight: 500 }}>{error}</h1>
            <p style={{ color: 'var(--ink-dim)', marginTop: 12 }}>
              O post que você procura não existe ou foi removido.
            </p>
            <Link to="/blog" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex', width: 'auto' }}>
              Ver todos os posts
            </Link>
          </div>
        )}

        {post && !loading && !error && (
          <>
            {post.tags?.length > 0 && (
              <div className="mono" style={{ marginBottom: 18 }}>
                {post.tags[0].toUpperCase()}
                {post.tags.length > 1 && ` · +${post.tags.length - 1}`}
              </div>
            )}

            <h1 style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              fontSize: 'clamp(36px, 5vw, 56px)',
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              marginBottom: 24,
            }}>
              {post.title}
            </h1>

            {post.excerpt && (
              <p style={{ fontSize: 19, color: 'var(--ink-dim)', lineHeight: 1.55, marginBottom: 32 }}>
                {post.excerpt}
              </p>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
              padding: '20px 0',
              borderTop: '1px solid var(--line)',
              borderBottom: '1px solid var(--line)',
              marginBottom: 40,
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--ink-dim)' }}>
                {post.author?.name && <span><b style={{ color: 'var(--ink)', fontWeight: 500 }}>{post.author.name}</b></span>}
                {post.publishedAt && <span>· {formatDate(post.publishedAt)}</span>}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  · <Clock className="h-3 w-3" /> {calcReadTime(post.content)} min
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={shareTwitter} className="share-btn" title="Compartilhar no Twitter"><Twitter className="h-4 w-4" /></button>
                <button onClick={shareLinkedIn} className="share-btn" title="Compartilhar no LinkedIn"><Linkedin className="h-4 w-4" /></button>
                <button onClick={copyLink} className="share-btn" title="Copiar link"><LinkIcon className="h-4 w-4" /></button>
              </div>
            </div>

            {post.coverImage && (
              <img
                src={post.coverImage}
                alt={post.title}
                style={{
                  width: '100%',
                  borderRadius: 18,
                  border: '1px solid var(--line)',
                  marginBottom: 40,
                  display: 'block',
                }}
              />
            )}

            <div
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {post.tags?.length > 0 && (
              <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="mono" style={{ marginRight: 8 }}>Tags:</span>
                {post.tags.map((t) => (
                  <span key={t} className="pill" style={{ background: 'rgba(255,255,255,0.06)' }}>{t}</span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link to="/blog" className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <ArrowLeft className="h-3 w-3" /> Todos os posts
              </Link>
              <Link to="/contato" className="btn btn-primary" style={{ width: 'auto' }}>
                <Share2 className="h-4 w-4" /> Conversar com um especialista
              </Link>
            </div>
          </>
        )}
      </article>

      <Footer />
    </div>
  )
}
