import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save, ExternalLink } from 'lucide-react'
import { clientsApi } from '@/lib/api'

interface Client {
  id: string
  name: string
  logoUrl: string
  websiteUrl?: string | null
  isActive: boolean
  order: number
}

interface FormData {
  name: string
  logoUrl: string
  websiteUrl: string
  isActive: boolean
  order?: number
}

const EMPTY: FormData = { name: '', logoUrl: '', websiteUrl: '', isActive: true }

export default function AdminClientsPage() {
  const [items, setItems] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await clientsApi.admin.getClients()
      setItems(Array.isArray(res?.clients) ? res.clients : [])
    } catch { setItems([]) } finally { setLoading(false) }
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }

  function openEdit(c: Client) {
    setEditing(c)
    setForm({
      name: c.name,
      logoUrl: c.logoUrl,
      websiteUrl: c.websiteUrl ?? '',
      isActive: c.isActive,
      order: c.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = { ...form, websiteUrl: form.websiteUrl || null }
    try {
      if (editing) await clientsApi.admin.updateClient(editing.id, payload)
      else await clientsApi.admin.createClient(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este cliente?')) return
    await clientsApi.admin.deleteClient(id); load()
  }
  async function toggle(id: string) { await clientsApi.admin.toggleClient(id); load() }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">Logos de clientes exibidos no site.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo cliente
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">Nenhum cliente cadastrado.</div>
      ) : (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="glass p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {c.logoUrl && <img src={c.logoUrl} alt={c.name} className="h-10 w-10 object-contain" />}
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{c.name}</h3>
                    {!c.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
                  </div>
                  {c.websiteUrl && (
                    <a href={c.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-white inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> {c.websiteUrl}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(c.id)} className="p-2 hover:bg-white/10 rounded">
                  {c.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(c)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(c.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="glass max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar cliente' : 'Novo cliente'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">URL do logo</label>
                <input type="url" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Website (opcional)</label>
                <input type="url" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
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
