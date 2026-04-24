import { SERVICE_ICON_SLUGS, renderServiceIcon } from '@/lib/service-icons'

interface Props {
  value?: string | null
  onChange: (slug: string) => void
  label?: string
  className?: string
  id?: string
}

/**
 * Select de ícone Lucide disponível em SERVICE_ICONS, com preview visual
 * ao lado do nome do ícone selecionado.
 */
export default function ServiceIconSelect({ value, onChange, label, className = '', id }: Props) {
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-sm mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-white/10 bg-black/30 flex items-center justify-center flex-shrink-0">
          {renderServiceIcon(value, 'w-5 h-5')}
        </div>
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">— Selecione —</option>
          {SERVICE_ICON_SLUGS.map((slug) => (
            <option key={slug} value={slug}>{slug}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
