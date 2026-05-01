import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check } from 'lucide-react'
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
 * Seletor visual de ícone com layout idêntico ao Select base (h-10, trigger
 * simples com swatch à esquerda). Dropdown abre via portal com grid 4-col
 * e busca — preserva a UX rica do picker mas em tamanho alinhado aos outros
 * selects do admin.
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
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const entries = Object.entries(icons)
  const filtered = query
    ? entries.filter(
        ([key, data]) =>
          key.toLowerCase().includes(query.toLowerCase()) ||
          data.label.toLowerCase().includes(query.toLowerCase())
      )
    : entries

  const currentIcon = value && icons[value] ? icons[value] : null

  const updateMenuPosition = () => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const menuHeight = menuRef.current?.offsetHeight ?? 340
    const spaceBelow = window.innerHeight - rect.bottom
    const openUpward = spaceBelow < Math.min(menuHeight + 16, 340) && rect.top > menuHeight + 16
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
      zIndex: 9999,
    })
  }

  useEffect(() => {
    if (!open) return
    updateMenuPosition()
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target)) return
      if (menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onReflow = () => updateMenuPosition()
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    window.addEventListener('scroll', onReflow, true)
    window.addEventListener('resize', onReflow)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onEsc)
      window.removeEventListener('scroll', onReflow, true)
      window.removeEventListener('resize', onReflow)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full h-10 text-sm px-3 pr-9 rounded-lg border transition-colors text-left inline-flex items-center gap-2 border-white/10 ${
          disabled
            ? 'bg-black/20 text-white/40 cursor-not-allowed'
            : 'bg-black/30 hover:bg-black/40 focus:border-white/25 outline-none'
        }`}
      >
        {currentIcon ? (
          <span className="w-5 h-5 inline-flex items-center justify-center text-white/90 shrink-0">
            {currentIcon.svg}
          </span>
        ) : null}
        <span className={`flex-1 truncate ${currentIcon ? '' : 'text-white/40'}`}>
          {currentIcon ? currentIcon.label : placeholder}
        </span>
        {currentIcon && value && (
          <span className="text-[11px] font-mono text-white/40">{value}</span>
        )}
        <ChevronDown
          className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && !disabled && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="min-w-[280px] rounded-lg border border-white/15 bg-[#0c0c10] shadow-2xl backdrop-blur overflow-hidden"
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
                className="w-full pl-7 pr-2 py-1.5 bg-black/40 border border-white/10 rounded text-xs outline-none focus:border-white/25"
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
                  className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition ${
                    active
                      ? 'bg-primary/20 border border-primary/40 text-white'
                      : 'border border-transparent hover:bg-white/5 hover:border-white/10 text-white/80'
                  }`}
                >
                  {active && (
                    <Check className="absolute top-1 right-1 w-3 h-3 text-violet-300" />
                  )}
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
        </div>,
        document.body
      )}
    </div>
  )
}

export default IconPicker
