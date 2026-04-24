import { COLOR_CLASS_OPTIONS, SHARD_COLOR_OPTIONS, type PaletteOption } from '@/lib/color-palette'

interface Props {
  /** Tipo da paleta: 'color-class' (a-f) ou 'shard' (v,c,m,a,e). */
  variant?: 'color-class' | 'shard'
  value?: string | null
  onChange: (slug: string) => void
  label?: string
  className?: string
  id?: string
  /** Permite passar as opções manualmente se precisar de paleta custom. */
  options?: PaletteOption[]
}

/**
 * Select com swatch colorido + nome da cor. Resolve o problema de UX
 * onde o usuário tinha que decorar "a, b, c, d, e, f".
 */
export default function ColorSelect({
  variant = 'color-class',
  value,
  onChange,
  label,
  className = '',
  id,
  options,
}: Props) {
  const opts = options ?? (variant === 'shard' ? SHARD_COLOR_OPTIONS : COLOR_CLASS_OPTIONS)
  const current = opts.find((o) => o.slug === value)

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {current && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ring-1 ring-white/20"
            style={{ background: current.hex }}
          />
        )}
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm appearance-none"
          style={{ paddingLeft: current ? 36 : 12 }}
        >
          <option value="">— Selecione —</option>
          {opts.map((opt) => (
            <option key={opt.slug} value={opt.slug}>
              {opt.label} ({opt.slug})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
