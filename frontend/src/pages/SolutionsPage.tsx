import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { api } from '@/lib/api'

interface Solution {
  id: string
  title: string
  tag?: string | null
  description: string
  bullets: string[]
  colorClass?: string | null
  ctaLabel?: string | null
}

export default function SolutionsPage() {
  const { data } = useQuery<{ solutions: Solution[] }>({
    queryKey: ['solutions-public'],
    queryFn: async () => (await api.get('/solutions')).data,
    staleTime: 5 * 60 * 1000,
  })

  const solutions = data?.solutions ?? []

  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Soluções · produtos verticais</span>
        </div>
        <h1>
          Plataformas prontas,
          <br />
          <em>customizáveis</em> para seu setor.
        </h1>
        <p>
          Aceleradores que condensam anos de experiência em setores específicos — adaptamos a base ao seu processo em
          semanas, não em meses.
        </p>
      </section>

      <section className="sol-grid shell">
        {solutions.map((sol) => (
          <div key={sol.id} className={`sol glass ${sol.colorClass ?? 'a'}`}>
            <div className="shard" />
            {sol.tag && <div className="tag">{sol.tag}</div>}
            <h3>{sol.title}</h3>
            <p>{sol.description}</p>
            {sol.bullets && sol.bullets.length > 0 && (
              <ul>
                {sol.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            )}
            <Link to="/contato" className="sol-cta">
              {sol.ctaLabel ?? 'Ver demo →'}
            </Link>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  )
}
