import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

const testimonials = [
  {
    name: 'Maria Silva',
    role: 'CEO',
    company: 'Tech Startup',
    content: 'A BSN Solution transformou nossa visão em um produto incrível. Profissionais competentes e muito atenciosos.',
    rating: 5,
  },
  {
    name: 'João Santos', 
    role: 'Diretor de TI',
    company: 'Empresa XYZ',
    content: 'Excelente trabalho na modernização do nosso sistema. Projeto entregue no prazo e com qualidade superior.',
    rating: 5,
  },
  {
    name: 'Ana Costa',
    role: 'Empreendedora',
    company: 'Loja Online',
    content: 'O e-commerce desenvolvido pela BSN superou nossas expectativas. Vendas aumentaram 300% no primeiro mês.',
    rating: 5,
  },
]

export default function TestimonialsSection() {
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
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            O que nossos <span className="gradient-text">clientes</span> falam
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Depoimentos de quem confia em nossas soluções para transformar seus negócios.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 50 }}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
            >
              <Card variant="glass" className="p-6 h-full hover:bg-white/10 transition-all duration-300 group">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Quote className="h-8 w-8 text-primary opacity-50" />
                    <div className="flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="pt-4 border-t border-white/10">
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}