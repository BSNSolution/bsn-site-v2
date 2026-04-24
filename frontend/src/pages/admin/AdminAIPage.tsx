import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { aiApi, api } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import ColorSelect from '@/components/admin/ColorSelect'
import ImageInput from '@/components/admin/ImageInput'
import DragList from '@/components/admin/DragList'
import Select from '@/components/admin/Select'
import { toast } from 'sonner'

type AIBlockType = 'HERO_BENEFIT' | 'STAGE' | 'EDU_HIGHLIGHT'

interface AIBlock {
  id: string
  type: AIBlockType
  tag?: string | null
  title: string
  description: string
  bullets: string[]
  colorClass?: string | null
  number?: string | null
  iconName?: string | null
  imageUrl?: string | null
  isActive: boolean
  order: number
}

interface FormData {
  type: AIBlockType
  tag: string
  title: string
  description: string
  bullets: string // textarea, um por linha
  colorClass: string
  number: string
  iconName: string
  imageUrl: string
  isActive: boolean
  order?: number
}

const TYPE_OPTIONS: { value: AIBlockType; label: string }[] = [
  { value: 'HERO_BENEFIT', label: 'Benefício (topo)' },
  { value: 'STAGE', label: 'Etapa / Escopo' },
  { value: 'EDU_HIGHLIGHT', label: 'Destaque educacional' },
]

const ICON_OPTIONS = [
  'trending-up',
  'scissors',
  'zap',
  'brain',
  'database',
  'shield',
  'sparkles',
  'cpu',
  'line-chart',
  'bot',
  'workflow',
  'file-search',
]

const EMPTY_FORM: FormData = {
  type: 'HERO_BENEFIT',
  tag: '',
  title: '',
  description: '',
  bullets: '',
  colorClass: 'a',
  number: '',
  iconName: 'sparkles',
  imageUrl: '',
  isActive: true,
}

const TYPE_LABEL: Record<AIBlockType, string> = {
  HERO_BENEFIT: 'Benefícios (topo)',
  STAGE: 'Etapas numeradas',
  EDU_HIGHLIGHT: 'Destaques educacionais',
}

