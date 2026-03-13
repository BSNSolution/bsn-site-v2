import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function SolutionsPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="pt-16 min-h-screen">
        <div className="section-spacing">
          <div className="container-custom text-center">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Soluções</span> e Portfólio
            </h1>
            <p className="text-xl text-muted-foreground">
              Em breve - Nossos projetos incríveis
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}