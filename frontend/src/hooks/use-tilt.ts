import { useEffect, useRef } from 'react'
import VanillaTilt from 'vanilla-tilt'

export interface TiltOptions {
  max?: number
  speed?: number
  scale?: number
  glare?: boolean
  'max-glare'?: number
  reverse?: boolean
  perspective?: number
  easing?: string
  'reset-to-start'?: boolean
}

const DEFAULTS: TiltOptions = {
  max: 12,
  speed: 400,
  scale: 1.04,
  easing: 'cubic-bezier(.03,.98,.52,.99)',
  perspective: 1000,
}

/**
 * Aplica o efeito 3D-tilt do VanillaTilt em um elemento ao montar.
 * Respeita prefers-reduced-motion (não inicia se o usuário pediu menos motion).
 */
export function useTilt<T extends HTMLElement>(options: TiltOptions = {}) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof window === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const merged = { ...DEFAULTS, ...options }
    VanillaTilt.init(el, merged as any)

    return () => {
      const inst = (el as any).vanillaTilt
      if (inst && typeof inst.destroy === 'function') inst.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
