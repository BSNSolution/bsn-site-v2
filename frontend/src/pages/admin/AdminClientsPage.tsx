import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, Building2 } from 'lucide-react'
import { clientsApi } from '@/lib/api'

export default function AdminClientsPage() {
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)

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

  const handleToggle = async (client: any) => {
    try {
      await clientsApi.admin.toggleClient(client.id)
      await loadClients()
    } catch (error) {
      console.error('Error toggling client:', error)
    }
  }

  const handleDelete = async (client: any) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${client.name}"?`)) {
      return
    }

    try {
      await clientsApi.admin.deleteClient(client.id)
      await loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Clientes</h1>
          <p className="text-muted-foreground">Gerencie os clientes da empresa</p>
        </div>
        <button
          onClick={() => {/* TODO: Implement form */}}
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
            {clients.map((client: any, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {client.logo && (
                    <img 
                      src={client.logo} 
                      alt={client.name}
                      className="w-12 h-12 object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{client.name}</h3>
                    {client.description && (
                      <p className="text-sm text-muted-foreground">{client.description}</p>
                    )}
                  </div>
                  {!client.active && (
                    <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                      Inativo
                    </span>
                  )}
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
                    onClick={() => {/* TODO: Edit form */}}
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}