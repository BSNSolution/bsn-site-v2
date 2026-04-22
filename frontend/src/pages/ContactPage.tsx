import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { contactApi, settingsApi } from '@/lib/api'

const PROJECT_TYPES = ['Sob medida', 'Squad', 'Automação', 'Consultoria', 'Infra'] as const

export default function ContactPage() {
  const { data: settings } = useQuery({
    queryKey: ['site-settings-contact'],
    queryFn: settingsApi.getSettings,
    staleTime: 10 * 60 * 1000,
  })

  const [projectType, setProjectType] = useState<(typeof PROJECT_TYPES)[number]>('Sob medida')
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
      setProjectType('Sob medida')
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

  return (
    <div className="page">
      <Header />

      <section className="hero-s shell">
        <div className="eyebrow mono">
          <span className="dot" />
          <span>Contato · vamos conversar</span>
        </div>
        <h1>
          Seu próximo sistema
          <br />
          começa com um <em>diagnóstico</em>.
        </h1>
        <p>
          Conte o desafio. Em até 24 horas úteis, um parceiro da BSN responde com um próximo passo concreto — sem
          lengalenga comercial.
        </p>
      </section>

      <section className="contact-wrap shell">
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
                {PROJECT_TYPES.map((type) => (
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

      <Footer />
    </div>
  )
}
