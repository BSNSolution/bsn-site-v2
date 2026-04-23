import { Link, useParams } from 'react-router-dom'
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
  Gauge,
  Clock,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { servicesApi } from '@/lib/api'

interface ServiceDetailBlock {
  id: string
  title: string
  description: string
  iconName?: string | null
  colorClass?: string | null
  order: number
  isActive: boolean
}

interface ServiceDetail {
  id: string
  title: string
  subtitle?: string | null
  description: string
  slug: string
  iconName?: string | null
  shardColor?: string | null
  numLabel?: string | null
  heroEyebrow?: string | null
  heroDescription?: string | null
  heroLongText?: string | null
  ctaTitle?: string | null
  ctaText?: string | null
  ctaButtonLabel?: string | null
  ctaButtonUrl?: string | null
  detailBlocks: ServiceDetailBlock[]
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

function renderIcon(name?: string | null, fallback: React.ComponentType<{ className?: string }> = Sparkles) {
  const Icon = (name && ICONS[name]) || fallback
  return <Icon className="svc-detail-ico-svg" />
}

export default function ServiceDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>()

  const { data, isLoading, isError } = useQuery<ServiceDetail | null>({
    queryKey: ['service-detail', slug],
    queryFn: async () => {
      if (!slug) return null
      try {
        return (await servicesApi.getServiceBySlug(slug)) as ServiceDetail
      } catch (err: any) {
        if (err?.response?.status === 404) return null
        throw err
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const svc = data
  const shard = svc?.shardColor ?? 'v'
  const blocks = (svc?.detailBlocks ?? []).filter((b) => b.isActive).sort((a, b) => a.order - b.order)

  return (
    <div className="page">
      <Header />

      {isLoading && (
        <section className="shell" style={{ padding: '120px 32px 60px', textAlign: 'center', color: 'var(--ink-dim)' }}>
          Carregando serviço...
        </section>
      )}

      {!isLoading && (isError || !svc) && (
        <section className="shell" style={{ padding: '120px 32px 60px' }}>
          <div className="glass" style={{ padding: 40, textAlign: 'center' }}>
            <div className="mono" style={{ marginBottom: 12 }}>404 · SERVIÇO</div>
            <h1 style={{ fontSize: 32, letterSpacing: '-0.02em', fontWeight: 500 }}>Serviço não encontrado</h1>
            <p style={{ color: 'var(--ink-dim)', marginTop: 12 }}>
              O serviço que você está procurando não existe ou foi removido.
            </p>
            <Link to="/servicos" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex', width: 'auto' }}>
              Ver todos os serviços
            </Link>
          </div>
        </section>
      )}

      {svc && (
        <>
          {/* ─── Hero centralizado ─── */}
          <section className={`svc-detail-hero shell ${shard}`} data-reveal>
            <div className="svc-detail-hero-shard" aria-hidden />
            <div className="eyebrow mono">
              <span className="dot" />
              <span>{svc.heroEyebrow ?? `Serviço · ${svc.subtitle ?? svc.title}`}</span>
            </div>
            <h1 className="svc-detail-hero-title">
              {svc.title.split(' ').slice(0, -1).join(' ')}{' '}
              <em>{svc.title.split(' ').slice(-1).join(' ')}</em>
            </h1>
            {svc.heroDescription && <p className="svc-detail-hero-lede">{svc.heroDescription}</p>}
            {svc.heroLongText && <p className="svc-detail-hero-extra">{svc.heroLongText}</p>}
          </section>

          {/* ─── Blocos de detalhe (3 cards) ─── */}
          {blocks.length > 0 && (
            <section className="svc-detail-blocks shell" data-reveal>
              <div className="svc-detail-blocks-grid">
                {blocks.map((block) => {
                  const color = block.colorClass ?? 'a'
                  return (
                    <article key={block.id} className={`svc-detail-block glass ${color}`}>
                      <div className="shard" />
                      <div className="svc-detail-block-ico">{renderIcon(block.iconName)}</div>
                      <h3>{block.title}</h3>
                      <p>{block.description}</p>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {/* ─── CTA band final ─── */}
          {(svc.ctaTitle || svc.ctaText || svc.ctaButtonLabel) && (
            <section className="svc-detail-cta-band" data-reveal>
              <div className="shell svc-detail-cta-band-inner">
                <div className="svc-detail-cta-band-copy">
                  <h2>{svc.ctaTitle ?? 'Vamos conversar sobre seu desafio?'}</h2>
                  {svc.ctaText && <p>{svc.ctaText}</p>}
                </div>
                <Link to={svc.ctaButtonUrl ?? '/contato'} className="svc-detail-cta-band-btn">
                  {svc.ctaButtonLabel ?? 'Falar com um especialista →'}
                </Link>
              </div>
            </section>
          )}

          {/* ─── Navegação: voltar pra lista ─── */}
          <section className="shell" style={{ padding: '40px 32px 80px' }}>
            <Link to="/servicos" className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <span>←</span> Todos os serviços
            </Link>
          </section>
        </>
      )}

      <Footer />
    </div>
  )
}
