import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Star,
  Quote,
  User
} from 'lucide-react'
import { testimonialsApi } from '@/lib/api'

interface Testimonial {
  id: string
  name: string
  role: string
  company?: string
  content: string
  avatar?: string
  rating: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  role: string
  company: string
  content: string
  avatar: string
  rating: number
  active: boolean
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: '',
    company: '',
    content: '',
    avatar: '',
    rating: 5,
    active: true
  })

  useEffect(() => {
    loadTestimonials()
  }, [])

  const loadTestimonials = async () => {
    try {
      setIsLoading(true)
      const response = await testimonialsApi.admin.getTestimonials()
      if (response.data) {
        setTestimonials(response.data)
      }
    } catch (error) {
      console.error('Error loading testimonials:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      company: '',
      content: '',
      avatar: '',
      rating: 5,
      active: true
    })
    setEditingTestimonial(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTestimonial) {
        await testimonialsApi.admin.updateTestimonial(editingTestimonial.id, formData)
      } else {
        await testimonialsApi.admin.createTestimonial(formData)
      }
      
      await loadTestimonials()
      resetForm()
    } catch (error) {
      console.error('Error saving testimonial:', error)
    }
  }

  const handleEdit = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial)
    setFormData({
      name: testimonial.name,
      role: testimonial.role,
      company: testimonial.company || '',
      content: testimonial.content,
      avatar: testimonial.avatar || '',
      rating: testimonial.rating,
      active: testimonial.active
    })
    setShowForm(true)
  }

  const handleDelete = async (testimonial: Testimonial) => {
    if (!confirm(`Tem certeza que deseja excluir o depoimento de "${testimonial.name}"?`)) {
      return
    }

    try {
      await testimonialsApi.admin.deleteTestimonial(testimonial.id)
      await loadTestimonials()
    } catch (error) {
      console.error('Error deleting testimonial:', error)
    }
  }

  const handleToggle = async (testimonial: Testimonial) => {
    try {
      await testimonialsApi.admin.toggleTestimonial(testimonial.id)
      await loadTestimonials()
    } catch (error) {
      console.error('Error toggling testimonial:', error)
    }
  }

  const renderStars = (rating: number, editable = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={editable ? () => setFormData(prev => ({ ...prev, rating: star })) : undefined}
            className={`${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!editable}
          >
            <Star
              className={`h-4 w-4 ${
                star <= rating 
                  ? 'text-yellow-500 fill-yellow-500' 
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Depoimentos</h1>
          <p className="text-muted-foreground">Gerencie os depoimentos de clientes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Depoimento
        </button>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingTestimonial ? 'Editar Depoimento' : 'Novo Depoimento'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nome *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Cargo *
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      required
                      placeholder="ex: CEO, Desenvolvedor, Gerente"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL do Avatar
                    </label>
                    <input
                      type="url"
                      value={formData.avatar}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="https://exemplo.com/avatar.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Avaliação *
                  </label>
                  <div className="flex items-center gap-4">
                    {renderStars(formData.rating, true)}
                    <span className="text-sm text-muted-foreground">
                      {formData.rating} de 5 estrelas
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Depoimento *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    required
                    placeholder="O depoimento do cliente..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50 focus:ring-2"
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Depoimento ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonials List */}
      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando depoimentos...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="p-8 text-center">
            <Quote className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum depoimento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 flex gap-4 hover:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {testimonial.avatar ? (
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling!.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-muted rounded-full flex items-center justify-center ${testimonial.avatar ? 'hidden' : ''}`}>
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{testimonial.name}</h3>
                    <span className="text-sm text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      {testimonial.role}
                      {testimonial.company && ` @ ${testimonial.company}`}
                    </span>
                    {!testimonial.active && (
                      <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </div>

                  <div className="mb-2">
                    {renderStars(testimonial.rating)}
                  </div>

                  <blockquote className="text-sm text-muted-foreground line-clamp-3 italic border-l-2 border-primary/20 pl-3">
                    "{testimonial.content}"
                  </blockquote>

                  <div className="mt-2 text-xs text-muted-foreground">
                    Criado em {new Date(testimonial.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(testimonial)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={testimonial.active ? 'Desativar' : 'Ativar'}
                  >
                    {testimonial.active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(testimonial)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(testimonial)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}