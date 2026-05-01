import { useEffect, useState, lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import Seo from '@/components/Seo'
import {
  contactApi,
  contactConfigApi,
  contactProjectTypesApi,
  settingsApi,
  type ContactPageConfig,
  type ContactProjectType,
} from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'

// Mapa pesado — lazy pra não onerar bundle inicial e quebrar SSR caso volte
const ContactMap = lazy(() => import('@/components/contact/ContactMap'))

// Fallback: chips quando DB vazio. Substitui completamente a derivação
// bugada via Service.subtitle (que gerava "sob", "&", "de"…).
const FALLBACK_PROJECT_TYPES: string[] = [
  'Sob medida',
  'Squad',
  'Automação',
  'Consultoria',
  'Infra',
]

const FALLBACK_CONFIG: ContactPageConfig = {
  pageTitle: 'Vamos conversar sobre seu projeto.',
  pageSubtitle:
    'Conte o desafio em linguagem de humano. Sem tecniquês, sem lengalenga comercial — respondemos em até 24 horas úteis com um próximo passo concreto.',
  email: 'contato@bsnsolution.com.br',
  phone: '+55 65 9000-0000',
  whatsappNumber: '5565900000000',
  address: 'Cuiabá · MT · Brasil',
  addressLat: null,
  addressLng: null,
  businessHours: 'Seg–Sex · 09h–18h',
  responseTimeText: 'Resposta em até 24h úteis',
  showMap: true,
  showBriefForm: true,
  showProjectTypes: true,
  isActive: true,
}

const CONTACT_SECTION_KEYS = ['hero', 'wrap', 'map'] as const

export default function ContactPage() {
  const { data: settings } = useQuery({
    queryKey: ['site-settings-contact'],
    queryFn: settingsApi.getSettings,
    staleTime: 10 * 60 * 1000,
  })

  // Singleton config: se a query falhar ou DB vazio, usa fallback.
  const { data: configResp } = useQuery({
    queryKey: ['contact-config'],
    queryFn: contactConfigApi.get,
    staleTime: 5 * 60 * 1000,
  })

  const { data: typesResp } = useQuery({
    queryKey: ['contact-project-types'],
    queryFn: contactProjectTypesApi.list,
    staleTime: 5 * 60 * 1000,
  })

  const config: ContactPageConfig = configResp?.config ?? FALLBACK_CONFIG
  const dbTypes: ContactProjectType[] = typesResp?.types ?? []
  const projectTypeLabels: string[] =
    dbTypes.length > 0 ? dbTypes.map((t) => t.label) : FALLBACK_PROJECT_TYPES

  const [projectType, setProjectType] = useState<string>(
    projectTypeLabels[0] ?? ''
  )
  // Re-sincroniza chip selecionado quando lista é recarregada.
  useEffect(() => {
    if (!projectTypeLabels.includes(projectType)) {
      setProjectType(projectTypeLabels[0] ?? '')
    }
  }, [projectTypeLabels, projectType])

  const [status, setStatus] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const payload = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      subject: `Briefing · ${projectType}`,
      message: `Empresa: ${String(data.get('company') ?? '—')}\nTipo: ${projectType}\n\n${String(data.get('brief') ?? '')}`,
    }

    setSubmitting(true)
    setStatus('ENVIANDO...')
    try {
      await contactApi.sendMessage(payload)
      setStatus('✓ BRIEFING RECEBIDO — RETORNAMOS EM 24H')
      form.reset()
      setProjectType(projectTypeLabels[0] ?? '')
    } catch (err) {
      setStatus('✗ ERRO AO ENVIAR — TENTE NOVAMENTE OU E-MAIL DIRETO')
    } finally {
      setSubmitting(false)
      setTimeout(() => setStatus(''), 6000)
    }
  }

  // settings.* serve como fallback secundário caso o admin não tenha
  // preenchido o ContactPageConfig ainda (ex: DB recém-criado).
  const email = config.email || settings?.email || FALLBACK_CONFIG.email
  const phone = config.phone || settings?.phone || FALLBACK_CONFIG.phone
  const address = config.address || settings?.address || FALLBACK_CONFIG.address
  const whatsappRaw = config.whatsappNumber || phone.replace(/\D/g, '')
  const linkedin = settings?.linkedinUrl ?? '/company/bsnsolution'

  const showMapSection =
    config.showMap &&
    typeof config.addressLat === 'number' &&
    typeof config.addressLng === 'number'

  // Se config esconde uma das seções, ela é removida da lista efetiva.
  // Caso usePageSections traga override do admin, ele continua valendo.
  const desiredKeys = CONTACT_SECTION_KEYS.filter((k) => {
    if (k === 'map' && !showMapSection) return false
    return true
  })

  const { effectiveKeys } = usePageSections(
    'contact',
    desiredKeys as readonly string[]
  )

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Contato · vamos conversar"
        title={
          <span dangerouslySetInnerHTML={{ __html: config.pageTitle }} />
        }
        lede={config.pageSubtitle}
      >
        <div className="hero-badges" style={{ marginTop: 28 }}>
          <span className="hero-badge">
            <span className="dot-pulse" />
            {config.responseTimeText}
          </span>
          <span className="hero-badge">🔒 Dados tratados conforme LGPD</span>
          <span className="hero-badge">💬 Sem tecniquês</span>
        </div>
      </PublicPageHero>
    ),

    wrap: () => (
      <section key="wrap" className="contact-wrap shell">
        <div className="channels glass">
          <div className="shard" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="mono">CANAIS DIRETOS</div>
            <h2>
              Fale com um <em>parceiro</em>, não com um formulário.
            </h2>
            <p className="lede">
              Qualquer um dos canais abaixo chega no mesmo time que vai
              construir sua solução. Sem triagem comercial.
            </p>
            <p
              className="mono"
              style={{
                marginTop: 12,
                color: 'var(--ink-dim)',
                fontSize: 12,
              }}
            >
              {config.businessHours}
            </p>
          </div>
          <div className="chan-list">
            <a
              href={`mailto:${email}`}
              className="chan"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div className="l">E-MAIL</div>
                <div className="v">{email}</div>
              </div>
              <div className="arr">↗</div>
            </a>
            <a
              href={`https://wa.me/${whatsappRaw}`}
              className="chan"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div className="l">WHATSAPP</div>
                <div className="v">{phone}</div>
              </div>
              <div className="arr">↗</div>
            </a>
            <a
              href={
                linkedin.startsWith('http')
                  ? linkedin
                  : `https://linkedin.com${linkedin}`
              }
              className="chan"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div className="l">LINKEDIN</div>
                <div className="v">
                  {linkedin.replace('https://linkedin.com', '') ||
                    '/company/bsnsolution'}
                </div>
              </div>
              <div className="arr">↗</div>
            </a>
            <div className="chan">
              <div>
                <div className="l">ENDEREÇO</div>
                <div className="v">{address}</div>
              </div>
              <div className="arr">↗</div>
            </div>
          </div>
        </div>

        {config.showBriefForm && (
          <div className="form-card glass">
            <div className="shard" />
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Nome</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="field">
                <label>E-mail corporativo</label>
                <input
                  type="email"
                  name="email"
                  placeholder="nome@empresa.com.br"
                  required
                />
              </div>
              <div className="field">
                <label>Empresa</label>
                <input
                  type="text"
                  name="company"
                  placeholder="Nome da empresa"
                />
              </div>
              {config.showProjectTypes && projectTypeLabels.length > 0 && (
                <div className="field">
                  <label>Tipo de projeto</label>
                  <div className="chips">
                    {projectTypeLabels.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={`chip ${projectType === type ? 'active' : ''}`}
                        onClick={() => setProjectType(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="field">
                <label>Conte seu desafio</label>
                <textarea
                  name="brief"
                  placeholder="Objetivo, contexto, prazos..."
                  required
                />
              </div>
              <button
                className="btn btn-primary submit auto"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar briefing'}{' '}
                <span>↗</span>
              </button>
              <div className="form-status">{status}</div>
            </form>
          </div>
        )}
      </section>
    ),

    map: () =>
      showMapSection ? (
        <section key="map" className="shell" style={{ padding: '60px 32px' }}>
          <div style={{ marginBottom: 24 }}>
            <div className="mono" style={{ marginBottom: 8 }}>
              ONDE ESTAMOS
            </div>
            <h2
              style={{
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                fontSize: 'clamp(28px, 4vw, 40px)',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
              }}
            >
              {address}
            </h2>
          </div>
          <Suspense
            fallback={
              <div
                className="glass"
                style={{
                  height: 360,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-dim)',
                }}
              >
                Carregando mapa…
              </div>
            }
          >
            <ContactMap
              lat={config.addressLat as number}
              lng={config.addressLng as number}
              address={address}
              name="BSN Solution"
            />
          </Suspense>
        </section>
      ) : null,
  }

  return (
    <div className="page">
      <Seo
        title="Contato — Vamos conversar sobre seu projeto"
        description="Fale com a BSN Solution. Diagnóstico inicial gratuito de 45 minutos: viabilidade, próximos passos e primeiro escopo enxuto. Sem lengalenga comercial, em até 24h úteis."
        path="/contato"
      />
      <Header />
      {effectiveKeys.map((key) => sectionRenderers[key]?.() ?? null)}
      <Footer />
    </div>
  )
}
