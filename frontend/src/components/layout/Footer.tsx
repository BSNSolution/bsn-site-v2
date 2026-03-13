import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Github, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin,
  ArrowUp,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScrollAnimation } from '@/hooks/use-scroll-animation'
import { cn } from '@/lib/utils'
import { useRef } from 'react'

interface FooterLink {
  href: string
  label: string
  external?: boolean
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: 'Serviços',
    links: [
      { href: '/servicos#desenvolvimento-web', label: 'Desenvolvimento Web' },
      { href: '/servicos#mobile', label: 'Apps Mobile' },
      { href: '/servicos#inteligencia-artificial', label: 'Inteligência Artificial' },
      { href: '/servicos#ui-ux', label: 'UI/UX Design' },
      { href: '/servicos#devops', label: 'DevOps & Cloud' },
      { href: '/servicos#consultoria', label: 'Consultoria TI' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { href: '/sobre', label: 'Sobre Nós' },
      { href: '/solucoes', label: 'Portfólio' },
      { href: '/blog', label: 'Blog' },
      { href: '/carreiras', label: 'Carreiras' },
      { href: '/contato', label: 'Contato' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacidade', label: 'Política de Privacidade' },
      { href: '/termos', label: 'Termos de Uso' },
      { href: '/cookies', label: 'Política de Cookies' },
    ],
  },
]

const socialLinks = [
  {
    href: 'https://linkedin.com/company/bsn-solution',
    label: 'LinkedIn',
    icon: Linkedin,
  },
  {
    href: 'https://instagram.com/bsnsolution',
    label: 'Instagram', 
    icon: Instagram,
  },
  {
    href: 'https://github.com/bsnsolution',
    label: 'GitHub',
    icon: Github,
  },
]

const contactInfo = [
  {
    icon: Mail,
    label: 'contato@bsnsolution.com.br',
    href: 'mailto:contato@bsnsolution.com.br',
  },
  {
    icon: Phone,
    label: '+55 (65) 99999-9999',
    href: 'tel:+5565999999999',
  },
  {
    icon: MapPin,
    label: 'Cuiabá, MT - Brasil',
    href: 'https://maps.google.com/?q=Cuiaba+MT+Brasil',
    external: true,
  },
]

// Footer section component with animations
function FooterSection({ title, links }: FooterSection) {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-4"
    >
      <h3 className="font-semibold text-foreground text-lg">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link, index) => (
          <motion.li
            key={link.href}
            initial={{ opacity: 0, x: -20 }}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
          >
            <Link
              to={link.href}
              target={link.external ? '_blank' : undefined}
              rel={link.external ? 'noopener noreferrer' : undefined}
              className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm flex items-center gap-1 group"
            >
              {link.label}
              {link.external && (
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </Link>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}

// Social media links with magnetic effect
function SocialLinks() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="flex flex-col sm:flex-row sm:items-center gap-4"
    >
      <span className="text-sm text-muted-foreground">Siga-nos:</span>
      <div className="flex items-center gap-3">
        {socialLinks.map((social, index) => {
          const buttonRef = useRef<HTMLAnchorElement>(null)
          
          return (
            <motion.a
              key={social.href}
              ref={buttonRef}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-primary hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all duration-300 group"
              aria-label={social.label}
            >
              <social.icon className="h-4 w-4" />
            </motion.a>
          )
        })}
      </div>
    </motion.div>
  )
}

// Contact info section
function ContactInfo() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-4"
    >
      <h3 className="font-semibold text-foreground text-lg">
        Contato
      </h3>
      <div className="space-y-3">
        {contactInfo.map((contact, index) => (
          <motion.a
            key={contact.href}
            href={contact.href}
            target={contact.external ? '_blank' : undefined}
            rel={contact.external ? 'noopener noreferrer' : undefined}
            initial={{ opacity: 0, x: -20 }}
            animate={shouldAnimate ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
            className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200 text-sm group"
          >
            <contact.icon className="h-4 w-4 flex-shrink-0" />
            <span>{contact.label}</span>
            {contact.external && (
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}
          </motion.a>
        ))}
      </div>
    </motion.div>
  )
}

// Newsletter signup (optional)
function NewsletterSignup() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const submitRef = useRef<HTMLButtonElement>(null)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="space-y-4"
    >
      <h3 className="font-semibold text-foreground text-lg">
        Newsletter
      </h3>
      <p className="text-sm text-muted-foreground">
        Receba atualizações sobre tecnologia e nossas soluções.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          placeholder="seu@email.com"
          className="flex-1 px-4 py-2 rounded-md bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
        />
        <Button
          ref={submitRef}
          variant="magnetic"
          size="lg"
          className="min-w-fit"
        >
          Inscrever
        </Button>
      </div>
    </motion.div>
  )
}

// Main footer component
export default function Footer() {
  const { ref, shouldAnimate } = useScrollAnimation({
    threshold: 0.1,
    triggerOnce: true,
  })

  const backToTopRef = useRef<HTMLButtonElement>(null)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative mt-20">
      {/* Gradient separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-16" />
      
      <div className="container-custom">
        {/* Main footer content */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0 }}
          animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12"
        >
          {/* Company info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {/* Logo */}
              <Link to="/" className="inline-flex items-center gap-3 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center font-display font-bold text-white group-hover:scale-110 transition-transform duration-300">
                    BSN
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />
                </div>
                <div>
                  <div className="font-display font-bold text-xl text-foreground">
                    BSN Solution
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tecnologia & Inovação
                  </div>
                </div>
              </Link>

              <p className="text-muted-foreground max-w-md leading-relaxed">
                Transformamos suas ideias em soluções tecnológicas inovadoras. 
                Especialistas em desenvolvimento web, mobile e consultoria em TI em Cuiabá-MT.
              </p>
            </div>

            <ContactInfo />
          </div>

          {/* Footer sections */}
          {footerSections.map((section) => (
            <FooterSection key={section.title} {...section} />
          ))}
        </motion.div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <NewsletterSignup />
            <SocialLinks />
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-muted-foreground text-center sm:text-left"
          >
            © {new Date().getFullYear()} BSN Solution. Todos os direitos reservados.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={shouldAnimate ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Button
              ref={backToTopRef}
              variant="ghost"
              size="sm"
              onClick={scrollToTop}
              className="text-muted-foreground hover:text-primary gap-2"
            >
              <ArrowUp className="h-4 w-4" />
              Voltar ao topo
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      {/* Subtle grain effect overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-grain" />
    </footer>
  )
}