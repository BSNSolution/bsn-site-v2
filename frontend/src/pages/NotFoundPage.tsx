import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Header from '@/components/layout/Header'
import Seo from '@/components/Seo'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Página não encontrada"
        description="A página que você procura não existe ou foi movida."
        path="/404"
        noIndex
      />
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-md mx-auto px-4">
          <div className="space-y-2">
            <h1 className="text-6xl font-display font-bold gradient-text">
              404
            </h1>
            <h2 className="text-2xl font-semibold text-foreground">
              Página não encontrada
            </h2>
            <p className="text-muted-foreground">
              A página que você está procurando não existe ou foi movida.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="magnetic">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
            
            <Button asChild variant="glass">
              <button onClick={() => window.history.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Página anterior
              </button>
            </Button>
          </div>
        </div>
      </main>
    </>
  )
}