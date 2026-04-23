import type { StackItem } from './types'

interface Props {
  stack: StackItem[]
}

export default function StackSection({ stack }: Props) {
  if (stack.length === 0) return null
  return (
    <section key="stack" className="stack shell">
      <div className="mono" style={{ marginBottom: 18 }}>STACK &amp; FERRAMENTAS QUE DOMINAMOS</div>
      <div className="marquee">
        <div className="marquee-track">
          {stack.map((t) => <span key={`a-${t.id}`}>{t.name}</span>)}
          {stack.map((t) => <span key={`b-${t.id}`}>{t.name}</span>)}
        </div>
      </div>
    </section>
  )
}
