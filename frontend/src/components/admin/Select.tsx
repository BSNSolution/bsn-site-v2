import { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption<V = string> {
  value: V
  label: string
  /** Texto secundário (slug, código, etc) */
  hint?: string
  /** Cor de preview (swatch) — css color ou hsl/rgb */
  color?: string
  /** Ícone Lucide ou qualquer ReactNode */
  icon?: ReactNode
  /** Desabilita essa opção */
  disabled?: boolean
  /** Agrupa opções por esse rótulo (optgroup) */
  group?: string
}

interface Props<V = string> {
  value: V | undefined | null
  onChange: (value: V) => void
  options: SelectOption<V>[]
  placeholder?: string
  disabled?: boolean
  error?: string
  /** Classe adicional no wrapper */
  className?: string
  /** Altura — default h-10 */
  size?: 'sm' | 'md'
  /** Mostra ícone/swatch também no trigger (default true) */
  showVisualOnTrigger?: boolean
  /** Nome do campo (pra forms nativos) */
  name?: string
  id?: string
  /** Busca por texto no dropdown (default: false) */
  searchable?: boolean
}

/**
 * Select customizado dark-mode nativo do projeto. Render próprio (não usa
 * <select> do browser) pra ter controle total do look e suportar ícone/cor
 * nas opções.
 */
export default function Select<V extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = '— Selecione —',
  disabled = false,
  error,
  className = '',
  size = 'md',
  showVisualOnTrigger = true,
  name,
  id,
  searchable = false,
}: Props<V>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightIdx, setHighlightIdx] = useState<number>(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const heightCls = size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm'

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onEsc)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onEsc)
    }
  }, [open])

  // Foca search quando abre
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => inputRef.current?.focus(), 20)
      setQuery('')
      setHighlightIdx(-1)
    }
  }, [open, searchable])

  const filtered = searchable && query
    ? options.filter((o) => {
        const q = query.toLowerCase()
        return (
          o.label.toLowerCase().includes(q) ||
          (o.hint ?? '').toLowerCase().includes(q) ||
          String(o.value).toLowerCase().includes(q)
        )
      })
    : options

  // Agrupar mantendo ordem
  const groups: { label: string | null; items: SelectOption<V>[] }[] = []
  const groupIndex = new Map<string, number>()
  for (const opt of filtered) {
    const g = opt.group ?? null
    const key = g ?? '__nogroup__'
    if (!groupIndex.has(key)) {
      groupIndex.set(key, groups.length)
      groups.push({ label: g, items: [] })
    }
    groups[groupIndex.get(key)!].items.push(opt)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((i) => Math.min(filtered.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const opt = filtered[highlightIdx]
      if (opt && !opt.disabled) {
        onChange(opt.value)
        setOpen(false)
      }
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* hidden native input pra forms */}
      {name && <input type="hidden" name={name} value={String(value ?? '')} />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleKey}
        className={`w-full ${heightCls} px-3 pr-9 rounded-lg border transition-colors text-left inline-flex items-center gap-2
          ${error ? 'border-red-500/40' : 'border-white/10'}
          ${disabled ? 'bg-black/20 text-white/40 cursor-not-allowed' : 'bg-black/30 hover:bg-black/40 focus:border-white/25 outline-none'}
        `}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected && showVisualOnTrigger && renderVisual(selected)}
        <span className={`flex-1 truncate ${selected ? '' : 'text-white/40'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.hint && showVisualOnTrigger && (
          <span className="text-[11px] font-mono text-white/40">{selected.hint}</span>
        )}
        <ChevronDown className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}

      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-lg border border-white/15 bg-[#0c0c10] shadow-xl backdrop-blur overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-white/10">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Buscar..."
                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs outline-none focus:border-white/25"
              />
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-xs text-white/40 text-center">Nada encontrado</div>
            )}
            {groups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                    {group.label}
                  </div>
                )}
                {group.items.map((opt) => {
                  const isSelected = opt.value === value
                  const flatIdx = filtered.indexOf(opt)
                  const isHighlighted = highlightIdx === flatIdx
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => {
                        if (opt.disabled) return
                        onChange(opt.value)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setHighlightIdx(flatIdx)}
                      className={`w-full text-left px-3 py-2 inline-flex items-center gap-2 transition-colors
                        ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        ${isHighlighted && !opt.disabled ? 'bg-white/10' : 'hover:bg-white/5'}
                        ${isSelected ? 'text-white' : 'text-white/80'}
                      `}
                    >
                      {renderVisual(opt)}
                      <span className="flex-1 truncate text-sm">{opt.label}</span>
                      {opt.hint && (
                        <span className="text-[11px] font-mono text-white/40">{opt.hint}</span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-violet-300 shrink-0" />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function renderVisual(opt: SelectOption<any>) {
  if (opt.color) {
    return (
      <span
        className="w-5 h-5 rounded border border-white/15 shrink-0"
        style={{ background: opt.color }}
      />
    )
  }
  if (opt.icon) {
    return <span className="w-5 h-5 inline-flex items-center justify-center text-white/80 shrink-0">{opt.icon}</span>
  }
  return null
}
