import { useEffect, useState, type FormEvent } from 'react'
import { Edit, ExternalLink, Eye, EyeOff, Plus, Save, Trash2, X } from 'lucide-react'
import { servicesApi } from '@/lib/api'
import TabMain from './services/TabMain'
import TabDetail from './services/TabDetail'
import TabBlocks from './services/TabBlocks'
import {
  EMPTY_FORM,
  isValidSlug,
  type Feature,
  type Service,
  type ServiceDetailBlock,
  type ServiceFormData,
} from './services/types'

type ActiveTab = 'main' | 'detail' | 'blocks'

export default function AdminServicesPage() {
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [form, setForm] = useState<ServiceFormData>(EMPTY_FORM)
  const [blocks, setBlocks] = useState<ServiceDetailBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('main')

  useEffect(() => {
    load({ silent: false })
  }, [])

  // silent=true mantém a lista visível durante refetch pós-ação (preserva scroll)
  async function load({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await servicesApi.admin.getServices()
      setItems(res.services ?? [])
    } finally {
      if (!silent) setLoading(false)
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

  async function reorderBlocks(next: ServiceDetailBlock[]) {
    if (!editing) return
    // Atualiza otimisticamente
    setBlocks(next.map((b, idx) => ({ ...b, order: idx + 1 })))
    try {
      await servicesApi.admin.reorderBlocks(
        editing.id,
        next.map((b, idx) => ({ id: b.id, order: idx + 1 }))
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
              {activeTab === 'main' && <TabMain form={form} setForm={setForm} />}
              {activeTab === 'detail' && <TabDetail form={form} setForm={setForm} />}
              {activeTab === 'blocks' && (
                <TabBlocks
                  editing={editing}
                  blocks={blocks}
                  setBlocks={setBlocks}
                  blocksLoading={blocksLoading}
                  onAddBlock={addBlock}
                  onUpdateBlock={updateBlock}
                  onRemoveBlock={removeBlock}
                  onToggleBlock={toggleBlock}
                  onReorderBlocks={reorderBlocks}
                />
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
