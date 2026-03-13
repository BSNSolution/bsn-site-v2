import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Github, Linkedin, Mail, Users, Award, Target, Calendar, MapPin, Phone } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { teamApi } from '@/lib/api'

interface TeamMember {
  id: string
  name: string
  role: string
  bio: string
  imageUrl: string
  linkedinUrl?: string
  githubUrl?: string
  email?: string
  isActive: boolean
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

const stats = [
  { icon: Calendar, label: 'Anos de Experiência', value: '8+' },
  { icon: Target, label: 'Projetos Entregues', value: '150+' },
  { icon: Users, label: 'Clientes Satisfeitos', value: '80+' },
  { icon: Award, label: 'Soluções Inovadoras', value: '50+' }
]

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      setIsLoading(true)
      const data = await teamApi.getTeam()
      if (data && data.team) {
        setTeam(data.team.filter((member: TeamMember) => member.isActive !== false))
      }
    } catch (error) {
      console.error('Erro ao carregar equipe:', error)
    } finally {
      setIsLoading(false)
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
                <span className="gradient-text">Sobre</span> a BSN Solution
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Transformamos ideias em soluções digitais inovadoras, combinando tecnologia de ponta com design excepcional
              </p>
            </motion.div>
          </div>
        </section>

        {/* Company Story */}
        <section className="pb-20">
          <div className="container-custom">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
              <motion.div variants={itemVariants}>
                <h2 className="text-4xl md:text-5xl font-bold mb-8">
                  Nossa <span className="gradient-text">História</span>
                </h2>
                <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                  <p>
                    A BSN Solution nasceu da paixão por tecnologia e da vontade de criar soluções que realmente fazem a diferença. 
                    Fundada em 2016, começamos como uma pequena startup com grandes sonhos e a determinação de revolucionar 
                    o desenvolvimento de software.
                  </p>
                  <p>
                    Ao longo dos anos, crescemos organicamente, sempre priorizando a qualidade sobre a quantidade. 
                    Nossa filosofia é simples: cada projeto é uma oportunidade de superar expectativas e criar algo extraordinário.
                  </p>
                  <p>
                    Hoje, somos reconhecidos como uma referência em desenvolvimento web, mobile e soluções digitais customizadas. 
                    Nossa equipe talentosa combina experiência técnica com criatividade para entregar resultados que impactam 
                    positivamente os negócios de nossos clientes.
                  </p>
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants} className="relative">
                <div className="glass-card p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-6">Nossa Missão</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                      Democratizar o acesso à tecnologia de qualidade, criando soluções digitais que impulsionam o crescimento 
                      e a transformação dos negócios de nossos clientes.
                    </p>
                    <h3 className="text-2xl font-bold mb-6">Nossa Visão</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Ser a referência em inovação tecnológica, reconhecida pela excelência técnica e pela capacidade de 
                      transformar desafios complexos em soluções elegantes e eficientes.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Números que <span className="gradient-text">Impressionam</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Nossa trajetória é marcada por conquistas significativas e relacionamentos duradouros
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="glass-card-hover text-center p-8 group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-6">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-4xl font-bold mb-2 gradient-text">
                    {stat.value}
                  </h3>
                  <p className="text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="section-spacing">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Conheça Nossa <span className="gradient-text">Equipe</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Profissionais talentosos e apaixonados por tecnologia que fazem a diferença em cada projeto
              </p>
            </motion.div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : team.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-semibold mb-4">Equipe em expansão</h3>
                <p className="text-muted-foreground">
                  Nossa equipe está crescendo. Em breve apresentaremos nossos talentos.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
              >
                {team.map((member, index) => (
                  <motion.div
                    key={member.id}
                    variants={itemVariants}
                    className="glass-card-hover group text-center overflow-hidden"
                  >
                    {/* Avatar */}
                    <div className="relative mb-6">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-primary/20 group-hover:border-primary/40 transition-colors"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-32 h-32 rounded-full mx-auto bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-4 border-primary/20 group-hover:border-primary/40 transition-colors">
                          <Users className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-6 pt-0">
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-primary/80 font-medium mb-3">
                        {member.role}
                      </p>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                        {member.bio}
                      </p>

                      {/* Social Links */}
                      <div className="flex justify-center gap-3">
                        {member.linkedinUrl && (
                          <a
                            href={member.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 glass-card hover:bg-blue-500/10 hover:text-blue-400 rounded-lg transition-all duration-300"
                            aria-label={`LinkedIn de ${member.name}`}
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {member.githubUrl && (
                          <a
                            href={member.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 glass-card hover:bg-gray-500/10 hover:text-gray-400 rounded-lg transition-all duration-300"
                            aria-label={`GitHub de ${member.name}`}
                          >
                            <Github className="h-4 w-4" />
                          </a>
                        )}
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="p-2 glass-card hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-300"
                            aria-label={`Email de ${member.name}`}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gradient-to-br from-accent/5 via-primary/5 to-transparent">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Nossos <span className="gradient-text">Valores</span>
              </h2>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <motion.div variants={itemVariants} className="glass-card-hover p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Excelência</h3>
                <p className="text-muted-foreground">
                  Buscamos a perfeição em cada detalhe, entregando soluções que superam expectativas e estabelecem novos padrões de qualidade.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card-hover p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Colaboração</h3>
                <p className="text-muted-foreground">
                  Trabalhamos em parceria com nossos clientes, construindo relacionamentos duradouros baseados na confiança e transparência.
                </p>
              </motion.div>

              <motion.div variants={itemVariants} className="glass-card-hover p-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-4">Inovação</h3>
                <p className="text-muted-foreground">
                  Estamos sempre explorando novas tecnologias e metodologias para oferecer soluções modernas e eficientes.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="section-spacing">
          <div className="container-custom text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Vamos trabalhar juntos?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Estamos prontos para transformar suas ideias em soluções digitais extraordinárias
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.a
                  href="/contato"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold transition-colors text-lg"
                >
                  Vamos conversar
                  <ExternalLink className="h-5 w-5" />
                </motion.a>
                <motion.a
                  href="/solucoes"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-4 glass-card hover:bg-white/10 rounded-full font-semibold transition-colors text-lg"
                >
                  Ver nossos projetos
                </motion.a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}