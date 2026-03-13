import { useEffect, useRef, useState, useCallback } from 'react'
import { isClient } from '@/lib/utils'

export type CursorVariant = 'default' | 'hover' | 'text' | 'drag' | 'disabled'

interface CursorConfig {
  variant: CursorVariant
  text?: string
  size?: number
  offset?: { x: number; y: number }
}

/**
 * AWWWARDS-level custom cursor hook
 * Creates a smooth, interactive cursor that follows the mouse
 */
export function useCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [config, setConfig] = useState<CursorConfig>({
    variant: 'default',
    size: 20,
    offset: { x: 0, y: 0 }
  })

  // Mouse position with smooth lerping
  const mousePos = useRef({ x: 0, y: 0 })
  const cursorPos = useRef({ x: 0, y: 0 })
  const animationFrame = useRef<number>()

  // Smooth cursor following animation
  const animateCursor = useCallback(() => {
    if (!cursorRef.current) return

    // Lerp for smooth movement
    const lerp = 0.15
    cursorPos.current.x += (mousePos.current.x - cursorPos.current.x) * lerp
    cursorPos.current.y += (mousePos.current.y - cursorPos.current.y) * lerp

    // Apply transform with offset
    const x = cursorPos.current.x + config.offset.x
    const y = cursorPos.current.y + config.offset.y
    
    cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`

    animationFrame.current = requestAnimationFrame(animateCursor)
  }, [config.offset])

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current.x = e.clientX
    mousePos.current.y = e.clientY

    if (!isVisible) {
      setIsVisible(true)
    }
  }, [isVisible])

  // Handle mouse enter/leave
  const handleMouseEnter = useCallback(() => {
    setIsVisible(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  // Set cursor variant
  const setCursor = useCallback((newConfig: Partial<CursorConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Reset cursor to default
  const resetCursor = useCallback(() => {
    setConfig({
      variant: 'default',
      size: 20,
      offset: { x: 0, y: 0 }
    })
  }, [])

  // Setup event listeners
  useEffect(() => {
    if (!isClient) return

    // Start animation loop
    animationFrame.current = requestAnimationFrame(animateCursor)

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseenter', handleMouseEnter)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Hide default cursor
    document.body.style.cursor = 'none'

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseenter', handleMouseEnter)
      document.removeEventListener('mouseleave', handleMouseLeave)
      
      // Restore default cursor
      document.body.style.cursor = 'auto'
    }
  }, [animateCursor, handleMouseMove, handleMouseEnter, handleMouseLeave])

  // Auto-detect hover states
  useEffect(() => {
    if (!isClient) return

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement
      
      // Check if hovering over interactive elements
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.hasAttribute('role') ||
        target.classList.contains('cursor-pointer') ||
        getComputedStyle(target).cursor === 'pointer'
      ) {
        setCursor({ 
          variant: 'hover',
          size: 40,
          text: target.getAttribute('data-cursor-text') || undefined
        })
      }
      
      // Check for text elements
      else if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.hasAttribute('contenteditable')
      ) {
        setCursor({ variant: 'text', size: 2 })
      }
      
      // Check for disabled elements
      else if (target.hasAttribute('disabled')) {
        setCursor({ variant: 'disabled', size: 20 })
      }
    }

    const handleMouseOut = () => {
      resetCursor()
    }

    // Add hover detection to all elements
    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    document.addEventListener('mouseout', handleMouseOut, { passive: true })

    return () => {
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [setCursor, resetCursor])

  return {
    cursorRef,
    isVisible,
    config,
    setCursor,
    resetCursor,
  }
}

/**
 * Custom cursor component
 * Renders the actual cursor element
 */
export function CustomCursor() {
  const { cursorRef, isVisible, config } = useCursor()

  if (!isClient) return null

  return (
    <div
      ref={cursorRef}
      className={`
        fixed top-0 left-0 pointer-events-none z-[9999] transition-all duration-200
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      style={{
        width: config.size,
        height: config.size,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Main cursor dot */}
      <div
        className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${config.variant === 'default' ? 'bg-primary border border-primary/50' : ''}
          ${config.variant === 'hover' ? 'bg-primary/20 border-2 border-primary backdrop-blur-sm' : ''}
          ${config.variant === 'text' ? 'bg-primary w-0.5 h-4 rounded-none' : ''}
          ${config.variant === 'drag' ? 'bg-primary/50 border border-primary scale-125' : ''}
          ${config.variant === 'disabled' ? 'bg-muted border border-muted/50' : ''}
        `}
      />

      {/* Inner dot for hover state */}
      {config.variant === 'hover' && (
        <div className="absolute inset-0 m-auto w-1 h-1 bg-primary rounded-full" />
      )}

      {/* Text label */}
      {config.text && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2 py-1 bg-background border border-border rounded text-xs text-foreground whitespace-nowrap">
          {config.text}
        </div>
      )}

      {/* Ripple effect for interactions */}
      {config.variant === 'hover' && (
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
      )}
    </div>
  )
}

/**
 * Higher-order component to add magnetic effect to elements
 * AWWWARDS technique for interactive buttons/cards
 */
export function useMagneticEffect(ref: React.RefObject<HTMLElement>, strength: number = 0.3) {
  useEffect(() => {
    const element = ref.current
    if (!element || !isClient) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2

      element.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    }

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0px, 0px)'
    }

    element.addEventListener('mousemove', handleMouseMove, { passive: true })
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [ref, strength])
}

/**
 * Hook for cursor text effects
 * Allows elements to show custom text on hover
 */
export function useCursorText(text: string) {
  const { setCursor, resetCursor } = useCursor()

  const props = {
    onMouseEnter: () => setCursor({ variant: 'hover', text, size: 40 }),
    onMouseLeave: resetCursor,
    'data-cursor-text': text,
  }

  return props
}