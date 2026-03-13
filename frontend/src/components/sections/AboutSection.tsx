import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Target, Users, Zap, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScrollAnimation, useStaggeredAnimation } from '@/hooks/use-scroll-animation'
import { useMagneticEffect } from '@/hooks/use-cursor'
import { useAnalytics } from '@/hooks/use-analytics'
import { useRef } from 'react'

const highlights = [
  {
    icon: Target,
    title: 'Foco em Resultados',
    description: 'Desenvolvemos soluções que geram valor real para o seu negócio.',
  },
  {
    icon: Users,
    title: 'Equipe Especializada',
    description: 'Profissionais experientes em tecnologias modernas e tendências.',
  },
  {
    icon: Zap,
    title: 'Agilidade',
    description: 'Metodologias ágeis para entregas rápidas e de qualidade.',
  },
  {
    icon: Award,
    title: 'Excelência',
    description: 'Comprometidos com a mais alta qualidade em cada projeto.',
  },
]

export default function AboutSection() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
  })

  const { containerRef } = useStaggeredAnimation('.highlight-card', {
    threshold: 0.3,
    triggerOnce: true,
  })

  const { trackButtonClick } = useAnalytics()
  
  const ctaRef = useRef<HTMLAnchorElement>(null)
  useMagneticEffect(ctaRef, 0.2)

  return (
    <section ref={ref} className="section-spacing relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-primary/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left side - Content */}
          <div className="lg:col-span-6 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-sm">
                <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-muted-foreground">Sobre a BSN Solution</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-display font-bold leading-tight">
                <span className="gradient-text">Inovação</span> e{' '}
                <span className="gradient-text">tecnologia</span>{' '}
                em cada projeto
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Somos uma empresa de tecnologia localizada em Cuiabá-MT, especializada em 
                desenvolvimento de software, consultoria e soluções digitais inovadoras que 
                transformam negócios e criam valor real para nossos clientes.
              </p>

              <p className="text-muted-foreground leading-relaxed">
                Desde nossa fundação, temos o compromisso de entregar soluções de alta qualidade, 
                utilizando as tecnologias mais modernas do mercado e metodologias ágeis que 
                garantem resultados excepcionais.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              <Button
                asChild
                variant="glass"
                size="lg"
                className="group"
              >
                <Link
                  ref={ctaRef}
                  to="/sobre"
                  onClick={() => trackButtonClick('about-learn-more', 'about-section')}
                >
                  Conheça nossa história
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Right side - Highlights */}
          <div className="lg:col-span-6">
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, y: 50 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-6"
            >
              {highlights.map((highlight, index) => (
                <Card
                  key={highlight.title}
                  variant="glass"
                  className="highlight-card p-6 hover:bg-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-300 group opacity-0 transform translate-y-8"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <highlight.icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {highlight.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {highlight.description}
                      </p>
                    </div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </Card>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Numbers section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
          className="mt-20 pt-16 border-t border-white/10"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '50+', label: 'Projetos Concluídos' },
              { number: '98%', label: 'Satisfação do Cliente' },
              { number: '5+', label: 'Anos de Experiência' },
              { number: '24/7', label: 'Suporte Técnico' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.6 + (index * 0.1), ease: 'easeOut' }}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2 group-hover:scale-110 transition-transform duration-300">
                  {stat.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}