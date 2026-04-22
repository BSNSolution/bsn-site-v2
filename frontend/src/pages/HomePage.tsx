import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useAnalytics } from '@/hooks/use-analytics'
import { useEffect } from 'react'
import { api } from '@/lib/api'

interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  iconName?: string | null
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

const DEFAULT_SERVICES: Service[] = [
  {
    id: '1',
    title: 'Desenvolvimento de software sob medida',
    description:
      'Sistemas construídos para a realidade da sua operação — de portais complexos a módulos de integração e dashboards executivos.',
    iconName: 'code',
    order: 1,
  },
  {
    id: '2',
    title: 'Squads ágeis multidisciplinares',
    description: 'Times plug-and-play que integram ao seu fluxo em até 5 dias úteis.',
    iconName: 'squad',
    order: 2,
  },
  {
    id: '3',
    title: 'Automação de processos',
    description: 'Integramos sistemas e orquestramos fluxos que devolvem horas à equipe.',
    iconName: 'auto',
    order: 3,
  },
  {
    id: '4',
    title: 'Consultoria em tecnologia',
    description: 'Diagnóstico que alinha processos, infraestrutura e inovação.',
    iconName: 'box',
    order: 4,
  },
  {
    id: '5',
    title: 'Infraestrutura & VPS gerenciada',
    description: 'Servidores dimensionados para sua carga, com backups e monitoramento.',
    iconName: 'server',
    order: 5,
  },
  {
    id: '6',
    title: 'Suporte técnico e evolução contínua',
    description: 'Planos que acompanham o crescimento — adicione funcionalidades a qualquer momento.',
    iconName: 'support',
    order: 6,
  },
  {
    id: '7',
    title: 'Outsourcing de TI e alocação estratégica',
    description:
      'Mantenha o foco no core do seu negócio. Nossos especialistas assumem demandas específicas com previsibilidade de custo e prazo.',
    iconName: 'build',
    order: 7,
  },
]

const DEFAULT_KPIS: KPI[] = [
  { id: '1', label: 'EXPERIÊNCIA', value: '12', suffix: '+', caption: 'anos entregando software de missão crítica', order: 1 },
  { id: '2', label: 'PORTFÓLIO', value: '80', suffix: '+', caption: 'projetos entregues em 14 setores', order: 2 },
  { id: '3', label: 'VELOCIDADE', value: '5', suffix: 'dias', caption: 'para integrar um squad ao seu time', order: 3 },
  { id: '4', label: 'COBERTURA', value: '24', suffix: '/7', caption: 'suporte, monitoramento e evolução contínua', order: 4 },
]

const STACK = [
  'TypeScript',
  'Node.js',
  'React',
  'Next.js',
  'Python',
  'Django',
  'PostgreSQL',
  'Redis',
  'AWS',
  'Kubernetes',
  'Terraform',
  'Kafka',
]

const SERVICE_ANCHORS = [
  '/servicos#sob-medida',
  '/servicos#squads',
  '/servicos#automacao',
  '/servicos#consultoria',
  '/servicos#infra',
  '/servicos#suporte',
  '/servicos#outsourcing',
]

const TILE_CLASSES = ['t1', 't2', 't3', 't4', 't5', 't6', 't7']

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

function iconFor(iconName?: string | null, fallback: string = 'code') {
  const key = iconName && ICONS[iconName] ? iconName : fallback
  return ICONS[key] ?? ICONS[fallback]
}

