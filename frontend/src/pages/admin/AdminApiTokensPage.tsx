import { useEffect, useState, FormEvent } from 'react'
import { Copy, KeyRound, Plus, Trash2, Ban, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { apiTokensApi, type ApiToken, type ApiTokenScope } from '@/lib/api'
import { toast } from 'sonner'

interface FormData {
  name: string
  scopes: string[]
  expiresAt: string
}

const EMPTY_FORM: FormData = { name: '', scopes: [], expiresAt: '' }

export default function AdminApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [scopes, setScopes] = useState<ApiTokenScope[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [creating, setCreating] = useState(false)
  // Token gerado (mostrado apenas uma vez, depois some)
  const [justCreated, setJustCreated] = useState<{ name: string; token: string } | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const [{ tokens }, { scopes }] = await Promise.all([
        apiTokensApi.list(),
        apiTokensApi.scopes(),
      ])
      setTokens(tokens)
      setScopes(scopes)
    } catch {
      toast.error('Erro ao carregar tokens')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function toggleScope(slug: string) {
    setForm((f) => ({
      ...f,
      scopes: f.scopes.includes(slug) ? f.scopes.filter((s) => s !== slug) : [...f.scopes, slug],
    }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Informe um nome')
      return
    }
    if (form.scopes.length === 0) {
      toast.error('Selecione pelo menos um scope')
      return
    }
    try {
      setCreating(true)
      const result = await apiTokensApi.create({
        name: form.name.trim(),
        scopes: form.scopes,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      })
      setJustCreated({ name: result.name, token: result.token })
      setShowForm(false)
      setForm(EMPTY_FORM)
      load()
    } catch {
      toast.error('Erro ao criar token')
    } finally {
      setCreating(false)
    }
  }

  async function onRevoke(id: string) {
    if (!confirm('Revogar este token? Ele deixa de funcionar imediatamente.')) return
    try {
      await apiTokensApi.revoke(id)
      toast.success('Token revogado')
      load()
    } catch {
      toast.error('Erro ao revogar')
    }
  }

  async function onRemove(id: string) {
    if (!confirm('Remover este token permanentemente?')) return
    try {
      await apiTokensApi.remove(id)
      toast.success('Token removido')
      load()
    } catch {
      toast.error('Erro ao remover')
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token)
    toast.success('Token copiado')
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <KeyRound className="w-6 h-6" /> Tokens de API
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Use tokens para permitir que integrações externas (AI, scripts) gerenciem conteúdo.
            Cada token tem scopes específicos e pode ser revogado a qualquer momento.
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary auto">
          <Plus className="w-4 h-4" /> Novo token
        </button>
      </header>

      {/* Token recém-criado — mostrado UMA vez */}
      {justCreated && (
        <div className="glass p-5 border border-amber-500/40 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold">Copie agora — o token não será exibido novamente</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Nome: <strong>{justCreated.name}</strong>
              </p>
            </div>
            <button
              onClick={() => setJustCreated(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-3 font-mono text-sm break-all">
            <code className="flex-1">{justCreated.token}</code>
            <button
              onClick={() => copyToken(justCreated.token)}
              className="btn btn-ghost auto flex-shrink-0"
            >
              <Copy className="w-4 h-4" /> Copiar
            </button>
          </div>
        </div>
      )}

      {/* Formulário inline */}
      {showForm && (
        <form onSubmit={onSubmit} className="glass p-5 rounded-xl space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome do token</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ex: Claude — blog writer"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm mb-2">Scopes (permissões)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {scopes.map((s) => (
                <label
                  key={s.slug}
                  className="flex items-center gap-2 p-2 rounded-lg border border-white/10 bg-black/20 cursor-pointer hover:bg-black/30"
                >
                  <input
                    type="checkbox"
                    checked={form.scopes.includes(s.slug)}
                    onChange={() => toggleScope(s.slug)}
                  />
                  <span className="text-sm">
                    <code className="text-xs text-violet-300">{s.slug}</code>
                    <br />
                    <span className="text-muted-foreground">{s.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm mb-1">Data de expiração (opcional)</label>
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className="btn btn-primary auto">
              {creating ? 'Criando…' : 'Gerar token'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost auto"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista */}
      <div className="space-y-3">
        {loading && <div className="text-muted-foreground">Carregando…</div>}
        {!loading && tokens.length === 0 && (
          <div className="glass p-5 rounded-xl text-center text-muted-foreground">
            Nenhum token criado ainda. Clique em "Novo token" para gerar o primeiro.
          </div>
        )}
        {tokens.map((t) => {
          const expired = t.expiresAt && new Date(t.expiresAt).getTime() < Date.now()
          return (
            <div key={t.id} className="glass p-4 rounded-xl">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{t.name}</h3>
                    {t.isActive && !expired ? (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Ativo
                      </span>
                    ) : (
                      <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Ban className="w-3 h-3" /> {expired ? 'Expirado' : 'Revogado'}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <code className="text-xs bg-black/40 px-2 py-1 rounded">
                      {t.tokenPrefix}•••••••••••
                    </code>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {t.scopes.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-violet-500/20 text-violet-200 px-2 py-0.5 rounded"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground flex gap-4 flex-wrap">
                    <span>
                      Criado em {new Date(t.createdAt).toLocaleString('pt-BR')}
                      {t.createdBy && <> por {t.createdBy.name}</>}
                    </span>
                    {t.lastUsedAt && (
                      <span>Último uso: {new Date(t.lastUsedAt).toLocaleString('pt-BR')}</span>
                    )}
                    {t.expiresAt && (
                      <span>Expira em {new Date(t.expiresAt).toLocaleString('pt-BR')}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {t.isActive && (
                    <button
                      onClick={() => onRevoke(t.id)}
                      className="btn btn-ghost auto"
                      title="Revogar"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(t.id)}
                    className="btn btn-ghost auto text-red-400"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Documentação */}
      <div className="glass p-5 rounded-xl space-y-3 text-sm">
        <h3 className="font-semibold">Como usar</h3>
        <p className="text-muted-foreground">
          Envie o header <code className="bg-black/40 px-1 rounded">Authorization: Bearer &lt;token&gt;</code>
          em qualquer requisição para <code className="bg-black/40 px-1 rounded">/api/v1/blog/*</code>.
        </p>
        <p className="text-muted-foreground">
          <strong>Endpoints disponíveis:</strong>
        </p>
        <ul className="text-xs font-mono space-y-1 text-muted-foreground list-disc pl-5">
          <li>GET /api/v1/blog — lista posts (scope blog:read). Query: status, tag, search, includeMetrics</li>
          <li>GET /api/v1/blog/:idOrSlug — busca post</li>
          <li>GET /api/v1/blog/:idOrSlug/metrics — métricas detalhadas (scope blog:metrics)</li>
          <li>POST /api/v1/blog — cria post (scope blog:write)</li>
          <li>PUT /api/v1/blog/:idOrSlug — atualiza (scope blog:write)</li>
          <li>DELETE /api/v1/blog/:idOrSlug — remove (scope blog:delete)</li>
          <li>POST /api/v1/blog/images (multipart) — upload de imagem (scope upload:write)</li>
        </ul>
      </div>
    </div>
  )
}
