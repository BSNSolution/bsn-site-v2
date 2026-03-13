import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { useMagneticEffect } from '@/hooks/use-cursor'
import { useRef } from 'react'

export default function CTASection() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true,
  })

  const ctaRef = useRef<HTMLAnchorElement>(null)
  useMagneticEffect(ctaRef, 0.3)

  return (
    <section ref={ref} className="section-spacing relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute inset-0 bg-grain opacity-[0.02]" />
      
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-sm mb-8">
            <Rocket className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Pronto para começar?</span>
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
            Vamos transformar sua{' '}
            <span className="gradient-text">ideia</span> em{' '}
            <span className="gradient-text">realidade</span>
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground leading-relaxed mb-12 max-w-2xl mx-auto">
            Entre em contato conosco e descubra como podemos impulsionar o seu negócio 
            com soluções tecnológicas inovadoras.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              variant="magnetic"
              size="xl"
              className="group relative overflow-hidden"
            >
              <Link ref={ctaRef} to="/contato">
                <span className="relative z-10 flex items-center gap-2">
                  Solicitar Orçamento
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary to-accent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Link>
            </Button>

            <Button asChild variant="glass" size="xl">
              <Link to="/sobre">
                Conheça nossa equipe
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}