export default function HomePage() {
  const { trackPageView, trackEvent } = useAnalytics()

  useEffect(() => {
    trackPageView('/')
    trackEvent('page_load', { page: 'home', timestamp: new Date().toISOString() })
  }, [trackPageView, trackEvent])

  const servicesQuery = useQuery<{ services: Service[] }>({
    queryKey: ['services-home'],
    queryFn: async () => {
      const res = await api.get('/services')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
  })

  const kpiQuery = useQuery<{ kpis: KPI[] }>({
    queryKey: ['kpis-home'],
    queryFn: async () => {
      const res = await api.get('/kpis')
      return res.data
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  const services = (servicesQuery.data?.services?.length ? servicesQuery.data.services : DEFAULT_SERVICES).slice(0, 7)
  const kpis = (kpiQuery.data?.kpis?.length ? kpiQuery.data.kpis : DEFAULT_KPIS).slice(0, 4)

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
            <h1>
              <span className="word"><span>Engenharia</span></span>{' '}
              <span className="word"><span>de software</span></span>{' '}
              <span className="word">
                <span>
                  que <em className="prism">transforma</em>
                </span>
              </span>{' '}
              <span className="word"><span>operações em vantagem</span></span>{' '}
              <span className="word"><span>competitiva.</span></span>
            </h1>
            <p className="sub">
              A BSN Solution é a parceira estratégica de empresas que não aceitam soluções engessadas.
              Desenvolvemos software sob medida, automatizamos processos e construímos squads ágeis para acelerar sua
              transformação digital.
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
          </div>

          <aside className="right">
            <div className="card-live glass">
              <div className="shard" />
              <div className="pulse">
                <span className="bullet" />
                <span>Ao vivo · operação 24/7</span>
              </div>
              <h4>Monitoramos 32 projetos em produção agora mesmo.</h4>
              <div className="ticker">
                <div className="row"><span>Uptime · ano</span><b className="up">99.97%</b></div>
                <div className="row"><span>Deploys · semana</span><b>147</b></div>
                <div className="row"><span>Tickets resolvidos</span><b className="up">↑ 12%</b></div>
              </div>
            </div>
            <div className="card-pill glass">
              <div className="shard" />
              <div className="av" />
              <div className="t">
                <b>Carolina Menezes</b> · FinCo
                <br />
                "Ritmo de entrega 3× superior ao esperado."
              </div>
            </div>
          </aside>
        </div>

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
      </section>

      <section className="vitral shell">
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
          {services.map((svc, i) => (
            <Link
              key={svc.id}
              to={SERVICE_ANCHORS[i] ?? '/servicos'}
              className={`tile glass ${TILE_CLASSES[i] ?? 't' + (i + 1)}`}
            >
              <div className="tile-body">
                <div className="tile-head">
                  <div>
                    <div className="svc-num">SVC · {String(i + 1).padStart(2, '0')}</div>
                    <h3 style={{ marginTop: 10 }}>{svc.title}</h3>
                    {(i === 0 || i === 6) && (
                      <p style={{ marginTop: 8, maxWidth: i === 0 ? 420 : 480 }}>{svc.description}</p>
                    )}
                    {i !== 0 && i !== 6 && <p>{svc.description}</p>}
                  </div>
                  <div className="tile-icon">{iconFor(svc.iconName, ['code','squad','auto','box','server','support','build'][i])}</div>
                </div>
                {i === 0 && <span className="pill">Ver detalhes →</span>}
                {i === 1 && <span className="pill">Plug &amp; play</span>}
                {i === 5 && <span className="pill">SLA 24/7</span>}
                {i === 6 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="pill">Dev</span>
                    <span className="pill">DevOps</span>
                    <span className="pill">QA</span>
                    <span className="pill">Data</span>
                    <span className="pill">Produto</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="band shell">
        <div className="band-inner glass">
          <div className="band-shard a" />
          <div className="band-shard b" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="mono" style={{ marginBottom: 18 }}>FILOSOFIA</div>
            <h2 className="display">
              Software fácil de usar. <em>Difícil de ignorar.</em>
              <br />
              Feito para durar tanto quanto sua empresa.
            </h2>
            <div className="band-cta">
              <Link to="/contato" className="btn btn-primary">
                Conversar com um especialista <span>↗</span>
              </Link>
              <span className="mono">Diagnóstico inicial gratuito · 45 min</span>
            </div>
          </div>
        </div>
      </section>

      <section className="stack shell">
        <div className="mono" style={{ marginBottom: 18 }}>STACK &amp; FERRAMENTAS QUE DOMINAMOS</div>
        <div className="marquee">
          <div className="marquee-track">
            {STACK.map((t, idx) => (
              <span key={`a-${idx}-${t}`}>{t}</span>
            ))}
            {STACK.map((t, idx) => (
              <span key={`b-${idx}-${t}`}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
