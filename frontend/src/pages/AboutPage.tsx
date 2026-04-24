import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import Seo from '@/components/Seo'
import { teamApi, aboutCardsApi } from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'
import { useApiQuery } from '@/hooks/use-api-query'

const ABOUT_SECTION_KEYS = ['hero', 'cards', 'values', 'team'] as const

interface TeamMember {
  id: string
  name: string
  role: string
  bio?: string | null
  imageUrl?: string | null
  avatarVariant?: string | null
  order: number
}

interface Value {
  id: string
  number: string
  title: string
  description: string
  order: number
}

interface AboutCard {
  id: string
  tag: string
  title: string
  description: string
  colorClass: string
  order: number
}

export default function AboutPage() {
  const teamQuery = useQuery<{ team?: TeamMember[]; members?: TeamMember[] }>({
    queryKey: ['team-public'],
    queryFn: teamApi.getTeam,
    staleTime: 5 * 60 * 1000,
  })

  const valuesQuery = useApiQuery<{ values: Value[] }>(['values-public'], '/values')

  const aboutQuery = useQuery<{ cards: AboutCard[] }>({
    queryKey: ['about-cards-public'],
    queryFn: aboutCardsApi.getCards,
    staleTime: 5 * 60 * 1000,
  })

  const team = teamQuery.data?.team ?? teamQuery.data?.members ?? []
  const values = valuesQuery.data?.values ?? []
  const aboutCards = aboutQuery.data?.cards ?? []
  const { effectiveKeys } = usePageSections('about', ABOUT_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Sobre a BSN · quem somos"
        title={
          <>
            Engenharia com foco em
            <br />
            <em>problemas reais</em> de negócio.
          </>
        }
        lede="Há mais de uma década ajudamos empresas a transformar operação em vantagem competitiva. Software que é fácil de usar, difícil de ignorar e feito para durar tanto quanto seu negócio."
      />
    ),

    cards: () =>
      aboutCards.length === 0 ? null : (
        <section key="cards" className="about-grid shell">
          {aboutCards.map((card) => (
            <div key={card.id} className={`card glass ${card.colorClass}`}>
              <div className="shard" />
              <div className="tag">{card.tag}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </section>
      ),

    values: () =>
      values.length === 0 ? null : (
        <section key="values" className="values shell">
          <div className="head">
            <h2>
              Quatro <em>princípios</em> que atravessam cada linha de código.
            </h2>
          </div>
          <div className="values-grid">
            {values.map((v) => (
              <div key={v.id} className="val glass">
                <div className="vn">{v.number}</div>
                <h4>{v.title}</h4>
                <p>{v.description}</p>
              </div>
            ))}
          </div>
        </section>
      ),

    team: () =>
      team.length === 0 ? null : (
        <section key="team" className="team shell">
          <div className="head">
            <h2>
              Um time <em>sênior</em> que você gostaria de ter contratado.
            </h2>
          </div>
          <div className="team-grid">
            {team.map((p) => {
              const variant = p.avatarVariant ?? 'default'
              const avClass = variant === 'default' ? '' : variant
              return (
                <div key={p.id} className="person glass">
                  <div
                    className={`av ${avClass} ${p.imageUrl ? 'has-photo' : ''}`}
                    style={
                      p.imageUrl
                        ? {
                            backgroundImage: `url(${p.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            background: `url(${p.imageUrl}) center/cover no-repeat`,
                          }
                        : undefined
                    }
                  />
                  <div>
                    <div className="n">{p.name}</div>
                    <div className="r">{p.role}</div>
                    {p.bio && <p className="q">{p.bio}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ),
  }

  return (
    <div className="page">
      <Seo
        title="Sobre a BSN Solution — Engenharia para Problemas Reais"
        description="Há mais de uma década transformando operação em vantagem competitiva. Software fácil de usar, difícil de ignorar e feito para durar tanto quanto o seu negócio. Conheça o time, a história e os valores da BSN Solution."
        path="/sobre"
      />
      <Header />
      {effectiveKeys.map((key) => sectionRenderers[key]?.() ?? null)}
      <Footer />
    </div>
  )
}
