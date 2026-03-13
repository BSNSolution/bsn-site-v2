import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Code, Smartphone, Brain, Palette, Cloud, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { useAnalytics } from '@/hooks/use-analytics'

const services = [
  {
    icon: Code,
    title: 'Desenvolvimento Web',
    description: 'Sites responsivos e sistemas web modernos com React, Node.js e tecnologias atuais.',
  },
  {
    icon: Smartphone,
    title: 'Aplicativos Mobile',
    description: 'Apps nativos e híbridos para iOS e Android com performance excepcional.',
  },
  {
    icon: Brain,
    title: 'Inteligência Artificial',
    description: 'Soluções em IA, chatbots, automação de processos e análise de dados.',
  },
  {
    icon: Palette,
    title: 'UI/UX Design',
    description: 'Interfaces intuitivas e experiências digitais que encantam usuários.',
  },
  {
    icon: Cloud,
    title: 'DevOps & Cloud',
    description: 'Infraestrutura escalável, CI/CD e serviços em nuvem otimizados.',
  },
  {
    icon: Users,
    title: 'Consultoria em TI',
    description: 'Estratégias tecnológicas para otimizar processos e aumentar produtividade.',
  },
]

interface ServicesSectionProps {
  preview?: boolean
}

export default function ServicesSection({ preview = false }: ServicesSectionProps) {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
  })

  const { trackButtonClick, trackServiceInterest } = useAnalytics()

  const displayServices = preview ? services.slice(0, 3) : services

  return (
    <section ref={ref} className="section-spacing relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-gradient-to-r from-accent/30 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-sm mb-6">
            <span className="text-muted-foreground">Nossos Serviços</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Soluções completas em{' '}
            <span className="gradient-text">tecnologia</span>
          </h2>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Oferecemos serviços especializados para transformar suas ideias em soluções digitais de alto impacto.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 50 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            >
              <Card
                variant="glass"
                className="p-6 h-full hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-300 group cursor-pointer"
                onClick={() => {
                  trackServiceInterest(service.title.toLowerCase().replace(/\s+/g, '-'), service.title)
                  trackButtonClick('service-card', 'services-section')
                }}
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <service.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-4">
                    <div className="flex items-center text-sm text-primary group-hover:gap-2 transition-all duration-300">
                      Saiba mais
                      <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>

                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="text-center mt-12"
          >
            <Button
              asChild
              variant="glass"
              size="lg"
              className="group"
            >
              <Link
                to="/servicos"
                onClick={() => trackButtonClick('services-view-all', 'services-section')}
              >
                Ver todos os serviços
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  )
}