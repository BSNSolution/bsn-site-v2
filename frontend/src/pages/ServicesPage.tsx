import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ServicesSection from '@/components/sections/ServicesSection'

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="pt-16">
        <div className="section-spacing">
          <div className="container-custom text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Nossos <span className="gradient-text">Serviços</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Soluções completas em tecnologia para transformar seu negócio
            </p>
          </div>
          <ServicesSection />
        </div>
      </main>
      <Footer />
    </>
  )
}