import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Github, Star, Code, Palette, Smartphone, Globe, Database, Zap } from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { solutionsApi } from '@/lib/api'

interface Solution {
  id: string
  title: string
  description: string
  imageUrl: string
  technologies: string[]
  projectUrl?: string
  githubUrl?: string
  isFeatured: boolean
  category?: string
  createdAt: string
}

const categoryIcons = {
  'web': Globe,
  'mobile': Smartphone,
  'design': Palette,
  'backend': Database,
  'automation': Zap,
  'default': Code
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

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [filteredSolutions, setFilteredSolutions] = useState<Solution[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>(['all'])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSolutions()
  }, [])

  const loadSolutions = async () => {
    try {
      setIsLoading(true)
      const data = await solutionsApi.getSolutions()
      if (data && data.solutions) {
        setSolutions(data.solutions)
        setFilteredSolutions(data.solutions)
        
        // Extract unique categories
        const uniqueCategories = ['all', ...new Set(data.solutions.map((s: Solution) => s.category).filter(Boolean))]
        setCategories(uniqueCategories)
      }
    } catch (error) {
      console.error('Erro ao carregar soluções:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterByCategory = (category: string) => {
    setActiveCategory(category)
    if (category === 'all') {
      setFilteredSolutions(solutions)
    } else {
      setFilteredSolutions(solutions.filter(solution => solution.category === category))
    }
  }

  const getTechBadgeColor = (tech: string) => {
    const colors = {
      'React': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Next.js': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      'TypeScript': 'bg-blue-600/10 text-blue-300 border-blue-600/20',
      'Node.js': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Python': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'PostgreSQL': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      'MongoDB': 'bg-green-600/10 text-green-300 border-green-600/20',
      'Docker': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'AWS': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'default': 'bg-primary/10 text-primary border-primary/20'
    }
    return colors[tech as keyof typeof colors] || colors.default
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
                <span className="gradient-text">Soluções</span> e Portfólio
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Conheça nossos projetos mais recentes e as tecnologias que utilizamos para criar soluções inovadoras
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filter Section */}
        {categories.length > 1 && (
          <section className="pb-16">
            <div className="container-custom">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => filterByCategory(category)}
                    className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                      activeCategory === category
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                        : 'glass-card hover:bg-white/10'
                    }`}
                  >
                    {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </motion.div>
            </div>
          </section>
        )}

        {/* Solutions Grid */}
        <section className="pb-20">
          <div className="container-custom">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : filteredSolutions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Code className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-50" />
                <h3 className="text-2xl font-semibold mb-4">Nenhuma solução encontrada</h3>
                <p className="text-muted-foreground">
                  Não encontramos soluções para a categoria selecionada.
                </p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredSolutions.map((solution, index) => (
                  <motion.div
                    key={solution.id}
                    variants={cardVariants}
                    className="glass-card-hover group overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                      {solution.imageUrl ? (
                        <img
                          src={solution.imageUrl}
                          alt={solution.title}
                          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-48 flex items-center justify-center">
                          <Code className="h-12 w-12 text-muted-foreground opacity-50" />
                        </div>
                      )}
                      
                      {/* Featured Badge */}
                      {solution.isFeatured && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30 backdrop-blur-sm flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Destaque
                          </span>
                        </div>
                      )}

                      {/* Category Icon */}
                      {solution.category && (
                        <div className="absolute top-4 right-4">
                          <div className="p-2 bg-black/20 backdrop-blur-sm rounded-full">
                            {(() => {
                              const IconComponent = categoryIcons[solution.category as keyof typeof categoryIcons] || categoryIcons.default
                              return <IconComponent className="h-4 w-4 text-white" />
                            })()}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {solution.title}
                      </h3>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {solution.description}
                      </p>

                      {/* Technologies */}
                      {solution.technologies && solution.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {solution.technologies.map((tech, techIndex) => (
                            <span
                              key={techIndex}
                              className={`px-2 py-1 text-xs rounded border ${getTechBadgeColor(tech)}`}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex gap-3">
                        {solution.projectUrl && (
                          <a
                            href={solution.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors text-sm font-medium"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver Projeto
                          </a>
                        )}
                        {solution.githubUrl && (
                          <a
                            href={solution.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Github className="h-4 w-4" />
                            Código
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

        {/* Call to Action */}
        <section className="section-spacing bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
          <div className="container-custom text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Tem um projeto em mente?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Vamos conversar sobre como podemos transformar sua ideia em realidade
              </p>
              <motion.a
                href="/contato"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full font-semibold transition-colors text-lg"
              >
                Vamos conversar
                <ExternalLink className="h-5 w-5" />
              </motion.a>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}