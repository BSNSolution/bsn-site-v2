import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ExternalLink, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

interface SolutionsSectionProps {
  preview?: boolean
}

export default function SolutionsSection({ preview = false }: SolutionsSectionProps) {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.2,
    triggerOnce: true,
  })

  return (
    <section ref={ref} className="section-spacing relative overflow-hidden">
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Projetos que <span className="gradient-text">transformam</span> negócios
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12">
            Conheça alguns dos projetos que desenvolvemos para nossos clientes.
          </p>
          
          {preview && (
            <Button asChild variant="glass" size="lg">
              <Link to="/solucoes">
                Ver portfólio completo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </motion.div>
      </div>
    </section>
  )
}