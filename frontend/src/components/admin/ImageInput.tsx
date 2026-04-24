import { useRef, useState } from 'react'
import { Upload, Link as LinkIcon, X, Loader2 } from 'lucide-react'
import { uploadApi } from '@/lib/api'
import { toast } from 'sonner'

interface Props {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  placeholder?: string
  className?: string
  id?: string
  /** Altura do preview (default: 120) */
  previewHeight?: number
}

/**
 * Campo unificado de imagem: permite colar URL direta OU fazer upload
 * de arquivo (que vai pro R2 e retorna URL pública). Usado em:
 * - Soluções (cover), Blog (cover), Clientes (logo), Team (foto),
 *   Settings (logo/favicon), etc.
 */
export default function ImageInput({
  value,
  onChange,
  label,
  placeholder = 'https://... ou clique em "Upload"',
  className = '',
  id,
  previewHeight = 120,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(file: File) {
    try {
      setUploading(true)
      const res = await uploadApi.uploadFile(file)
      const url = res?.file?.url || res?.url
      if (!url) throw new Error('URL não retornada')
      onChange(url)
      toast.success('Upload concluído')
    } catch (err) {
      toast.error('Erro no upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-sm mb-1">{label}</label>}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id={id}
            type="url"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={placeholder}
            className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn btn-ghost auto"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" /> Upload
            </>
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="btn btn-ghost auto text-red-400"
            title="Remover"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/20 inline-block">
          <img
            src={value}
            alt="preview"
            loading="lazy"
            style={{ height: previewHeight, width: 'auto', maxWidth: '100%', display: 'block' }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}
