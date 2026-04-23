import type { ProcessStep } from './types'

interface Props {
  steps: ProcessStep[]
}

export default function TimelineSection({ steps }: Props) {
  if (steps.length === 0) return null
  return (
    <section key="timeline" className="timeline shell">
      <div className="section-head">
        <h2 className="display">
          Nosso ritmo <span className="dim">de trabalho.</span>
        </h2>
        <p className="lede">
          Nada de caixa preta. Você acompanha de perto, aprova a cada passo, sabe exatamente onde estamos.
        </p>
      </div>
      <div className="timeline-wrap">
        <div className="timeline-rail" aria-hidden="true" />
        {steps.map((s, idx) => (
          <article key={s.id} className={`timeline-item ${idx % 2 === 0 ? 'left' : 'right'}`}>
            <div className="timeline-dot" aria-hidden="true">
              <span className="timeline-dot-ring" />
            </div>
            <div className="timeline-content">
              <span className="timeline-watermark" aria-hidden="true">{s.number}</span>
              <div className="timeline-head">
                <span className="mono">etapa {s.number}</span>
                {s.duration && <span className="timeline-duration">⏱ {s.duration}</span>}
              </div>
              <h3>{s.title}</h3>
              <div className="timeline-desc glass">
                <p>{s.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
