import { useState, useEffect, FormEvent } from 'react'
import { Save, Info } from 'lucide-react'
import { homeExtrasApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'

interface Hero {
  id?: string
  eyebrowTemplate: string
  title: string
  subtitle: string
  ctaPrimaryLabel: string
  ctaPrimaryUrl: string
  ctaPrimaryIcon?: string | null
  ctaSecondaryLabel?: string | null
  ctaSecondaryUrl?: string | null
  badge1Text?: string | null
  badge1HasPulse: boolean
  badge2Text?: string | null
  showFloatingNodes: boolean
  isActive: boolean
}

const DEFAULT: Hero = {
  eyebrowTemplate: '{count} capacidades · 1 parceiro',
  title: 'Tudo que sua operação precisa <em>girando</em> no mesmo eixo.',
  subtitle:
    'Desenvolvimento, cloud, automação e suporte 24/7 sob a mesma governança. Um ponto de contato, um SLA, um time que fala a mesma língua.',
  ctaPrimaryLabel: 'Começar',
  ctaPrimaryUrl: '/contato',
  ctaPrimaryIcon: '↗',
  ctaSecondaryLabel: 'Explorar capacidades',
  ctaSecondaryUrl: '/servicos',
  badge1Text: 'Resposta em até 24h úteis',
  badge1HasPulse: true,
  badge2Text: '🔒 LGPD-ready',
  showFloatingNodes: true,
  isActive: true,
}

export default function AdminHomeHeroPage() {
  const [form, setForm] = useState<Hero>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasSecondaryCta, setHasSecondaryCta] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await homeExtrasApi.admin.getHero()
      if (res.hero) {
        setForm(res.hero)
        setHasSecondaryCta(!!(res.hero.ctaSecondaryLabel && res.hero.ctaSecondaryUrl))
      }
    } catch {
      /* sem registro ainda — mantém DEFAULT */
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: Hero = {
        ...form,
        ctaPrimaryIcon: form.ctaPrimaryIcon?.trim() ? form.ctaPrimaryIcon : null,
        ctaSecondaryLabel: hasSecondaryCta ? form.ctaSecondaryLabel || null : null,
        ctaSecondaryUrl: hasSecondaryCta ? form.ctaSecondaryUrl || null : null,
        badge1Text: form.badge1Text?.trim() ? form.badge1Text : null,
        badge2Text: form.badge2Text?.trim() ? form.badge2Text : null,
      }
      await homeExtrasApi.admin.saveHero(payload)
      alert('Salvo com sucesso')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Hero da Home</h1>
        <p className="text-sm text-muted-foreground">
          Edita o bloco principal que aparece no topo da página inicial — eyebrow, título, subtítulo,
          CTAs e badges. Os cards flutuantes em órbita consomem os serviços ativos (edite-os em
          "4. Mosaico de serviços").
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* IDENTIFICAÇÃO / EYEBROW */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div>
            <h2 className="text-sm font-semibold mb-1">Eyebrow</h2>
            <p className="text-xs text-muted-foreground mb-2">
              Pequena legenda acima do título. Use <code className="text-[11px] px-1 bg-white/10 rounded">{'{count}'}</code> para inserir dinamicamente o número de serviços ativos.
            </p>
            <input
              type="text"
              value={form.eyebrowTemplate}
              onChange={(e) => setForm({ ...form, eyebrowTemplate: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              placeholder="{count} capacidades · 1 parceiro"
              required
            />
          </div>
        </div>

        {/* TÍTULO & SUBTÍTULO */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <h2 className="text-sm font-semibold">Título & subtítulo</h2>
          <div>
            <label className="text-xs text-muted-foreground">
              Título (aceita HTML simples: <code className="text-[11px] px-1 bg-white/10 rounded">&lt;em&gt;</code> e <code className="text-[11px] px-1 bg-white/10 rounded">&lt;br&gt;</code>)
            </label>
            <textarea
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Subtítulo (lede abaixo do título)</label>
            <textarea
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              required
            />
          </div>
        </div>

        {/* CTA PRIMÁRIA */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <h2 className="text-sm font-semibold">CTA primária</h2>
          <div className="grid grid-cols-[1fr_1fr_80px] gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Label</label>
              <input
                type="text"
                value={form.ctaPrimaryLabel}
                onChange={(e) => setForm({ ...form, ctaPrimaryLabel: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">URL</label>
              <input
                type="text"
                value={form.ctaPrimaryUrl}
                onChange={(e) => setForm({ ...form, ctaPrimaryUrl: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ícone</label>
              <input
                type="text"
                value={form.ctaPrimaryIcon ?? ''}
                onChange={(e) => setForm({ ...form, ctaPrimaryIcon: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                placeholder="↗"
              />
            </div>
          </div>
        </div>

        {/* CTA SECUNDÁRIA */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">CTA secundária (ghost)</h2>
            <Checkbox
              label="Mostrar"
              checked={hasSecondaryCta}
              onChange={(e) => setHasSecondaryCta(e.target.checked)}
            />
          </div>
          {hasSecondaryCta && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Label</label>
                <input
                  type="text"
                  value={form.ctaSecondaryLabel ?? ''}
                  onChange={(e) => setForm({ ...form, ctaSecondaryLabel: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL</label>
                <input
                  type="text"
                  value={form.ctaSecondaryUrl ?? ''}
                  onChange={(e) => setForm({ ...form, ctaSecondaryUrl: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                />
              </div>
            </div>
          )}
        </div>

        {/* BADGES */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <h2 className="text-sm font-semibold">Badges flutuantes (abaixo dos CTAs)</h2>
          <div>
            <label className="text-xs text-muted-foreground">Badge 1</label>
            <input
              type="text"
              value={form.badge1Text ?? ''}
              onChange={(e) => setForm({ ...form, badge1Text: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              placeholder="Resposta em até 24h úteis"
            />
            <div className="mt-2">
              <Checkbox
                label="Com dot pulsante"
                checked={form.badge1HasPulse}
                onChange={(e) => setForm({ ...form, badge1HasPulse: e.target.checked })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Badge 2</label>
            <input
              type="text"
              value={form.badge2Text ?? ''}
              onChange={(e) => setForm({ ...form, badge2Text: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
              placeholder="🔒 LGPD-ready"
            />
          </div>
        </div>

        {/* ORBIT / FLOATING NODES */}
        <div className="bg-black/30 border border-white/10 rounded p-5 space-y-3">
          <h2 className="text-sm font-semibold">Cards flutuantes em órbita</h2>
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Os 6 cards flutuantes ao redor do hero são gerados a partir dos <strong>serviços ativos</strong>.
              Para editar título curto, ícone, num label e anchor de cada card, vá em
              <code className="text-[11px] px-1 bg-white/10 rounded mx-1">4. Mosaico de serviços</code>.
            </span>
          </p>
          <Checkbox
            label="Mostrar cards flutuantes em órbita"
            checked={form.showFloatingNodes}
            onChange={(e) => setForm({ ...form, showFloatingNodes: e.target.checked })}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90 disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
