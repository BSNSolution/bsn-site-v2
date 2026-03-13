import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useScrollDirection } from '@/hooks/use-scroll-animation'
import { useMagneticEffect } from '@/hooks/use-cursor'
import { cn } from '@/lib/utils'
import { useRef } from 'react'

interface NavLink {
  href: string
  label: string
  external?: boolean
}

const navLinks: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/solucoes', label: 'Soluções' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/blog', label: 'Blog' },
  { href: '/contato', label: 'Contato' },
]

// Logo component with magnetic effect
function Logo() {
  const logoRef = useRef<HTMLAnchorElement>(null)
  useMagneticEffect(logoRef, 0.2)

  return (
    <Link
      ref={logoRef}
      to="/"
      className="flex items-center gap-2 group transition-all duration-300"
    >
      {/* Logo icon/text */}
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center font-display font-bold text-white text-sm group-hover:scale-110 transition-transform duration-300">
          BSN
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-lg blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300 -z-10" />
      </div>
      
      <span className="font-display font-semibold text-lg text-foreground hidden sm:block">
        BSN Solution
      </span>
    </Link>
  )
}

// Mobile navigation menu
function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation()

  useEffect(() => {
    // Close mobile menu on route change
    onClose()
  }, [location, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Mobile menu */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw]"
          >
            <div className="h-full bg-background/95 backdrop-blur-xl border-l border-white/10 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <Logo />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-foreground hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Navigation links */}
              <nav className="flex-1 py-6">
                <ul className="space-y-1">
                  {navLinks.map((link, index) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={link.href}
                        className={cn(
                          'block px-6 py-3 text-lg font-medium transition-all duration-200',
                          'hover:bg-white/5 hover:text-primary',
                          location.pathname === link.href && 'text-primary bg-white/10'
                        )}
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              
              {/* CTA */}
              <div className="p-6 border-t border-white/10">
                <Button
                  asChild
                  variant="glow"
                  size="lg"
                  className="w-full"
                >
                  <Link to="/contato">
                    Solicitar Orçamento
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Desktop navigation
function DesktopNav() {
  const location = useLocation()
  
  return (
    <nav className="hidden md:block">
      <ul className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.href
          
          return (
            <li key={link.href}>
              <Link
                to={link.href}
                className={cn(
                  'relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'hover:text-primary hover:bg-white/5',
                  isActive && 'text-primary'
                )}
              >
                {link.label}
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// Main header component
export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { scrollDirection, scrollY } = useScrollDirection()
  const ctaRef = useRef<HTMLDivElement>(null)

  // Magnetic effect on CTA button
  useMagneticEffect(ctaRef, 0.3)

  // Handle scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Hide header on scroll down (AWWWARDS technique)
  const shouldHideHeader = scrollDirection === 'down' && scrollY > 200 && !isMobileMenuOpen

  return (
    <>
      <motion.header
        animate={{
          y: shouldHideHeader ? '-100%' : '0%',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 transition-all duration-300',
          'glass-header', // Custom glassmorphism class
          isScrolled && 'shadow-lg'
        )}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <DesktopNav />

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* CTA Button - Desktop */}
              <div ref={ctaRef} className="hidden lg:block">
                <Button
                  asChild
                  variant="magnetic"
                  size="lg"
                  className="relative overflow-hidden group"
                >
                  <Link to="/contato">
                    <span className="relative z-10">Solicitar Orçamento</span>
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </Button>
              </div>

              {/* Mobile menu trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-foreground hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Header spacer to prevent content jump */}
      <div className="h-16 md:h-20" />
    </>
  )
}

// Scroll progress indicator
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalScrollable = document.documentElement.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const progress = Math.min(scrolled / totalScrollable, 1)
      setProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary via-accent to-primary origin-left"
      style={{ scaleX: progress }}
    />
  )
}