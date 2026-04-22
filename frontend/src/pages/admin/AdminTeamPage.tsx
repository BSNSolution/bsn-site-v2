import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { teamApi } from '@/lib/api'

interface TeamMember {
  id: string
  name: string
  role: string
  bio?: string | null
  imageUrl?: string | null
  linkedinUrl?: string | null
  avatarVariant?: string | null
  isActive: boolean
  order: number
}

interface FormData {
  name: string
  role: string
  bio: string
  imageUrl: string
  linkedinUrl: string
  avatarVariant: string
  isActive: boolean
  order?: number
}

const AVATAR_VARIANTS = [
  { value: 'default', label: 'Violet → Magenta (padrão)' },
  { value: 'b', label: 'Cyan → Emerald' },
  { value: 'c', label: 'Amber → Magenta' },
]

const EMPTY_FORM: FormData = {
  name: '',
  role: '',
  bio: '',
  imageUrl: '',
  linkedinUrl: '',
  avatarVariant: 'default',
  isActive: true,
}

export default function AdminTeamPage() {
  const [items, setItems] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await teamApi.admin.getTeam()
      setItems(res.team ?? res.members ?? [])
    } finally { setLoading(false) }
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true)
  }

  function openEdit(m: TeamMember) {
    setEditing(m)
    setForm({
      name: m.name,
      role: m.role,
      bio: m.bio ?? '',
      imageUrl: m.imageUrl ?? '',
      linkedinUrl: m.linkedinUrl ?? '',
      avatarVariant: m.avatarVariant ?? 'default',
      isActive: m.isActive,
      order: m.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      imageUrl: form.imageUrl || null,
      linkedinUrl: form.linkedinUrl || null,
      bio: form.bio || null,
    }
    try {
      if (editing) await teamApi.admin.updateMember(editing.id, payload)
      else await teamApi.admin.createMember(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este membro?')) return
    await teamApi.admin.deleteMember(id); load()
  }

  async function toggle(id: string) {
    await teamApi.admin.toggleMember(id); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Equipe</h1>
          <p className="text-sm text-muted-foreground">Membros exibidos na página /sobre.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo membro
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {items.map((m) => (
            <div key={m.id} className="glass p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div
                  className="w-12 h-12 rounded-full shrink-0"
                  style={
                    m.imageUrl
                      ? { background: `url(${m.imageUrl}) center/cover` }
                      : {
                          background:
                            m.avatarVariant === 'b'
                              ? 'linear-gradient(135deg, var(--cyan), var(--emerald))'
                              : m.avatarVariant === 'c'
                              ? 'linear-gradient(135deg, var(--amber), var(--magenta))'
                              : 'linear-gradient(135deg, var(--violet), var(--magenta))',
                        }
                  }
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{m.name}</h3>
                    {!m.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
                  </div>
                  <div className="text-sm text-muted-foreground">{m.role}</div>
                  {m.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{m.bio}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(m.id)} className="p-2 hover:bg-white/10 rounded">
                  {m.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(m)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(m.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhum membro.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-md w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar membro' : 'Novo membro'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cargo</label>
                <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL da foto (opcional)</label>
                <input type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Variante do avatar (se sem foto)</label>
                <select value={form.avatarVariant} onChange={(e) => setForm({ ...form, avatarVariant: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                  {AVATAR_VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">LinkedIn</label>
                <input type="url" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
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
                <button type="submit" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded"><Save className="h-4 w-4" /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
