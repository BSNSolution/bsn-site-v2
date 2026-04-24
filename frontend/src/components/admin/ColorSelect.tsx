import { COLOR_CLASS_OPTIONS, SHARD_COLOR_OPTIONS, type PaletteOption } from '@/lib/color-palette'
import Select, { SelectOption } from './Select'

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
  placeholder?: string
}

/**
 * Select com swatch colorido + nome da cor. Usa o Select base pra manter
 * consistência visual com os outros selects do admin.
 */
export default function ColorSelect({
  variant = 'color-class',
  value,
  onChange,
  label,
  className = '',
  id,
  options,
  placeholder = '— Selecione cor —',
}: Props) {
  const opts = options ?? (variant === 'shard' ? SHARD_COLOR_OPTIONS : COLOR_CLASS_OPTIONS)
  const selectOptions: SelectOption<string>[] = opts.map((o) => ({
    value: o.slug,
    label: o.label,
    hint: o.slug,
    color: o.hex,
  }))

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm mb-1">
          {label}
        </label>
      )}
      <Select
        id={id}
        value={value ?? ''}
        onChange={(v) => onChange(v)}
        options={selectOptions}
        placeholder={placeholder}
      />
    </div>
  )
}
