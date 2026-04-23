import type { KPI } from './types'

interface Props {
  kpis: KPI[]
}

export default function KpisSection({ kpis }: Props) {
  if (kpis.length === 0) return null
  return (
    <section key="kpis" className="kpis-section shell">
      <div className="hero-meta">
        {kpis.map((kpi) => {
          // Se o valor for numérico, tenta animar com data-count
          const numeric = parseFloat(kpi.value)
          const isNumber = !isNaN(numeric) && /^\d/.test(kpi.value)
          return (
            <div key={kpi.id}>
              <div className="km">{kpi.label}</div>
              <div className="k">
                {isNumber ? (
                  <span data-count={numeric}>0</span>
                ) : (
                  kpi.value
                )}
                {kpi.suffix && <em>{kpi.suffix}</em>}
              </div>
              <div className="l">{kpi.caption}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
