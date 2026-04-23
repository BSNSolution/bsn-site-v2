import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { settingsApi } from '@/lib/api'

interface SiteSettings {
  siteName?: string
  siteDescription?: string
  logoUrl?: string
  email?: string
  phone?: string
  address?: string
  facebookUrl?: string
  instagramUrl?: string
  linkedinUrl?: string
  twitterUrl?: string
  youtubeUrl?: string
}

const DEFAULTS: SiteSettings = {
  siteName: 'BSN Solution',
  siteDescription:
    'Transformamos ideias em soluções tecnológicas inovadoras. Especialistas em desenvolvimento sob medida, squads ágeis e consultoria estratégica em TI.',
  email: 'contato@bsnsolution.com.br',
  phone: '+55 11 99000-0000',
  address: 'Cuiabá · MT · Brasil',
  linkedinUrl: '#',
  instagramUrl: '#',
}

export default function Footer() {
  const { data } = useQuery({
    queryKey: ['site-settings'],
    queryFn: settingsApi.getSettings,
    staleTime: 10 * 60 * 1000,
  })

  const settings: SiteSettings = { ...DEFAULTS, ...(data ?? {}) }

  const backToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNewsletterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const btn = form.querySelector('button') as HTMLButtonElement | null
    if (!btn) return
    const original = btn.textContent ?? 'Inscrever'
    btn.textContent = '✓ Inscrito'
    setTimeout(() => {
      btn.textContent = original
    }, 2500)
    form.reset()
  }

  return (
    <footer className="bsn-footer">
      <div className="shell">
        <div className="top">
          <div className="brand-col">
            <div className="logo-row">
              <img src="/assets/logo.png" alt={settings.siteName ?? 'BSN Solution'} loading="lazy" />
              <span className="tag">Tecnologia &amp; Inovação</span>
            </div>
            <p>{settings.siteDescription}</p>
            <div className="contact-block">
              <h4>Contato</h4>
              <ul>
                <li>
                  <span className="ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 6h16v12H4z" />
                      <path d="m4 7 8 6 8-6" />
                    </svg>
                  </span>
                  {settings.email}
                </li>
                <li>
                  <span className="ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M5 4h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                    </svg>
                  </span>
                  {settings.phone}
                </li>
                <li>
                  <span className="ic">
                    <svg viewBox="0 0 24 24">
                      <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </span>
                  {settings.address}
                </li>
              </ul>
            </div>
          </div>

          <div className="link-col">
            <h4>Serviços</h4>
            <ul>
              <li><Link to="/servicos#sob-medida">Desenvolvimento sob medida</Link></li>
              <li><Link to="/servicos#squads">Squads ágeis</Link></li>
              <li><Link to="/servicos#automacao">Automação de processos</Link></li>
              <li><Link to="/servicos#consultoria">Consultoria em tecnologia</Link></li>
              <li><Link to="/servicos#infra">Infraestrutura &amp; VPS</Link></li>
              <li><Link to="/servicos#suporte">Suporte contínuo</Link></li>
              <li><Link to="/servicos#outsourcing">Outsourcing de TI</Link></li>
            </ul>
          </div>

          <div className="link-col">
            <h4>Empresa</h4>
            <ul>
              <li><Link to="/sobre">Sobre nós</Link></li>
              <li><Link to="/solucoes">Soluções verticais</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/carreiras">Carreiras</Link></li>
              <li><Link to="/contato">Contato</Link></li>
            </ul>
          </div>

          <div className="link-col">
            <h4>Legal</h4>
            <ul>
              <li><Link to="/privacidade">Política de Privacidade</Link></li>
              <li><Link to="/termos">Termos de Uso</Link></li>
              <li><Link to="/privacidade#cookies">Política de Cookies</Link></li>
              <li><Link to="/privacidade#lgpd">Conformidade LGPD</Link></li>
            </ul>
          </div>
        </div>

        <div className="mid">
          <div className="news">
            <h4>Newsletter</h4>
            <p>Receba insights técnicos e análises dos nossos projetos. Uma edição mensal, sem enchimento.</p>
            <form className="news-form" onSubmit={handleNewsletterSubmit}>
              <input type="email" placeholder="seu@email.com" required />
              <button type="submit">Inscrever</button>
            </form>
          </div>

          <div className="social">
            <span className="label">Siga-nos</span>
            <div className="icons">
              {settings.linkedinUrl && (
                <a href={settings.linkedinUrl} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M8 10v7M8 7v.01M12 17v-5a2 2 0 1 1 4 0v5M12 13v-3" />
                  </svg>
                </a>
              )}
              {settings.instagramUrl && (
                <a href={settings.instagramUrl} aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r=".5" fill="currentColor" />
                  </svg>
                </a>
              )}
              <a href="#" aria-label="GitHub">
                <svg viewBox="0 0 24 24">
                  <path d="M9 19c-4 1.5-4-2-6-2m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.7 4.7 0 0 0-1.3-3.3 4.4 4.4 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.8 11.8 0 0 0-6 0C7.3 2.7 6.3 3 6.3 3a4.4 4.4 0 0 0-.1 3.2A4.7 4.7 0 0 0 4.9 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
                </svg>
              </a>
              {settings.phone && (
                <a
                  href={`https://wa.me/${(settings.phone ?? '').replace(/\D/g, '')}`}
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M3 21l1.5-5A8 8 0 1 1 8 20z" />
                    <path d="M9 10c.5 2 2 3.5 4 4l1.5-1.5 2 1-1 2a2 2 0 0 1-2.5.5A8 8 0 0 1 7.5 11a2 2 0 0 1 .5-2.5l2-1 1 2L9 10z" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="bottom">
          <div>
            © {new Date().getFullYear()} {settings.siteName} · CNPJ 00.000.000/0001-00 · Todos os direitos reservados.
          </div>
          <button type="button" className="totop" onClick={backToTop}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Voltar ao topo
          </button>
        </div>
      </div>
    </footer>
  )
}
