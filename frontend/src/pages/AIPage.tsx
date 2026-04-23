import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Brain,
  Database,
  Scissors,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
  Cpu,
  LineChart,
  Bot,
  Workflow,
  FileSearch,
  FileText,
  Table,
  Clock,
  Gauge,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { aiApi } from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'

const AI_SECTION_KEYS = ['hero', 'benefits', 'cases', 'data', 'stages', 'cta-band'] as const

type AIBlockType = 'HERO_BENEFIT' | 'STAGE' | 'EDU_HIGHLIGHT'

interface AIBlock {
  id: string
  type: AIBlockType
  tag?: string | null
  title: string
  description: string
  bullets: string[]
  colorClass?: string | null
  number?: string | null
  iconName?: string | null
  imageUrl?: string | null
  order: number
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'trending-up': TrendingUp,
  scissors: Scissors,
  zap: Zap,
  brain: Brain,
  database: Database,
  shield: Shield,
  sparkles: Sparkles,
  cpu: Cpu,
  'line-chart': LineChart,
  bot: Bot,
  workflow: Workflow,
  'file-search': FileSearch,
  gauge: Gauge,
  clock: Clock,
}

function renderIcon(name?: string | null, fallback = Sparkles) {
  const Icon = (name && ICONS[name]) || fallback
  return <Icon className="ai-ico-svg" />
}

/* ─────────── Fallback local — garante que a página renderiza mesmo sem API ─────────── */

const FALLBACK_BENEFITS: AIBlock[] = [
  {
    id: 'b1',
    type: 'HERO_BENEFIT',
    tag: 'RECEITA',
    title: 'Aumento de receita',
    description: 'Upsell dirigido por sinal, recomendação contextual e recuperação de demanda perdida.',
    bullets: [],
    colorClass: 'a',
    iconName: 'trending-up',
    order: 1,
  },
  {
    id: 'b2',
    type: 'HERO_BENEFIT',
    tag: 'CUSTO',
    title: 'Redução de custos',
    description: 'Triagem, classificação e automação que tira horas de trabalho repetitivo do time.',
    bullets: [],
    colorClass: 'b',
    iconName: 'scissors',
    order: 2,
  },
  {
    id: 'b3',
    type: 'HERO_BENEFIT',
    tag: 'EFICIÊNCIA',
    title: 'Ganho em eficiência',
    description: 'Otimização de operação com decisão assistida — quem opera vê o motivo, não só o output.',
    bullets: [],
    colorClass: 'c',
    iconName: 'zap',
    order: 3,
  },
  {
    id: 'b4',
    type: 'HERO_BENEFIT',
    tag: 'QUALIDADE',
    title: 'Qualidade auditável',
    description: 'Cada resposta do modelo tem trilha, fonte e métrica — nada de caixa-preta.',
    bullets: [],
    colorClass: 'd',
    iconName: 'shield',
    order: 4,
  },
]

const FALLBACK_STAGES: AIBlock[] = [
  {
    id: 's1',
    type: 'STAGE',
    tag: 'Discovery IA',
    title: 'Validar & Planejar',
    description: 'Análise de viabilidade, desenho do caso de uso e plano de ação com critério de parada.',
    bullets: [
      'Mapeamento de dados disponíveis e gaps',
      'Definição de métrica de sucesso e baseline',
      'Prova de conceito em até 3 semanas',
    ],
    colorClass: 'a',
    number: '01',
    iconName: 'file-search',
    order: 1,
  },
  {
    id: 's2',
    type: 'STAGE',
    tag: 'Desenvolvimento IA',
    title: 'Construir & Integrar',
    description: 'Construção do modelo, agentes ou pipeline e integração nos sistemas que você já opera.',
    bullets: [
      'Escolha do stack (open-source, APIs gerenciadas, RAG, fine-tuning)',
      'Orquestração com fallback e guardrails',
      'Observabilidade desde o primeiro deploy',
    ],
    colorClass: 'b',
    number: '02',
    iconName: 'workflow',
    order: 2,
  },
  {
    id: 's3',
    type: 'STAGE',
    tag: 'Squads Especializados',
    title: 'Evoluir & Escalar',
    description: 'Operação contínua com squad dedicado, métricas públicas e evolução com base em uso real.',
    bullets: [
      'Revisão mensal de custo por inferência',
      'Retreinos dirigidos por drift, não por calendário',
      'Evolução do produto com base em feedback operacional',
    ],
    colorClass: 'c',
    number: '03',
    iconName: 'cpu',
    order: 3,
  },
]

