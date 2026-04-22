import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, X, Save, Shield, Lock } from 'lucide-react'
import { usersAdminApi } from '@/lib/api'

interface Permission {
  id: string
  slug: string
  label: string
  category: string
}

interface Group {
  id: string
  name: string
  description?: string | null
  isSystem?: boolean
  permissions: Permission[]
  _count?: { users: number }
}

interface FormData {
  id?: string
  name: string
  description: string
  permissionIds: Set<string>
  isSystem?: boolean
}

const EMPTY: FormData = { name: '', description: '', permissionIds: new Set() }

export default function AdminPermissionGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [g, p] = await Promise.all([usersAdminApi.listGroups(), usersAdminApi.listPermissions()])
      setGroups(Array.isArray(g?.groups) ? g.groups : [])
      setPermissions(Array.isArray(p?.permissions) ? p.permissions : [])
    } finally { setLoading(false) }
  }

  function openCreate() {
    setForm({ ...EMPTY, permissionIds: new Set() })
    setShowForm(true)
  }

  function openEdit(g: Group) {
    setForm({
      id: g.id,
      name: g.name,
      description: g.description ?? '',
      permissionIds: new Set(g.permissions.map((p) => p.id)),
      isSystem: g.isSystem,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      description: form.description || null,
      permissionIds: Array.from(form.permissionIds),
    }
    try {
      if (form.id) await usersAdminApi.updateGroup(form.id, payload)
      else await usersAdminApi.createGroup(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(g: Group) {
    if (g.isSystem) {
      alert('Grupos do sistema não podem ser excluídos.')
      return
    }
    if (!confirm(`Excluir o grupo "${g.name}"?`)) return
    try {
      await usersAdminApi.deleteGroup(g.id)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao excluir')
    }
  }

  function togglePermission(id: string) {
    setForm((f) => {
      const next = new Set(f.permissionIds)
      if (next.has(id)) next.delete(id); else next.add(id)
      return { ...f, permissionIds: next }
    })
  }

  const permsByCategory = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Grupos de permissões</h1>
          <p className="text-sm text-muted-foreground">Crie templates reutilizáveis de permissões e atribua a usuários.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo grupo
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : groups.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">Nenhum grupo.</div>
      ) : (
        <div className="grid gap-3">
          {groups.map((g) => (
            <div key={g.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">{g.name}</h3>
                  {g.isSystem && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono uppercase">
                      <Lock className="h-3 w-3" /> Sistema
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{g.permissions.length} permissões · {g._count?.users ?? 0} usuários</span>
                </div>
                {g.description && <p className="text-sm text-muted-foreground">{g.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(g)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(g)} disabled={g.isSystem} className="p-2 hover:bg-destructive/10 text-destructive rounded disabled:opacity-30 disabled:cursor-not-allowed">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{form.id ? 'Editar grupo' : 'Novo grupo'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Nome</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Permissões incluídas</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto p-3 rounded-lg border border-white/10 bg-black/20">
                  {Object.entries(permsByCategory).map(([category, perms]) => (
                    <div key={category}>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{category}</div>
                      <div className="grid gap-1 grid-cols-1 md:grid-cols-2">
                        {perms.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 px-2 py-1 rounded">
                            <input type="checkbox" checked={form.permissionIds.has(p.id)} onChange={() => togglePermission(p.id)} />
                            <span>{p.label}</span>
                            <span className="text-muted-foreground font-mono text-[10px] ml-auto">{p.slug}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
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
