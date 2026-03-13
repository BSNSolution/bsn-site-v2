import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { contactApi, settingsApi } from '@/lib/api'

interface ContactForm {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

interface CompanyInfo {
  name: string
  email: string
  phone: string
  address: string
  businessHours: string
  socialMedia: {
    linkedin?: string
    instagram?: string
    twitter?: string
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

const itemVariants = {
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

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'BSN Solution',
    email: 'contato@bsnsolution.com.br',
    phone: '(65) 99999-9999',
    address: 'Cuiabá, MT - Brasil',
    businessHours: 'Segunda a Sexta: 8h às 18h',
    socialMedia: {}
  })

  useEffect(() => {
    loadCompanyInfo()
  }, [])

  const loadCompanyInfo = async () => {
    try {
      const data = await settingsApi.getSettings()
      if (data && data.settings) {
        const settings = data.settings
        setCompanyInfo({
          name: settings.companyName || 'BSN Solution',
          email: settings.contactEmail || 'contato@bsnsolution.com.br',
          phone: settings.contactPhone || '(65) 99999-9999',
          address: settings.address || 'Cuiabá, MT - Brasil',
          businessHours: settings.businessHours || 'Segunda a Sexta: 8h às 18h',
          socialMedia: settings.socialMedia || {}
        })
      }
    } catch (error) {
      console.error('Erro ao carregar informações da empresa:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setSubmitStatus('error')
      setSubmitMessage('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) {
      setSubmitStatus('error')
      setSubmitMessage('Por favor, insira um email válido.')
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitStatus('idle')

      await contactApi.sendMessage({
        name: form.name,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message
      })

      setSubmitStatus('success')
      setSubmitMessage('Mensagem enviada com sucesso! Entraremos em contato em breve.')
      
      // Clear form
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setSubmitStatus('error')
      setSubmitMessage('Erro ao enviar mensagem. Tente novamente mais tarde.')
    } finally {
      setIsSubmitting(false)
    }
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
                <span className="gradient-text">Contato</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Vamos conversar sobre seu próximo projeto. Estamos aqui para transformar suas ideias em realidade.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Content */}
        <section className="pb-20">
          <div className="container-custom">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
              {/* Contact Form */}
              <motion.div variants={itemVariants}>
                <div className="glass-card p-8">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold mb-4">
                      Envie uma mensagem
                    </h2>
                    <p className="text-muted-foreground">
                      Preencha o formulário abaixo e entraremos em contato em até 24 horas.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Nome completo *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                        placeholder="Seu nome completo"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                        placeholder="seu@email.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        Telefone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                        placeholder="(xx) xxxxx-xxxx"
                      />
                    </div>

                    {/* Subject */}
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium mb-2">
                        Assunto
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      >
                        <option value="">Selecione um assunto</option>
                        <option value="desenvolvimento-web">Desenvolvimento Web</option>
                        <option value="desenvolvimento-mobile">Desenvolvimento Mobile</option>
                        <option value="consultoria">Consultoria</option>
                        <option value="suporte">Suporte</option>
                        <option value="orcamento">Orçamento</option>
                        <option value="outros">Outros</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium mb-2">
                        Mensagem *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={form.message}
                        onChange={handleInputChange}
                        required
                        rows={6}
                        className="w-full px-4 py-3 bg-background/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors resize-vertical"
                        placeholder="Conte-nos sobre seu projeto ou dúvida..."
                      />
                    </div>

                    {/* Submit Status */}
                    {submitStatus !== 'idle' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-center gap-2 p-4 rounded-lg ${
                          submitStatus === 'success'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {submitStatus === 'success' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                        {submitMessage}
                      </motion.div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground rounded-lg font-semibold transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5" />
                          Enviar mensagem
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div variants={itemVariants} className="space-y-8">
                {/* Company Info */}
                <div className="glass-card p-8">
                  <h3 className="text-2xl font-bold mb-6">
                    Informações de contato
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Mail className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Email</h4>
                        <a 
                          href={`mailto:${companyInfo.email}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {companyInfo.email}
                        </a>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Phone className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Telefone</h4>
                        <a 
                          href={`tel:${companyInfo.phone.replace(/\D/g, '')}`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {companyInfo.phone}
                        </a>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <MapPin className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Endereço</h4>
                        <p className="text-muted-foreground">
                          {companyInfo.address}
                        </p>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">Horário de atendimento</h4>
                        <p className="text-muted-foreground">
                          {companyInfo.businessHours}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Contact Methods */}
                <div className="glass-card p-8">
                  <h3 className="text-2xl font-bold mb-6">
                    Outras formas de contato
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">WhatsApp</h4>
                        <p className="text-sm text-muted-foreground">
                          Resposta rápida em horário comercial
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">Email comercial</h4>
                        <p className="text-sm text-muted-foreground">
                          Resposta em até 24 horas
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="glass-card p-8 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
                  <h3 className="text-xl font-bold mb-4">
                    Precisa de uma resposta rápida?
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Para questões urgentes, entre em contato diretamente pelo WhatsApp ou telefone.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={`tel:${companyInfo.phone.replace(/\D/g, '')}`}
                      className="flex-1 text-center px-4 py-3 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-medium transition-colors"
                    >
                      Ligar agora
                    </a>
                    <a
                      href={`https://wa.me/55${companyInfo.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg font-medium transition-colors"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
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
                Dúvidas frequentes
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  q: 'Qual o prazo médio para desenvolvimento?',
                  a: 'O prazo varia conforme a complexidade. Projetos simples: 2-4 semanas. Projetos complexos: 2-6 meses. Fornecemos cronograma detalhado após análise.'
                },
                {
                  q: 'Vocês oferecem suporte pós-lançamento?',
                  a: 'Sim! Oferecemos diferentes planos de suporte e manutenção para garantir que seu projeto continue funcionando perfeitamente.'
                },
                {
                  q: 'Como é o processo de orçamento?',
                  a: 'Após o contato inicial, agendamos uma reunião para entender suas necessidades e fornecemos orçamento detalhado em até 48 horas.'
                },
                {
                  q: 'Trabalham com projetos de qualquer tamanho?',
                  a: 'Sim! Atendemos desde pequenos negócios até grandes empresas, adaptando nossa abordagem às necessidades e orçamento de cada cliente.'
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-card p-6"
                >
                  <h3 className="font-semibold mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}