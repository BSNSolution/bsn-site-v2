import { useEffect, useState, type FormEvent } from 'react'
import { Edit, Eye, EyeOff, Info, Save, X, ExternalLink } from 'lucide-react'
import { servicesApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import DragList from '@/components/admin/DragList'
import Select from '@/components/admin/Select'
import ServiceIconSelect from '@/components/admin/ServiceIconSelect'
import { toast } from 'sonner'
import {
  TILE_OPTIONS,
  type Service,
} from './services/types'

interface MosaicFormData {
  tileClass: string
  numLabel: string
  iconName: string
  homePill: string
  homePillTags: string // csv
  anchor: string
  isActive: boolean
}

const EMPTY_FORM: MosaicFormData = {
  tileClass: 't1',
  numLabel: '',
  iconName: 'code',
  homePill: '',
  homePillTags: '',
  anchor: '',
  isActive: true,
}

export default function AdminHomeServicesMosaicPage() {
  const [items, setItems] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Service | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<MosaicFormData>(EMPTY_FORM)

  useEffect(() => { load({ silent: false }) }, [])

  async function load({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await servicesApi.admin.getServices()
      const list: Service[] = res.services ?? []
      list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setItems(list)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function openEdit(svc: Service) {
    setEditing(svc)
    setForm({
      tileClass: svc.tileClass ?? 't1',
      numLabel: svc.numLabel ?? '',
      iconName: svc.iconName ?? 'code',
      homePill: svc.homePill ?? '',
      homePillTags: (svc.homePillTags ?? []).join(', '),
      anchor: svc.anchor ?? '',
      isActive: svc.isActive,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    // Só mandamos os campos de mosaico — backend faz merge parcial.
    const payload = {
      tileClass: form.tileClass || null,
      numLabel: form.numLabel || null,
      iconName: form.iconName || null,
      homePill: form.homePill || null,
      homePillTags: form.homePillTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      anchor: form.anchor || null,
      isActive: form.isActive,
    }
    try {
      await servicesApi.admin.updateService(editing.id, payload)
      toast.success('Mosaico atualizado')
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function toggle(id: string) {
    await servicesApi.admin.toggleService(id)
    load()
  }

  async function handleReorder(next: Service[]) {
    setItems(next)
    try {
      await servicesApi.admin.reorderServices(
        next.map((s, idx) => ({ id: s.id, order: idx + 1 })),
      )
      toast.success('Ordem salva')
    } catch {
      toast.error('Erro ao salvar ordem')
      load()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mosaico de serviços da home</h1>
        <p className="text-sm text-muted-foreground">
          Controle a ordem e os campos de mosaico que aparecem na home (vitral + cards flutuantes do hero).
        </p>
      </div>

      {/* Banner informativo */}
      <div className="bg-primary/5 border border-primary/20 rounded p-4 flex items-start gap-3">
        <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">
            Editando apenas os campos de mosaico
          </p>
          <p className="text-muted-foreground mt-1">
            Para editar título, descrição, slug, features e página de detalhe, use a tela
            <code className="text-[11px] px-1 bg-white/10 rounded mx-1">Página: Serviços → Serviços (mosaico + lista)</code>.
            Aqui você ajusta só como o serviço aparece na home: ordem, cor do tile, ícone, num label, pill e tags.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          Nenhum serviço cadastrado. Crie em "Página: Serviços → Serviços (mosaico + lista)".
        </div>
      ) : (
        <DragList items={items} getKey={(s) => s.id} onReorder={handleReorder} className="grid gap-3">
          {(svc, handle) => (
            <div className="glass p-4 flex items-start gap-4">
              {handle}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-mono text-muted-foreground">
                    {svc.numLabel || `SVC · ${String(svc.order).padStart(2, '0')}`}
                  </span>
                  <h3 className="font-medium truncate">{svc.title}</h3>
                  {!svc.isActive && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-muted-foreground">Inativo</span>
                  )}
                  {svc.anchor && (
                    <a
                      href={`/#${svc.anchor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      title="Ver âncora na home"
                    >
                      #{svc.anchor} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>tile: <b className="text-foreground">{svc.tileClass ?? '—'}</b></span>
                  <span>· ícone: <b className="text-foreground">{svc.iconName ?? '—'}</b></span>
                  <span>· ordem: <b className="text-foreground">{svc.order}</b></span>
                </div>
                {svc.homePill && (
                  <div className="mt-2 text-xs">
                    <span className="inline-block px-2 py-0.5 rounded bg-white/10 text-foreground">{svc.homePill}</span>
                    {Array.isArray(svc.homePillTags) && svc.homePillTags.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {svc.homePillTags.map((t) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground border border-white/10">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(svc.id)} className="p-2 hover:bg-white/10 rounded" title={svc.isActive ? 'Desativar' : 'Ativar'}>
                  {svc.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(svc)} className="p-2 hover:bg-white/10 rounded" title="Editar mosaico">
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </DragList>
      )}

      {showForm && editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Editar mosaico · {editing.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Edita apenas os campos que aparecem na home. Outros campos em "Página: Serviços".
                </p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Tile class</label>
                  <div className="mt-1">
                    <Select
                      value={form.tileClass}
                      onChange={(v) => setForm({ ...form, tileClass: v })}
                      options={TILE_OPTIONS.map((t) => ({ value: t, label: t || '(auto)' }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Num label</label>
                  <input
                    type="text"
                    value={form.numLabel}
                    onChange={(e) => setForm({ ...form, numLabel: e.target.value })}
                    placeholder="SVC · 01"
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Ícone</label>
                <div className="mt-1">
                  <ServiceIconSelect
                    value={form.iconName}
                    onChange={(slug) => setForm({ ...form, iconName: slug })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Anchor (âncora na home)</label>
                <input
                  type="text"
                  value={form.anchor}
                  onChange={(e) => setForm({ ...form, anchor: e.target.value })}
                  placeholder="ex: sob-medida"
                  className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Home pill (badge)</label>
                  <input
                    type="text"
                    value={form.homePill}
                    onChange={(e) => setForm({ ...form, homePill: e.target.value })}
                    placeholder="SLA 24/7"
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tags (separadas por vírgula)</label>
                  <input
                    type="text"
                    value={form.homePillTags}
                    onChange={(e) => setForm({ ...form, homePillTags: e.target.value })}
                    placeholder="Dev, DevOps, QA"
                    className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded"
                  />
                </div>
              </div>

              <Checkbox
                label="Ativo na home"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 hover:bg-white/10 rounded">
                  Cancelar
                </button>
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
