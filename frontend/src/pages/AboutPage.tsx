import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { teamApi, api, aboutCardsApi } from '@/lib/api'

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

  const valuesQuery = useQuery<{ values: Value[] }>({
    queryKey: ['values-public'],
    queryFn: async () => (await api.get('/values')).data,
    staleTime: 5 * 60 * 1000,
  })

  const aboutQuery = useQuery<{ cards: AboutCard[] }>({
    queryKey: ['about-cards-public'],
    queryFn: aboutCardsApi.getCards,
    staleTime: 5 * 60 * 1000,
  })

  const team = teamQuery.data?.team ?? teamQuery.data?.members ?? []
  const values = valuesQuery.data?.values ?? []
  const aboutCards = aboutQuery.data?.cards ?? []

  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Sobre a BSN · quem somos</span>
        </div>
        <h1>
          Engenharia com foco
          <br />
          em <em>problemas reais</em>
          <br />
          de negócio.
        </h1>
        <p>
          Há mais de uma década ajudamos empresas a transformar operação em vantagem competitiva. Software que é fácil
          de usar, difícil de ignorar e feito para durar tanto quanto seu negócio.
        </p>
      </section>

      {aboutCards.length > 0 && (
        <section className="about-grid shell">
          {aboutCards.map((card) => (
            <div key={card.id} className={`card glass ${card.colorClass}`}>
              <div className="shard" />
              <div className="tag">{card.tag}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </section>
      )}

      {values.length > 0 && (
        <section className="values shell">
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
      )}

      {team.length > 0 && (
        <section className="team shell">
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
                    className={`av ${avClass}`}
                    style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
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
      )}

      <Footer />
    </div>
  )
}
