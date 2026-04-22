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
  technologies?: string[]
  projectUrl?: string | null
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
          <span>Soluções · produtos reais no ar</span>
        </div>
        <h1>
          Plataformas que
          <br />
          <em>impactam negócios</em>
          <br />
          de verdade.
        </h1>
        <p>
          Não vendemos promessas, mostramos projetos ao vivo. Cada produto aqui roda em produção com clientes reais —
          e pode ser adaptado ao seu setor em semanas, não meses.
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
            {sol.technologies && sol.technologies.length > 0 && (
              <div className="sol-tech">
                {sol.technologies.map((t) => (
                  <span key={t} className="sol-tech-pill">{t}</span>
                ))}
              </div>
            )}
            {sol.projectUrl ? (
              <a href={sol.projectUrl} target="_blank" rel="noopener noreferrer" className="sol-cta sol-cta-live">
                Ver solução ao vivo ↗
              </a>
            ) : (
              <Link to="/contato" className="sol-cta">
                {sol.ctaLabel ?? 'Ver detalhes →'}
              </Link>
            )}
          </div>
        ))}
      </section>

      <Footer />
    </div>
  )
}
