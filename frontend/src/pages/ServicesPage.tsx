import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { api } from '@/lib/api'

interface Feature {
  title: string
  description: string
}

interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  anchor?: string | null
  slug?: string | null
  numLabel?: string | null
  shardColor?: string | null
  ctaLabel?: string | null
  features?: Feature[] | null
  order: number
}

export default function ServicesPage() {
  const { data } = useQuery<{ services: Service[] }>({
    queryKey: ['services-public'],
    queryFn: async () => (await api.get('/services')).data,
    staleTime: 5 * 60 * 1000,
  })

  const services = data?.services ?? []

  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Serviços · o que construímos</span>
        </div>
        <h1>
          Capacidades técnicas
          <br />
          que viram <em>resultado</em>
          <br />
          no seu balanço.
        </h1>
        <p>
          Sete frentes especializadas. Entregamos como peças avulsas ou montadas como um vitral — do diagnóstico à
          operação contínua.
        </p>
      </section>

      <section className="svc-grid shell">
        {services.map((svc) => {
          const shard = svc.shardColor ?? 'v'
          const features: Feature[] = Array.isArray(svc.features) ? svc.features : []
          // Primeira palavra fica no main, resto (subtitle) embaixo
          const mainTitle = svc.subtitle
            ? svc.title.replace(svc.subtitle, '').trim()
            : svc.title
          const detailHref = svc.slug ? `/servicos/${svc.slug}` : null
          return (
            <article id={svc.anchor ?? undefined} key={svc.id} className={`svc glass ${shard}`}>
              <div className="shard" />
              <div className="side">
                <div className="num">{svc.numLabel}</div>
                <h2>
                  {detailHref ? (
                    <Link to={detailHref} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {mainTitle}
                      {svc.subtitle && (
                        <>
                          <br />
                          {svc.subtitle}
                        </>
                      )}
                    </Link>
                  ) : (
                    <>
                      {mainTitle}
                      {svc.subtitle && (
                        <>
                          <br />
                          {svc.subtitle}
                        </>
                      )}
                    </>
                  )}
                </h2>
              </div>
              <div className="content">
                <p className="lede">{svc.description}</p>
                {features.length > 0 && (
                  <div className="feats">
                    {features.map((f, idx) => (
                      <div key={idx}>
                        <b>{f.title}</b>
                        {f.description}
                      </div>
                    ))}
                  </div>
                )}
                <div className="svc-cta-row">
                  {detailHref && (
                    <Link to={detailHref} className="svc-cta">
                      Conhecer este serviço ↗
                    </Link>
                  )}
                  <Link to="/contato" className="svc-cta svc-cta-ghost">
                    {svc.ctaLabel ?? 'Falar sobre um projeto ↗'}
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <Footer />
    </div>
  )
}
