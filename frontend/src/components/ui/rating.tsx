import { useState } from 'react'
import { Star } from 'lucide-react'

export interface RatingProps {
  value: number
  onChange?: (value: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  readOnly?: boolean
  showValue?: boolean
  className?: string
  color?: string
}

/**
 * Rating com estrelas (1-N). Suporta hover preview, controlado e read-only.
 *
 * Usage:
 *   <Rating value={4} onChange={setValue} />
 *   <Rating value={3.5} readOnly size="sm" />
 */
export function Rating({
  value,
  onChange,
  max = 5,
  size = 'md',
  readOnly = false,
  showValue = false,
  className = '',
  color = 'var(--amber)',
}: RatingProps) {
  const [hover, setHover] = useState<number | null>(null)

  const sizePx = size === 'sm' ? 14 : size === 'lg' ? 22 : 18
  const gap = size === 'sm' ? 2 : size === 'lg' ? 6 : 4

  const display = hover ?? value

  return (
    <div className={`inline-flex items-center ${className}`} style={{ gap }}>
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1
        const filled = display >= idx
        const half = !filled && display >= idx - 0.5

        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(idx)}
            onMouseLeave={() => !readOnly && setHover(null)}
            onClick={() => !readOnly && onChange && onChange(idx)}
            className={`relative transition ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            aria-label={`${idx} de ${max}`}
            style={{ width: sizePx, height: sizePx }}
          >
            {/* base (outline) */}
            <Star
              className="absolute inset-0"
              style={{
                width: sizePx,
                height: sizePx,
                color: 'rgba(255,255,255,0.2)',
                fill: 'transparent',
                strokeWidth: 1.5,
              }}
            />
            {/* preenchida */}
            {(filled || half) && (
              <Star
                className="absolute inset-0"
                style={{
                  width: sizePx,
                  height: sizePx,
                  color,
                  fill: color,
                  strokeWidth: 1.5,
                  clipPath: half ? 'inset(0 50% 0 0)' : undefined,
                }}
              />
            )}
          </button>
        )
      })}
      {showValue && (
        <span className="ml-1.5 text-xs text-muted-foreground font-mono">
          {display.toFixed(1)}/{max}
        </span>
      )}
    </div>
  )
}

export default Rating