const FALLBACK_CASES = [
  {
    id: 'c1',
    tag: 'AGENTE',
    title: 'Agente de atendimento em cooperativa',
    description: 'Triagem de 40k associados com resposta contextualizada e trilha de auditoria.',
    metric: '-62% tempo de resposta',
    colorClass: 'a',
  },
  {
    id: 'c2',
    tag: 'AUTOMAÇÃO',
    title: 'Classificação de documentos fiscais',
    description: 'Extração de dados de NF-e, NFS-e e boletos com validação humana em fila.',
    metric: '94% precisão em produção',
    colorClass: 'b',
  },
  {
    id: 'c3',
    tag: 'RAG',
    title: 'Base de conhecimento corporativa',
    description: 'Busca semântica sobre 18 anos de documentação interna, com citação de fonte.',
    metric: '3s por resposta',
    colorClass: 'c',
  },
  {
    id: 'c4',
    tag: 'ML CLÁSSICO',
    title: 'Previsão de churn em SaaS B2B',
    description: 'Modelo de risco com janela de 30 dias — integrado ao CRM e ao playbook de CS.',
    metric: '+22% retenção',
    colorClass: 'd',
  },
]

export default function AIPage() {
  const { data } = useQuery<{
    blocks: AIBlock[]
    benefits: AIBlock[]
    stages: AIBlock[]
    education: AIBlock[]
  }>({
    queryKey: ['ai-blocks-public'],
    queryFn: aiApi.getBlocks,
    staleTime: 5 * 60 * 1000,
  })

  const benefits = data?.benefits?.length ? data.benefits : FALLBACK_BENEFITS
  const stages = data?.stages?.length ? data.stages : FALLBACK_STAGES
  const { effectiveKeys } = usePageSections('ai', AI_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <section key="hero" className="ai-hero shell a" data-reveal>
        <div className="svc-detail-hero-icon" aria-hidden>
          <span className="svc-detail-hero-icon-ring svc-detail-hero-icon-ring-1" />
          <span className="svc-detail-hero-icon-ring svc-detail-hero-icon-ring-2" />
          <span className="svc-detail-hero-icon-ring svc-detail-hero-icon-ring-3" />
          <span className="svc-detail-hero-icon-orb svc-detail-hero-icon-orb-1" />
          <span className="svc-detail-hero-icon-orb svc-detail-hero-icon-orb-2" />
          <span className="svc-detail-hero-icon-orb svc-detail-hero-icon-orb-3" />
          <span className="svc-detail-hero-icon-glow" />
          <span className="svc-detail-hero-icon-core">
            <Brain className="svc-detail-ico-svg" />
          </span>
        </div>
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Inteligência Artificial · engenharia aplicada</span>
        </div>
        <h1 className="ai-hero-title">
          IA que vira <em>resultado</em> no balanço — não promessa em keynote.
        </h1>
        <p className="ai-hero-lede">
          A Inteligência Artificial é uma ferramenta estratégica, não uma solução mágica. Construímos agentes, automações
          e modelos sob medida para operações reais — com dados, métricas e um plano claro.
        </p>
      </section>
    ),

    benefits: () => (
      <section key="benefits" className="ai-benefits-strip shell" data-reveal>
        <div className="ai-benefits-wrap glass">
          {benefits.map((b) => (
            <div key={b.id} className={`ai-benefit-item ${b.colorClass ?? 'a'}`}>
              <div className="ai-benefit-ico">{renderIcon(b.iconName)}</div>
              <div className="ai-benefit-title">{b.title}</div>
              {b.description && <div className="ai-benefit-sub">{b.description}</div>}
            </div>
          ))}
        </div>
      </section>
    ),

    cases: () => (
      <section key="cases" className="ai-cases shell" data-reveal>
        <div className="ai-section-head">
          <span className="tag mono">Cases com IA</span>
          <h2>
            Entregamos jornadas e soluções claras, com o <em>desafio de negócio sempre como ponto de partida</em>.
          </h2>
        </div>
        <div className="ai-cases-grid">
          {FALLBACK_CASES.map((c) => (
            <article key={c.id} className={`ai-case glass ${c.colorClass}`}>
              <div className="shard" />
              <div className="ai-case-cover">
                <div className="ai-case-cover-inner" aria-hidden />
                <span className="ai-case-tag mono">{c.tag}</span>
              </div>
              <div className="ai-case-body">
                <h3>{c.title}</h3>
                <p>{c.description}</p>
                <div className="ai-case-metric mono">{c.metric}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    ),

    stages: () => (
      <section key="stages" className="ai-stages shell" data-reveal>
        <div className="ai-section-head">
          <span className="tag mono">Escopo e serviços</span>
          <h2>
            Nossa operação é estruturada e garante <em>alocação inteligente de investimentos</em>.
          </h2>
        </div>
        <div className="ai-stages-list">
          {stages.map((s) => (
            <article key={s.id} className={`ai-stage glass ${s.colorClass ?? 'a'}`}>
              <div className="shard" />
              <div className="ai-stage-num mono">{s.number ?? '—'}</div>
              <div className="ai-stage-body">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
                {s.bullets.length > 0 && (
                  <ul>
                    {s.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="ai-stage-service">
                <div className="mono tag">Serviço sugerido</div>
                <div className="ai-stage-service-label">
                  {renderIcon(s.iconName, Sparkles)}
                  <span>{s.tag ?? 'Discovery IA'}</span>
                  <span className="ai-arr">→</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    ),

    data: () => (
      <section key="data" className="ai-data shell" data-reveal>
        <div className="ai-section-head center">
          <h2>
            Dados como fator <em>mais importante</em>.
          </h2>
          <p className="lede">
            A IA é sempre tão boa quanto os dados que a alimentam. Com bons dados, os resultados são melhores — e
            auditáveis.
          </p>
        </div>
        <div className="ai-orbit" aria-hidden>
          {/* Linhas conectando nodes externos ao core — curvas bezier */}
          <svg className="ai-orbit-lines" viewBox="0 0 720 420" preserveAspectRatio="none">
            {/* Camada base (tracejado discreto sempre visível) */}
            <g>
              <path className="line-n-left-1"  d="M 360 210 C 240 210, 200 72,  55 72" />
              <path className="line-n-left-2"  d="M 360 210 C 240 210, 180 168, 20 168" />
              <path className="line-n-left-3"  d="M 360 210 C 240 210, 200 275, 55 275" />
              <path className="line-n-left-4"  d="M 360 210 C 300 230, 240 340, 149 357" />
              <path className="line-n-right-1" d="M 360 210 C 480 210, 520 72, 665 72" />
              <path className="line-n-right-2" d="M 360 210 C 540 210, 580 168, 700 168" />
              <path className="line-n-right-3" d="M 360 210 C 480 210, 520 275, 665 275" />
              <path className="line-n-right-4" d="M 360 210 C 420 230, 480 340, 571 357" />
            </g>
            {/* Camada pulso (traço luminoso que viaja do node ao core) — mesmos paths */}
            <g className="ai-orbit-lines-pulse">
              <path className="line-n-left-1"  d="M 360 210 C 240 210, 200 72,  55 72" />
              <path className="line-n-left-2"  d="M 360 210 C 240 210, 180 168, 20 168" />
              <path className="line-n-left-3"  d="M 360 210 C 240 210, 200 275, 55 275" />
              <path className="line-n-left-4"  d="M 360 210 C 300 230, 240 340, 149 357" />
              <path className="line-n-right-1" d="M 360 210 C 480 210, 520 72, 665 72" />
              <path className="line-n-right-2" d="M 360 210 C 540 210, 580 168, 700 168" />
              <path className="line-n-right-3" d="M 360 210 C 480 210, 520 275, 665 275" />
              <path className="line-n-right-4" d="M 360 210 C 420 230, 480 340, 571 357" />
            </g>
          </svg>
          <div className="ai-orbit-ring ring-outer" />
          <div className="ai-orbit-ring ring-inner" />
          <div className="ai-orbit-core">
            <Brain />
          </div>
          {/* Fontes de dados (esquerda) */}
          <div className="ai-orbit-node n-left-1"><FileText /></div>
          <div className="ai-orbit-node n-left-2"><Database /></div>
          <div className="ai-orbit-node n-left-3"><FileSearch /></div>
          <div className="ai-orbit-node n-left-4"><Table /></div>
          {/* Saídas (direita) */}
          <div className="ai-orbit-node n-right-1"><TrendingUp /></div>
          <div className="ai-orbit-node n-right-2"><Gauge /></div>
          <div className="ai-orbit-node n-right-3"><LineChart /></div>
          <div className="ai-orbit-node n-right-4"><Zap /></div>
        </div>
      </section>
    ),

    'cta-band': () => (
      <section key="cta-band" className="ai-cta-band" data-reveal>
        <div className="shell ai-cta-band-inner">
          <div className="ai-cta-band-copy">
            <h2>Fale com nossos especialistas hoje.</h2>
            <p>Vamos planejar e construir junto a sua próxima solução com IA — com dados, métricas e plano claro.</p>
          </div>
          <Link to="/contato" className="ai-cta-band-btn">
            Entrar em contato →
          </Link>
        </div>
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
