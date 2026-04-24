import { Routes, Route, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Lazy load pages for performance
const HomePage = lazy(() => import('@/pages/HomePage'))
const ServicesPage = lazy(() => import('@/pages/ServicesPage'))
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage'))
const SolutionsPage = lazy(() => import('@/pages/SolutionsPage'))
const AIPage = lazy(() => import('@/pages/AIPage'))
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
const HomeSectionsPage = lazy(() => import('@/pages/admin/HomeSectionsPage'))
const AdminServicesPage = lazy(() => import('@/pages/admin/AdminServicesPage'))
const AdminSolutionsPage = lazy(() => import('@/pages/admin/AdminSolutionsPage'))
const AdminTestimonialsPage = lazy(() => import('@/pages/admin/AdminTestimonialsPage'))
const AdminTeamPage = lazy(() => import('@/pages/admin/AdminTeamPage'))
const AdminClientsPage = lazy(() => import('@/pages/admin/AdminClientsPage'))
const AdminJobsPage = lazy(() => import('@/pages/admin/AdminJobsPage'))
const AdminBlogPage = lazy(() => import('@/pages/admin/AdminBlogPage'))
const AdminBlogEditorPage = lazy(() => import('@/pages/admin/AdminBlogEditorPage'))
const AdminInboxPage = lazy(() => import('@/pages/admin/AdminInboxPage'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
const AdminUploadsPage = lazy(() => import('@/pages/admin/AdminUploadsPage'))
const AdminValuesPage = lazy(() => import('@/pages/admin/AdminValuesPage'))
const AdminKPIsPage = lazy(() => import('@/pages/admin/AdminKPIsPage'))
const AdminPerksPage = lazy(() => import('@/pages/admin/AdminPerksPage'))
const AdminHomeLivePage = lazy(() => import('@/pages/admin/AdminHomeLivePage'))
const AdminHomePillPage = lazy(() => import('@/pages/admin/AdminHomePillPage'))
const AdminHomeBandPage = lazy(() => import('@/pages/admin/AdminHomeBandPage'))
const AdminStackPage = lazy(() => import('@/pages/admin/AdminStackPage'))
const AdminAboutCardsPage = lazy(() => import('@/pages/admin/AdminAboutCardsPage'))
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
const AdminPermissionGroupsPage = lazy(() => import('@/pages/admin/AdminPermissionGroupsPage'))
const AdminApiTokensPage = lazy(() => import('@/pages/admin/AdminApiTokensPage'))
const AdminAIPage = lazy(() => import('@/pages/admin/AdminAIPage'))
const AdminPagesPage = lazy(() => import('@/pages/admin/AdminPagesPage'))
const AdminPageSectionsPage = lazy(() => import('@/pages/admin/AdminPageSectionsPage'))

// Components
import LoadingSpinner from '@/components/LoadingSpinner'
import SiteBackground from '@/components/layout/SiteBackground'
import WhatsAppFloat from '@/components/layout/WhatsAppFloat'
import MotionLayer from '@/components/layout/MotionLayer'

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
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
        '/inteligencia-artificial': 'Inteligência Artificial - BSN Solution',
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

  const isAdmin = location.pathname.startsWith('/admin')

  return (
    <div className="App">
      {/* Vitral/glass background layers — mounted once so they don't remount on route changes */}
      {!isAdmin && <SiteBackground />}

      {/* WhatsApp flutuante (apenas no site público) */}
      {!isAdmin && <WhatsAppFloat />}

      {/* Motion layer (reveal, spotlight, parallax — apenas site público) */}
      {!isAdmin && <MotionLayer />}

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
            path="/servicos/:slug"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <ServiceDetailPage />
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
            path="/inteligencia-artificial"
            element={
              <Suspense fallback={<PageLoader />}>
                <AnimatedPage>
                  <AIPage />
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
            path="/admin"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="home" element={<HomeSectionsPage />} />
            <Route path="services" element={<AdminServicesPage />} />
            <Route path="solutions" element={<AdminSolutionsPage />} />
            <Route path="ai" element={<AdminAIPage />} />
            <Route path="testimonials" element={<AdminTestimonialsPage />} />
            <Route path="team" element={<AdminTeamPage />} />
            <Route path="clients" element={<AdminClientsPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="blog" element={<AdminBlogPage />} />
            <Route path="blog/new" element={<AdminBlogEditorPage />} />
            <Route path="blog/:id/edit" element={<AdminBlogEditorPage />} />
            <Route path="inbox" element={<AdminInboxPage />} />
            <Route path="uploads" element={<AdminUploadsPage />} />
            <Route path="values" element={<AdminValuesPage />} />
            <Route path="kpis" element={<AdminKPIsPage />} />
            <Route path="perks" element={<AdminPerksPage />} />
            <Route path="home-live" element={<AdminHomeLivePage />} />
            <Route path="home-pill" element={<AdminHomePillPage />} />
            <Route path="home-band" element={<AdminHomeBandPage />} />
            <Route path="stack" element={<AdminStackPage />} />
            <Route path="about-cards" element={<AdminAboutCardsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="permission-groups" element={<AdminPermissionGroupsPage />} />
            <Route path="api-tokens" element={<AdminApiTokensPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="pages" element={<AdminPagesPage />} />
            <Route path="pages/:page" element={<AdminPageSectionsPage />} />
          </Route>

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