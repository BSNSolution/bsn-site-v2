import { useRef, useState } from 'react'
import { Upload, Link as LinkIcon, X, Loader2, Crop } from 'lucide-react'
import { uploadApi } from '@/lib/api'
import { toast } from 'sonner'
import ImageCropModal from './ImageCropModal'

interface Props {
  value?: string | null
  onChange: (url: string | null) => void
  label?: string
  placeholder?: string
  className?: string
  id?: string
  /** Altura do preview (default: 120) */
  previewHeight?: number
  /** Habilita o modal de crop antes do upload e botão "Recortar" no preview.
   *  Quando undefined/false, comportamento clássico (upload direto). */
  enableCrop?: boolean
  /** Razão de aspecto pro crop (1 = quadrado, 16/9 = wide). null/undefined = livre. */
  cropAspect?: number | null
  /** Forma da máscara (rect | round). Default rect. */
  cropShape?: 'rect' | 'round'
  /** Título do modal de crop (default: "Editar imagem") */
  cropTitle?: string
}

/**
 * Campo unificado de imagem: permite colar URL direta OU fazer upload
 * de arquivo (que vai pro R2 e retorna URL pública). Pode habilitar crop
 * interativo via prop `enableCrop`.
 */
export default function ImageInput({
  value,
  onChange,
  label,
  placeholder = 'https://... ou clique em "Upload"',
  className = '',
  id,
  previewHeight = 120,
  enableCrop = false,
  cropAspect = null,
  cropShape = 'rect',
  cropTitle = 'Editar imagem',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  // Object URL ou URL atual sendo recortada
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  // Quando o crop é de um arquivo recém-selecionado, guardamos o objectURL pra revogar
  const objectUrlRef = useRef<string | null>(null)

  async function handleUploadBlob(blob: Blob | File) {
    try {
      setUploading(true)
      // Converte Blob em File se necessário (uploadApi espera File)
      const file =
        blob instanceof File
          ? blob
          : new File([blob], 'cropped.png', { type: blob.type || 'image/png' })
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

  function startCropFromFile(file: File) {
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setCropSrc(url)
  }

  function startCropFromCurrent() {
    if (!value) return
    setCropSrc(value)
  }

  function closeCrop() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setCropSrc(null)
  }

  async function onCropSave(blob: Blob) {
    await handleUploadBlob(blob)
    closeCrop()
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm mb-1">
          {label}
        </label>
      )}
      <div className="flex items-stretch gap-2 h-10">
        <div className="relative flex-1 min-w-0">
          <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id={id}
            type="url"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={placeholder}
            className="w-full h-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 text-sm outline-none focus:border-white/25 transition-colors"
          />
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              if (enableCrop) startCropFromFile(file)
              else handleUploadBlob(file)
            }
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="h-full inline-flex items-center gap-1.5 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm whitespace-nowrap disabled:opacity-60 transition-colors"
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
        {value && enableCrop && (
          <button
            type="button"
            onClick={startCropFromCurrent}
            disabled={uploading}
            className="h-full inline-flex items-center justify-center w-10 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-violet-300 transition-colors disabled:opacity-50"
            title="Recortar imagem"
          >
            <Crop className="w-4 h-4" />
          </button>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="h-full inline-flex items-center justify-center w-10 rounded-lg border border-white/10 bg-white/5 hover:bg-red-500/10 text-red-400 transition-colors"
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
            style={{
              height: previewHeight,
              width: 'auto',
              maxWidth: '100%',
              display: 'block',
            }}
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {cropSrc && (
        <ImageCropModal
          src={cropSrc}
          aspect={cropAspect}
          shape={cropShape}
          title={cropTitle}
          onSave={onCropSave}
          onClose={closeCrop}
        />
      )}
    </div>
  )
}
