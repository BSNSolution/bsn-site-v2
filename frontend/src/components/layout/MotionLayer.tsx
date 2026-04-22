import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * BSN Motion Layer — recria o comportamento do motion.js do design v3:
 *   - Reveal on scroll (data-reveal attribute + IntersectionObserver)
 *   - Cursor spotlight nos cards (.glass, .tile, .node, .sol, .svc etc.)
 *   - Parallax sutil dos orbs do hero ao mover o mouse
 *   - Magnetismo em .btn-primary
 *   - Header scroll state (.is-scrolled)
 *   - Contador animado para [data-count]
 *   - Grain sutil global
 * Respeita prefers-reduced-motion.
 */
export default function MotionLayer() {
  const location = useLocation()

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // 1) Grain fixed overlay
    if (!document.querySelector('.bsn-grain')) {
      const g = document.createElement('div')
      g.className = 'bsn-grain'
      document.body.appendChild(g)
    }

    // 2) Auto-add data-reveal em elementos-alvo
    const revealSelectors = [
      '.hero h1', '.hero p.sub', '.hero .ctas', '.hero .eyebrow',
      '.orbit-center h1', '.orbit-center p', '.orbit-center .ctas', '.orbit-center .eyebrow',
      '.node',
      '.vitral .mono', '.vitral h2', '.vitral p',
      '.tile',
      '.band-inner h2', '.band-inner p', '.band-cta',
      '.stack h2', '.stack .mono',
      '.hero-s h1', '.hero-s p', '.hero-s .eyebrow',
      '.svc', '.sol', '.feat-card', '.post', '.person', '.val', '.job', '.perk',
      '.channels .chan', '.chan-list .chan', '.form-card',
      '.contact-wrap > *', '.about-grid > *', '.team-grid > *', '.values-grid > *',
      '.sol-grid > *', '.svc-grid > *', '.feats > *', '.posts > *', '.jobs > *', '.perks > *',
      '.legal .doc', '.legal h1',
      '.process-step', '.process-grid > *',
      '.timeline-item',
      '.clients-card',
      '.hero-meta > *',
      '.card-live', '.card-pill',
    ]
    revealSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => {
        if (!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '')
      })
    })

    // Grupos com stagger
    const groupSelectors = [
      '.mosaic', '.orbit-nodes', '.hero-meta', '.bsn-footer .top',
      '.svc-grid', '.sol-grid', '.feats', '.posts', '.jobs', '.perks',
      '.team-grid', '.values-grid', '.about-grid', '.chan-list', '.channels', '.contact-wrap',
      '.process-grid', '.timeline-wrap',
    ]
    groupSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((g) => g.classList.add('reveal-group'))
    })

    // h-accent (underline gradient em títulos)
    document.querySelectorAll('.band-inner h2, .hero-s h1, .legal h1').forEach((h) => {
      h.classList.add('h-accent')
    })
    document.querySelectorAll('.section-head h2, .vitral h2').forEach((h) => {
      if (!h.hasAttribute('data-reveal')) h.setAttribute('data-reveal', '')
    })

    if (reduce) return

    // 3) IntersectionObserver reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    )
    document.querySelectorAll('[data-reveal], .h-accent').forEach((el) => io.observe(el))

    // 4) Cursor spotlight nos cards
    const pointerFine = window.matchMedia('(pointer:fine)').matches
    const spotTargets = '.glass, .tile, .node, .svc, .sol, .feat-card, .post, .person, .val, .job, .perk, .chan, .form-card, .doc, .clients-card, .process-step, .timeline-card'
    const listeners: Array<{ el: Element; move: (e: Event) => void; leave: () => void }> = []

    if (pointerFine) {
      document.querySelectorAll(spotTargets).forEach((el) => {
        // skip nav-inner
        if (el.closest('.nav-inner') || (el as HTMLElement).classList.contains('nav-inner')) return

        if (!el.querySelector(':scope > .bsn-spot')) {
          const spot = document.createElement('i')
          spot.className = 'bsn-spot'
          spot.setAttribute('aria-hidden', 'true')
          el.insertBefore(spot, el.firstChild)
        }
        const move = (e: Event) => {
          const ev = e as MouseEvent
          const r = (el as HTMLElement).getBoundingClientRect()
          const x = ((ev.clientX - r.left) / r.width) * 100
          const y = ((ev.clientY - r.top) / r.height) * 100
          ;(el as HTMLElement).style.setProperty('--mx', x + '%')
          ;(el as HTMLElement).style.setProperty('--my', y + '%')
        }
        const leave = () => {
          ;(el as HTMLElement).style.removeProperty('--mx')
          ;(el as HTMLElement).style.removeProperty('--my')
        }
        el.addEventListener('mousemove', move)
        el.addEventListener('mouseleave', leave)
        listeners.push({ el, move, leave })
      })
    }

    // 5) Header scroll state + parallax elements
    const onScroll = () => {
      const sy = window.scrollY
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const speed = parseFloat((el as HTMLElement).getAttribute('data-parallax') || '0.2')
        ;(el as HTMLElement).style.transform = `translate3d(0,${sy * speed}px,0)`
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    // 6) Magnetismo em .btn-primary
    const magneticHandlers: Array<{ el: Element; move: (e: Event) => void; leave: () => void }> = []
    if (pointerFine) {
      document.querySelectorAll('.btn-primary').forEach((btn) => {
        const move = (e: Event) => {
          const ev = e as MouseEvent
          const r = (btn as HTMLElement).getBoundingClientRect()
          const x = ev.clientX - r.left - r.width / 2
          const y = ev.clientY - r.top - r.height / 2
          ;(btn as HTMLElement).style.transform = `translate(${x * 0.12}px,${y * 0.18}px)`
        }
        const leave = () => {
          ;(btn as HTMLElement).style.transform = ''
        }
        btn.addEventListener('mousemove', move)
        btn.addEventListener('mouseleave', leave)
        magneticHandlers.push({ el: btn, move, leave })
      })
    }

    // 7) Mouse parallax em orbit-sun / bg layers
    let rafId: number | null = null
    let mx = 0, my = 0, tx = 0, ty = 0
    const parallaxEls = document.querySelectorAll('.orbit-sun, .bg-glass, [data-mouse-parallax]')
    const loop = () => {
      tx += (mx - tx) * 0.08
      ty += (my - ty) * 0.08
      parallaxEls.forEach((el) => {
        const depthAttr = (el as HTMLElement).getAttribute('data-mouse-parallax')
        let depth = depthAttr ? parseFloat(depthAttr) : 30
        if ((el as HTMLElement).classList.contains('bg-glass')) depth = 10
        const dx = tx * depth
        const dy = ty * depth
        if ((el as HTMLElement).classList.contains('orbit-sun')) {
          ;(el as HTMLElement).style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`
        } else {
          ;(el as HTMLElement).style.transform = `translate3d(${dx}px,${dy}px,0)`
        }
      })
      if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) {
        rafId = requestAnimationFrame(loop)
      } else {
        rafId = null
      }
    }
    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX / window.innerWidth - 0.5
      my = e.clientY / window.innerHeight - 0.5
      if (!rafId) rafId = requestAnimationFrame(loop)
    }
    if (pointerFine && parallaxEls.length > 0) {
      window.addEventListener('mousemove', onMouseMove)
    }

    // 8) Contador animado
    const counterObservers: IntersectionObserver[] = []
    document.querySelectorAll('[data-count]').forEach((el) => {
      const countAttr = (el as HTMLElement).getAttribute('data-count') || '0'
      const target = parseFloat(countAttr)
      const decimals = (countAttr.split('.')[1] || '').length
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const start = performance.now()
          const dur = 1400
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / dur)
            const eased = 1 - Math.pow(1 - t, 3)
            ;(el as HTMLElement).textContent = (target * eased).toFixed(decimals)
            if (t < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io2.unobserve(el)
        })
      })
      io2.observe(el)
      counterObservers.push(io2)
    })

    return () => {
      io.disconnect()
      counterObservers.forEach((o) => o.disconnect())
      window.removeEventListener('scroll', onScroll)
      if (pointerFine && parallaxEls.length > 0) {
        window.removeEventListener('mousemove', onMouseMove)
      }
      listeners.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move)
        el.removeEventListener('mouseleave', leave)
      })
      magneticHandlers.forEach(({ el, move, leave }) => {
        el.removeEventListener('mousemove', move)
        el.removeEventListener('mouseleave', leave)
      })
      if (rafId) cancelAnimationFrame(rafId)
    }
    // Re-roda a cada troca de rota para pegar elementos novos
  }, [location.pathname])

  return null
}
