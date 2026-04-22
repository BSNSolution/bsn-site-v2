import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { SERVICE_ICONS } from './service-icons'

export interface IconPickerProps {
  value?: string | null
  onChange: (iconName: string) => void
  /** Mapa de ícones — default: catálogo de Serviços */
  icons?: Record<string, { label: string; svg: JSX.Element }>
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * Seletor visual de ícone. Mostra o ícone atual num trigger estilo input e
 * abre um dropdown com grid de ícones + busca.
 *
 * Usage:
 *   <IconPicker value={form.iconName} onChange={(name) => setForm({ ...form, iconName: name })} />
 */
export function IconPicker({
  value,
  onChange,
  icons = SERVICE_ICONS,
  placeholder = 'Selecione um ícone',
  disabled,
  className = '',
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const entries = Object.entries(icons)
  const filtered = query
    ? entries.filter(
        ([key, data]) =>
          key.toLowerCase().includes(query.toLowerCase()) ||
          data.label.toLowerCase().includes(query.toLowerCase())
      )
    : entries

  const currentIcon = value && icons[value] ? icons[value] : null

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-3 py-2 bg-black/40 border border-white/10 rounded hover:border-white/20 transition disabled:opacity-50"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 shrink-0">
          {currentIcon ? (
            <span style={{ width: 18, height: 18, display: 'block', color: 'var(--ink)' }}>
              {currentIcon.svg}
            </span>
          ) : (
            <span className="text-white/30 text-xs">?</span>
          )}
        </span>
        <span className="flex-1 text-left text-sm">
          {currentIcon ? (
            <>
              <span className="block">{currentIcon.label}</span>
              <span className="block text-[10px] text-muted-foreground font-mono">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-white/15 shadow-xl overflow-hidden"
          style={{ background: 'rgba(10,10,16,0.98)', backdropFilter: 'blur(20px)' }}
        >
          <div className="p-2 border-b border-white/10">
            <div className="relative">
              <Search className="absolute top-1/2 left-2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar ícone..."
                autoFocus
                className="w-full pl-7 pr-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 max-h-64 overflow-y-auto">
            {filtered.map(([key, data]) => {
              const active = key === value
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    onChange(key)
                    setOpen(false)
                    setQuery('')
                  }}
                  title={data.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition ${
                    active
                      ? 'bg-primary/20 border border-primary/40 text-white'
                      : 'border border-transparent hover:bg-white/5 hover:border-white/10 text-white/80'
                  }`}
                >
                  <span style={{ width: 22, height: 22, display: 'block' }}>{data.svg}</span>
                  <span className="text-[10px] truncate w-full text-center">{data.label}</span>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="col-span-4 p-4 text-center text-xs text-muted-foreground">
                Nenhum ícone encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default IconPicker
