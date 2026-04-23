import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import { usePageSections } from '@/hooks/use-page-sections'
import { useApiQuery } from '@/hooks/use-api-query'
import { renderServiceIcon } from '@/lib/service-icons'

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
  iconName?: string | null
  ctaLabel?: string | null
  features?: Feature[] | null
  order: number
}

const SERVICES_SECTION_KEYS = ['hero', 'grid'] as const

export default function ServicesPage() {
  const { data } = useApiQuery<{ services: Service[] }>(['services-public'], '/services')

  const services = data?.services ?? []
  const { effectiveKeys } = usePageSections('services', SERVICES_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Serviços · o que construímos"
        title={
          <>
            Capacidades técnicas que viram
            <br />
            <em>resultado</em> no seu balanço.
          </>
        }
        lede="Sete frentes especializadas. Entregamos como peças avulsas ou montadas como um vitral — do diagnóstico à operação contínua."
      />
    ),

    grid: () => (
      <section key="grid" className="svc-grid shell">
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
              <div className={`svc-watermark ${shard}`} aria-hidden>
                {renderServiceIcon(svc.iconName, 'svc-watermark-svg')}
              </div>
              <div className="side">
                <div className="svc-head">
                  <div className={`svc-ico ${shard}`}>{renderServiceIcon(svc.iconName, 'svc-ico-svg')}</div>
                  <div className="num">{svc.numLabel}</div>
                </div>
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
