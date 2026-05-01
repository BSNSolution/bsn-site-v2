import { useState, useEffect, FormEvent } from 'react'
import { Mail, MailOpen, Reply, Trash2, Archive, Clock, X } from 'lucide-react'
import { inboxApi } from '@/lib/api'

interface Message {
  id: string
  name: string
  email: string
  phone?: string | null
  subject?: string | null
  message: string
  status: string
  createdAt: string
  replies?: Reply[]
}

interface Reply {
  id: string
  content: string
  createdAt: string
  user?: { id: string; name: string } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR')
}

export default function AdminInboxPage() {
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Message | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => { load({ silent: false }) }, [])

  // silent=true mantém a lista visível durante refetch pós-ação (preserva scroll)
  async function load({ silent = true }: { silent?: boolean } = {}) {
    try {
      if (!silent) setLoading(true)
      const res = await inboxApi.admin.getMessages({ limit: 100 })
      setItems(Array.isArray(res?.messages) ? res.messages : [])
    } catch { setItems([]) } finally { if (!silent) setLoading(false) }
  }

  async function openMessage(m: Message) {
    try {
      const full = await inboxApi.admin.getMessage(m.id)
      setSelected(full)
      if (m.status === 'UNREAD') {
        await inboxApi.admin.updateMessageStatus(m.id, 'READ')
        load()
      }
    } catch {
      setSelected(m)
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover esta mensagem?')) return
    await inboxApi.admin.deleteMessage(id)
    setSelected(null); load()
  }

  async function archive(id: string) {
    await inboxApi.admin.updateMessageStatus(id, 'ARCHIVED')
    setSelected(null); load()
  }

  async function sendReply(e: FormEvent) {
    e.preventDefault()
    if (!selected || !replyText.trim()) return
    setSendingReply(true)
    try {
      await inboxApi.admin.replyToMessage(selected.id, replyText)
      setReplyText('')
      const full = await inboxApi.admin.getMessage(selected.id)
      setSelected(full)
      load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao enviar resposta')
    } finally { setSendingReply(false) }
  }

  const statusColor = (s: string) => ({
    UNREAD: 'bg-primary/30 text-primary',
    READ: 'bg-white/10',
    REPLIED: 'bg-emerald-500/20 text-emerald-300',
    ARCHIVED: 'bg-white/5 text-white/40',
  } as any)[s] || 'bg-white/10'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">Mensagens enviadas pelo formulário de contato.</p>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="glass p-12 text-center text-muted-foreground">Nenhuma mensagem.</div>
      ) : (
        <div className="grid gap-2">
          {items.map((m) => {
            const isUnread = m.status === 'UNREAD'
            return (
              <button
                key={m.id}
                onClick={() => openMessage(m)}
                className="glass p-4 text-left hover:bg-white/5 transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${isUnread ? 'bg-primary/20' : 'bg-white/5'}`}>
                    {isUnread ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-medium ${isUnread ? 'text-white' : 'text-white/70'}`}>{m.name}</span>
                      <span className="text-xs text-muted-foreground">· {m.email}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase ${statusColor(m.status)}`}>
                        {m.status}
                      </span>
                    </div>
                    {m.subject && <div className="text-sm">{m.subject}</div>}
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{m.message}</p>
                    <div className="text-[10px] text-muted-foreground font-mono mt-1 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {formatDate(m.createdAt)}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setSelected(null)}>
          <div className="glass max-w-2xl w-full p-6 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{selected.subject || 'Mensagem'}</h2>
              <button onClick={() => setSelected(null)} className="p-1 hover:bg-white/10 rounded"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-1 mb-4 text-sm">
              <div><span className="text-muted-foreground">De:</span> <strong>{selected.name}</strong> &lt;{selected.email}&gt;</div>
              {selected.phone && <div><span className="text-muted-foreground">Telefone:</span> {selected.phone}</div>}
              <div className="text-[11px] text-muted-foreground font-mono">{formatDate(selected.createdAt)}</div>
            </div>

            <div className="bg-black/30 border border-white/10 rounded-lg p-4 text-sm whitespace-pre-wrap mb-4">
              {selected.message}
            </div>

            {selected.replies && selected.replies.length > 0 && (
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-medium">Respostas</h3>
                {selected.replies.map((r) => (
                  <div key={r.id} className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm">
                    <div className="text-xs text-muted-foreground mb-1">
                      {r.user?.name ?? 'Admin'} · {formatDate(r.createdAt)}
                    </div>
                    <div className="whitespace-pre-wrap">{r.content}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={sendReply} className="space-y-2">
              <label className="text-xs text-muted-foreground">Responder por e-mail</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                placeholder="Escreva sua resposta..."
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded"
              />
              <div className="flex justify-between gap-2">
                <div className="flex gap-2">
                  <button type="button" onClick={() => archive(selected.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-sm">
                    <Archive className="h-4 w-4" /> Arquivar
                  </button>
                  <button type="button" onClick={() => remove(selected.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm">
                    <Trash2 className="h-4 w-4" /> Excluir
                  </button>
                </div>
                <button type="submit" disabled={sendingReply || !replyText.trim()} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50">
                  <Reply className="h-4 w-4" /> {sendingReply ? 'Enviando...' : 'Enviar resposta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
