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
  imageUrl?: string | null
  colorClass?: string | null
  ctaLabel?: string | null
}

/**
 * Placeholder SVG inline (data URI) enquanto o admin não subiu a imagem
 * real — cada card ganha uma paleta diferente conforme a colorClass.
 */
function samplePlaceholder(colorClass: string, title: string): string {
  const palettes: Record<string, [string, string]> = {
    a: ['#7a5bff', '#26d9ff'], // violet → cyan
    b: ['#26d9ff', '#3de0a8'], // cyan → emerald
    c: ['#ff4fb8', '#ffb547'], // magenta → amber
    d: ['#ffb547', '#ff4fb8'], // amber → magenta
    e: ['#3de0a8', '#26d9ff'], // emerald → cyan
    f: ['#7a5bff', '#ff4fb8'], // violet → magenta
  }
  const [c1, c2] = palettes[colorClass] || palettes.a
  const initial = (title || '?').trim().charAt(0).toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}" stop-opacity="0.55"/>
        <stop offset="1" stop-color="${c2}" stop-opacity="0.35"/>
      </linearGradient>
      <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M24 0H0v24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="400" height="200" fill="#0c0c14"/>
    <rect width="400" height="200" fill="url(#g)"/>
    <rect width="400" height="200" fill="url(#grid)"/>
    <circle cx="330" cy="50" r="80" fill="${c1}" opacity="0.35" filter="blur(40px)"/>
    <circle cx="70" cy="170" r="90" fill="${c2}" opacity="0.3" filter="blur(50px)"/>
    <text x="30" y="120" font-family="Inter, sans-serif" font-size="82" font-weight="500" fill="rgba(255,255,255,0.92)" letter-spacing="-4">${initial}</text>
    <text x="30" y="160" font-family="JetBrains Mono, monospace" font-size="11" font-weight="400" fill="rgba(255,255,255,0.5)" letter-spacing="2">PREVIEW · SAMPLE</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
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
        {solutions.map((sol) => {
          const coverSrc = sol.imageUrl || samplePlaceholder(sol.colorClass ?? 'a', sol.title)
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

      <Footer />
    </div>
  )
}
