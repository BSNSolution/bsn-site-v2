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
  Briefcase,
  ExternalLink
} from 'lucide-react'
import { servicesApi } from '@/lib/api'

interface Service {
  id: string
  title: string
  description: string
  icon?: string
  image?: string
  features?: string[]
  price?: string
  duration?: string
  active: boolean
  order: number
  createdAt: string
  updatedAt: string
}

interface FormData {
  title: string
  description: string
  icon: string
  image: string
  features: string[]
  price: string
  duration: string
  active: boolean
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    icon: '',
    image: '',
    features: [],
    price: '',
    duration: '',
    active: true
  })
  const [draggedService, setDraggedService] = useState<Service | null>(null)

  useEffect(() => {
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      setIsLoading(true)
      const data = await servicesApi.admin.getServices()
      if (data) {
        setServices((data.services || []).sort((a: Service, b: Service) => a.order - b.order))
      }
    } catch (error) {
      console.error('Error loading services:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: '',
      image: '',
      features: [],
      price: '',
      duration: '',
      active: true
    })
    setEditingService(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingService) {
        await servicesApi.admin.updateService(editingService.id, formData)
      } else {
        await servicesApi.admin.createService(formData)
      }
      
      await loadServices()
      resetForm()
    } catch (error) {
      console.error('Error saving service:', error)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      title: service.title,
      description: service.description,
      icon: service.icon || '',
      image: service.image || '',
      features: service.features || [],
      price: service.price || '',
      duration: service.duration || '',
      active: service.active
    })
    setShowForm(true)
  }

  const handleDelete = async (service: Service) => {
    if (!confirm(`Tem certeza que deseja excluir o serviço "${service.title}"?`)) {
      return
    }

    try {
      await servicesApi.admin.deleteService(service.id)
      await loadServices()
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  const handleToggle = async (service: Service) => {
    try {
      await servicesApi.admin.toggleService(service.id)
      await loadServices()
    } catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const handleReorder = async (newServices: Service[]) => {
    try {
      const items = newServices.map((service, index) => ({
        id: service.id,
        order: index + 1
      }))
      
      await servicesApi.admin.reorderServices(items)
      setServices(newServices)
    } catch (error) {
      console.error('Error reordering services:', error)
    }
  }

  const handleDragStart = (service: Service) => {
    setDraggedService(service)
  }

  const handleDragOver = (e: React.DragEvent, targetService: Service) => {
    e.preventDefault()
    
    if (!draggedService || draggedService.id === targetService.id) {
      return
    }

    const draggedIndex = services.findIndex(s => s.id === draggedService.id)
    const targetIndex = services.findIndex(s => s.id === targetService.id)

    const newServices = [...services]
    const [draggedItem] = newServices.splice(draggedIndex, 1)
    newServices.splice(targetIndex, 0, draggedItem)

    setServices(newServices)
  }

  const handleDragEnd = () => {
    if (draggedService) {
      handleReorder(services)
    }
    setDraggedService(null)
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Serviços</h1>
          <p className="text-muted-foreground">Gerencie os serviços oferecidos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Serviço
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
              className="glass-card p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
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
                      Ícone (Lucide React)
                    </label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="ex: Briefcase, Code, Smartphone"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Descrição *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    required
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Preço
                    </label>
                    <input
                      type="text"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="ex: R$ 1.500,00 ou Sob consulta"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Duração
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="ex: 2-4 semanas"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Características/Recursos
                    </label>
                    <button
                      type="button"
                      onClick={addFeature}
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
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                          placeholder="Característica do serviço"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {formData.features.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhuma característica adicionada
                      </p>
                    )}
                  </div>
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
                    Serviço ativo
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

      {/* Services List */}
      <div className="glass-card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-2">Carregando serviços...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="p-8 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Nenhum serviço encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                draggable
                onDragStart={() => handleDragStart(service)}
                onDragOver={(e) => handleDragOver(e, service)}
                onDragEnd={handleDragEnd}
                className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors cursor-move"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                {service.image && (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.parentElement!.innerHTML = `<div class="w-6 h-6 text-muted-foreground">${service.icon ? service.icon : '<Briefcase />'}</div>`
                      }}
                    />
                  </div>
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{service.title}</h3>
                    {service.price && (
                      <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded border border-green-500/20">
                        {service.price}
                      </span>
                    )}
                    {!service.active && (
                      <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {service.description}
                  </p>
                  {service.features && service.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 3).map((feature, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                          {feature}
                        </span>
                      ))}
                      {service.features.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                          +{service.features.length - 3} mais
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(service)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title={service.active ? 'Desativar' : 'Ativar'}
                  >
                    {service.active ? (
                      <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(service)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service)}
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