import { useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { Area } from 'react-easy-crop'
import { X, Check, RotateCcw, RotateCw, FlipHorizontal2, Loader2 } from 'lucide-react'

interface Props {
  /** URL ou Object URL da imagem original */
  src: string
  /** Razão de aspecto (ex: 1 para quadrado, 16/9 para wide). null = livre */
  aspect?: number | null
  /** Forma do crop — 'round' desenha a guia circular (mas exporta sempre PNG) */
  shape?: 'rect' | 'round'
  /** Título do modal */
  title?: string
  /** Quando o usuário clica em "Salvar alterações" — recebe o Blob recortado */
  onSave: (blob: Blob) => Promise<void> | void
  /** Fecha sem salvar */
  onClose: () => void
}

export default function ImageCropModal({
  src,
  aspect = null,
  shape = 'rect',
  title = 'Editar imagem',
  onSave,
  onClose,
}: Props) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_a: Area, areaPx: Area) => {
    setCroppedAreaPixels(areaPx)
  }, [])

  // Esc fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  async function handleSave() {
    if (!croppedAreaPixels) return
    try {
      setSaving(true)
      const blob = await getCroppedImageBlob(src, croppedAreaPixels, rotation)
      await onSave(blob)
    } catch (err) {
      console.error('Erro ao recortar imagem', err)
      // Devolve controle pra UI mostrar erro via parent (toast)
    } finally {
      setSaving(false)
    }
  }

  // Lock body scroll enquanto modal aberto
  useEffect(() => {
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [])

  const modal = (
    <div
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose()
      }}
    >
      <div className="bg-[#0c0c10] border border-white/15 rounded-xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 hover:bg-white/10 rounded-lg disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: cropper + controles */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] min-h-0">
          {/* Cropper */}
          <div className="relative bg-[#0a0a0e] min-h-[400px]">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect ?? undefined}
              cropShape={shape === 'round' ? 'round' : 'rect'}
              showGrid={shape !== 'round'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              objectFit={aspect ? 'contain' : 'horizontal-cover'}
              style={{
                containerStyle: { background: '#0a0a0e' },
              }}
            />
          </div>

          {/* Painel de controles */}
          <div className="border-t lg:border-t-0 lg:border-l border-white/10 p-5 space-y-5 overflow-y-auto">
            {/* Ações de rotação/flip */}
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Rotação
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  title="Girar à esquerda"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  title="Girar à direita"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation(0)}
                  className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors"
                  title="Zerar rotação"
                >
                  <FlipHorizontal2 className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">{rotation}°</p>
            </div>

            {/* Zoom */}
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Zoom
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-violet-400"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                {zoom.toFixed(2)}×
              </p>
            </div>

            {/* Ajuste fino de rotação */}
            <div>
              <label className="block text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Ajuste fino
              </label>
              <input
                type="range"
                min={-45}
                max={45}
                step={1}
                value={rotation % 90}
                onChange={(e) =>
                  setRotation(Math.floor(rotation / 90) * 90 + Number(e.target.value))
                }
                className="w-full accent-violet-400"
              />
            </div>

            <div className="text-[11px] text-muted-foreground border-t border-white/5 pt-4">
              <strong className="text-white/70 block mb-1">Dicas</strong>
              Arraste a imagem para reposicionar.
              {aspect ? (
                <> O recorte mantém a proporção <span className="font-mono">{formatAspect(aspect)}</span>.</>
              ) : (
                <> O recorte é livre — você pode mudar zoom para enquadrar.</>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !croppedAreaPixels}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Salvando…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Salvar alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  // Renderiza via portal direto no body — escapa de qualquer modal pai
  // (transform, overflow, z-index) que esteja confinando o crop modal.
  return createPortal(modal, document.body)
}

function formatAspect(a: number) {
  if (Math.abs(a - 1) < 0.001) return '1:1'
  if (Math.abs(a - 16 / 9) < 0.001) return '16:9'
  if (Math.abs(a - 4 / 3) < 0.001) return '4:3'
  if (Math.abs(a - 3 / 2) < 0.001) return '3:2'
  return a.toFixed(2)
}

/**
 * Carrega a imagem (suporta cross-origin) e devolve um <img> pronto pra desenhar.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', (err) => reject(err))
    img.src = src
  })
}

/**
 * Pega a área de crop em pixels (do react-easy-crop) + rotação,
 * desenha num canvas e retorna o Blob PNG.
 */
async function getCroppedImageBlob(
  src: string,
  pixelArea: Area,
  rotation: number,
): Promise<Blob> {
  const img = await loadImage(src)
  const rotRad = (rotation * Math.PI) / 180

  // Bounding box após rotação (para acomodar imagem rotacionada)
  const { width: bBoxWidth, height: bBoxHeight } = rotatedSize(img.width, img.height, rotation)

  // Canvas auxiliar com a imagem rotacionada
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Centro e rotaciona
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-img.width / 2, -img.height / 2)
  ctx.drawImage(img, 0, 0)

  // Recorta a área desejada
  const data = ctx.getImageData(pixelArea.x, pixelArea.y, pixelArea.width, pixelArea.height)
  canvas.width = pixelArea.width
  canvas.height = pixelArea.height
  ctx.putImageData(data, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Falha ao gerar blob'))
      resolve(blob)
    }, 'image/png')
  })
}

function rotatedSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}
