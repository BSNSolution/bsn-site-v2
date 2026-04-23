import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save, ExternalLink, ArrowUp, ArrowDown } from 'lucide-react'
import { servicesApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import { IconPicker } from '@/components/ui/icon-picker'

interface Feature {
  title: string
  description: string
}

interface ServiceDetailBlock {
  id: string
  title: string
  description: string
  iconName?: string | null
  colorClass?: string | null
  order: number
  isActive: boolean
}

interface Service {
  id: string
  title: string
  subtitle?: string | null
  description: string
  iconName?: string | null
  anchor?: string | null
  slug?: string | null
  numLabel?: string | null
  shardColor?: string | null
  ctaLabel?: string | null
  features?: Feature[] | null
  tileClass?: string | null
  homePill?: string | null
  homePillTags?: string[]
  heroEyebrow?: string | null
  heroDescription?: string | null
  heroLongText?: string | null
  ctaTitle?: string | null
  ctaText?: string | null
  ctaButtonLabel?: string | null
  ctaButtonUrl?: string | null
  detailBlocks?: ServiceDetailBlock[]
  isActive: boolean
  order: number
}

interface FormData {
  title: string
  subtitle: string
  description: string
  iconName: string
  anchor: string
  slug: string
  numLabel: string
  shardColor: string
  ctaLabel: string
  features: Feature[]
  tileClass: string
  homePill: string
  homePillTags: string
  heroEyebrow: string
  heroDescription: string
  heroLongText: string
  ctaTitle: string
  ctaText: string
  ctaButtonLabel: string
  ctaButtonUrl: string
  isActive: boolean
  order?: number
}

const SHARD_OPTIONS = ['v', 'c', 'm', 'a', 'e']
const TILE_OPTIONS = ['', 't1', 't2', 't3', 't4', 't5', 't6', 't7']
const BLOCK_COLOR_OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f']

const EMPTY_FORM: FormData = {
  title: '',
  subtitle: '',
  description: '',
  iconName: 'code',
  anchor: '',
  slug: '',
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
  heroEyebrow: '',
  heroDescription: '',
  heroLongText: '',
  ctaTitle: '',
  ctaText: '',
  ctaButtonLabel: '',
  ctaButtonUrl: '/contato',
  isActive: true,
}

// Slug válido: lowercase, letras/números/hífen, sem iniciar em hífen
function isValidSlug(slug: string): boolean {
  if (!slug) return true // opcional
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [blocks, setBlocks] = useState<ServiceDetailBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'main' | 'detail' | 'blocks'>('main')

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

  async function loadBlocks(serviceId: string) {
    setBlocksLoading(true)
    try {
      const res = await servicesApi.admin.getBlocks(serviceId)
      setBlocks(res.blocks ?? [])
    } catch {
      setBlocks([])
    } finally {
      setBlocksLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setBlocks([])
    setActiveTab('main')
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
      slug: svc.slug ?? '',
      numLabel: svc.numLabel ?? '',
      shardColor: svc.shardColor ?? 'v',
      ctaLabel: svc.ctaLabel ?? '',
      features: padded.slice(0, 4),
      tileClass: svc.tileClass ?? 't1',
      homePill: svc.homePill ?? '',
      homePillTags: (svc.homePillTags ?? []).join(', '),
      heroEyebrow: svc.heroEyebrow ?? '',
      heroDescription: svc.heroDescription ?? '',
      heroLongText: svc.heroLongText ?? '',
      ctaTitle: svc.ctaTitle ?? '',
      ctaText: svc.ctaText ?? '',
      ctaButtonLabel: svc.ctaButtonLabel ?? '',
      ctaButtonUrl: svc.ctaButtonUrl ?? '/contato',
      isActive: svc.isActive,
      order: svc.order,
    })
    setActiveTab('main')
    loadBlocks(svc.id)
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (form.slug && !isValidSlug(form.slug)) {
      alert('Slug inválido. Use apenas letras minúsculas, números e hífen (ex: "sob-medida").')
      return
    }
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
        const created = await servicesApi.admin.createService(payload)
        // Se criado, abrir o card de edição para gerenciar blocks
        if (created?.id) {
          setEditing({ ...created, isActive: created.isActive ?? true })
        }
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.field === 'slug') {
        alert('Slug já está em uso por outro serviço. Escolha outro.')
      } else {
        alert(data?.error || 'Erro ao salvar')
      }
    }
  }

  // ── Blocks CRUD ──
  async function addBlock() {
    if (!editing) {
      alert('Salve o serviço primeiro antes de adicionar blocos.')
      return
    }
    try {
      const created = await servicesApi.admin.createBlock(editing.id, {
        title: 'Novo bloco',
        description: 'Descrição breve do bloco.',
        iconName: 'sparkles',
        colorClass: 'a',
        order: blocks.length + 1,
        isActive: true,
      })
      setBlocks((prev) => [...prev, created])
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao criar bloco')
    }
  }

  async function updateBlock(blockId: string, patch: Partial<ServiceDetailBlock>) {
    if (!editing) return
    try {
      const updated = await servicesApi.admin.updateBlock(editing.id, blockId, patch)
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updated } : b)))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao atualizar bloco')
    }
  }

  async function removeBlock(blockId: string) {
    if (!editing) return
    if (!confirm('Remover este bloco?')) return
    try {
      await servicesApi.admin.deleteBlock(editing.id, blockId)
      setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao remover bloco')
    }
  }

  async function toggleBlock(blockId: string) {
    if (!editing) return
    try {
      const updated = await servicesApi.admin.toggleBlock(editing.id, blockId)
      setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updated } : b)))
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao alternar bloco')
    }
  }

  async function moveBlock(blockId: string, direction: 'up' | 'down') {
    if (!editing) return
    const sorted = [...blocks].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((b) => b.id === blockId)
    if (idx < 0) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= sorted.length) return
    const a = sorted[idx]
    const b = sorted[swapIdx]
    const items = [
      { id: a.id, order: b.order },
      { id: b.id, order: a.order },
    ]
    try {
      await servicesApi.admin.reorderBlocks(editing.id, items)
      setBlocks((prev) =>
        prev.map((blk) => {
          if (blk.id === a.id) return { ...blk, order: b.order }
          if (blk.id === b.id) return { ...blk, order: a.order }
          return blk
        })
      )
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao reordenar')
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">{svc.numLabel}</span>
                  <h3 className="font-medium">{svc.title}</h3>
                  {!svc.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground">Inativo</span>}
                  {svc.slug && (
                    <a
                      href={`/servicos/${svc.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      title="Abrir página pública"
                    >
                      /servicos/{svc.slug} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{svc.description}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>tile: {svc.tileClass ?? '—'}</span>
                  <span>· cor: {svc.shardColor ?? '—'}</span>
                  <span>· ícone: {svc.iconName ?? '—'}</span>
                  <span>· ordem: {svc.order}</span>
                  <span>· blocos: {svc.detailBlocks?.length ?? 0}</span>
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
          <div className="glass max-w-3xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{editing ? 'Editar serviço' : 'Novo serviço'}</h2>
                {editing && form.slug && (
                  <a
                    href={`/servicos/${form.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
                  >
                    Ver página pública <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/10 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('main')}
                className={`px-4 py-2 text-sm rounded-t transition ${
                  activeTab === 'main'
                    ? 'bg-white/5 text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Principal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('detail')}
                className={`px-4 py-2 text-sm rounded-t transition ${
                  activeTab === 'detail'
                    ? 'bg-white/5 text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Página de detalhe
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('blocks')}
                disabled={!editing}
                title={!editing ? 'Salve o serviço primeiro' : undefined}
                className={`px-4 py-2 text-sm rounded-t transition ${
                  activeTab === 'blocks'
                    ? 'bg-white/5 text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Blocos de detalhe {editing ? `(${blocks.length})` : ''}
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              {activeTab === 'main' && (
                <>
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
                      <div className="mt-1">
                        <IconPicker value={form.iconName} onChange={(name) => setForm({ ...form, iconName: name })} />
                      </div>
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
                      <label className="text-xs text-muted-foreground">Anchor (hash ÂNCORA em /servicos)</label>
                      <input type="text" value={form.anchor} onChange={(e) => setForm({ ...form, anchor: e.target.value })} placeholder="ex: sob-medida" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">
                        Slug (URL da página /servicos/&lt;slug&gt;)
                      </label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="ex: sob-medida"
                        className={`w-full mt-1 px-3 py-2 bg-black/40 border rounded ${
                          form.slug && !isValidSlug(form.slug) ? 'border-destructive' : 'border-white/10'
                        }`}
                      />
                      {form.slug && !isValidSlug(form.slug) && (
                        <span className="text-[10px] text-destructive">Apenas letras minúsculas, números e hífen.</span>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Num label</label>
                      <input type="text" value={form.numLabel} onChange={(e) => setForm({ ...form, numLabel: e.target.value })} placeholder="SVC · 01" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">CTA label (card da /servicos)</label>
                      <input type="text" value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Features (4 bullets 2x2 da página /servicos)</label>
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

                  <div className="flex items-center gap-4 flex-wrap">
                    <Checkbox label="Ativo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground">Ordem:</span>
                      <input type="number" value={form.order ?? ''} onChange={(e) => setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })} className="w-20 px-2 py-1 bg-black/40 border border-white/10 rounded" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'detail' && (
                <>
                  <div className="text-xs text-muted-foreground mb-2">
                    Conteúdo exibido em <code>/servicos/{form.slug || '<slug>'}</code> — hero e CTA band.
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Hero eyebrow (pequeno rótulo acima do título)</label>
                    <input type="text" value={form.heroEyebrow} onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })} placeholder="ex: Serviço · sob medida" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Hero descrição (lede abaixo do h1)</label>
                    <textarea value={form.heroDescription} onChange={(e) => setForm({ ...form, heroDescription: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Hero texto extra (opcional, parágrafo menor)</label>
                    <textarea value={form.heroLongText} onChange={(e) => setForm({ ...form, heroLongText: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                  </div>

                  <div className="border-t border-white/10 pt-3 mt-3">
                    <div className="text-xs text-muted-foreground mb-2 font-medium">Bloco CTA (faixa no final da página)</div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Título</label>
                        <input type="text" value={form.ctaTitle} onChange={(e) => setForm({ ...form, ctaTitle: e.target.value })} placeholder="Pronto para começar?" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Texto</label>
                        <textarea value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Label do botão</label>
                          <input type="text" value={form.ctaButtonLabel} onChange={(e) => setForm({ ...form, ctaButtonLabel: e.target.value })} placeholder="Agendar diagnóstico →" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">URL do botão</label>
                          <input type="text" value={form.ctaButtonUrl} onChange={(e) => setForm({ ...form, ctaButtonUrl: e.target.value })} placeholder="/contato" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'blocks' && (
                <div className="space-y-3">
                  {!editing ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      Salve o serviço primeiro para gerenciar os blocos.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          {blocks.length} bloco(s) · normalmente 3 blocos por página de detalhe
                        </div>
                        <button
                          type="button"
                          onClick={addBlock}
                          className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded"
                        >
                          <Plus className="h-4 w-4" /> Adicionar bloco
                        </button>
                      </div>

                      {blocksLoading && (
                        <div className="p-6 text-center text-muted-foreground text-sm">Carregando blocos...</div>
                      )}

                      {!blocksLoading && blocks.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground text-sm border border-dashed border-white/10 rounded">
                          Nenhum bloco ainda. Clique em "Adicionar bloco".
                        </div>
                      )}

                      {[...blocks].sort((a, b) => a.order - b.order).map((block, idx, arr) => (
                        <div key={block.id} className="border border-white/10 rounded p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                              {!block.isActive && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-muted-foreground">Inativo</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveBlock(block.id, 'up')}
                                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === arr.length - 1}
                                onClick={() => moveBlock(block.id, 'down')}
                                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleBlock(block.id)}
                                className="p-1.5 hover:bg-white/10 rounded"
                              >
                                {block.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBlock(block.id)}
                                className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase">Título</label>
                            <input
                              type="text"
                              value={block.title}
                              onChange={(e) => setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, title: e.target.value } : b)))}
                              onBlur={(e) => updateBlock(block.id, { title: e.target.value })}
                              className="w-full mt-0.5 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-muted-foreground uppercase">Descrição</label>
                            <textarea
                              value={block.description}
                              rows={3}
                              onChange={(e) => setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, description: e.target.value } : b)))}
                              onBlur={(e) => updateBlock(block.id, { description: e.target.value })}
                              className="w-full mt-0.5 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Ícone</label>
                              <IconPicker
                                value={block.iconName ?? 'sparkles'}
                                onChange={(name) => {
                                  setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, iconName: name } : b)))
                                  updateBlock(block.id, { iconName: name })
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-muted-foreground uppercase">Cor do shard</label>
                              <select
                                value={block.colorClass ?? 'a'}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, colorClass: val } : b)))
                                  updateBlock(block.id, { colorClass: val })
                                }}
                                className="w-full mt-0.5 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm"
                              >
                                {BLOCK_COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 hover:bg-white/10 rounded">Fechar</button>
                {activeTab !== 'blocks' && (
                  <button type="submit" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded">
                    <Save className="h-4 w-4" /> Salvar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
