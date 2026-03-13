import { motion } from 'framer-motion'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'

const clients = [
  'Tech Corp',
  'Digital Agency', 
  'Startup Innovation',
  'E-commerce Plus',
  'Cloud Systems',
  'Mobile First',
]

export default function ClientsSection() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.3,
    triggerOnce: true,
  })

  return (
    <section ref={ref} className="py-16 relative overflow-hidden">
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-8">
            Empresas que confiam em nossas soluções
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            {clients.map((client, index) => (
              <motion.div
                key={client}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                className="text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                {client}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}