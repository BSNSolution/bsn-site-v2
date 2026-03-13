import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Users, DollarSign, Calendar, ChevronRight, Briefcase, Star, Send } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { jobsApi, uploadApi } from '@/lib/api'

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
  salary?: string
  experience?: string
}

interface JobApplication {
  name: string
  email: string
  phone: string
  resume: File | null
  coverLetter: string
}

const jobTypeLabels = {
  'FULL_TIME': 'Tempo Integral',
  'PART_TIME': 'Meio Período',
  'CONTRACT': 'Contrato',
  'INTERNSHIP': 'Estágio'
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [application, setApplication] = useState<JobApplication>({
    name: '',
    email: '',
    phone: '',
    resume: null,
    coverLetter: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      const data = await jobsApi.getJobs()
      if (data && data.jobs) {
        setJobs(data.jobs.filter((job: Job) => job.isActive !== false))
      }
    } catch (error) {
      console.error('Erro ao carregar vagas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openApplicationModal = (job: Job) => {
    setSelectedJob(job)
    setShowApplicationModal(true)
    setSubmitStatus('idle')
    setApplication({
      name: '',
      email: '',
      phone: '',
      resume: null,
      coverLetter: ''
    })
  }

  const closeApplicationModal = () => {
    setShowApplicationModal(false)
    setSelectedJob(null)
    setSubmitStatus('idle')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setApplication(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setApplication(prev => ({ ...prev, resume: file }))
  }

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedJob) return

    // Basic validation
    if (!application.name.trim() || !application.email.trim() || !application.resume) {
      setSubmitStatus('error')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitStatus('idle')

      // Upload resume first
      const resumeUpload = await uploadApi.uploadResume(application.resume)
      
      // Submit application
      await jobsApi.applyToJob(selectedJob.id, {
        name: application.name,
        email: application.email,
        phone: application.phone,
        resumeUrl: resumeUpload.url,
        coverLetter: application.coverLetter
      })

      setSubmitStatus('success')
      
      // Auto-close modal after success
      setTimeout(() => {
        closeApplicationModal()
      }, 2000)

    } catch (error) {
      console.error('Erro ao enviar candidatura:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <>
      <Header />
      <main id="main-content" className="pt-16 min-h-screen">
        {/* Hero Section */}
        <section className="section-spacing">
          <div className="container-custom text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 hero-text">
                <span className="gradient-text">Carreiras</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Junte-se à nossa equipe e faça parte de projetos inovadores que transformam o mundo digital
              </p>
            </motion.div>
          </div>
        </section>

        {/* Why Work With Us */}
        <section className="pb-20">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que trabalhar <span className="gradient-text">conosco?</span>
              </h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[
                {
                  icon: Star,
                  title: 'Projetos Desafiadores',
                  description: 'Trabalhe em projetos inovadores com tecnologias de ponta e clientes renomados.'
                },
                {
                  icon: Users,
                  title: 'Equipe Colaborativa',
                  description: 'Ambiente de trabalho inclusivo e colaborativo, onde sua voz é ouvida e valorizada.'
                },
                {
                  icon: Briefcase,
                  title: 'Crescimento Profissional',
                  description: 'Oportunidades de desenvolvimento, treinamentos e progressão de carreira.'
                },
                {
                  icon: DollarSign,
                  title: 'Benefícios Atrativos',
                  description: 'Salário competitivo, plano de saúde, vale refeição e outros benefícios.'
                },
                {
                  icon: Clock,
                  title: 'Flexibilidade',
                  description: 'Horários flexíveis e possibilidade de trabalho remoto e híbrido.'
                },
                {
                  icon: MapPin,
                  title: 'Localização Privilegiada',
                  description: 'Escritório moderno em Cuiabá com toda infraestrutura necessária.'
                }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  className="glass-card-hover p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <benefit.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Job Listings */}
        <section className="pb-20">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Vagas <span className="gradient-text">Disponíveis</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Confira as oportunidades abertas e candidate-se à vaga que mais combina com seu perfil
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-semibold mb-4">Nenhuma vaga disponível no momento</h3>
                <p className="text-muted-foreground mb-6">
                  Não encontramos vagas abertas, mas estamos sempre crescendo! Envie seu currículo para futuras oportunidades.
                </p>
                <button
                  onClick={() => openApplicationModal({ 
                    id: 'spontaneous', 
                    title: 'Candidatura Espontânea',
                    description: 'Envie seu currículo para futuras oportunidades',
                    location: 'Cuiabá, MT',
                    type: 'FULL_TIME',
                    requirements: [],
                    benefits: [],
                    isActive: true,
                    createdAt: new Date().toISOString()
                  })}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
                >
                  Enviar currículo
                  <Send className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-6"
              >
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    variants={cardVariants}
                    className="glass-card-hover p-8"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-4">
                          <h3 className="text-2xl font-bold">{job.title}</h3>
                          <span className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full border border-primary/20">
                            {jobTypeLabels[job.type]}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Publicado em {formatDate(job.createdAt)}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              {job.salary}
                            </div>
                          )}
                        </div>

                        <p className="text-muted-foreground leading-relaxed mb-6 line-clamp-3">
                          {job.description}
                        </p>

                        {/* Requirements Preview */}
                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">Requisitos principais:</h4>
                            <ul className="text-muted-foreground text-sm">
                              {job.requirements.slice(0, 3).map((req, reqIndex) => (
                                <li key={reqIndex} className="flex items-start gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  {req}
                                </li>
                              ))}
                              {job.requirements.length > 3 && (
                                <li className="text-muted-foreground/60">
                                  +{job.requirements.length - 3} requisitos adicionais
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => openApplicationModal(job)}
                          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors whitespace-nowrap"
                        >
                          Candidatar-se
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <button className="px-6 py-3 glass-card hover:bg-white/10 rounded-lg font-medium transition-colors whitespace-nowrap">
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Company Culture */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Nossa <span className="gradient-text">Cultura</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Acreditamos que pessoas felizes criam soluções extraordinárias
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Inovação', desc: 'Sempre buscamos novas formas de resolver problemas' },
                { title: 'Transparência', desc: 'Comunicação clara e feedback constante' },
                { title: 'Diversidade', desc: 'Valorizamos diferentes perspectivas e experiências' },
                { title: 'Aprendizado', desc: 'Crescimento contínuo pessoal e profissional' }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6 text-center"
                >
                  <h3 className="text-lg font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm">{value.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      {/* Application Modal */}
      {showApplicationModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Candidatar-se para {selectedJob.title}</h2>
              <button
                onClick={closeApplicationModal}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-6">
              <div>
                <label htmlFor="modal-name" className="block text-sm font-medium mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  id="modal-name"
                  name="name"
                  value={application.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label htmlFor="modal-email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="modal-email"
                  name="email"
                  value={application.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label htmlFor="modal-phone" className="block text-sm font-medium mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="modal-phone"
                  name="phone"
                  value={application.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label htmlFor="modal-resume" className="block text-sm font-medium mb-2">
                  Currículo (PDF) *
                </label>
                <input
                  type="file"
                  id="modal-resume"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div>
                <label htmlFor="modal-cover-letter" className="block text-sm font-medium mb-2">
                  Carta de apresentação
                </label>
                <textarea
                  id="modal-cover-letter"
                  name="coverLetter"
                  value={application.coverLetter}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-vertical"
                  placeholder="Conte-nos por que você é a pessoa ideal para esta vaga..."
                />
              </div>

              {submitStatus === 'success' && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
                  Candidatura enviada com sucesso!
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
                  Erro ao enviar candidatura. Verifique os dados e tente novamente.
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={closeApplicationModal}
                  className="flex-1 px-6 py-3 glass-card hover:bg-white/10 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-semibold transition-colors"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar candidatura'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <Footer />
    </>
  )
}