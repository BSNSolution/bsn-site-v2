import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { servicesApi } from '@/lib/api'

interface Feature {
  title: string
  description: string
}

interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  iconName?: string | null
  anchor?: string | null
  numLabel?: string | null
  shardColor?: string | null
  ctaLabel?: string | null
  features?: Feature[] | null
  tileClass?: string | null
  homePill?: string | null
  homePillTags?: string[]
  isActive: boolean
  order: number
}

interface FormData {
  title: string
  subtitle: string
  description: string
  iconName: string
  anchor: string
  numLabel: string
  shardColor: string
  ctaLabel: string
  features: Feature[]
  tileClass: string
  homePill: string
  homePillTags: string
  isActive: boolean
  order?: number
}

const ICON_OPTIONS = ['code', 'squad', 'auto', 'box', 'server', 'support', 'build']
const SHARD_OPTIONS = ['v', 'c', 'm', 'a', 'e']
const TILE_OPTIONS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7']

const EMPTY_FORM: FormData = {
  title: '',
  subtitle: '',
  description: '',
  iconName: 'code',
  anchor: '',
  numLabel: '',
  shardColor: 'v',
  ctaLabel: 'Falar sobre um projeto ↗',
  features: [
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
    { title: '', description: '' },
  ],
  tileClass: 't1',
  homePill: '',
  homePillTags: '',
  isActive: true,
}

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await servicesApi.admin.getServices()
      setItems(res.services ?? [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(svc: Service) {
    setEditing(svc)
    const features: Feature[] = Array.isArray(svc.features) ? svc.features : []
    const padded = [...features]
    while (padded.length < 4) padded.push({ title: '', description: '' })
    setForm({
      title: svc.title,
      subtitle: svc.subtitle ?? '',
      description: svc.description,
      iconName: svc.iconName ?? 'code',
      anchor: svc.anchor ?? '',
      numLabel: svc.numLabel ?? '',
      shardColor: svc.shardColor ?? 'v',
      ctaLabel: svc.ctaLabel ?? '',
      features: padded.slice(0, 4),
      tileClass: svc.tileClass ?? 't1',
      homePill: svc.homePill ?? '',
      homePillTags: (svc.homePillTags ?? []).join(', '),
      isActive: svc.isActive,
      order: svc.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      features: form.features.filter((f) => f.title.trim() || f.description.trim()),
      homePillTags: form.homePillTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
    try {
      if (editing) {
        await servicesApi.admin.updateService(editing.id, payload)
      } else {
        await servicesApi.admin.createService(payload)
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este serviço?')) return
    await servicesApi.admin.deleteService(id)
    load()
  }

  async function toggle(id: string) {
    await servicesApi.admin.toggleService(id)
    load()
  }

  function updateFeature(idx: number, field: 'title' | 'description', value: string) {
    const features = [...form.features]
    features[idx] = { ...features[idx], [field]: value }
    setForm({ ...form, features })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Serviços</h1>
          <p className="text-sm text-muted-foreground">Controle as 7 frentes exibidas na home (mosaico) e na página /servicos.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo serviço
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {items.map((svc) => (
            <div key={svc.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{svc.numLabel}</span>
                  <h3 className="font-medium">{svc.title}</h3>
                  {!svc.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground">Inativo</span>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{svc.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>tile: {svc.tileClass ?? '—'}</span>
                  <span>· cor: {svc.shardColor ?? '—'}</span>
                  <span>· ícone: {svc.iconName ?? '—'}</span>
                  <span>· ordem: {svc.order}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(svc.id)} className="p-2 hover:bg-white/10 rounded">
                  {svc.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(svc)} className="p-2 hover:bg-white/10 rounded">
                  <Edit className="h-4 w-4" />
                </button>
                <button onClick={() => remove(svc.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum serviço.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar serviço' : 'Novo serviço'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Título completo</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Subtítulo (2ª linha do h2)</label>
                  <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição / lede</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Ícone</label>
                  <select value={form.iconName} onChange={(e) => setForm({ ...form, iconName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                    {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Shard color</label>
                  <select value={form.shardColor} onChange={(e) => setForm({ ...form, shardColor: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                    {SHARD_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tile class</label>
                  <select value={form.tileClass} onChange={(e) => setForm({ ...form, tileClass: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                    {TILE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Anchor (URL)</label>
                  <input type="text" value={form.anchor} onChange={(e) => setForm({ ...form, anchor: e.target.value })} placeholder="ex: sob-medida" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Num label</label>
                  <input type="text" value={form.numLabel} onChange={(e) => setForm({ ...form, numLabel: e.target.value })} placeholder="SVC · 01" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">CTA label</label>
                  <input type="text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Features (4 bullets 2x2 da página de serviços)</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  {form.features.map((f, idx) => (
                    <div key={idx} className="space-y-1">
                      <input type="text" value={f.title} onChange={(e) => updateFeature(idx, 'title', e.target.value)} placeholder={`Título #${idx + 1}`} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm" />
                      <input type="text" value={f.description} onChange={(e) => updateFeature(idx, 'description', e.target.value)} placeholder="Descrição" className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Home pill (badge)</label>
                  <input type="text" value={form.homePill} onChange={(e) => setForm({ ...form, homePill: e.target.value })} placeholder="SLA 24/7" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Home tags (separadas por vírgula)</label>
                  <input type="text" value={form.homePillTags} onChange={(e) => setForm({ ...form, homePillTags: e.target.value })} placeholder="Dev, DevOps, QA" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Ativo
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">Ordem:</span>
                  <input type="number" value={form.order ?? ''} onChange={(e) => setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })} className="w-20 px-2 py-1 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 hover:bg-white/10 rounded">Cancelar</button>
                <button type="submit" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded">
                  <Save className="h-4 w-4" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
