import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save, UserPlus, Shield } from 'lucide-react'
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
  permissions?: Permission[]
}

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
  permissions?: Permission[]
  groups?: { id: string; name: string }[]
}

interface FormData {
  id?: string
  email: string
  password: string
  name: string
  role: string
  isActive: boolean
  permissionIds: Set<string>
  groupIds: Set<string>
}

const ROLES = ['ADMIN', 'DEVELOPER', 'EDITOR', 'GUEST']
const EMPTY: FormData = {
  email: '',
  password: '',
  name: '',
  role: 'EDITOR',
  isActive: true,
  permissionIds: new Set(),
  groupIds: new Set(),
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [u, p, g] = await Promise.all([
        usersAdminApi.listUsers(),
        usersAdminApi.listPermissions(),
        usersAdminApi.listGroups(),
      ])
      setUsers(Array.isArray(u?.users) ? u.users : [])
      setPermissions(Array.isArray(p?.permissions) ? p.permissions : [])
      setGroups(Array.isArray(g?.groups) ? g.groups : [])
    } catch (err) {
      console.error(err)
    } finally { setLoading(false) }
  }

  function openCreate() {
    setForm({ ...EMPTY, permissionIds: new Set(), groupIds: new Set() })
    setShowForm(true)
  }

  async function openEdit(u: User) {
    const full = await usersAdminApi.getUser(u.id)
    setForm({
      id: full.id,
      email: full.email,
      password: '',
      name: full.name,
      role: full.role,
      isActive: full.isActive,
      permissionIds: new Set((full.permissions ?? []).map((p: Permission) => p.id)),
      groupIds: new Set((full.groups ?? []).map((g: Group) => g.id)),
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload: any = {
      email: form.email,
      name: form.name,
      role: form.role,
      isActive: form.isActive,
      permissionIds: Array.from(form.permissionIds),
      groupIds: Array.from(form.groupIds),
    }
    if (form.password) payload.password = form.password

    try {
      if (form.id) {
        await usersAdminApi.updateUser(form.id, payload)
      } else {
        if (!form.password) {
          alert('Senha é obrigatória ao criar novo usuário')
          return
        }
        await usersAdminApi.createUser(payload)
      }
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Excluir este usuário?')) return
    try {
      await usersAdminApi.deleteUser(id)
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

  function toggleGroup(id: string) {
    setForm((f) => {
      const next = new Set(f.groupIds)
      if (next.has(id)) next.delete(id); else next.add(id)
      return { ...f, groupIds: next }
    })
  }

  // Agrupar permissões por categoria
  const permsByCategory = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie quem tem acesso ao painel admin.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <UserPlus className="h-4 w-4" /> Novo usuário
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">Nenhum usuário.</div>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <div key={u.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-medium">{u.name}</h3>
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-primary/15 text-primary">{u.role}</span>
                  {!u.isActive && <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white/60 font-mono uppercase">Inativo</span>}
                </div>
                <div className="flex gap-1 flex-wrap mt-2 text-[11px]">
                  {(u.groups ?? []).map((g) => (
                    <span key={g.id} className="px-2 py-0.5 rounded border border-white/10 bg-white/5">
                      {g.name}
                    </span>
                  ))}
                  {(u.permissions ?? []).length > 0 && (
                    <span className="text-muted-foreground font-mono">
                      + {(u.permissions ?? []).length} permissão{(u.permissions ?? []).length > 1 ? 'ões' : ''} avulsa
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(u)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(u.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-3xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{form.id ? 'Editar usuário' : 'Novo usuário'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Nome</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">E-mail</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Senha {form.id && <span className="opacity-60">(deixe em branco para manter)</span>}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" autoComplete="new-password" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Role base</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded">
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                Ativo
              </label>

              {/* Grupos */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Grupos de permissões</h3>
                </div>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                  {groups.map((g) => (
                    <label key={g.id} className="flex items-start gap-2 p-3 rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:bg-white/10">
                      <input type="checkbox" checked={form.groupIds.has(g.id)} onChange={() => toggleGroup(g.id)} className="mt-1" />
                      <div className="flex-1">
                        <div className="font-medium text-sm">{g.name}</div>
                        {g.description && <div className="text-xs text-muted-foreground">{g.description}</div>}
                        {g.permissions && (
                          <div className="text-[10px] text-muted-foreground font-mono mt-1">
                            {g.permissions.length} permissões
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Permissões avulsas */}
              <div>
                <h3 className="text-sm font-medium mb-2">Permissões avulsas</h3>
                <p className="text-xs text-muted-foreground mb-2">Adicionadas em cima dos grupos selecionados.</p>
                <div className="space-y-3 max-h-80 overflow-y-auto p-3 rounded-lg border border-white/10 bg-black/20">
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
