import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAnalytics } from '@/hooks/use-analytics'
import { useEffect } from 'react'
import { api, homeExtrasApi, stackApi } from '@/lib/api'

interface ProcessStep {
  id: string
  number: string
  title: string
  description: string
  duration?: string | null
}

interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  iconName?: string | null
  anchor?: string | null
  numLabel?: string | null
  tileClass?: string | null
  homePill?: string | null
  homePillTags?: string[]
  order: number
}

interface KPI {
  id: string
  label: string
  value: string
  suffix?: string | null
  caption?: string | null
  order: number
}

interface LiveCardRow {
  label: string
  value: string
  highlight?: string | null
}

interface LiveCard {
  id: string
  label: string
  title: string
  rows: LiveCardRow[]
}

interface BrandPill {
  id: string
  personName: string
  company?: string | null
  quote: string
  avatarUrl?: string | null
}

interface HomeBand {
  id: string
  eyebrow: string
  title: string
  ctaLabel: string
  ctaUrl: string
  mono: string
}

const ICONS: Record<string, JSX.Element> = {
  code: (
    <svg viewBox="0 0 24 24">
      <path d="M8 6 3 12l5 6M16 6l5 6-5 6M14 4l-4 16" />
    </svg>
  ),
  squad: (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5M13 20c0-3 3-5 6-5" />
    </svg>
  ),
  auto: (
    <svg viewBox="0 0 24 24">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  box: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3l9 4.5v9L12 21 3 16.5v-9L12 3zM12 12l9-4.5M12 12v9M12 12L3 7.5" />
    </svg>
  ),
  server: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <rect x="3" y="15" width="18" height="5" rx="1" />
      <path d="M7 6.5v.01M7 17.5v.01" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10c0-1.66 1.34-3 3-3s3 1.34 3 3-3 2-3 4M12 17v.01" />
    </svg>
  ),
  build: (
    <svg viewBox="0 0 24 24">
      <path d="M4 20V10l8-6 8 6v10H4zM10 20v-6h4v6" />
    </svg>
  ),
}

function iconFor(iconName?: string | null) {
  if (iconName && ICONS[iconName]) return ICONS[iconName]
  return ICONS.code
}

