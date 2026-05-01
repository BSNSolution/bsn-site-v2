import { useState, useEffect, FormEvent } from 'react'
import { Save, MapPin, Mail, Phone, Clock, Eye } from 'lucide-react'
import { contactConfigApi, type ContactPageConfig } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'

const DEFAULT: ContactPageConfig = {
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

export default function AdminContactConfigPage() {
  const [form, setForm] = useState<ContactPageConfig>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await contactConfigApi.admin.get()
      if (res.config) setForm(res.config)
    } catch {
      /* mantém defaults */
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      // Converte string vazia em null para os campos numéricos
      const payload: ContactPageConfig = {
        ...form,
        addressLat:
          form.addressLat === null || Number.isNaN(form.addressLat)
            ? null
            : Number(form.addressLat),
        addressLng:
          form.addressLng === null || Number.isNaN(form.addressLng)
            ? null
            : Number(form.addressLng),
      }
      await contactConfigApi.admin.save(payload)
      toast.success('Configurações de contato salvas')
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof ContactPageConfig>(
    key: K,
    value: ContactPageConfig[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Carregando...</div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-semibold">Página de Contato — Configurações</h1>
        <p className="text-sm text-muted-foreground">
          Edita o cabeçalho da página, canais de contato, geolocalização do
          mapa e visibilidade dos blocos.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* 1. Cabeçalho */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Cabeçalho da página
            </h2>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Título principal
            </label>
            <input
              type="text"
              value={form.pageTitle}
              onChange={(e) => setField('pageTitle', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Aceita HTML simples (&lt;em&gt;, &lt;br&gt;).
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Subtítulo / lede
            </label>
            <textarea
              value={form.pageSubtitle}
              onChange={(e) => setField('pageSubtitle', e.target.value)}
              rows={3}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              required
            />
          </div>
        </div>

        {/* 2. Contato direto */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Canais de contato
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Telefone (exibido)
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+55 65 9000-0000"
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              WhatsApp (apenas dígitos, com DDI/DDD — ex: 5565900000000)
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) =>
                setField('whatsappNumber', e.target.value.replace(/\D/g, ''))
              }
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-sm"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Usado no link <span className="font-mono">wa.me/{form.whatsappNumber || 'NUMERO'}</span>
            </p>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Endereço (texto)
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              required
            />
          </div>
        </div>

        {/* 3. Geolocalização */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Mapa — Geolocalização
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground -mt-1">
            Para obter coordenadas: abra{' '}
            <a
              href="https://www.openstreetmap.org/search"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              openstreetmap.org/search
            </a>
            {' '}ou Google Maps, busque o endereço, copie lat/lng do URL ou do menu de contexto.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">
                Latitude (ex: -15.601411)
              </label>
              <input
                type="number"
                step="any"
                value={form.addressLat ?? ''}
                onChange={(e) =>
                  setField(
                    'addressLat',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-sm"
                placeholder="-15.601411"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">
                Longitude (ex: -56.097892)
              </label>
              <input
                type="number"
                step="any"
                value={form.addressLng ?? ''}
                onChange={(e) =>
                  setField(
                    'addressLng',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-sm"
                placeholder="-56.097892"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            O mapa só é renderizado quando ambos os valores estiverem
            preenchidos E o toggle "Exibir mapa" estiver ativo.
          </p>
        </div>

        {/* 4. Atendimento */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Atendimento
            </h2>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Horário de atendimento
            </label>
            <input
              type="text"
              value={form.businessHours}
              onChange={(e) => setField('businessHours', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              placeholder="Seg–Sex · 09h–18h"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">
              Texto de SLA / resposta
            </label>
            <input
              type="text"
              value={form.responseTimeText}
              onChange={(e) => setField('responseTimeText', e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              placeholder="Resposta em até 24h úteis"
              required
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Aparece como badge logo abaixo do título.
            </p>
          </div>
        </div>

        {/* 5. Visibilidade */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Visibilidade dos blocos
            </h2>
          </div>
          <div className="grid gap-2">
            <Checkbox
              label="Exibir mapa"
              description="Só aparece se lat/lng estiverem preenchidos."
              checked={form.showMap}
              onChange={(e) => setField('showMap', e.target.checked)}
            />
            <Checkbox
              label="Exibir formulário completo de briefing"
              description="Se desligado, só os canais diretos (e-mail, whatsapp) ficam visíveis."
              checked={form.showBriefForm}
              onChange={(e) => setField('showBriefForm', e.target.checked)}
            />
            <Checkbox
              label="Exibir chips de tipo de projeto"
              description="Lista os tipos cadastrados em 'Tipos de projeto'."
              checked={form.showProjectTypes}
              onChange={(e) => setField('showProjectTypes', e.target.checked)}
            />
          </div>
        </div>

        {/* 6. Status */}
        <div className="bg-black/30 border border-white/10 rounded p-5">
          <Checkbox
            label="Configuração ativa"
            description="Se desligado, os fallbacks hardcoded entram no lugar."
            checked={form.isActive}
            onChange={(e) => setField('isActive', e.target.checked)}
          />
        </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
