import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Lazy load pages for performance
const HomePage = lazy(() => import('@/pages/HomePage'))
const ServicesPage = lazy(() => import('@/pages/ServicesPage'))
const SolutionsPage = lazy(() => import('@/pages/SolutionsPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const BlogPostPage = lazy(() => import('@/pages/BlogPostPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const CareersPage = lazy(() => import('@/pages/CareersPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

// Admin pages
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminLogin = lazy(() => import('@/pages/admin/LoginPage'))
const AdminDashboard = lazy(() => import('@/pages/admin/DashboardPage'))

// Components
import LoadingSpinner from '@/components/LoadingSpinner'

// Page transition variants - AWWWARDS style
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.99,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // Custom easing
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 1.01,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Loading component for Suspense
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}

// Page wrapper with animations
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="min-h-screen"
    >
      {children}
    </motion.div>
  )
}

function App() {
  const location = useLocation()

  // Track route changes for analytics
  useEffect(() => {
    // Track page views
    if (window.gtag) {
      window.gtag('config', 'GA_TRACKING_ID', {
        page_path: location.pathname,
      })
    }

    // Update page title based on route
    const getPageTitle = (path: string) => {
      const titles = {
        '/': 'BSN Solution - Desenvolvimento e Tecnologia',
        '/servicos': 'Serviços - BSN Solution',
        '/solucoes': 'Soluções - BSN Solution', 
        '/sobre': 'Sobre - BSN Solution',
        '/blog': 'Blog - BSN Solution',
        '/contato': 'Contato - BSN Solution',
        '/carreiras': 'Carreiras - BSN Solution',
        '/privacidade': 'Política de Privacidade - BSN Solution',
        '/termos': 'Termos de Uso - BSN Solution',
        '/admin': 'Admin - BSN Solution',
      }
      return titles[path as keyof typeof titles] || 'BSN Solution'
    }

    document.title = getPageTitle(location.pathname)
  }, [location])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="App">
      {/* Page transitions with AnimatePresence */}
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <HomePage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/servicos"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <ServicesPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/solucoes"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <SolutionsPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/sobre"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <AboutPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/blog"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <BlogPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/blog/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <BlogPostPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/contato"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <ContactPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/carreiras"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <CareersPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/privacidade"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <PrivacyPage />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/termos"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <TermsPage />
                </AnimatedPage>
              </Suspense>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <AdminLogin />
                </AnimatedPage>
              </Suspense>
            }
          />
          
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminLayout />
              </Suspense>
            }
          />

          {/* 404 page */}
          <Route
            path="*"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <NotFoundPage />
                </AnimatedPage>
              </Suspense>
            }
          />
        </Routes>
      </AnimatePresence>

      {/* Global elements */}
      
      {/* Back to top button */}
      <BackToTopButton />
      
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Pular para o conteúdo principal
      </a>
    </div>
  )
}

// Back to top button component
function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  if (!isVisible) return null

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      aria-label="Voltar ao topo"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    </motion.button>
  )
}

// Global CSS for smooth scrolling
const globalStyles = `
  html {
    scroll-behavior: smooth;
  }
  
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
  }
`

// Inject global styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = globalStyles
  document.head.appendChild(style)
}

export default App