import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Sparkles, Star, StarOff, CheckCircle2, XCircle } from 'lucide-react'
import { aiConfigsApi, AiConfig } from '@/lib/api'
import { toast } from 'sonner'
import Select from '@/components/admin/Select'

const PROVIDER_MODELS: Record<string, { label: string; models: string[] }> = {
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo', 'o1-preview', 'o1-mini'],
  },
  anthropic: {
    label: 'Anthropic (Claude)',
    models: [
      'claude-opus-4-7',
      'claude-sonnet-4-6',
      'claude-haiku-4-5-20251001',
      'claude-3-5-sonnet-20241022',
      'claude-3-opus-20240229',
    ],
  },
  google: {
    label: 'Google (Gemini)',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  },
}

interface FormState {
  id?: string
  name: string
  provider: 'openai' | 'anthropic' | 'google'
  model: string
  apiKey: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  isActive: boolean
  isDefault: boolean
}

const EMPTY: FormState = {
  name: '',
  provider: 'anthropic',
  model: 'claude-opus-4-7',
  apiKey: '',
  systemPrompt: '',
  temperature: 0.7,
  maxTokens: 4000,
  isActive: true,
  isDefault: false,
}

export default function AdminAiConfigsPage() {
  const [items, setItems] = useState<AiConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)

  useEffect(() => {
    load({ silent: false })
  }, [])

  // silent=true mantém a lista visível durante refetch pós-ação (preserva scroll)
  async function load({ silent = true }: { silent?: boolean } = {}) {
    if (!silent) setLoading(true)
    try {
      const res = await aiConfigsApi.list()
      setItems(res.configs ?? [])
    } catch (err) {
      console.error(err)
      toast.error('Falha ao carregar configurações')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  function openNew() {
    setForm(EMPTY)
    setShowForm(true)
  }

  function openEdit(c: AiConfig) {
    setForm({
      id: c.id,
      name: c.name,
      provider: c.provider,
      model: c.model,
      apiKey: c.apiKey, // já vem mascarada
      systemPrompt: c.systemPrompt ?? '',
      temperature: c.temperature,
      maxTokens: c.maxTokens,
      isActive: c.isActive,
      isDefault: c.isDefault,
    })
    setShowForm(true)
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        name: form.name,
        provider: form.provider,
        model: form.model,
        systemPrompt: form.systemPrompt || null,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
        isActive: form.isActive,
        isDefault: form.isDefault,
      }
      // Só envia apiKey se foi alterada (não contém "...")
      if (form.apiKey && !form.apiKey.includes('...')) {
        payload.apiKey = form.apiKey
      }
      if (form.id) {
        await aiConfigsApi.update(form.id, payload)
        toast.success('Configuração atualizada')
      } else {
        if (!payload.apiKey) {
          toast.error('Informe a API Key')
          setSaving(false)
          return
        }
        await aiConfigsApi.create(payload)
        toast.success('Configuração criada')
      }
      setShowForm(false)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(c: AiConfig) {
    try {
      await aiConfigsApi.toggle(c.id)
      load()
    } catch {
      toast.error('Falha ao alternar')
    }
  }

  async function handleSetDefault(c: AiConfig) {
    try {
      await aiConfigsApi.setDefault(c.id)
      toast.success(`${c.name} é agora a configuração padrão`)
      load()
    } catch {
      toast.error('Falha ao definir padrão')
    }
  }

  async function handleDelete(c: AiConfig) {
    if (!confirm(`Remover "${c.name}"?`)) return
    try {
      await aiConfigsApi.remove(c.id)
      toast.success('Removido')
      load()
    } catch {
      toast.error('Falha ao remover')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Configurações de IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastre provedores de LLM (OpenAI, Anthropic, Google) para habilitar "Gerar com IA" nos posts.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nova configuração
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">
          Nenhuma configuração de IA cadastrada. Adicione uma para habilitar os botões de IA no editor.
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((c) => (
            <div key={c.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium">{c.name}</h3>
                  {c.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-mono uppercase">
                      Padrão
                    </span>
                  )}
                  {c.isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-mono uppercase">
                      <CheckCircle2 className="h-3 w-3" /> Ativa
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/50 font-mono uppercase">
                      <XCircle className="h-3 w-3" /> Inativa
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {PROVIDER_MODELS[c.provider]?.label ?? c.provider} · {c.model}
                </div>
                <div className="text-[11px] text-muted-foreground font-mono mt-1">
                  API Key: {c.apiKey} · temp: {c.temperature} · max_tokens: {c.maxTokens}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleSetDefault(c)}
                  disabled={c.isDefault}
                  title={c.isDefault ? 'Já é padrão' : 'Definir como padrão'}
                  className="p-2 hover:bg-white/10 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {c.isDefault ? (
                    <Star className="h-4 w-4 fill-current text-primary" />
                  ) : (
                    <StarOff className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleToggle(c)}
                  title={c.isActive ? 'Desativar' : 'Ativar'}
                  className="p-2 hover:bg-white/10 rounded"
                >
                  {c.isActive ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-white/40" />
                  )}
                </button>
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 hover:bg-white/10 rounded"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="p-2 hover:bg-destructive/10 text-destructive rounded"
                  title="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-6 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div
            className="glass p-6 w-full max-w-2xl my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">
              {form.id ? 'Editar configuração' : 'Nova configuração de IA'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">Nome identificador</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Claude Opus principal"
                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-white/25"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Provedor</label>
                  <Select
                    value={form.provider}
                    onChange={(v) => {
                      const prov = v as FormState['provider']
                      setForm({
                        ...form,
                        provider: prov,
                        model: PROVIDER_MODELS[prov].models[0],
                      })
                    }}
                    options={Object.entries(PROVIDER_MODELS).map(([k, v]) => ({
                      value: k,
                      label: v.label,
                      hint: k,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Modelo</label>
                  <Select
                    value={form.model}
                    onChange={(v) => setForm({ ...form, model: v })}
                    searchable
                    options={[
                      ...PROVIDER_MODELS[form.provider].models.map((m) => ({ value: m, label: m })),
                      { value: '__custom__', label: 'Outro (digitar)' },
                    ]}
                  />
                  {form.model === '__custom__' && (
                    <input
                      type="text"
                      placeholder="Nome do modelo customizado"
                      className="mt-2 w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none"
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">
                    API Key {form.id && <span className="text-xs text-muted-foreground">(deixe como está pra manter)</span>}
                  </label>
                  <input
                    type="password"
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    placeholder={form.id ? '••••••••' : 'sk-... ou sua key do provedor'}
                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none focus:border-white/25"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={form.temperature}
                    onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Max tokens</label>
                  <input
                    type="number"
                    min="100"
                    max="32000"
                    value={form.maxTokens}
                    onChange={(e) => setForm({ ...form, maxTokens: Number(e.target.value) })}
                    className="w-full h-10 bg-black/30 border border-white/10 rounded-lg px-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Prompt de sistema (opcional — adiciona ao prompt padrão da BSN)
                </label>
                <textarea
                  value={form.systemPrompt}
                  onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                  rows={4}
                  placeholder="Ex: sempre use exemplos do setor de varejo, evite jargão de consultoria..."
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-white/25 resize-y"
                />
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Ativa
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  />
                  Padrão (usado quando não especificar outro)
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
