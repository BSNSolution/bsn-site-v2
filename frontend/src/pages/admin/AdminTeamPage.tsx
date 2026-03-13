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
  Users,
  Mail,
  Phone,
  LinkedinIcon,
  GithubIcon,
  TwitterIcon
} from 'lucide-react'
import { teamApi } from '@/lib/api'

interface TeamMember {
  id: string
  name: string
  role: string
  bio?: string
  avatar?: string
  email?: string
  phone?: string
  social?: {
    linkedin?: string
    github?: string
    twitter?: string
  }
  active: boolean
  createdAt: string
  updatedAt: string
}

interface FormData {
  name: string
  role: string
  bio: string
  avatar: string
  email: string
  phone: string
  linkedin: string
  github: string
  twitter: string
  active: boolean
}

export default function AdminTeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    role: '',
    bio: '',
    avatar: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    twitter: '',
    active: true
  })

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      setIsLoading(true)
      const data = await teamApi.admin.getTeam()
      if (data) {
        setTeam(data.team || [])
      }
    } catch (error) {
      console.error('Error loading team:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      bio: '',
      avatar: '',
      email: '',
      phone: '',
      linkedin: '',
      github: '',
      twitter: '',
      active: true
    })
    setEditingMember(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Prepare data with social links
      const submitData = {
        ...formData,
        social: {
          ...(formData.linkedin && { linkedin: formData.linkedin }),
          ...(formData.github && { github: formData.github }),
          ...(formData.twitter && { twitter: formData.twitter })
        }
      }

      if (editingMember) {
        await teamApi.admin.updateMember(editingMember.id, submitData)
      } else {
        await teamApi.admin.createMember(submitData)
      }
      
      await loadTeam()
      resetForm()
    } catch (error) {
      console.error('Error saving team member:', error)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      avatar: member.avatar || '',
      email: member.email || '',
      phone: member.phone || '',
      linkedin: member.social?.linkedin || '',
      github: member.social?.github || '',
      twitter: member.social?.twitter || '',
      active: member.active
    })
    setShowForm(true)
  }

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Tem certeza que deseja excluir "${member.name}" da equipe?`)) {
      return
    }

    try {
      await teamApi.admin.deleteMember(member.id)
      await loadTeam()
    } catch (error) {
      console.error('Error deleting team member:', error)
    }
  }

  const handleToggle = async (member: TeamMember) => {
    try {
      await teamApi.admin.toggleMember(member.id)
      await loadTeam()
    } catch (error) {
      console.error('Error toggling team member:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os membros da equipe</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Membro
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
                  {editingMember ? 'Editar Membro' : 'Novo Membro'}
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
                      placeholder="ex: CEO, Desenvolvedor Full-stack"
                    />
                  </div>
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

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Biografia
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-none"
                    placeholder="Breve descrição sobre o membro da equipe"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      placeholder="+55 11 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">
                    Redes Sociais
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <LinkedinIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        placeholder="https://linkedin.com/in/usuario"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <GithubIcon className="h-5 w-5 text-gray-800 flex-shrink-0" />
                      <input
                        type="url"
                        value={formData.github}
                        onChange={(e) => setFormData(prev => ({ ...prev, github: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        placeholder="https://github.com/usuario"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <TwitterIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      <input
                        type="url"
                        value={formData.twitter}
                        onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                        className="flex-1 px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        placeholder="https://twitter.com/usuario"
                      />
                    </div>
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
                    Membro ativo
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

      {/* Team Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded mb-3" />
                <div className="h-3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : team.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhum membro encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, index) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card-hover p-6 relative"
            >
              {!member.active && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs bg-muted/50 rounded text-muted-foreground">
                    Inativo
                  </span>
                </div>
              )}

              {/* Avatar */}
              <div className="text-center mb-4">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling!.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto ${member.avatar ? 'hidden' : ''}`}>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>

              {/* Info */}
              <div className="text-center mb-4">
                <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                <p className="text-primary text-sm font-medium mb-2">{member.role}</p>
                {member.bio && (
                  <p className="text-muted-foreground text-sm line-clamp-3">{member.bio}</p>
                )}
              </div>

              {/* Contact & Social */}
              <div className="space-y-2 mb-4">
                {member.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                
                {member.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{member.phone}</span>
                  </div>
                )}

                {member.social && Object.keys(member.social).length > 0 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {member.social.linkedin && (
                      <a 
                        href={member.social.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-blue-600 transition-colors"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.github && (
                      <a 
                        href={member.social.github} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-gray-800 transition-colors"
                      >
                        <GithubIcon className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a 
                        href={member.social.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-muted-foreground hover:text-blue-400 transition-colors"
                      >
                        <TwitterIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => handleToggle(member)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title={member.active ? 'Desativar' : 'Ativar'}
                >
                  {member.active ? (
                    <Eye className="h-4 w-4 text-green-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(member)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(member)}
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
  )
}