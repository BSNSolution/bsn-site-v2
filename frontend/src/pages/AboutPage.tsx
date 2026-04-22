import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { teamApi, api } from '@/lib/api'

interface TeamMember {
  id: string
  name: string
  role: string
  bio?: string | null
  imageUrl?: string | null
  order: number
}

interface Value {
  id: string
  number: string
  title: string
  description: string
  order: number
}

const DEFAULT_VALUES: Value[] = [
  {
    id: '1',
    number: '01',
    title: 'Clareza radical',
    description: 'Se não dá para explicar em uma frase, precisa ser simplificado.',
    order: 1,
  },
  {
    id: '2',
    number: '02',
    title: 'Menos é mais',
    description: 'Mil "nãos" para cada "sim". Evitamos feature slop a todo custo.',
    order: 2,
  },
  {
    id: '3',
    number: '03',
    title: 'Propriedade',
    description: 'Cada engenheiro trata o sistema como se fosse seu.',
    order: 3,
  },
  {
    id: '4',
    number: '04',
    title: 'Evolução contínua',
    description: 'Entregar rápido é bom; manter entregando por anos é melhor.',
    order: 4,
  },
]

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Cristhyan Koch',
    role: 'CTO & Co-founder',
    bio: '15+ anos em sistemas distribuídos e produtos de missão crítica.',
    order: 1,
  },
  {
    id: '2',
    name: 'Bruno Santos',
    role: 'Head de Engenharia',
    bio: 'Especialista em arquitetura escalável e times de alto desempenho.',
    order: 2,
  },
  {
    id: '3',
    name: 'Natalia Reis',
    role: 'Head de Produto',
    bio: 'Traduz necessidades complexas em roadmaps executáveis.',
    order: 3,
  },
]

const ABOUT_CARDS = [
  {
    tag: 'MISSÃO',
    title: 'Eliminar o gap entre a estratégia e a execução técnica.',
    description:
      'Queremos que líderes vejam tecnologia como alavanca — não como gargalo. Traduzimos visão de negócio em sistemas que escalam.',
    colorClass: 'c1',
  },
  {
    tag: 'VISÃO',
    title: 'Ser a parceira técnica default de operações complexas no Brasil.',
    description: 'Em setores onde o software tradicional não dá conta, queremos ser a primeira ligação.',
    colorClass: 'c2',
  },
  {
    tag: 'FORMA DE TRABALHAR',
    title: 'Parceria de longo prazo, com transparência desconfortável.',
    description:
      'Nossos relatórios mostram o que funcionou e o que não — porque essa é a única forma de evoluir de verdade.',
    colorClass: 'c3',
  },
  {
    tag: 'O QUE EVITAMOS',
    title: 'Feature slop, burocracia e soluções engessadas.',
    description: 'Se uma funcionalidade não gera valor mensurável, ela não entra no roadmap.',
    colorClass: 'c4',
  },
]

export default function AboutPage() {
  const teamQuery = useQuery<{ members?: TeamMember[]; team?: TeamMember[] }>({
    queryKey: ['team-public'],
    queryFn: teamApi.getTeam,
    staleTime: 5 * 60 * 1000,
  })

  const valuesQuery = useQuery<{ values: Value[] }>({
    queryKey: ['values-public'],
    queryFn: async () => {
      const res = await api.get('/values')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const team = (teamQuery.data?.members ?? teamQuery.data?.team ?? DEFAULT_TEAM).slice(0, 3)
  const values = (valuesQuery.data?.values?.length ? valuesQuery.data.values : DEFAULT_VALUES).slice(0, 4)

  const avatarClass = (i: number) => (i === 0 ? '' : i === 1 ? 'b' : 'c')

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

      <section className="about-grid shell">
        {ABOUT_CARDS.map((card) => (
          <div key={card.tag} className={`card glass ${card.colorClass}`}>
            <div className="shard" />
            <div className="tag">{card.tag}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </section>

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

      <section className="team shell">
        <div className="head">
          <h2>
            Um time <em>sênior</em> que você gostaria de ter contratado.
          </h2>
        </div>
        <div className="team-grid">
          {team.map((p, i) => (
            <div key={p.id} className="person glass">
              <div
                className={`av ${avatarClass(i)}`}
                style={p.imageUrl ? { backgroundImage: `url(${p.imageUrl})` } : undefined}
              />
              <div>
                <div className="n">{p.name}</div>
                <div className="r">{p.role}</div>
                {p.bio && <p className="q">{p.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
