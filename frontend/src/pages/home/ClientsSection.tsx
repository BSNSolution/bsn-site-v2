import type { HomeClient } from './types'

interface Props {
  clients: HomeClient[]
}

type FlatItem =
  | { type: 'chapter'; label: string }
  | { type: 'client'; data: HomeClient }

export default function ClientsSection({ clients }: Props) {
  if (clients.length === 0) return null

  // agrupar por setor para montar os "capítulos"
  const sectors = Array.from(new Set(clients.map((c) => c.sector || 'Outros')))
  const bySector = sectors.map((s) => ({
    sector: s,
    items: clients.filter((c) => (c.sector || 'Outros') === s),
  }))

  // construir uma única faixa ordenada com chapters intercalados
  const flat: FlatItem[] = []
  bySector.forEach((g) => {
    flat.push({ type: 'chapter', label: g.sector })
    g.items.forEach((c) => flat.push({ type: 'client', data: c }))
  })

  const renderItem = (item: FlatItem, key: string) => {
    if (item.type === 'chapter') {
      return (
        <span key={key} className="clients-chapter">
          <span className="clients-chapter-star">✶</span>
          <span className="clients-chapter-label">{item.label}</span>
        </span>
      )
    }
    const c = item.data
    const inner = c.logoUrl ? (
      <img src={c.logoUrl} alt={c.name} loading="lazy" />
    ) : (
      <span className="clients-card-name">{c.name}</span>
    )
    return c.websiteUrl ? (
      <a key={key} href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="clients-card">{inner}</a>
    ) : (
      <span key={key} className="clients-card">{inner}</span>
    )
  }

  return (
    <section key="clients" className="clients-strip">
      <div className="shell clients-strip-head">
        <div>
          <div className="mono" style={{ marginBottom: 12 }}>Prova social · {clients.length} clientes em produção</div>
          <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>
            Empresas que escolheram a <span className="dim">BSN Solution</span>
          </h2>
        </div>
      </div>

      <div className="clients-marquee">
        <div className="clients-track clients-track-a">
          {flat.map((item, i) => renderItem(item, `a-${i}`))}
          {flat.map((item, i) => renderItem(item, `a2-${i}`))}
        </div>
      </div>
      <div className="clients-marquee">
        <div className="clients-track clients-track-b">
          {[...flat].reverse().map((item, i) => renderItem(item, `b-${i}`))}
          {[...flat].reverse().map((item, i) => renderItem(item, `b2-${i}`))}
        </div>
      </div>
    </section>
  )
}
