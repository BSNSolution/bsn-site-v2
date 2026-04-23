import type { BrandPill, LiveCard } from './types'

interface Props {
  live?: LiveCard | null
  pill?: BrandPill | null
}

export default function LiveStripSection({ live, pill }: Props) {
  if (!(live || pill)) return null
  return (
    <section key="live-strip" className="live-strip shell">
      {live && (
        <div className="card-live glass">
          <div className="shard" />
          <div className="pulse">
            <span className="bullet" />
            <span>{live.label}</span>
          </div>
          <h4>{live.title}</h4>
          <div className="ticker">
            {live.rows.map((row, idx) => (
              <div key={idx} className="row">
                <span>{row.label}</span>
                <b className={row.highlight === 'up' ? 'up' : ''}>{row.value}</b>
              </div>
            ))}
          </div>
        </div>
      )}
      {pill && (
        <div className="card-pill glass">
          <div className="shard" />
          <div
            className="av"
            style={pill.avatarUrl ? { backgroundImage: `url(${pill.avatarUrl})`, backgroundSize: 'cover' } : undefined}
          />
          <div className="t">
            <b>{pill.personName}</b>
            {pill.company ? ` · ${pill.company}` : ''}
            <br />
            {pill.quote}
          </div>
        </div>
      )}
    </section>
  )
}
