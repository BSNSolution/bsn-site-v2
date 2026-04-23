import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import { IconPicker } from '@/components/ui/icon-picker'
import { BLOCK_COLOR_OPTIONS, type Service, type ServiceDetailBlock } from './types'

interface Props {
  editing: Service | null
  blocks: ServiceDetailBlock[]
  setBlocks: Dispatch<SetStateAction<ServiceDetailBlock[]>>
  blocksLoading: boolean
  onAddBlock: () => Promise<void> | void
  onUpdateBlock: (blockId: string, patch: Partial<ServiceDetailBlock>) => Promise<void> | void
  onRemoveBlock: (blockId: string) => Promise<void> | void
  onToggleBlock: (blockId: string) => Promise<void> | void
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => Promise<void> | void
}

/**
 * Tab "Blocos de detalhe" — CRUD da lista de `ServiceDetailBlock`, com
 * drag por setas, toggle de visibilidade e edição inline com save no blur.
 *
 * Só está habilitada quando o serviço já foi criado (precisa de `editing.id`).
 */
export default function TabBlocks({
  editing,
  blocks,
  setBlocks,
  blocksLoading,
  onAddBlock,
  onUpdateBlock,
  onRemoveBlock,
  onToggleBlock,
  onMoveBlock,
}: Props) {
  if (!editing) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Salve o serviço primeiro para gerenciar os blocos.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {blocks.length} bloco(s) · normalmente 3 blocos por página de detalhe
        </div>
        <button
          type="button"
          onClick={() => onAddBlock()}
          className="inline-flex items-center gap-1 text-sm bg-primary text-primary-foreground px-3 py-1.5 rounded"
        >
          <Plus className="h-4 w-4" /> Adicionar bloco
        </button>
      </div>

      {blocksLoading && (
        <div className="p-6 text-center text-muted-foreground text-sm">Carregando blocos...</div>
      )}

      {!blocksLoading && blocks.length === 0 && (
        <div className="p-6 text-center text-muted-foreground text-sm border border-dashed border-white/10 rounded">
          Nenhum bloco ainda. Clique em "Adicionar bloco".
        </div>
      )}

      {[...blocks].sort((a, b) => a.order - b.order).map((block, idx, arr) => (
        <div key={block.id} className="border border-white/10 rounded p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
              {!block.isActive && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-muted-foreground">Inativo</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => onMoveBlock(block.id, 'up')}
                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={idx === arr.length - 1}
                onClick={() => onMoveBlock(block.id, 'down')}
                className="p-1.5 hover:bg-white/10 rounded disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => onToggleBlock(block.id)}
                className="p-1.5 hover:bg-white/10 rounded"
              >
                {block.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => onRemoveBlock(block.id)}
                className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Título</label>
            <input
              type="text"
              value={block.title}
              onChange={(e) => setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, title: e.target.value } : b)))}
              onBlur={(e) => onUpdateBlock(block.id, { title: e.target.value })}
              className="w-full mt-0.5 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase">Descrição</label>
            <textarea
              value={block.description}
              rows={3}
              onChange={(e) => setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, description: e.target.value } : b)))}
              onBlur={(e) => onUpdateBlock(block.id, { description: e.target.value })}
              className="w-full mt-0.5 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Ícone</label>
              <IconPicker
                value={block.iconName ?? 'sparkles'}
                onChange={(name) => {
                  setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, iconName: name } : b)))
                  onUpdateBlock(block.id, { iconName: name })
                }}
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Cor do shard</label>
              <select
                value={block.colorClass ?? 'a'}
                onChange={(e) => {
                  const val = e.target.value
                  setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, colorClass: val } : b)))
                  onUpdateBlock(block.id, { colorClass: val })
                }}
                className="w-full mt-0.5 px-2 py-1.5 bg-black/40 border border-white/10 rounded text-sm"
              >
                {BLOCK_COLOR_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
