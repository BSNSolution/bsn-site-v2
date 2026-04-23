import { Link } from 'react-router-dom'
import type { HomeBand } from './types'

interface Props {
  band?: HomeBand | null
}

export default function BandSection({ band }: Props) {
  if (!band) return null
  return (
    <section key="band" className="band">
      <div className="band-inner glass">
        <div className="band-shard a" />
        <div className="band-shard b" />
        <div className="shell" style={{ position: 'relative', zIndex: 1 }}>
          <div className="mono" style={{ marginBottom: 18 }}>{band.eyebrow}</div>
          <h2 className="display" dangerouslySetInnerHTML={{ __html: band.title }} />
          <div className="band-cta">
            <Link to={band.ctaUrl} className="btn btn-primary">
              {band.ctaLabel}
            </Link>
            <span className="mono">{band.mono}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
