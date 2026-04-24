import { SERVICE_ICON_SLUGS, renderServiceIcon } from '@/lib/service-icons'
import IconSelect from './IconSelect'

interface Props {
  value?: string | null
  onChange: (slug: string) => void
  label?: string
  className?: string
  id?: string
}

/**
 * Wrapper de IconSelect pré-configurado com os ícones Lucide de serviço.
 * Usa o IconSelect genérico por baixo.
 */
export default function ServiceIconSelect({ value, onChange, label, className = '', id }: Props) {
  const icons = SERVICE_ICON_SLUGS.map((slug) => ({
    slug,
    render: (cls?: string) => renderServiceIcon(slug, cls),
  }))

  return (
    <IconSelect
      value={value}
      onChange={onChange}
      icons={icons}
      label={label}
      className={className}
      id={id}
    />
  )
}
