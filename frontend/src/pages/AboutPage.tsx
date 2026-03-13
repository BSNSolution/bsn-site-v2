import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function AboutPage() {
  return (
    <>
      <Header />
      <main id="main-content" className="pt-16 min-h-screen">
        <div className="section-spacing">
          <div className="container-custom text-center">
            <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
              <span className="gradient-text">Sobre</span> a BSN Solution
            </h1>
            <p className="text-xl text-muted-foreground">
              Em breve - Nossa história e equipe
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
