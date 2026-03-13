import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, MessageCircle, Star, StarOff } from 'lucide-react'
import { blogApi } from '@/lib/api'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

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

  const handleTogglePublished = async (post: any) => {
    try {
      await blogApi.admin.togglePublished(post.id)
      await loadPosts()
    } catch (error) {
      console.error('Error toggling published:', error)
    }
  }

  const handleToggleFeatured = async (post: any) => {
    try {
      await blogApi.admin.toggleFeatured(post.id)
      await loadPosts()
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Blog</h1>
          <p className="text-muted-foreground">Gerencie os posts do blog</p>
        </div>
        <button
          onClick={() => {/* TODO: Implement form */}}
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
            {posts.map((post: any, index) => (
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
                      onClick={() => {/* TODO: Edit form */}}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {/* TODO: Delete */}}
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
  )
}