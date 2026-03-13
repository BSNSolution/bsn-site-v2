import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/sections/HeroSection'
import AboutSection from '@/components/sections/AboutSection'
import ServicesSection from '@/components/sections/ServicesSection'
import SolutionsSection from '@/components/sections/SolutionsSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import CTASection from '@/components/sections/CTASection'
import ClientsSection from '@/components/sections/ClientsSection'
import { ScrollProgress } from '@/components/layout/Header'
import { useAnalytics } from '@/hooks/use-analytics'
import { useEffect } from 'react'

export default function HomePage() {
  const { trackPageView, trackEvent } = useAnalytics()

  useEffect(() => {
    // Track home page view
    trackPageView('/')
    trackEvent('page_load', { 
      page: 'home',
      timestamp: new Date().toISOString() 
    })
  }, [trackPageView, trackEvent])

  return (
    <>
      {/* Scroll progress indicator */}
      <ScrollProgress />
      
      {/* Header */}
      <Header />

      {/* Main content */}
      <main id="main-content" className="relative">
        {/* Hero Section - Above the fold */}
        <HeroSection />

        {/* About Section */}
        <AboutSection />

        {/* Services Preview */}
        <ServicesSection preview />

        {/* Solutions/Portfolio Preview */}
        <SolutionsSection preview />

        {/* Clients */}
        <ClientsSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Final CTA */}
        <CTASection />

        {/* Background decorations */}
        <div className="fixed inset-0 pointer-events-none -z-10">
          {/* Ambient gradients */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}