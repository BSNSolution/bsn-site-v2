import { useEffect, useRef, useState, useCallback } from 'react'
import { useInView } from 'framer-motion'
import { isClient, throttle } from '@/lib/utils'

export interface ScrollAnimationOptions {
  threshold?: number
  triggerOnce?: boolean
  rootMargin?: string
  delay?: number
}

/**
 * AWWWARDS-level scroll animation hook
 * Detects when elements enter viewport and triggers animations
 */
export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, {
    threshold: options.threshold || 0.1,
    once: options.triggerOnce !== false,
    margin: options.rootMargin || '-100px',
  })

  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isInView && !hasAnimated) {
      if (options.delay) {
        setTimeout(() => setHasAnimated(true), options.delay)
      } else {
        setHasAnimated(true)
      }
    }
  }, [isInView, hasAnimated, options.delay])

  return {
    ref,
    isInView,
    hasAnimated,
    shouldAnimate: isInView || hasAnimated,
  }
}

/**
 * Parallax scroll effect hook
 * Creates depth by moving elements at different speeds
 */
export function useParallax(speed: number = 0.5, offset: number = 0) {
  const ref = useRef<HTMLElement>(null)
  const [transform, setTransform] = useState(`translateY(${offset}px)`)

  useEffect(() => {
    if (!isClient || !ref.current) return

    const handleScroll = throttle(() => {
      if (!ref.current) return

      const rect = ref.current.getBoundingClientRect()
      const scrolled = window.scrollY
      const windowHeight = window.innerHeight
      
      // Only calculate parallax when element is near viewport
      if (rect.top < windowHeight && rect.bottom > 0) {
        const yPos = -(scrolled * speed) + offset
        setTransform(`translateY(${yPos}px)`)
      }
    }, 16) // 60fps

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, offset])

  return {
    ref,
    style: { transform },
  }
}

/**
 * Scroll progress hook
 * Tracks how much of the page has been scrolled
 */
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isClient) return

    const handleScroll = throttle(() => {
      const totalScrollable = document.body.scrollHeight - window.innerHeight
      const scrolled = window.scrollY
      const progress = Math.min(scrolled / totalScrollable, 1)
      setProgress(progress)
    }, 16)

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}

/**
 * Scroll direction hook
 * Detects scroll direction for hiding/showing headers
 */
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (!isClient) return

    let lastScrollY = window.scrollY

    const updateScrollDirection = throttle(() => {
      const currentScrollY = window.scrollY
      const direction = currentScrollY > lastScrollY ? 'down' : 'up'
      
      if (direction !== scrollDirection && Math.abs(currentScrollY - lastScrollY) > 10) {
        setScrollDirection(direction)
      }
      
      setScrollY(currentScrollY)
      lastScrollY = currentScrollY > 0 ? currentScrollY : 0
    }, 16)

    window.addEventListener('scroll', updateScrollDirection, { passive: true })
    return () => window.removeEventListener('scroll', updateScrollDirection)
  }, [scrollDirection])

  return { scrollDirection, scrollY }
}

/**
 * Scroll snap sections hook
 * Creates smooth scroll between sections
 */
export function useScrollSnap(sectionIds: string[]) {
  const [currentSection, setCurrentSection] = useState(0)

  useEffect(() => {
    if (!isClient) return

    const handleScroll = throttle(() => {
      const windowHeight = window.innerHeight
      const scrollTop = window.scrollY

      for (let i = 0; i < sectionIds.length; i++) {
        const element = document.getElementById(sectionIds[i])
        if (element) {
          const rect = element.getBoundingClientRect()
          const elementTop = rect.top + scrollTop
          
          if (scrollTop >= elementTop - windowHeight / 2 && 
              scrollTop < elementTop + element.offsetHeight - windowHeight / 2) {
            setCurrentSection(i)
            break
          }
        }
      }
    }, 16)

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [sectionIds])

  const scrollToSection = useCallback((index: number) => {
    const sectionId = sectionIds[index]
    const element = document.getElementById(sectionId)
    
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }, [sectionIds])

  return {
    currentSection,
    scrollToSection,
  }
}

/**
 * Staggered children animation hook
 * AWWWARDS technique for revealing multiple elements with delays
 */
export function useStaggeredAnimation(childSelector: string = '.stagger-item', options: ScrollAnimationOptions = {}) {
  const containerRef = useRef<HTMLElement>(null)
  const { shouldAnimate } = useScrollAnimation(options)
  const [animatedItems, setAnimatedItems] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (!shouldAnimate || !containerRef.current) return

    const children = containerRef.current.querySelectorAll(childSelector)
    const staggerDelay = 100 // milliseconds

    children.forEach((child, index) => {
      setTimeout(() => {
        (child as HTMLElement).style.opacity = '1'
        ;(child as HTMLElement).style.transform = 'translateY(0) scale(1)'
        setAnimatedItems(prev => new Set(prev).add(index))
      }, index * staggerDelay)
    })
  }, [shouldAnimate, childSelector])

  return {
    containerRef,
    shouldAnimate,
    animatedItems,
  }
}

/**
 * Scroll-triggered counter animation
 * Animates numbers when they come into view
 */
export function useCounterAnimation(
  end: number,
  start: number = 0,
  duration: number = 2000,
  options: ScrollAnimationOptions = {}
) {
  const [count, setCount] = useState(start)
  const { shouldAnimate } = useScrollAnimation(options)

  useEffect(() => {
    if (!shouldAnimate) return

    let startTime: number
    const startValue = start
    const endValue = end
    const change = endValue - startValue

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const currentCount = startValue + (change * easedProgress)

      setCount(Math.round(currentCount))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [shouldAnimate, start, end, duration])

  return count
}

/**
 * Magnetic scroll effect for elements
 * Elements get pulled toward the center as they scroll
 */
export function useMagneticScroll(strength: number = 0.1) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isClient || !ref.current) return

    const element = ref.current

    const handleScroll = throttle(() => {
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      const elementCenter = rect.top + rect.height / 2
      const screenCenter = windowHeight / 2
      
      const distance = elementCenter - screenCenter
      const maxDistance = windowHeight / 2
      const normalizedDistance = Math.max(-1, Math.min(1, distance / maxDistance))
      
      const translateY = -normalizedDistance * 50 * strength
      const translateX = normalizedDistance * 20 * strength
      
      element.style.transform = `translate(${translateX}px, ${translateY}px)`
    }, 16)

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [strength])

  return ref
}

/**
 * Text reveal animation hook
 * AWWWARDS technique for revealing text character by character
 */
export function useTextReveal(text: string, options: ScrollAnimationOptions = {}) {
  const [revealedChars, setRevealedChars] = useState(0)
  const { shouldAnimate } = useScrollAnimation(options)

  useEffect(() => {
    if (!shouldAnimate) return

    const chars = text.length
    const duration = 1000
    const interval = duration / chars

    for (let i = 0; i <= chars; i++) {
      setTimeout(() => {
        setRevealedChars(i)
      }, i * interval)
    }
  }, [shouldAnimate, text])

  return {
    revealedText: text.slice(0, revealedChars),
    isComplete: revealedChars >= text.length,
    progress: revealedChars / text.length,
  }
}

/**
 * Smooth scroll to element utility
 */
export function useSmoothScroll() {
  const scrollToElement = useCallback((elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId)
    if (!element) return

    const elementPosition = element.offsetTop - offset
    
    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth'
    })
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  return {
    scrollToElement,
    scrollToTop,
  }
}