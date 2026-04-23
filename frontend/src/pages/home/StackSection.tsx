import { Sparkles } from 'lucide-react'
import type { StackItem } from './types'

interface Props {
  stack: StackItem[]
}

export default function StackSection({ stack }: Props) {
  if (stack.length === 0) return null
  const renderItem = (t: StackItem, key: string) => (
    <span key={key}>
      {t.name}
      <Sparkles className="marquee-sep" aria-hidden />
    </span>
  )
  return (
    <section key="stack" className="stack">
      <div className="stack-inner glass">
        <div className="band-shard a" />
        <div className="band-shard b" />
        <div className="shell stack-head" style={{ position: 'relative', zIndex: 1 }}>
          <div className="mono" style={{ marginBottom: 18 }}>STACK &amp; FERRAMENTAS QUE DOMINAMOS</div>
        </div>
        <div className="marquee" style={{ position: 'relative', zIndex: 1 }}>
          <div className="marquee-track">
            {stack.map((t) => renderItem(t, `a-${t.id}`))}
            {stack.map((t) => renderItem(t, `b-${t.id}`))}
          </div>
        </div>
      </div>
    </section>
  )
}
