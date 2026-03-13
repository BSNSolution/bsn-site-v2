import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Zap, Code, Rocket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useScrollAnimation, useTextReveal, useCounterAnimation } from '@/hooks/use-scroll-animation'
import { useMagneticEffect, useCursorText } from '@/hooks/use-cursor'
import { useAnalytics } from '@/hooks/use-analytics'
import { cn } from '@/lib/utils'

// Floating elements for visual interest
const FloatingElement = ({ children, delay = 0, amplitude = 20 }: {
  children: React.ReactNode
  delay?: number
  amplitude?: number
}) => {
  return (
    <motion.div
      animate={{
        y: [0, -amplitude, 0],
        rotate: [0, 2, -2, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className="absolute"
    >
      {children}
    </motion.div>
  )
}

// Stats counter component
const StatItem = ({ number, label, suffix = '' }: {
  number: number
  label: string
  suffix?: string
}) => {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.5,
    triggerOnce: true,
  })
  
  const count = useCounterAnimation(number, 0, 2000, { 
    threshold: 0.5,
    triggerOnce: true 
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center"
    >
      <div className="text-3xl md:text-4xl font-display font-bold gradient-text mb-2">
        {count}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">
        {label}
      </div>
    </motion.div>
  )
}

// Animated background grid
const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Animated gradient overlay */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="absolute inset-0"
      />
    </div>
  )
}

export default function HeroSection() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })
  
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  
  const { trackButtonClick, trackEvent } = useAnalytics()
  
  // Magnetic effects
  const ctaPrimaryRef = useRef<HTMLAnchorElement>(null)
  const ctaSecondaryRef = useRef<HTMLAnchorElement>(null)
  const videoRef = useRef<HTMLDivElement>(null)
  
  useMagneticEffect(ctaPrimaryRef, 0.3)
  useMagneticEffect(ctaSecondaryRef, 0.2)
  useMagneticEffect(videoRef, 0.1)

  // Cursor text effects
  const watchDemoProps = useCursorText('▶ Assistir')
  const contactProps = useCursorText('📧 Contatar')

  // Text reveal animation
  const { revealedText: titleText, isComplete } = useTextReveal(
    'Transformamos suas ideias em soluções tecnológicas',
    { threshold: 0.2, triggerOnce: true }
  )

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Animated background */}
      <AnimatedGrid />
      
      {/* Parallax container */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 w-full"
      >
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[80vh]">
            {/* Left side - Main content */}
            <div className="lg:col-span-7 space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="gradient-text font-medium">
                    Líderes em Inovação Digital
                  </span>
                </div>
              </motion.div>

              {/* Main headline with text reveal */}
              <div className="space-y-4">
                <motion.h1
                  initial={{ opacity: 0, y: 50 }}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[0.9] tracking-tight"
                >
                  <span className="block gradient-text">
                    {titleText}
                  </span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={isComplete ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="block text-foreground mt-4"
                  >
                    extraordinárias
                  </motion.span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-xl md:text-2xl text-muted-foreground max-w-2xl leading-relaxed"
                >
                  Especialistas em desenvolvimento web, mobile e IA em Cuiabá-MT. 
                  Criamos experiências digitais que impulsionam o seu negócio.
                </motion.p>
              </div>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  asChild
                  variant="magnetic"
                  size="xl"
                  className="group relative overflow-hidden"
                  {...contactProps}
                >
                  <Link
                    ref={ctaPrimaryRef}
                    to="/contato"
                    onClick={() => trackButtonClick('hero-primary-cta', 'hero')}
                  >
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

                <Button
                  asChild
                  variant="glass"
                  size="xl"
                  className="group"
                  {...watchDemoProps}
                >
                  <div
                    ref={ctaSecondaryRef}
                    className="cursor-pointer flex items-center gap-2"
                    onClick={() => {
                      trackButtonClick('hero-secondary-cta', 'hero')
                      // TODO: Open video modal
                    }}
                  >
                    <Play className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                    Assistir Demo
                  </div>
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid grid-cols-3 gap-8 pt-8"
              >
                <StatItem number={50} label="Projetos Entregues" suffix="+" />
                <StatItem number={98} label="Satisfação do Cliente" suffix="%" />
                <StatItem number={5} label="Anos de Experiência" suffix="+" />
              </motion.div>
            </div>

            {/* Right side - Visual elements */}
            <div className="lg:col-span-5 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="relative"
              >
                {/* Main glass card */}
                <Card
                  variant="glass"
                  className="relative p-8 backdrop-blur-2xl bg-white/[0.02] border-white/20 hover:bg-white/[0.05] transition-all duration-500"
                >
                  {/* Floating elements */}
                  <FloatingElement delay={0} amplitude={15}>
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-glow">
                      <Code className="h-8 w-8 text-white" />
                    </div>
                  </FloatingElement>

                  <FloatingElement delay={1} amplitude={20}>
                    <div className="absolute top-1/2 -left-6 w-12 h-12 bg-gradient-to-br from-accent to-primary rounded-xl flex items-center justify-center shadow-glow-lg">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                  </FloatingElement>

                  <FloatingElement delay={2} amplitude={25}>
                    <div className="absolute -bottom-6 right-8 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-glow">
                      <Rocket className="h-7 w-7 text-white" />
                    </div>
                  </FloatingElement>

                  {/* Content */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-display font-bold gradient-text mb-2">
                        Tecnologias Modernas
                      </h3>
                      <p className="text-muted-foreground">
                        Utilizamos as melhores ferramentas do mercado
                      </p>
                    </div>

                    {/* Tech stack visual */}
                    <div className="grid grid-cols-3 gap-4">
                      {['React', 'Node.js', 'TypeScript', 'Python', 'Docker', 'AWS'].map((tech, i) => (
                        <motion.div
                          key={tech}
                          initial={{ opacity: 0, y: 20 }}
                          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                          transition={{ duration: 0.6, delay: 0.8 + (i * 0.1) }}
                          className="text-center p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                        >
                          <div className="text-xs text-muted-foreground group-hover:text-primary transition-colors duration-300">
                            {tech}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Glow effects */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 hover:opacity-100 transition-opacity duration-500" />
                </Card>

                {/* Video preview overlay */}
                <motion.div
                  ref={videoRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.8, delay: 1 }}
                  className="absolute -bottom-8 -left-8 w-32 h-20 bg-black/80 backdrop-blur-xl rounded-xl border border-white/20 flex items-center justify-center cursor-pointer group hover:scale-105 transition-all duration-300"
                  onClick={() => {
                    trackEvent('video_preview_click', { location: 'hero' })
                    // TODO: Open video modal
                  }}
                  {...watchDemoProps}
                >
                  <Play className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-xl opacity-0 group-hover:opacity-50 blur transition-opacity duration-300" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs">Scroll para descobrir</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-primary to-transparent"
          />
        </div>
      </motion.div>
    </section>
  )
}