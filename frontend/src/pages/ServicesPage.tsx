import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface SvcItem {
  id: string
  anchor: string
  num: string
  title: string
  subtitle?: string
  lede: string
  shardClass: 'v' | 'c' | 'm' | 'a' | 'e'
  feats: { title: string; description: string }[]
  ctaLabel: string
}

const SERVICES: SvcItem[] = [
  {
    id: 'sob-medida',
    anchor: 'sob-medida',
    num: 'SVC · 01',
    title: 'Desenvolvimento',
    subtitle: 'sob medida',
    shardClass: 'v',
    lede:
      'Sistemas construídos para a realidade da sua operação — portais de autoatendimento, módulos de integração complexos, dashboards executivos e qualquer ferramenta que resolva um problema específico do seu negócio.',
    feats: [
      { title: 'Arquitetura escalável', description: 'Pronta para crescer sem retrabalho' },
      { title: 'ROI mensurável', description: 'Foco em valor real, não em feature slop' },
      { title: 'Integrações nativas', description: 'ERPs, CRMs, APIs públicas e legadas' },
      { title: 'Código proprietário', description: 'Propriedade 100% sua, sem lock-in' },
    ],
    ctaLabel: 'Falar sobre um projeto ↗',
  },
  {
    id: 'squads',
    anchor: 'squads',
    num: 'SVC · 02',
    title: 'Squads ágeis',
    subtitle: 'multidisciplinares',
    shardClass: 'c',
    lede:
      'Times plug-and-play com devs, QAs, POs, designers e DevOps — montados no tamanho certo para o seu desafio e integrados em até 5 dias úteis.',
    feats: [
      { title: 'Integração em 5 dias', description: 'Do handshake ao primeiro PR' },
      { title: 'Cerimônias ágeis', description: 'Daily, planning, review, retro' },
      { title: 'Escala elástica', description: 'Aumente ou reduza sem burocracia' },
      { title: 'Métricas claras', description: 'Velocity, CSAT, lead time' },
    ],
    ctaLabel: 'Montar meu squad ↗',
  },
  {
    id: 'automacao',
    anchor: 'automacao',
    num: 'SVC · 03',
    title: 'Automação',
    subtitle: 'de processos',
    shardClass: 'm',
    lede:
      'Mapeamos fluxos manuais, orquestramos integrações e entregamos horas de volta à sua equipe. Ideal para operações com alto custo de repetição.',
    feats: [
      { title: 'RPA & workflows', description: 'Processos multi-sistema sem dor' },
      { title: 'ETL e pipelines', description: 'Dados no lugar certo, na hora certa' },
      { title: 'Notificações', description: 'WhatsApp, e-mail, webhooks' },
      { title: 'Monitoramento', description: 'Alertas quando algo sai do trilho' },
    ],
    ctaLabel: 'Automatizar um processo ↗',
  },
  {
    id: 'consultoria',
    anchor: 'consultoria',
    num: 'SVC · 04',
    title: 'Consultoria',
    subtitle: 'em tecnologia',
    shardClass: 'a',
    lede:
      'Diagnóstico preciso que alinha processos, infraestrutura e inovação. Ajudamos sua liderança a tomar decisões técnicas mais inteligentes — e mais baratas.',
    feats: [
      { title: 'Tech assessment', description: 'Radiografia de stack, time e débito' },
      { title: 'Roadmap técnico', description: 'Priorização orientada a valor' },
      { title: 'Arquitetura', description: 'Revisão e redesenho de sistemas' },
      { title: 'Due diligence', description: 'Suporte a M&A e investimentos' },
    ],
    ctaLabel: 'Solicitar diagnóstico ↗',
  },
  {
    id: 'infra',
    anchor: 'infra',
    num: 'SVC · 05',
    title: 'Infraestrutura',
    subtitle: '& VPS gerenciada',
    shardClass: 'e',
    lede:
      'Servidores dimensionados para sua carga real, com backups, segurança, observabilidade e atualizações inclusas. Você usa a ferramenta; a gente cuida do resto.',
    feats: [
      { title: 'Cloud-agnostic', description: 'AWS, GCP, Azure ou on-premise' },
      { title: 'Backups auditáveis', description: '3-2-1, testados e criptografados' },
      { title: 'SLA escalonado', description: 'De 99.9% a 99.99%' },
      { title: 'Observabilidade', description: 'Logs, métricas, traces, alertas' },
    ],
    ctaLabel: 'Dimensionar infra ↗',
  },
  {
    id: 'suporte',
    anchor: 'suporte',
    num: 'SVC · 06',
    title: 'Suporte e',
    subtitle: 'evolução contínua',
    shardClass: 'v',
    lede:
      'Planos que acompanham seu crescimento. Adicione funcionalidades, corrija rotas ou faça upgrades técnicos a qualquer momento — sem reiniciar o relacionamento.',
    feats: [
      { title: 'SLA 24/7', description: 'Plantão técnico com priorização' },
      { title: 'Roadmap compartilhado', description: 'Você vê cada sprint' },
      { title: 'Dívida técnica', description: 'Refactors programados' },
      { title: 'Onboarding contínuo', description: 'De novos membros do seu time' },
    ],
    ctaLabel: 'Contratar suporte ↗',
  },
  {
    id: 'outsourcing',
    anchor: 'outsourcing',
    num: 'SVC · 07',
    title: 'Outsourcing',
    subtitle: 'estratégico de TI',
    shardClass: 'c',
    lede:
      'Mantenha o foco no core do seu negócio. Nossos especialistas assumem demandas específicas — com previsibilidade de custo, prazo e qualidade superior à contratação interna.',
    feats: [
      { title: 'Dev & DevOps', description: 'Backend, frontend, mobile, infra' },
      { title: 'QA & SRE', description: 'Automação de testes e confiabilidade' },
      { title: 'Data & Produto', description: 'Analytics, BI, PMs e designers' },
      { title: 'Contratos flex', description: 'Mensal, trimestral ou por projeto' },
    ],
    ctaLabel: 'Terceirizar com a BSN ↗',
  },
]

export default function ServicesPage() {
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
        {SERVICES.map((svc) => (
          <article id={svc.anchor} key={svc.id} className={`svc glass ${svc.shardClass}`}>
            <div className="shard" />
            <div className="side">
              <div className="num">{svc.num}</div>
              <h2>
                {svc.title}
                {svc.subtitle && (
                  <>
                    <br />
                    {svc.subtitle}
                  </>
                )}
              </h2>
            </div>
            <div className="content">
              <p className="lede">{svc.lede}</p>
              <div className="feats">
                {svc.feats.map((f, idx) => (
                  <div key={idx}>
                    <b>{f.title}</b>
                    {f.description}
                  </div>
                ))}
              </div>
              <Link to="/contato" className="svc-cta">
                {svc.ctaLabel}
              </Link>
            </div>
          </article>
        ))}
      </section>

      <Footer />
    </div>
  )
}
