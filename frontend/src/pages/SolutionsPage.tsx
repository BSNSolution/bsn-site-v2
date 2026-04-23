import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import { usePageSections } from '@/hooks/use-page-sections'
import { useApiQuery } from '@/hooks/use-api-query'
import { solutionPlaceholder } from '@/lib/placeholders'

const SOLUTIONS_SECTION_KEYS = ['hero', 'grid'] as const

interface Solution {
  id: string
  title: string
  tag?: string | null
  description: string
  bullets: string[]
  technologies?: string[]
  projectUrl?: string | null
  imageUrl?: string | null
  colorClass?: string | null
  ctaLabel?: string | null
}

export default function SolutionsPage() {
  const { data } = useApiQuery<{ solutions: Solution[] }>(['solutions-public'], '/solutions')

  const solutions = data?.solutions ?? []
  const { effectiveKeys } = usePageSections('solutions', SOLUTIONS_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Soluções · produtos reais no ar"
        title={
          <>
            Plataformas que
            <br />
            <em>impactam negócios</em>
            <br />
            de verdade.
          </>
        }
        lede="Não vendemos promessas, mostramos projetos ao vivo. Cada produto aqui roda em produção com clientes reais — e pode ser adaptado ao seu setor em semanas, não meses."
      />
    ),

    grid: () => (
      <section key="grid" className="sol-grid shell">
        {solutions.map((sol) => {
          const coverSrc = sol.imageUrl || solutionPlaceholder(sol.colorClass ?? 'a', sol.title)
          return (
          <div key={sol.id} className={`sol glass ${sol.colorClass ?? 'a'}`}>
            <div className="shard" />
            <div className="sol-cover">
              <img src={coverSrc} alt={sol.title} loading="lazy" />
              {!sol.imageUrl && <span className="sol-cover-badge mono">sample</span>}
            </div>
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
          )
        })}
      </section>
    ),
  }

  return (
    <div className="page">
      <Header />
      {effectiveKeys.map((key) => sectionRenderers[key]?.() ?? null)}
      <Footer />
    </div>
  )
}
