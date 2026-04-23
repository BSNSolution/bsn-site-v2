import { Link } from 'react-router-dom'
import { iconFor } from './icons'
import type { Service } from './types'

interface Props {
  services: Service[]
}

export default function HeroOrbitSection({ services }: Props) {
  return (
    <section key="hero-orbit" className="hero hero-orbit shell">
      <div className="orbit-sun" aria-hidden="true" />
      <div className="orbit-rings" aria-hidden="true">
        <div className="orbit-ring r1" />
        <div className="orbit-ring r2" />
        <div className="orbit-ring r3" />
      </div>
      <div className="orbit-center">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>{services.length || 7} capacidades · 1 parceiro</span>
        </div>
        <h1>
          Tudo que sua operação precisa <em>girando</em> no mesmo eixo.
        </h1>
        <p>
          Desenvolvimento, cloud, automação e suporte 24/7 sob a mesma governança.
          Um ponto de contato, um SLA, um time que fala a mesma língua.
        </p>
        <div className="ctas">
          <Link to="/contato" className="btn btn-primary auto">
            Começar <span>↗</span>
          </Link>
          <Link to="/servicos" className="btn btn-ghost auto">
            Explorar capacidades
          </Link>
        </div>
        <div className="hero-badges">
          <span className="hero-badge">
            <span className="dot-pulse" />
            Resposta em até 24h úteis
          </span>
          <span className="hero-badge">🔒 LGPD-ready</span>
        </div>
      </div>

      {services.length > 0 && (
        <div className="orbit-nodes">
          {services.slice(0, 6).map((svc, i) => {
            // título curto: primeiros 3 palavras do título principal
            const shortTitle = svc.title
              .replace(/\s*&\s*/g, ' & ')
              .split(' ')
              .slice(0, 3)
              .join(' ')
            return (
              <Link
                key={svc.id}
                to={svc.anchor ? `/servicos#${svc.anchor}` : '/servicos'}
                className={`node glass n${i + 1}`}
              >
                <span className="ico">{iconFor(svc.iconName)}</span>
                <span className="txt">
                  <span>{svc.numLabel || `SVC · ${String(i + 1).padStart(2, '0')}`}</span>
                  <b>{shortTitle}</b>
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
