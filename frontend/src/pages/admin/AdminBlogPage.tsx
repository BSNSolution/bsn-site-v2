import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, MessageCircle, Star, StarOff, X } from 'lucide-react'
import { blogApi, authApi } from '@/lib/api'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl?: string
  tags: string[]
  author: {
    id: string
    name: string
  }
  authorId: string
  published: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl: string
  tags: string
  authorId: string
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    tags: '',
    authorId: ''
  })

  useEffect(() => {
    loadPosts()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const user = await authApi.me()
      if (user && user.id) {
        setCurrentUserId(user.id)
        setFormData(prev => ({ ...prev, authorId: user.id }))
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const loadPosts = async () => {
    try {
      setIsLoading(true)
      const data = await blogApi.admin.getPosts()
      if (data) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => {
      const newData = { ...prev, [name]: value }
      
      // Auto-generate slug when title changes
      if (name === 'title' && !editingPost) {
        newData.slug = generateSlug(value)
      }
      
      return newData
    })
  }

  const openCreateModal = () => {
    setEditingPost(null)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      imageUrl: '',
      tags: '',
      authorId: currentUserId
    })
    setShowModal(true)
  }

  const openEditModal = (post: BlogPost) => {
    setEditingPost(post)
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      imageUrl: post.imageUrl || '',
      tags: post.tags.join(', '),
      authorId: post.authorId
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPost(null)
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      imageUrl: '',
      tags: '',
      authorId: currentUserId
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      return
    }

    try {
      setIsSubmitting(true)

      const submitData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        imageUrl: formData.imageUrl,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        authorId: formData.authorId || currentUserId
      }

      if (editingPost) {
        await blogApi.admin.updatePost(editingPost.id, submitData)
      } else {
        await blogApi.admin.createPost(submitData)
      }

      await loadPosts()
      closeModal()
    } catch (error) {
      console.error('Error saving post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (post: BlogPost) => {
    if (!window.confirm(`Tem certeza que deseja excluir o post "${post.title}"?`)) {
      return
    }

    try {
      await blogApi.admin.deletePost(post.id)
      await loadPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  const handleTogglePublished = async (post: BlogPost) => {
    try {
      await blogApi.admin.togglePublished(post.id)
      await loadPosts()
    } catch (error) {
      console.error('Error toggling published:', error)
    }
  }

  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      await blogApi.admin.toggleFeatured(post.id)
      await loadPosts()
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Blog</h1>
            <p className="text-muted-foreground">Gerencie os posts do blog</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Post
          </button>
        </div>

        <div className="glass-card">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Carregando posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum post encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post: BlogPost, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{post.title}</h3>
                        {post.featured && (
                          <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Destaque
                          </span>
                        )}
                        {post.published ? (
                          <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded border border-green-500/20">
                            Publicado
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                            Rascunho
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt || post.content}</p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {post.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleFeatured(post)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={post.featured ? 'Remover destaque' : 'Destacar'}
                      >
                        {post.featured ? (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => handleTogglePublished(post)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={post.published ? 'Despublicar' : 'Publicar'}
                      >
                        {post.published ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(post)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingPost ? 'Editar Post' : 'Novo Post'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Título *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Título do post"
                  />
                </div>

                <div>
                  <label htmlFor="slug" className="block text-sm font-medium mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="slug-da-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe vazio para gerar automaticamente
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="excerpt" className="block text-sm font-medium mb-2">
                  Resumo
                </label>
                <textarea
                  id="excerpt"
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Breve descrição do post..."
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium mb-2">
                  Conteúdo *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  rows={12}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Conteúdo do post..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium mb-2">
                    URL da imagem
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="tag1, tag2, tag3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separadas por vírgula
                  </p>
                </div>
              </div>

              {/* Hidden authorId field */}
              <input
                type="hidden"
                name="authorId"
                value={formData.authorId}
              />

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 glass-card hover:bg-white/10 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-semibold transition-colors"
                >
                  {isSubmitting ? 'Salvando...' : editingPost ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  )
}