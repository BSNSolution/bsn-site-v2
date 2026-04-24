import { ReactNode } from 'react'
import Select, { SelectOption } from './Select'

export interface IconPool {
  slug: string
  render: (className?: string) => ReactNode
  label?: string
}

interface Props {
  value?: string | null
  onChange: (slug: string) => void
  /** Lista de ícones disponíveis. Cada item tem slug + função render */
  icons: IconPool[]
  label?: string
  className?: string
  id?: string
  placeholder?: string
  searchable?: boolean
}

/**
 * Select de ícone com preview visual. Genérico — recebe o pool de ícones
 * por prop, permitindo usar pra ícones de serviço, de categoria, etc.
 *
 * Uso:
 *   <IconSelect
 *     icons={SERVICE_ICON_SLUGS.map(slug => ({
 *       slug,
 *       render: (cls) => renderServiceIcon(slug, cls),
 *     }))}
 *     value={form.iconName}
 *     onChange={(v) => setField('iconName', v)}
 *   />
 */
export default function IconSelect({
  value,
  onChange,
  icons,
  label,
  className = '',
  id,
  placeholder = '— Selecione ícone —',
  searchable = true,
}: Props) {
  const options: SelectOption<string>[] = icons.map((i) => ({
    value: i.slug,
    label: i.label ?? i.slug,
    hint: i.label ? i.slug : undefined,
    icon: i.render('w-4 h-4'),
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
        options={options}
        placeholder={placeholder}
        searchable={searchable}
      />
    </div>
  )
}
