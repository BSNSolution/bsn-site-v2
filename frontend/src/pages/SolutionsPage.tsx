import { Link } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

interface SolutionItem {
  id: string
  tag: string
  title: string
  description: string
  bullets: string[]
  colorClass: 'a' | 'b' | 'c' | 'd' | 'e' | 'f'
}

const SOLUTIONS: SolutionItem[] = [
  {
    id: 'coop',
    tag: 'COOPERATIVISMO',
    title: 'Portal do Cooperado & Assembleia Digital',
    description:
      'Governança participativa com votação auditada, engajamento de membros e transparência total.',
    bullets: [
      'Votação remota com trilha de auditoria',
      'Feed de comunicação segmentado',
      'Autoatendimento integrado ao ERP',
    ],
    colorClass: 'a',
  },
  {
    id: 'consorcios',
    tag: 'CONSÓRCIOS',
    title: 'Força de Vendas Externa',
    description:
      'App offline-first para equipes de rua com pipeline, comissionamento e integração ao back-office.',
    bullets: [
      'Funciona sem sinal; sincroniza depois',
      'Gamificação de metas',
      'Dashboards de gestor em tempo real',
    ],
    colorClass: 'b',
  },
  {
    id: 'administradoras',
    tag: 'ADMINISTRADORAS',
    title: 'Motor de Integração entre ERPs',
    description: 'Sincronização de dados em tempo real entre sistemas legados e modernos.',
    bullets: [
      'Conectores prontos para 20+ sistemas',
      'Fila resiliente com retry',
      'Observabilidade ponta-a-ponta',
    ],
    colorClass: 'c',
  },
  {
    id: 'varejo',
    tag: 'VAREJO & PDV',
    title: 'Cantina Digital & Frente de Caixa',
    description: 'PDV moderno com pagamento integrado, cashback e gestão multi-loja.',
    bullets: [
      'Pagamento por QR, pix e cartão',
      'Programa de fidelidade embutido',
      'Relatórios operacionais em tempo real',
    ],
    colorClass: 'd',
  },
  {
    id: 'frota',
    tag: 'FROTA & LOGÍSTICA',
    title: 'Sistema de Frota & Multas',
    description:
      'Gestão de veículos, motoristas e autuações com prazos e recursos automatizados.',
    bullets: [
      'Alertas de vencimento',
      'OCR de notificações',
      'Indicação de condutor em 1 clique',
    ],
    colorClass: 'e',
  },
  {
    id: 'juridico',
    tag: 'JURÍDICO & IA',
    title: 'Assistente Jurídico via WhatsApp',
    description:
      'Atendimento 24/7 com triagem de casos, captação de clientes e integração a sistemas jurídicos.',
    bullets: [
      'Multi-tenant escalável',
      'Treinado no seu repositório',
      'Handoff suave para humano',
    ],
    colorClass: 'f',
  },
]

export default function SolutionsPage() {
  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Soluções · produtos verticais</span>
        </div>
        <h1>
          Plataformas prontas,
          <br />
          <em>customizáveis</em> para seu setor.
        </h1>
        <p>
          Aceleradores que condensam anos de experiência em setores específicos — adaptamos a base ao seu processo em
          semanas, não em meses.
        </p>
      </section>

      <section className="sol-grid shell">
        {SOLUTIONS.map((sol) => (
          <div key={sol.id} className={`sol glass ${sol.colorClass}`}>
            <div className="shard" />
            <div className="tag">{sol.tag}</div>
            <h3>{sol.title}</h3>
            <p>{sol.description}</p>
            <ul>
              {sol.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
            <Link to="/contato" className="sol-cta">
              Ver demo →
            </Link>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  )
}