export default function AdminAIPage() {
  const [items, setItems] = useState<AIBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AIBlock | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await aiApi.admin.getBlocks()
      setItems(res.blocks ?? [])
    } finally {
      setLoading(false)
    }
  }

  function openCreate(type?: AIBlockType) {
    setEditing(null)
    setForm({ ...EMPTY_FORM, type: type ?? 'HERO_BENEFIT' })
    setShowForm(true)
  }

  function openEdit(block: AIBlock) {
    setEditing(block)
    setForm({
      type: block.type,
      tag: block.tag ?? '',
      title: block.title,
      description: block.description,
      bullets: (block.bullets ?? []).join('\n'),
      colorClass: block.colorClass ?? 'a',
      number: block.number ?? '',
      iconName: block.iconName ?? 'sparkles',
      imageUrl: block.imageUrl ?? '',
      isActive: block.isActive,
      order: block.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      bullets: form.bullets
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      tag: form.tag.trim() || null,
      number: form.number.trim() || null,
      iconName: form.iconName.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
    }
    try {
      if (editing) {
        await aiApi.admin.updateBlock(editing.id, payload)
      } else {
        await aiApi.admin.createBlock(payload)
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este bloco?')) return
    await aiApi.admin.deleteBlock(id)
    load()
  }

  async function toggle(id: string) {
    await aiApi.admin.toggleBlock(id)
    load()
  }

  async function handleReorder(type: AIBlockType, next: AIBlock[]) {
    // Atualiza otimisticamente + persiste
    const others = items.filter((b) => b.type !== type)
    setItems([...others, ...next])
    try {
      await api.patch('/admin/ai-blocks/reorder', {
        items: next.map((b, idx) => ({ id: b.id, order: idx + 1 })),
      })
      toast.success('Ordem salva')
    } catch {
      toast.error('Erro ao salvar ordem')
      load()
    }
  }

  // agrupa por tipo
  const grouped: Record<AIBlockType, AIBlock[]> = {
    HERO_BENEFIT: [],
    STAGE: [],
    EDU_HIGHLIGHT: [],
  }
  for (const it of items) grouped[it.type]?.push(it)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Página: Inteligência Artificial</h1>
          <p className="text-sm text-muted-foreground">
            Controle os blocos exibidos em /inteligencia-artificial: benefícios no topo, etapas numeradas e destaques
            educacionais.
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Novo bloco
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        (['HERO_BENEFIT', 'STAGE', 'EDU_HIGHLIGHT'] as AIBlockType[]).map((type) => (
          <section key={type} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-mono uppercase tracking-wider text-white/60">{TYPE_LABEL[type]}</h2>
              <button
                onClick={() => openCreate(type)}
                className="text-xs inline-flex items-center gap-1 px-3 py-1 rounded border border-white/10 hover:bg-white/5"
              >
                <Plus className="h-3 w-3" /> Adicionar
              </button>
            </div>
            <DragList
              items={grouped[type]}
              getKey={(b) => b.id}
              onReorder={(next) => handleReorder(type, next)}
              className="grid gap-3"
            >
              {(block, handle) => (
                <div className="glass p-4 flex items-start justify-between gap-4">
                  {handle}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {block.number && (
                        <span className="text-xs font-mono text-muted-foreground">#{block.number}</span>
                      )}
                      {block.tag && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                          {block.tag}
                        </span>
                      )}
                      <h3 className="font-medium truncate">{block.title}</h3>
                      {!block.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{block.description}</p>
                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span>cor: {block.colorClass ?? '—'}</span>
                      <span>· ícone: {block.iconName ?? '—'}</span>
                      <span>· ordem: {block.order}</span>
                      <span>· {(block.bullets ?? []).length} bullets</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggle(block.id)} className="p-2 hover:bg-white/10 rounded">
                      {block.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button onClick={() => openEdit(block)} className="p-2 hover:bg-white/10 rounded">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(block.id)}
                      className="p-2 hover:bg-destructive/10 text-destructive rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </DragList>
            {grouped[type].length === 0 && (
              <div className="p-6 text-center text-muted-foreground glass text-sm">Nenhum bloco ainda.</div>
            )}
          </section>
        ))
      )}

      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar bloco' : 'Novo bloco'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    <Select
                      value={form.type}
                      onChange={(v) => setForm({ ...form, type: v as AIBlockType })}
                      options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tag / eyebrow</label>
                  <input
                    type="text"
                    value={form.tag}
                    onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    placeholder="RECEITA, DISCOVERY IA..."
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Descrição / lede</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">
                  Bullets (um por linha — usados em STAGE e EDU_HIGHLIGHT)
                </label>
                <textarea
                  value={form.bullets}
                  onChange={(e) => setForm({ ...form, bullets: e.target.value })}
                  rows={4}
                  placeholder={'Item 1\nItem 2\nItem 3'}
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <ColorSelect
                  label="Cor"
                  variant="color-class"
                  value={form.colorClass}
                  onChange={(v) => setForm({ ...form, colorClass: v })}
                />
                <div>
                  <label className="text-xs text-muted-foreground">Número (STAGE)</label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="01"
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ícone (Lucide)</label>
                  <div className="mt-1">
                    <Select
                      value={form.iconName}
                      onChange={(v) => setForm({ ...form, iconName: v })}
                      searchable
                      options={ICON_OPTIONS.map((i) => ({ value: i, label: i }))}
                    />
                  </div>
                </div>
              </div>

              <ImageInput
                label="Imagem (opcional)"
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
                previewHeight={100}
              />

              <div className="flex items-center gap-4 flex-wrap">
                <Checkbox
                  label="Ativo"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">Ordem:</span>
                  <input
                    type="number"
                    value={form.order ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, order: e.target.value ? Number(e.target.value) : undefined })
                    }
                    className="w-20 px-2 py-1 bg-black/40 border border-white/10 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 hover:bg-white/10 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded"
                >
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
