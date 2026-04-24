import { useState, useEffect, FormEvent } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, X, Save } from 'lucide-react'
import { jobsApi } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import Select from '@/components/admin/Select'

interface Job {
  id: string
  title: string
  description: string
  requirements?: string | null
  benefits?: string | null
  location?: string | null
  type: string
  salary?: string | null
  isActive: boolean
  order?: number
}

interface FormData {
  title: string
  description: string
  requirements: string
  benefits: string
  location: string
  type: string
  salary: string
  isActive: boolean
  order?: number
}

const TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'CLT Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contrato PJ' },
  { value: 'INTERNSHIP', label: 'Estágio' },
  { value: 'FREELANCE', label: 'Freelance' },
]

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  requirements: '',
  benefits: '',
  location: 'REMOTO',
  type: 'FULL_TIME',
  salary: '',
  isActive: true,
}

export default function AdminJobsPage() {
  const [items, setItems] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Job | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await jobsApi.admin.getJobs()
      setItems(res.jobs ?? [])
    } finally { setLoading(false) }
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true)
  }

  function openEdit(j: Job) {
    setEditing(j)
    setForm({
      title: j.title,
      description: j.description,
      requirements: j.requirements ?? '',
      benefits: j.benefits ?? '',
      location: j.location ?? 'REMOTO',
      type: j.type,
      salary: j.salary ?? '',
      isActive: j.isActive,
      order: j.order,
    })
    setShowForm(true)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      requirements: form.requirements || null,
      benefits: form.benefits || null,
      location: form.location || null,
      salary: form.salary || null,
    }
    try {
      if (editing) await jobsApi.admin.updateJob(editing.id, payload)
      else await jobsApi.admin.createJob(payload)
      setShowForm(false); load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover esta vaga?')) return
    await jobsApi.admin.deleteJob(id); load()
  }

  async function toggle(id: string) {
    await jobsApi.admin.toggleJob(id); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vagas</h1>
          <p className="text-sm text-muted-foreground">Vagas listadas em /carreiras.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova vaga
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid gap-3">
          {items.map((j) => (
            <div key={j.id} className="glass p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{j.title}</h3>
                  {!j.isActive && <span className="text-xs px-2 py-0.5 rounded bg-white/10">Inativo</span>}
                </div>
                {j.requirements && <div className="text-xs font-mono text-muted-foreground">{j.requirements}</div>}
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{j.location}</span>
                  <span>· {j.type}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(j.id)} className="p-2 hover:bg-white/10 rounded">
                  {j.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(j)} className="p-2 hover:bg-white/10 rounded"><Edit className="h-4 w-4" /></button>
                <button onClick={() => remove(j.id)} className="p-2 hover:bg-destructive/10 text-destructive rounded"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="p-8 text-center text-muted-foreground">Nenhuma vaga.</div>}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
          <div className="glass max-w-xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? 'Editar vaga' : 'Nova vaga'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Título</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" required />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Stack / requisitos (ex: TypeScript · Node · React)</label>
                <input type="text" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Benefícios</label>
                <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={2} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Local</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="REMOTO" className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tipo</label>
                  <div className="mt-1">
                    <Select
                      value={form.type}
                      onChange={(v) => setForm({ ...form, type: v })}
                      options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label, hint: t.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Salário</label>
                  <input type="text" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Checkbox label="Ativo" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
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
