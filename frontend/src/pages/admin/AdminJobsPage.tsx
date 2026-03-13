import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, EyeOff, Briefcase, MapPin, Calendar, X } from 'lucide-react'
import { jobsApi } from '@/lib/api'

interface Job {
  id: string
  title: string
  description: string
  location: string
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
  requirements: string[]
  benefits: string[]
  isActive: boolean
  createdAt: string
  updatedAt?: string
  salary?: string
}

interface FormData {
  title: string
  description: string
  location: string
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'
  requirements: string
  benefits: string
  salary: string
}

const jobTypeLabels = {
  'FULL_TIME': 'Tempo Integral',
  'PART_TIME': 'Meio Período',
  'CONTRACT': 'Contrato',
  'INTERNSHIP': 'Estágio'
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    location: '',
    type: 'FULL_TIME',
    requirements: '',
    benefits: '',
    salary: ''
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const data = await jobsApi.admin.getJobs()
      if (data) {
        setJobs(data.jobs || [])
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openCreateModal = () => {
    setEditingJob(null)
    setFormData({
      title: '',
      description: '',
      location: '',
      type: 'FULL_TIME',
      requirements: '',
      benefits: '',
      salary: ''
    })
    setShowModal(true)
  }

  const openEditModal = (job: Job) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location,
      type: job.type,
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements.toString(),
      benefits: Array.isArray(job.benefits) ? job.benefits.join('\n') : job.benefits.toString(),
      salary: job.salary || ''
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingJob(null)
    setFormData({
      title: '',
      description: '',
      location: '',
      type: 'FULL_TIME',
      requirements: '',
      benefits: '',
      salary: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      return
    }

    try {
      setIsSubmitting(true)

      const submitData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        type: formData.type,
        // Convert requirements and benefits to comma-separated strings as expected by backend
        requirements: formData.requirements
          .split('\n')
          .map(req => req.trim())
          .filter(Boolean)
          .join(', '),
        benefits: formData.benefits
          .split('\n')
          .map(benefit => benefit.trim())
          .filter(Boolean)
          .join(', '),
        salary: formData.salary || undefined
      }

      if (editingJob) {
        await jobsApi.admin.updateJob(editingJob.id, submitData)
      } else {
        await jobsApi.admin.createJob(submitData)
      }

      await loadJobs()
      closeModal()
    } catch (error) {
      console.error('Error saving job:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (job: Job) => {
    if (!window.confirm(`Tem certeza que deseja excluir a vaga "${job.title}"?`)) {
      return
    }

    try {
      await jobsApi.admin.deleteJob(job.id)
      await loadJobs()
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  const handleToggleActive = async (job: Job) => {
    try {
      await jobsApi.admin.updateJob(job.id, { isActive: !job.isActive })
      await loadJobs()
    } catch (error) {
      console.error('Error toggling job active status:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Vagas</h1>
            <p className="text-muted-foreground">Gerencie as oportunidades de trabalho</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Vaga
          </button>
        </div>

        <div className="glass-card">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground mt-2">Carregando vagas...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhuma vaga encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job: Job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{job.title}</h3>
                        <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded border border-primary/20">
                          {jobTypeLabels[job.type]}
                        </span>
                        {job.isActive ? (
                          <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded border border-green-500/20">
                            Ativa
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                            Inativa
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(job.createdAt)}
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {job.description}
                      </p>

                      {/* Requirements preview */}
                      {job.requirements && job.requirements.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Requisitos:</h4>
                          <div className="text-sm text-muted-foreground">
                            {Array.isArray(job.requirements) 
                              ? job.requirements.slice(0, 2).join(', ')
                              : job.requirements.split(', ').slice(0, 2).join(', ')
                            }
                            {((Array.isArray(job.requirements) && job.requirements.length > 2) ||
                              (!Array.isArray(job.requirements) && job.requirements.split(', ').length > 2)) && (
                              <span className="text-muted-foreground/60"> ...</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Benefits preview */}
                      {job.benefits && job.benefits.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1">Benefícios:</h4>
                          <div className="text-sm text-muted-foreground">
                            {Array.isArray(job.benefits) 
                              ? job.benefits.slice(0, 2).join(', ')
                              : job.benefits.split(', ').slice(0, 2).join(', ')
                            }
                            {((Array.isArray(job.benefits) && job.benefits.length > 2) ||
                              (!Array.isArray(job.benefits) && job.benefits.split(', ').length > 2)) && (
                              <span className="text-muted-foreground/60"> ...</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleToggleActive(job)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title={job.isActive ? 'Desativar vaga' : 'Ativar vaga'}
                      >
                        {job.isActive ? (
                          <Eye className="h-4 w-4 text-green-500" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(job)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(job)}
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
                {editingJob ? 'Editar Vaga' : 'Nova Vaga'}
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
                <div className="md:col-span-2">
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    Título da vaga *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Desenvolvedor Full Stack"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-2">
                    Localização *
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: Cuiabá, MT"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-2">
                    Tipo de contrato *
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="FULL_TIME">Tempo Integral</option>
                    <option value="PART_TIME">Meio Período</option>
                    <option value="CONTRACT">Contrato</option>
                    <option value="INTERNSHIP">Estágio</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="salary" className="block text-sm font-medium mb-2">
                    Salário (opcional)
                  </label>
                  <input
                    type="text"
                    id="salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Ex: R$ 5.000 - R$ 8.000"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Descrição da vaga *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Descreva a vaga, responsabilidades e o que esperamos do candidato..."
                />
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium mb-2">
                  Requisitos
                </label>
                <textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Digite um requisito por linha:
Experiência com React
Conhecimento em TypeScript
Experiência com APIs REST"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite um requisito por linha
                </p>
              </div>

              <div>
                <label htmlFor="benefits" className="block text-sm font-medium mb-2">
                  Benefícios
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Digite um benefício por linha:
Plano de saúde
Vale refeição
Home office"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digite um benefício por linha
                </p>
              </div>

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
                  {isSubmitting ? 'Salvando...' : editingJob ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </>
  )
}