import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, User, Tag, ArrowLeft, Share2, Twitter, Facebook, Linkedin, Copy } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { blogApi } from '@/lib/api'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl?: string
  tags: string[]
  author: {
    name: string
    avatar?: string
    bio?: string
  }
  createdAt: string
  updatedAt?: string
  isPublished: boolean
  readTime?: number
  views?: number
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const calculateReadTime = (content?: string) => {
  if (!content) return 1
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    if (slug) {
      loadPost(slug)
    }
  }, [slug])

  const loadPost = async (postSlug: string) => {
    try {
      setIsLoading(true)
      setError('')
      const data = await blogApi.getPost(postSlug)
      if (data && data.post) {
        setPost(data.post)
        // Update page title
        document.title = `${data.post.title} - BSN Solution Blog`
      } else {
        setError('Post não encontrado')
      }
    } catch (error) {
      console.error('Erro ao carregar post:', error)
      setError('Erro ao carregar o post')
    } finally {
      setIsLoading(false)
    }
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = post?.title || ''
  const shareDescription = post?.excerpt || ''

  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const shareOnLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'width=600,height=400')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // You could add a toast notification here
      setShowShareMenu(false)
    } catch (error) {
      console.error('Erro ao copiar link:', error)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <main id="main-content" className="pt-16 min-h-screen">
          <div className="section-spacing">
            <div className="container-custom">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Error state
  if (error || !post) {
    return (
      <>
        <Header />
        <main id="main-content" className="pt-16 min-h-screen">
          <div className="section-spacing">
            <div className="container-custom">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-4xl font-bold mb-6">Post não encontrado</h1>
                  <p className="text-muted-foreground mb-8">
                    O post que você está procurando não existe ou foi removido.
                  </p>
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o blog
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main id="main-content" className="pt-16 min-h-screen">
        <article>
          {/* Back Link */}
          <section className="py-8 border-b border-border">
            <div className="container-custom">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o blog
                </Link>
              </motion.div>
            </div>
          </section>

          {/* Header */}
          <header className="section-spacing">
            <div className="container-custom">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-12"
                >
                  {/* Meta */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.author.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(post.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.readTime || calculateReadTime(post.content)} min de leitura
                    </div>
                  </div>

                  {/* Title */}
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
                    {post.title}
                  </h1>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8">
                      {post.excerpt}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full border border-primary/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Share Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="inline-flex items-center gap-2 px-6 py-3 glass-card hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                      Compartilhar
                    </button>

                    {/* Share Menu */}
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 glass-card p-4 rounded-lg shadow-xl min-w-[200px] z-10"
                      >
                        <div className="space-y-2">
                          <button
                            onClick={shareOnTwitter}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left"
                          >
                            <Twitter className="h-4 w-4" />
                            Twitter
                          </button>
                          <button
                            onClick={shareOnFacebook}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left"
                          >
                            <Facebook className="h-4 w-4" />
                            Facebook
                          </button>
                          <button
                            onClick={shareOnLinkedIn}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left"
                          >
                            <Linkedin className="h-4 w-4" />
                            LinkedIn
                          </button>
                          <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-left"
                          >
                            <Copy className="h-4 w-4" />
                            Copiar link
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Featured Image */}
                {post.imageUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-16"
                  >
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-64 md:h-96 object-cover rounded-2xl"
                      loading="lazy"
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <section className="pb-20">
            <div className="container-custom">
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="prose prose-invert max-w-none"
                  style={{
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {/* Render content - assuming it's HTML */}
                  <div
                    dangerouslySetInnerHTML={{ __html: post.content }}
                    className="prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-8 prose-p:mb-6 prose-p:leading-relaxed prose-a:text-primary prose-a:hover:text-primary/80 prose-strong:text-foreground prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:p-4 prose-blockquote:rounded-r-lg prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-ul:mb-6 prose-ol:mb-6 prose-li:mb-2"
                  />

                  {/* If content is plain text, render as paragraphs */}
                  {post.content && !post.content.includes('<') && (
                    <div className="space-y-6">
                      {(post.content || '').split('\n\n').map((paragraph, index) => (
                        <p key={index} className="leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </section>

          {/* Author Section */}
          {post.author.bio && (
            <section className="py-16 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
              <div className="container-custom">
                <div className="max-w-4xl mx-auto">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="glass-card p-8"
                  >
                    <div className="flex items-start gap-6">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <User className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">
                          Sobre o autor
                        </h3>
                        <h4 className="text-lg text-primary font-semibold mb-3">
                          {post.author.name}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {post.author.bio}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </section>
          )}

          {/* Related/Navigation */}
          <section className="py-16">
            <div className="container-custom">
              <div className="max-w-4xl mx-auto text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h3 className="text-2xl font-bold mb-6">
                    Continue explorando
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      to="/blog"
                      className="inline-flex items-center gap-2 px-6 py-3 glass-card hover:bg-white/10 rounded-lg font-semibold transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Todos os posts
                    </Link>
                    <Link
                      to="/contato"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
                    >
                      Entre em contato
                    </Link>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        </article>

        {/* Click outside to close share menu */}
        {showShareMenu && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowShareMenu(false)}
          />
        )}
      </main>
      <Footer />
    </>
  )
}