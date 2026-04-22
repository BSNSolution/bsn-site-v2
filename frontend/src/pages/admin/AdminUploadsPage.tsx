import { useState, useEffect, useRef } from 'react'
import { Upload, Trash2, Copy, Image as ImageIcon, FileText } from 'lucide-react'
import { uploadApi } from '@/lib/api'

interface UploadedFile {
  id: string
  filename: string
  originalName?: string | null
  mimeType: string
  size: number
  url: string
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}

export default function AdminUploadsPage() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [page, setPage] = useState(1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [page])

  async function load() {
    try {
      setLoading(true)
      const data = await uploadApi.admin.getUploads({ page, limit: 24 })
      setFiles(Array.isArray(data?.files) ? data.files : [])
      setPagination(data?.pagination ?? null)
    } catch (err) {
      console.error(err)
      setFiles([])
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadApi.uploadFile(file)
      await load()
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover este arquivo?')) return
    await uploadApi.admin.deleteUpload(id)
    load()
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      alert('URL copiada!')
    } catch {
      prompt('URL do arquivo:', url)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Uploads</h1>
          <p className="text-sm text-muted-foreground">Gerencie as imagens e arquivos do site.</p>
        </div>
        <label className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition ${uploading ? 'bg-white/10 text-white/50' : 'bg-primary text-primary-foreground hover:opacity-90'}`}>
          <Upload className="h-4 w-4" /> {uploading ? 'Enviando...' : 'Enviar arquivo'}
          <input ref={inputRef} type="file" onChange={handleUpload} disabled={uploading} className="hidden" accept="image/*,.pdf" />
        </label>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground">Carregando...</div>
      ) : files.length === 0 ? (
        <div className="glass p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-white/30 mb-3" />
          <p className="text-muted-foreground">Nenhum arquivo enviado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((f) => {
            const isImage = f.mimeType?.startsWith('image/')
            return (
              <div key={f.id} className="glass p-3 flex flex-col gap-2">
                <div className="aspect-square rounded-lg overflow-hidden bg-black/40 flex items-center justify-center">
                  {isImage ? (
                    <img src={f.url} alt={f.filename} loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="h-10 w-10 text-white/40" />
                  )}
                </div>
                <div className="text-xs truncate" title={f.originalName || f.filename}>
                  {f.originalName || f.filename}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {formatBytes(f.size)}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => copyUrl(f.url)} className="flex-1 p-1.5 text-xs hover:bg-white/10 rounded flex items-center justify-center gap-1" title="Copiar URL">
                    <Copy className="h-3 w-3" /> URL
                  </button>
                  <button onClick={() => remove(f.id)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded" title="Remover">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 text-sm"
          >
            Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 text-sm"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  )
}
