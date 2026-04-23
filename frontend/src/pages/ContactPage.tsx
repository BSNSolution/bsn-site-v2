import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PublicPageHero from '@/components/layout/PublicPageHero'
import Seo from '@/components/Seo'
import { contactApi, settingsApi } from '@/lib/api'
import { usePageSections } from '@/hooks/use-page-sections'
import { useApiQuery } from '@/hooks/use-api-query'

interface PublicService {
  id: string
  title: string
  subtitle?: string | null
  anchor?: string | null
  order?: number
}

/**
 * Fallback usado quando a API de services não responde ou a tabela ainda
 * está vazia — mantém a UX do formulário de contato sem deixar os chips
 * em branco.
 */
const FALLBACK_PROJECT_TYPES = ['Sob medida', 'Squad', 'Automação', 'Consultoria', 'Infra'] as const
const CONTACT_SECTION_KEYS = ['hero', 'wrap'] as const

export default function ContactPage() {
  const { data: settings } = useQuery({
    queryKey: ['site-settings-contact'],
    queryFn: settingsApi.getSettings,
    staleTime: 10 * 60 * 1000,
  })
  const { data: servicesData } = useApiQuery<{ services: PublicService[] }>(
    ['services-contact-chips'],
    '/services',
  )

  // Deriva os chips de "Tipo de projeto" dos Services ativos no admin.
  // Cai no fallback se a API ainda não respondeu ou não há services.
  const derivedProjectTypes: string[] = (() => {
    const list = servicesData?.services ?? []
    if (list.length === 0) return [...FALLBACK_PROJECT_TYPES]
    // Usa a primeira palavra do `subtitle` (mais compacto) ou do título
    // para manter os chips curtos — evita quebras visuais.
    const labels = list
      .slice(0, 5)
      .map((s) => (s.subtitle?.trim() || s.title.trim()).split(' ')[0])
      .filter(Boolean)
    return labels.length > 0 ? labels : [...FALLBACK_PROJECT_TYPES]
  })()

  const [projectType, setProjectType] = useState<string>(derivedProjectTypes[0])
  // Garante que o chip selecionado continua válido quando a API devolve
  // a lista real de services depois do primeiro render.
  useEffect(() => {
    if (!derivedProjectTypes.includes(projectType)) {
      setProjectType(derivedProjectTypes[0])
    }
  }, [derivedProjectTypes, projectType])
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
      setProjectType(derivedProjectTypes[0])
    } catch (err) {
      setStatus('✗ ERRO AO ENVIAR — TENTE NOVAMENTE OU E-MAIL DIRETO')
    } finally {
      setSubmitting(false)
      setTimeout(() => setStatus(''), 6000)
    }
  }

  const email = settings?.email ?? 'contato@bsnsolution.com.br'
  const phone = settings?.phone ?? '+55 11 99000-0000'
  const address = settings?.address ?? 'Cuiabá · MT · Brasil'
  const linkedin = settings?.linkedinUrl ?? '/company/bsnsolution'
  const { effectiveKeys } = usePageSections('contact', CONTACT_SECTION_KEYS)

  const sectionRenderers: Record<string, () => JSX.Element | null> = {
    hero: () => (
      <PublicPageHero
        key="hero"
        eyebrow="Contato · vamos conversar"
        title={
          <>
            Seu próximo sistema
            <br />
            começa com um <em>diagnóstico</em>.
          </>
        }
        lede="Conte o desafio em linguagem de humano. Sem tecniquês, sem lengalenga comercial — respondemos em até 24 horas úteis com um próximo passo concreto."
      >
        <div className="hero-badges" style={{ marginTop: 28 }}>
          <span className="hero-badge">
            <span className="dot-pulse" />
            Resposta em até 24h úteis
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
              Qualquer um dos canais abaixo chega no mesmo time que vai construir sua solução. Sem triagem comercial.
            </p>
          </div>
          <div className="chan-list">
            <a href={`mailto:${email}`} className="chan" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div>
                <div className="l">E-MAIL</div>
                <div className="v">{email}</div>
              </div>
              <div className="arr">↗</div>
            </a>
            <a
              href={`https://wa.me/${phone.replace(/\D/g, '')}`}
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
              href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com${linkedin}`}
              className="chan"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div className="l">LINKEDIN</div>
                <div className="v">{linkedin.replace('https://linkedin.com', '') || '/company/bsnsolution'}</div>
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

        <div className="form-card glass">
          <div className="shard" />
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="field">
              <label>Nome</label>
              <input type="text" name="name" placeholder="Seu nome completo" required />
            </div>
            <div className="field">
              <label>E-mail corporativo</label>
              <input type="email" name="email" placeholder="nome@empresa.com.br" required />
            </div>
            <div className="field">
              <label>Empresa</label>
              <input type="text" name="company" placeholder="Nome da empresa" />
            </div>
            <div className="field">
              <label>Tipo de projeto</label>
              <div className="chips">
                {derivedProjectTypes.map((type) => (
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
            <div className="field">
              <label>Conte seu desafio</label>
              <textarea name="brief" placeholder="Objetivo, contexto, prazos..." required />
            </div>
            <button className="btn btn-primary submit auto" type="submit" disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar briefing'} <span>↗</span>
            </button>
            <div className="form-status">{status}</div>
          </form>
        </div>
      </section>
    ),
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
