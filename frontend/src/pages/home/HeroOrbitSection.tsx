import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { iconFor } from './icons'
import type { Service, HomeHero } from './types'

/**
 * Hook: rastreia posição do mouse relativa à seção hero e expõe via CSS vars
 * (--mx, --my) no elemento. Cada item filho (rings, nodes) reage com sua
 * própria intensidade via translate3d/rotate baseado nessas vars. Respeita
 * prefers-reduced-motion.
 */
function useHeroParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      // Normaliza pra [-1, 1] (centro = 0,0)
      targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      targetY = ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    const onLeave = () => {
      targetX = 0
      targetY = 0
    }

    const tick = () => {
      // Lerp suave (amortecimento) — efeito tipo VanillaTilt easing
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      el.style.setProperty('--mx', currentX.toFixed(3))
      el.style.setProperty('--my', currentY.toFixed(3))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [])
  return ref
}

interface Props {
  services: Service[]
  /** Total de serviços ativos (sem slice) — alimenta {count} no eyebrow.
   *  Default = services.length se não informado. */
  servicesCount?: number
  hero?: HomeHero | null
}

// Fallback (mesmos textos que rodaram desde sempre — garante zero regressão
// caso o banco ainda não tenha HomeHero seedado).
const FALLBACK_HERO: HomeHero = {
  id: 'fallback',
  eyebrowTemplate: '{count} capacidades · 1 parceiro',
  title: 'Tudo que sua operação precisa <em>girando</em> no mesmo eixo.',
  subtitle:
    'Desenvolvimento, cloud, automação e suporte 24/7 sob a mesma governança. Um ponto de contato, um SLA, um time que fala a mesma língua.',
  ctaPrimaryLabel: 'Começar',
  ctaPrimaryUrl: '/contato',
  ctaPrimaryIcon: '↗',
  ctaSecondaryLabel: 'Explorar capacidades',
  ctaSecondaryUrl: '/servicos',
  badge1Text: 'Resposta em até 24h úteis',
  badge1HasPulse: true,
  badge2Text: '🔒 LGPD-ready',
  showFloatingNodes: true,
  isActive: true,
}

export default function HeroOrbitSection({ services, servicesCount, hero }: Props) {
  const h = hero ?? FALLBACK_HERO
  const count = servicesCount ?? services.length
  const eyebrow = h.eyebrowTemplate.replace('{count}', String(count || 7))
  const showNodes = h.showFloatingNodes !== false && services.length > 0
  const parallaxRef = useHeroParallax<HTMLElement>()

  return (
    <section ref={parallaxRef} key="hero-orbit" className="hero hero-orbit shell">
      <div className="orbit-sun" aria-hidden="true" />
      <div className="orbit-rings" aria-hidden="true">
        <div className="orbit-ring r1" />
        <div className="orbit-ring r2" />
        <div className="orbit-ring r3" />
      </div>
      <div className="orbit-center">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>{eyebrow}</span>
        </div>
        <h1 dangerouslySetInnerHTML={{ __html: h.title }} />
        <p>{h.subtitle}</p>
        <div className="ctas">
          <Link to={h.ctaPrimaryUrl} className="btn btn-primary auto">
            {h.ctaPrimaryLabel}
            {h.ctaPrimaryIcon ? <span>{h.ctaPrimaryIcon}</span> : null}
          </Link>
          {h.ctaSecondaryLabel && h.ctaSecondaryUrl ? (
            <Link to={h.ctaSecondaryUrl} className="btn btn-ghost auto">
              {h.ctaSecondaryLabel}
            </Link>
          ) : null}
        </div>
        {(h.badge1Text || h.badge2Text) && (
          <div className="hero-badges">
            {h.badge1Text ? (
              <span className="hero-badge">
                {h.badge1HasPulse ? <span className="dot-pulse" /> : null}
                {h.badge1Text}
              </span>
            ) : null}
            {h.badge2Text ? <span className="hero-badge">{h.badge2Text}</span> : null}
          </div>
        )}
      </div>

      {showNodes && (
        <div className="orbit-nodes">
          {services.slice(0, 6).map((svc, i) => {
            // título curto: primeiros 3 palavras do título principal
            const shortTitle = svc.title
              .replace(/\s*&\s*/g, ' & ')
              .split(' ')
              .slice(0, 3)
              .join(' ')
            return (
              <div key={svc.id} className={`node-slot n${i + 1}`}>
                <Link
                  to={svc.anchor ? `/servicos#${svc.anchor}` : '/servicos'}
                  className="node glass"
                >
                  <span className="ico">{iconFor(svc.iconName)}</span>
                  <span className="txt">
                    <span>{svc.numLabel || `SVC · ${String(i + 1).padStart(2, '0')}`}</span>
                    <b>{shortTitle}</b>
                  </span>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
