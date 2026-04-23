import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

interface NavItem {
  href: string
  label: string
  num: string
  highlight?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', num: '01' },
  { href: '/servicos', label: 'Serviços', num: '02' },
  { href: '/solucoes', label: 'Soluções', num: '03' },
  { href: '/inteligencia-artificial', label: 'IA', num: '04', highlight: true },
  { href: '/sobre', label: 'Sobre', num: '05' },
  { href: '/blog', label: 'Blog', num: '06' },
  { href: '/contato', label: 'Contato', num: '07' },
]

export default function Header() {
  const location = useLocation()

  // Close mobile sheet on route change
  useEffect(() => {
    document.body.classList.remove('menu-open')
  }, [location.pathname])

  const toggleMenu = () => {
    document.body.classList.toggle('menu-open')
  }

  return (
    <>
      <div className="shell nav-shell">
        <nav className="nav">
          <div className="nav-inner glass">
            <Link to="/" className="brand">
              <img
                src="/assets/logo.png"
                alt="BSN Solution"
                fetchPriority="high"
                decoding="async"
                width={140}
                height={44}
                style={{ height: 44, width: 'auto', display: 'block' }}
              />
            </Link>

            <div className="nav-links">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    [isActive ? 'active' : '', item.highlight ? 'nav-highlight' : '']
                      .filter(Boolean)
                      .join(' ') || undefined
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <Link to="/contato" className="nav-cta">
              Solicitar orçamento <span className="arr">↗</span>
            </Link>

            <button
              className="nav-burger"
              aria-label="Abrir menu"
              type="button"
              onClick={toggleMenu}
            >
              <span />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile fullscreen sheet */}
      <div className="mobile-sheet">
        <button
          type="button"
          className="ms-close"
          aria-label="Fechar menu"
          onClick={() => document.body.classList.remove('menu-open')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="ms-links">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={
                  [isActive ? 'active' : '', item.highlight ? 'nav-highlight' : '']
                    .filter(Boolean)
                    .join(' ') || undefined
                }
                onClick={() => document.body.classList.remove('menu-open')}
              >
                {item.label} <span>{item.num}</span>
              </Link>
            )
          })}
        </div>
        <div className="ms-cta">
          <span className="mono">Vamos conversar</span>
          <Link
            to="/contato"
            className="cta"
            onClick={() => document.body.classList.remove('menu-open')}
          >
            Solicitar orçamento ↗
          </Link>
        </div>
      </div>
    </>
  )
}

/**
 * Scroll progress bar (optional, kept for Home)
 */
export function ScrollProgress() {
  // No visual progress bar in new design - keep as no-op for backwards-compat
  return null
}
