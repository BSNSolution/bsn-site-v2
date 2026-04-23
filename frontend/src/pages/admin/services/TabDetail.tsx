import type { ServiceFormData } from './types'

interface Props {
  form: ServiceFormData
  setForm: (value: ServiceFormData) => void
}

/**
 * Tab "Página de detalhe" — edita o hero e o bloco CTA exibidos em
 * `/servicos/:slug`.
 */
export default function TabDetail({ form, setForm }: Props) {
  return (
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
  )
}
