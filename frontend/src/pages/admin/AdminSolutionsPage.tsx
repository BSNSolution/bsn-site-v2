import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  StarOff,
  Save,
  X,
  Settings,
  Zap,
  ExternalLink
} from 'lucide-react'
import { solutionsApi } from '@/lib/api'

interface Solution {
  id: string
  title: string
  description: string
  longDescription?: string
  icon?: string
  image?: string
  features?: string[]
  technologies?: string[]
  category?: string
  active: boolean
  featured: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  title: string
  description: string
  longDescription: string
  icon: string
  image: string
  features: string[]
  technologies: string[]
  category: string
  active: boolean
  featured: boolean
}

const categories = [
  'Web Development',
  'Mobile Apps',
  'Desktop Software',
  'E-commerce',
  'Sistemas Integrados',
  'APIs',
  'Automação',
  'DevOps',
  'Consultoria',
  'Outros'
]

export default function AdminSolutionsPage() {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    longDescription: '',
    icon: '',
    image: '',
    features: [],
    technologies: [],
    category: '',
    active: true,
    featured: false
  })

  useEffect(() => {
    loadSolutions()
  }, [])

  const loadSolutions = async () => {
    try {
      setIsLoading(true)
      const data = await solutionsApi.admin.getSolutions()
      if (data) {
        setSolutions(data.solutions || [])
      }
    } catch (error) {
      console.error('Error loading solutions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      longDescription: '',
      icon: '',
      image: '',
      features: [],
      technologies: [],
      category: '',
      active: true,
      featured: false
    })
    setEditingSolution(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSolution) {
        await solutionsApi.admin.updateSolution(editingSolution.id, formData)
      } else {
        await solutionsApi.admin.createSolution(formData)
      }
      
      await loadSolutions()
      resetForm()
    } catch (error) {
      console.error('Error saving solution:', error)
    }
  }

  const handleEdit = (solution: Solution) => {
    setEditingSolution(solution)
    setFormData({
      title: solution.title,
      description: solution.description,
      longDescription: solution.longDescription || '',
      icon: solution.icon || '',
      image: solution.image || '',
      features: solution.features || [],
      technologies: solution.technologies || [],
      category: solution.category || '',
      active: solution.active,
      featured: solution.featured
    })
    setShowForm(true)
  }

  const handleDelete = async (solution: Solution) => {
    if (!confirm(`Tem certeza que deseja excluir a solução "${solution.title}"?`)) {
      return
    }

    try {
      await solutionsApi.admin.deleteSolution(solution.id)
      await loadSolutions()
    } catch (error) {
      console.error('Error deleting solution:', error)
    }
  }

  const handleToggle = async (solution: Solution) => {
    try {
      await solutionsApi.admin.toggleSolution(solution.id)
      await loadSolutions()
    } catch (error) {
      console.error('Error toggling solution:', error)
    }
  }

  const handleToggleFeatured = async (solution: Solution) => {
    try {
      await solutionsApi.admin.toggleFeatured(solution.id)
      await loadSolutions()
    } catch (error) {
      console.error('Error toggling featured:', error)
    }
  }

  const addListItem = (field: 'features' | 'technologies') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }))
  }

  const removeListItem = (field: 'features' | 'technologies', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateListItem = (field: 'features' | 'technologies', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Soluções</h1>
          <p className="text-muted-foreground">Gerencie as soluções desenvolvidas</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Solução
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
              className="glass-card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingSolution ? 'Editar Solução' : 'Nova Solução'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ícone (Lucide React)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="ex: Settings, Zap, Database"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL da Imagem
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="https://exemplo.com/imagem.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição Breve *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    required
                    placeholder="Descrição resumida da solução"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição Detalhada
                  </label>
                  <textarea
                    value={formData.longDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    placeholder="Descrição completa e detalhada da solução"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Features */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">
                        Características/Recursos
                      </label>
                      <button
                        type="button"
                        onClick={() => addListItem('features')}
                        className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => updateListItem('features', index, e.target.value)}
                            className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                            placeholder="Recurso da solução"
                          />
                          <button
                            type="button"
                            onClick={() => removeListItem('features', index)}
                            className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {formData.features.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhum recurso adicionado
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Technologies */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium">
                        Tecnologias
                      </label>
                      <button
                        type="button"
                        onClick={() => addListItem('technologies')}
                        className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded transition-colors"
                      >
                        Adicionar
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.technologies.map((tech, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={tech}
                            onChange={(e) => updateListItem('technologies', index, e.target.value)}
                            className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                            placeholder="ex: React, Node.js, PostgreSQL"
                          />
                          <button
                            type="button"
                            onClick={() => removeListItem('technologies', index)}
                            className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {formData.technologies.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          Nenhuma tecnologia adicionada
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active"
                      checked={formData.active}
                      onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                      className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50 focus:ring-2"
                    />
                    <label htmlFor="active" className="text-sm font-medium">
                      Solução ativa
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50 focus:ring-2"
                    />
                    <label htmlFor="featured" className="text-sm font-medium">
                      Solução em destaque
                    </label>
                  </div>
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

      {/* Solutions List */}
      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando soluções...</p>
          </div>
        ) : solutions.length === 0 ? (
          <div className="p-8 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhuma solução encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors"
              >
                {solution.image && (
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src={solution.image} 
                      alt={solution.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<div class="w-8 h-8 text-muted-foreground">${solution.icon ? solution.icon : '<Settings />'}</div>`
                      }}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{solution.title}</h3>
                    {solution.category && (
                      <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-500 rounded border border-blue-500/20">
                        {solution.category}
                      </span>
                    )}
                    {solution.featured && (
                      <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded border border-yellow-500/20 flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        Destaque
                      </span>
                    )}
                    {!solution.active && (
                      <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                        Inativa
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {solution.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {solution.features && solution.features.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {solution.features.slice(0, 2).map((feature, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {solution.technologies && solution.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {solution.technologies.slice(0, 3).map((tech, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-accent/10 text-accent rounded">
                            {tech}
                          </span>
                        ))}
                        {solution.technologies.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                            +{solution.technologies.length - 3} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFeatured(solution)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={solution.featured ? 'Remover destaque' : 'Destacar'}
                  >
                    {solution.featured ? (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(solution)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={solution.active ? 'Desativar' : 'Ativar'}
                  >
                    {solution.active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(solution)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(solution)}
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