export default function HomePage() {
  const { trackPageView, trackEvent } = useAnalytics()

  useEffect(() => {
    trackPageView('/')
    trackEvent('page_load', { page: 'home', timestamp: new Date().toISOString() })
  }, [trackPageView, trackEvent])

  const servicesQuery = useQuery<{ services: Service[] }>({
    queryKey: ['services-home'],
    queryFn: async () => (await api.get('/services')).data,
    staleTime: 5 * 60 * 1000,
  })

  const kpiQuery = useQuery<{ kpis: KPI[] }>({
    queryKey: ['kpis-home'],
    queryFn: async () => (await api.get('/kpis')).data,
    staleTime: 5 * 60 * 1000,
  })

  const liveCardQuery = useQuery<{ card: LiveCard | null }>({
    queryKey: ['home-live-card'],
    queryFn: homeExtrasApi.getLiveCard,
    staleTime: 5 * 60 * 1000,
  })

  const pillQuery = useQuery<{ pill: BrandPill | null }>({
    queryKey: ['home-brand-pill'],
    queryFn: homeExtrasApi.getBrandPill,
    staleTime: 5 * 60 * 1000,
  })

  const bandQuery = useQuery<{ band: HomeBand | null }>({
    queryKey: ['home-band'],
    queryFn: homeExtrasApi.getBand,
    staleTime: 5 * 60 * 1000,
  })

  const stackQuery = useQuery<{ items: { id: string; name: string }[] }>({
    queryKey: ['stack-items'],
    queryFn: stackApi.getItems,
    staleTime: 5 * 60 * 1000,
  })

  const stepsQuery = useQuery<{ steps: ProcessStep[] }>({
    queryKey: ['process-steps'],
    queryFn: async () => (await api.get('/process-steps')).data,
    staleTime: 5 * 60 * 1000,
  })

  const services = (servicesQuery.data?.services ?? []).slice(0, 7)
  const kpis = kpiQuery.data?.kpis ?? []
  const live = liveCardQuery.data?.card
  const pill = pillQuery.data?.pill
  const band = bandQuery.data?.band
  const stack = stackQuery.data?.items ?? []
  const steps = stepsQuery.data?.steps ?? []

  const clientsQuery = useQuery<{ clients: { id: string; name: string; logoUrl: string; sector?: string | null; websiteUrl?: string | null }[] }>({
    queryKey: ['clients-home'],
    queryFn: async () => (await api.get('/clients')).data,
    staleTime: 5 * 60 * 1000,
  })
  const clients = clientsQuery.data?.clients ?? []

  return (
    <div className="page">
      <Header />

      <section className="hero shell home-hero">
        <div className="wrap">
          <div className="left">
            <div className="eyebrow mono">
              <span className="dot" />
              <span>Abr 2026 · aceitando novos projetos para Q3</span>
            </div>
            <h1 className="hero-h1">
              <span className="hero-line">
                <span className="word"><span>Engenharia</span></span>{' '}
                <span className="word"><span>de software</span></span>
              </span>
              <span className="hero-line">
                <span className="word">
                  <span>
                    que <em className="prism">transforma</em>
                  </span>
                </span>
              </span>
              <span className="hero-line">
                <span className="word"><span>operações em vantagem</span></span>{' '}
                <span className="word"><span>competitiva.</span></span>
              </span>
            </h1>
            <p className="sub">
              Sem tecniquês. Viramos ideia em software — sob medida, rápido e pra durar.
              Squads ágeis, automação e consultoria pra acelerar sua transformação digital.
            </p>
            <div className="ctas">
              <Link to="/contato" className="btn btn-primary">
                Agendar diagnóstico <span>↗</span>
              </Link>
              <Link to="/servicos" className="play">
                <span className="pi">▶</span>
                <span>
                  Ver como trabalhamos <span style={{ color: 'var(--ink-faint)' }}>· 2 min</span>
                </span>
              </Link>
            </div>
            <div className="hero-badges">
              <span className="hero-badge">
                <span className="dot-pulse" />
                Resposta em até 24h úteis
              </span>
              <span className="hero-badge">
                🔒 LGPD-ready
              </span>
            </div>
          </div>

          <aside className="right">
            {live && (
              <div className="card-live glass">
                <div className="shard" />
                <div className="pulse">
                  <span className="bullet" />
                  <span>{live.label}</span>
                </div>
                <h4>{live.title}</h4>
                <div className="ticker">
                  {live.rows.map((row, idx) => (
                    <div key={idx} className="row">
                      <span>{row.label}</span>
                      <b className={row.highlight === 'up' ? 'up' : ''}>{row.value}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {pill && (
              <div className="card-pill glass">
                <div className="shard" />
                <div className="av" style={pill.avatarUrl ? { backgroundImage: `url(${pill.avatarUrl})`, backgroundSize: 'cover' } : undefined} />
                <div className="t">
                  <b>{pill.personName}</b>
                  {pill.company ? ` · ${pill.company}` : ''}
                  <br />
                  {pill.quote}
                </div>
              </div>
            )}
          </aside>
        </div>

        {kpis.length > 0 && (
          <div className="hero-meta">
            {kpis.map((kpi) => (
              <div key={kpi.id}>
                <div className="km">{kpi.label}</div>
                <div className="k">
                  {kpi.value}
                  {kpi.suffix && <em>{kpi.suffix}</em>}
                </div>
                <div className="l">{kpi.caption}</div>
              </div>
            ))}
          </div>
        )}

        <a href="#vitral" className="scroll-hint" aria-label="Rolar para ver mais">
          <span className="mono">Role para explorar</span>
          <span className="scroll-arrow">↓</span>
        </a>
      </section>

      <div className="shell"><div className="section-star">✶ ✶ ✶</div></div>

      {services.length > 0 && (
        <section id="vitral" className="vitral shell">
          <div className="section-head">
            <h2 className="display">
              Um mosaico de capacidades técnicas,{' '}
              <span className="dim">uma única entrega de valor.</span>
            </h2>
            <p className="lede">
              Cada vidraça do nosso vitral é uma competência afiada — montadas juntas, viram soluções sob medida para o
              seu problema de negócio.
            </p>
          </div>

          <div className="mosaic">
            {services.map((svc, i) => {
              const tileClass = svc.tileClass || `t${i + 1}`
              const href = svc.anchor ? `/servicos#${svc.anchor}` : '/servicos'
              return (
                <Link
                  key={svc.id}
                  to={href}
                  className={`tile glass ${tileClass}`}
                >
                  <div className="tile-body">
                    <div className="tile-head">
                      <div>
                        <div className="svc-num">{svc.numLabel || `SVC · ${String(i + 1).padStart(2, '0')}`}</div>
                        <h3 style={{ marginTop: 10 }}>{svc.title}</h3>
                        {(i === 0 || i === 6) && (
                          <p style={{ marginTop: 8, maxWidth: i === 0 ? 420 : 480 }}>{svc.description}</p>
                        )}
                        {i !== 0 && i !== 6 && <p>{svc.description}</p>}
                      </div>
                      <div className="tile-icon">{iconFor(svc.iconName)}</div>
                    </div>
                    {svc.homePill && <span className="pill">{svc.homePill}</span>}
                    {svc.homePillTags && svc.homePillTags.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {svc.homePillTags.map((t) => (
                          <span key={t} className="pill">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {steps.length > 0 && (
        <section className="timeline shell">
          <div className="section-head">
            <h2 className="display">
              Nosso ritmo <span className="dim">de trabalho.</span>
            </h2>
            <p className="lede">
              Nada de caixa preta. Você acompanha de perto, aprova a cada passo, sabe exatamente onde estamos.
            </p>
          </div>
          <div className="timeline-wrap">
            <div className="timeline-rail" aria-hidden="true" />
            {steps.map((s, idx) => (
              <article key={s.id} className={`timeline-item ${idx % 2 === 0 ? 'left' : 'right'}`}>
                <div className="timeline-dot" aria-hidden="true">
                  <span className="timeline-dot-ring" />
                </div>
                <div className="timeline-card glass">
                  <span className="timeline-watermark" aria-hidden="true">{s.number}</span>
                  <div className="timeline-head">
                    <span className="mono">etapa {s.number}</span>
                    {s.duration && <span className="timeline-duration">⏱ {s.duration}</span>}
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {clients.length > 0 && (() => {
        // agrupar por setor para montar os "capítulos"
        const sectors = Array.from(new Set(clients.map((c) => c.sector || 'Outros')))
        const bySector = sectors.map((s) => ({
          sector: s,
          items: clients.filter((c) => (c.sector || 'Outros') === s),
        }))
        // construir uma única faixa ordenada com chapters intercalados
        const flat: Array<{ type: 'chapter'; label: string } | { type: 'client'; data: typeof clients[number] }> = []
        bySector.forEach((g) => {
          flat.push({ type: 'chapter', label: g.sector })
          g.items.forEach((c) => flat.push({ type: 'client', data: c }))
        })

        const renderItem = (item: typeof flat[number], key: string) => {
          if (item.type === 'chapter') {
            return (
              <span key={key} className="clients-chapter">
                <span className="clients-chapter-star">✶</span>
                <span className="clients-chapter-label">{item.label}</span>
              </span>
            )
          }
          const c = item.data
          const inner = (
            <>
              {c.logoUrl ? (
                <img src={c.logoUrl} alt={c.name} loading="lazy" />
              ) : (
                <span className="clients-card-name">{c.name}</span>
              )}
            </>
          )
          return c.websiteUrl ? (
            <a key={key} href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="clients-card">{inner}</a>
          ) : (
            <span key={key} className="clients-card">{inner}</span>
          )
        }

        return (
          <section className="clients-strip">
            <div className="shell clients-strip-head">
              <div>
                <div className="mono" style={{ marginBottom: 12 }}>Prova social · {clients.length} clientes em produção</div>
                <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
                  Empresas que escolhem a BSN<br />
                  <span className="dim">para crescer com tecnologia.</span>
                </h2>
              </div>
            </div>

            <div className="clients-marquee">
              <div className="clients-track clients-track-a">
                {flat.map((item, i) => renderItem(item, `a-${i}`))}
                {flat.map((item, i) => renderItem(item, `a2-${i}`))}
              </div>
            </div>
            <div className="clients-marquee">
              <div className="clients-track clients-track-b">
                {[...flat].reverse().map((item, i) => renderItem(item, `b-${i}`))}
                {[...flat].reverse().map((item, i) => renderItem(item, `b2-${i}`))}
              </div>
            </div>
          </section>
        )
      })()}

      {band && (
        <section className="band shell">
          <div className="band-inner glass">
            <div className="band-shard a" />
            <div className="band-shard b" />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="mono" style={{ marginBottom: 18 }}>{band.eyebrow}</div>
              <h2 className="display" dangerouslySetInnerHTML={{ __html: band.title }} />
              <div className="band-cta">
                <Link to={band.ctaUrl} className="btn btn-primary">
                  {band.ctaLabel}
                </Link>
                <span className="mono">{band.mono}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {stack.length > 0 && (
        <section className="stack shell">
          <div className="mono" style={{ marginBottom: 18 }}>STACK &amp; FERRAMENTAS QUE DOMINAMOS</div>
          <div className="marquee">
            <div className="marquee-track">
              {stack.map((t) => <span key={`a-${t.id}`}>{t.name}</span>)}
              {stack.map((t) => <span key={`b-${t.id}`}>{t.name}</span>)}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
