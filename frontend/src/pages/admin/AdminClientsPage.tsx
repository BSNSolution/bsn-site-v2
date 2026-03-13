import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, Building2, X, ExternalLink } from 'lucide-react'
import { clientsApi } from '@/lib/api'

interface Client {
  id: string
  name: string
  description?: string
  logoUrl: string // REQUIRED by backend Zod validation
  websiteUrl?: string // Additional field
  active: boolean
  createdAt: string
  updatedAt?: string
}

interface FormData {
  name: string
  description: string
  logoUrl: string
  websiteUrl: string
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    logoUrl: '',
    websiteUrl: ''
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setIsLoading(true)
      const data = await clientsApi.admin.getClients()
      if (data) {
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openCreateModal = () => {
    setEditingClient(null)
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      websiteUrl: ''
    })
    setShowModal(true)
  }

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      description: client.description || '',
      logoUrl: client.logoUrl,
      websiteUrl: client.websiteUrl || ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingClient(null)
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      websiteUrl: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.logoUrl.trim()) {
      return
    }

    try {
      setIsSubmitting(true)

      const submitData = {
        name: formData.name,
        description: formData.description,
        logoUrl: formData.logoUrl, // REQUIRED field
        websiteUrl: formData.websiteUrl
      }

      if (editingClient) {
        await clientsApi.admin.updateClient(editingClient.id, submitData)
      } else {
        await clientsApi.admin.createClient(submitData)
      }

      await loadClients()
      closeModal()
    } catch (error) {
      console.error('Error saving client:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return
    }

    try {
      await clientsApi.admin.deleteClient(client.id)
      await loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleToggle = async (client: Client) => {
    try {
      await clientsApi.admin.toggleClient(client.id)
      await loadClients()
    } catch (error) {
      console.error('Error toggling client:', error)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Clientes</h1>
            <p className="text-muted-foreground">Gerencie os clientes da empresa</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </button>
        </div>

        <div className="glass-card">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Carregando clientes...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-8 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {clients.map((client: Client, index) => (
                <motion.div
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Logo */}
                      <div className="flex-shrink-0">
                        {client.logoUrl ? (
                          <img 
                            src={client.logoUrl} 
                            alt={client.name}
                            className="w-12 h-12 object-contain rounded bg-white/10 p-1"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{client.name}</h3>
                          {!client.active && (
                            <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                              Inativo
                            </span>
                          )}
                        </div>
                        {client.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {client.description}
                          </p>
                        )}
                        {client.websiteUrl && (
                          <a
                            href={client.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Website
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(client)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={client.active ? 'Desativar' : 'Ativar'}
                      >
                        {client.active ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(client)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client)}
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
            className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Nome do cliente *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Ex: Empresa XYZ"
                />
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium mb-2">
                  URL do logo *
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://exemplo.com/logo.png"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Obrigatório - URL da imagem do logo do cliente
                </p>
              </div>

              <div>
                <label htmlFor="websiteUrl" className="block text-sm font-medium mb-2">
                  Site do cliente
                </label>
                <input
                  type="url"
                  id="websiteUrl"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="https://www.cliente.com.br"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Breve descrição sobre o cliente ou projeto..."
                />
              </div>

              {/* Preview */}
              {formData.logoUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">Preview do logo</label>
                  <div className="glass-card p-4 max-w-xs">
                    <img
                      src={formData.logoUrl}
                      alt="Preview"
                      className="w-full h-20 object-contain rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = ''
                        target.alt = 'Erro ao carregar imagem'
                        target.className = 'w-full h-20 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs'
                      }}
                    />
                  </div>
                </div>
              )}

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
                  {isSubmitting ? 'Salvando...' : editingClient ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  )
}