import { Checkbox } from '@/components/ui/checkbox'
import { IconPicker } from '@/components/ui/icon-picker'
import {
  isValidSlug,
  SHARD_OPTIONS,
  TILE_OPTIONS,
  type ServiceFormData,
} from './types'

interface Props {
  form: ServiceFormData
  setForm: (value: ServiceFormData) => void
}

/**
 * Tab "Principal" do modal de edição de serviço — controla título, descrição,
 * ícone, cor do shard, tile class, slug, features e pill da home.
 */
export default function TabMain({ form, setForm }: Props) {
  function updateFeature(idx: number, field: 'title' | 'description', value: string) {
    const features = [...form.features]
    features[idx] = { ...features[idx], [field]: value }
    setForm({ ...form, features })
  }

  return (
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
  )
}
