import { Link } from 'react-router-dom'
import { iconFor } from './icons'
import type { Service } from './types'

interface Props {
  services: Service[]
}

export default function VitralSection({ services }: Props) {
  if (services.length === 0) return null
  return (
    <section key="vitral" id="vitral" className="vitral shell">
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
        {services.map((svc, i) => {
          const tileClass = svc.tileClass || `t${i + 1}`
          const href = svc.anchor ? `/servicos#${svc.anchor}` : '/servicos'
          return (
            <Link
              key={svc.id}
              to={href}
              className={`tile glass ${tileClass}`}
            >
              <div className="tile-body">
                <div className="tile-head">
                  <div>
                    <div className="svc-num">{svc.numLabel || `SVC · ${String(i + 1).padStart(2, '0')}`}</div>
                    <h3 style={{ marginTop: 10 }}>{svc.title}</h3>
                    {(i === 0 || i === 6) && (
                      <p style={{ marginTop: 8, maxWidth: i === 0 ? 420 : 480 }}>{svc.description}</p>
                    )}
                    {i !== 0 && i !== 6 && <p>{svc.description}</p>}
                  </div>
                  <div className="tile-icon">{iconFor(svc.iconName)}</div>
                </div>
                {svc.homePill && <span className="pill">{svc.homePill}</span>}
                {svc.homePillTags && svc.homePillTags.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {svc.homePillTags.map((t) => (
                      <span key={t} className="pill">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
