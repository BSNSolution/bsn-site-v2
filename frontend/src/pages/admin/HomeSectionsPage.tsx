import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { homeApi } from '@/lib/api'

interface HomeSection {
  id: string
  title: string
  subtitle?: string
  content?: string
  image?: string
  order: number
  active: boolean
  type: 'hero' | 'about' | 'stats' | 'cta' | 'custom'
  createdAt: string
  updatedAt: string
}

interface FormData {
  title: string
  subtitle: string
  content: string
  image: string
  type: 'hero' | 'about' | 'stats' | 'cta' | 'custom'
  active: boolean
}

const sectionTypes = [
  { value: 'hero', label: 'Hero/Banner' },
  { value: 'about', label: 'Sobre' },
  { value: 'stats', label: 'Estatísticas' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'custom', label: 'Personalizada' }
]

export default function HomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState<HomeSection | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    subtitle: '',
    content: '',
    image: '',
    type: 'custom',
    active: true
  })
  const [draggedSection, setDraggedSection] = useState<HomeSection | null>(null)

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = async () => {
    try {
      setIsLoading(true)
      const response = await homeApi.admin.getSections()
      if (response.data) {
        setSections(response.data.sort((a: HomeSection, b: HomeSection) => a.order - b.order))
      }
    } catch (error) {
      console.error('Error loading sections:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      content: '',
      image: '',
      type: 'custom',
      active: true
    })
    setEditingSection(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSection) {
        await homeApi.admin.updateSection(editingSection.id, formData)
      } else {
        await homeApi.admin.createSection(formData)
      }
      
      await loadSections()
      resetForm()
    } catch (error) {
      console.error('Error saving section:', error)
    }
  }

  const handleEdit = (section: HomeSection) => {
    setEditingSection(section)
    setFormData({
      title: section.title,
      subtitle: section.subtitle || '',
      content: section.content || '',
      image: section.image || '',
      type: section.type,
      active: section.active
    })
    setShowForm(true)
  }

  const handleDelete = async (section: HomeSection) => {
    if (!confirm(`Tem certeza que deseja excluir a seção "${section.title}"?`)) {
      return
    }

    try {
      await homeApi.admin.deleteSection(section.id)
      await loadSections()
    } catch (error) {
      console.error('Error deleting section:', error)
    }
  }

  const handleToggle = async (section: HomeSection) => {
    try {
      await homeApi.admin.toggleSection(section.id)
      await loadSections()
    } catch (error) {
      console.error('Error toggling section:', error)
    }
  }

  const handleReorder = async (newSections: HomeSection[]) => {
    try {
      const items = newSections.map((section, index) => ({
        id: section.id,
        order: index + 1
      }))
      
      await homeApi.admin.reorderSections(items)
      setSections(newSections)
    } catch (error) {
      console.error('Error reordering sections:', error)
    }
  }

  const handleDragStart = (section: HomeSection) => {
    setDraggedSection(section)
  }

  const handleDragOver = (e: React.DragEvent, targetSection: HomeSection) => {
    e.preventDefault()
    
    if (!draggedSection || draggedSection.id === targetSection.id) {
      return
    }

    const draggedIndex = sections.findIndex(s => s.id === draggedSection.id)
    const targetIndex = sections.findIndex(s => s.id === targetSection.id)

    const newSections = [...sections]
    const [draggedItem] = newSections.splice(draggedIndex, 1)
    newSections.splice(targetIndex, 0, draggedItem)

    setSections(newSections)
  }

  const handleDragEnd = () => {
    if (draggedSection) {
      handleReorder(sections)
    }
    setDraggedSection(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Seções da Home</h1>
          <p className="text-muted-foreground">Gerencie as seções da página inicial</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Seção
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
                  {editingSection ? 'Editar Seção' : 'Nova Seção'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Tipo da Seção
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  >
                    {sectionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Conteúdo
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
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

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-input border-border rounded focus:ring-primary/50 focus:ring-2"
                  />
                  <label htmlFor="active" className="text-sm font-medium">
                    Seção ativa
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

      {/* Sections List */}
      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando seções...</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma seção encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                draggable
                onDragStart={() => handleDragStart(section)}
                onDragOver={(e) => handleDragOver(e, section)}
                onDragEnd={handleDragEnd}
                className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-move"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                {section.image && (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src={section.image} 
                      alt={section.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = '<div class="w-5 h-5 text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z" /></svg></div>'
                      }}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{section.title}</h3>
                    <span className="px-2 py-1 text-xs bg-muted rounded text-muted-foreground">
                      {sectionTypes.find(t => t.value === section.type)?.label || section.type}
                    </span>
                    {!section.active && (
                      <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                        Inativa
                      </span>
                    )}
                  </div>
                  {section.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {section.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(section)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={section.active ? 'Desativar' : 'Ativar'}
                  >
                    {section.active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(section)}
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