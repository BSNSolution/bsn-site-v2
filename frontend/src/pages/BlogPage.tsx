import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, User, Tag, ChevronRight, Search, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
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
  }
  createdAt: string
  isPublished: boolean
  readTime?: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const calculateReadTime = (content: string) => {
  const wordsPerMinute = 200
  const words = content.split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string>('')
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    loadPosts()
    loadTags()
  }, [currentPage, selectedTag])

  useEffect(() => {
    if (searchTerm) {
      const delayedSearch = setTimeout(() => {
        setCurrentPage(1)
        loadPosts()
      }, 500)
      
      return () => clearTimeout(delayedSearch)
    }
  }, [searchTerm])

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const params = {
        page: currentPage,
        limit: pagination.limit,
        ...(selectedTag && { tag: selectedTag }),
        ...(searchTerm && { search: searchTerm })
      }
      
      const data = await blogApi.getPosts(params)
      if (data) {
        setPosts(data.posts || [])
        setPagination(data.pagination || pagination)
      }
    } catch (error) {
      console.error('Erro ao carregar posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTags = async () => {
    try {
      const data = await blogApi.getTags()
      if (data && data.tags) {
        setAvailableTags(data.tags)
      }
    } catch (error) {
      console.error('Erro ao carregar tags:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedTag('')
    setCurrentPage(1)
  }

  return (
    <>
      <Header />
      <main id="main-content" className="pt-16 min-h-screen">
        {/* Hero Section */}
        <section className="section-spacing">
          <div className="container-custom text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 hero-text">
                <span className="gradient-text">Blog</span> & Insights
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Compartilhamos conhecimento, tendências e insights do mundo da tecnologia
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="pb-16">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-card p-6"
            >
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Pesquisar posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Tag Filter */}
                {availableTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag('')}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        !selectedTag
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      Todos
                    </button>
                    {availableTags.slice(0, 5).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          tag === selectedTag
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Clear Filters */}
                {(searchTerm || selectedTag) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="pb-20">
          <div className="container-custom">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Filter className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-semibold mb-4">Nenhum post encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedTag
                    ? 'Tente ajustar os filtros para encontrar mais conteúdo.'
                    : 'Em breve teremos ótimos conteúdos para compartilhar.'}
                </p>
                {(searchTerm || selectedTag) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-6 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    Limpar filtros
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.id}
                      variants={cardVariants}
                    >
                      <Link
                        to={`/blog/${post.slug}`}
                        className="glass-card-hover group block overflow-hidden"
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                          {post.imageUrl ? (
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-48 flex items-center justify-center">
                              <div className="text-6xl opacity-20">📝</div>
                            </div>
                          )}
                          
                          {/* Read Time Overlay */}
                          <div className="absolute top-4 right-4">
                            <span className="px-3 py-1 text-xs bg-black/50 text-white rounded-full backdrop-blur-sm flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime || calculateReadTime(post.content)} min
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                          {/* Meta */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {post.author.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(post.createdAt)}
                            </div>
                          </div>

                          {/* Title */}
                          <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          <p className="text-muted-foreground mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>

                          {/* Tags */}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags.slice(0, 3).map((tag, tagIndex) => (
                                <span
                                  key={tagIndex}
                                  className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20"
                                >
                                  {tag}
                                </span>
                              ))}
                              {post.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs text-muted-foreground">
                                  +{post.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Read More */}
                          <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                            Ler mais
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </motion.div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex justify-center mt-16"
                  >
                    <div className="flex gap-2">
                      {/* Previous */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>

                      {/* Page Numbers */}
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            page === currentPage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      {/* Next */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                        className="px-4 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Próximo
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
          <div className="container-custom text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Não perca nenhuma novidade
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Receba nossos insights e atualizações diretamente em seu email
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Seu melhor email"
                  className="flex-1 px-6 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors">
                  Inscrever-se
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}