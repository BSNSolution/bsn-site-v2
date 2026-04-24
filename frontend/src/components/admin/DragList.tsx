import { useRef, useState } from 'react'
import { GripVertical } from 'lucide-react'

interface Props<T> {
  items: T[]
  getKey: (item: T) => string
  onReorder: (newOrder: T[]) => void
  children: (item: T, dragHandle: React.ReactNode) => React.ReactNode
  className?: string
}

/**
 * Lista reordenável via drag & drop HTML5 nativo. Clica e arrasta pela
 * alça (ícone GripVertical renderizado em `dragHandle` dentro do item)
 * ou pelo próprio item quando `drag-handle` não é usado.
 *
 * Uso:
 *   <DragList items={items} getKey={x => x.id} onReorder={save}>
 *     {(item, handle) => (
 *       <div>{handle}<b>{item.name}</b></div>
 *     )}
 *   </DragList>
 */
export default function DragList<T>({
  items,
  getKey,
  onReorder,
  children,
  className = '',
}: Props<T>) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const dragImage = useRef<HTMLDivElement | null>(null)

  function handleDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx)
    e.dataTransfer.effectAllowed = 'move'
    // Fantasma customizado (minimalista)
    if (!dragImage.current) {
      const el = document.createElement('div')
      el.style.width = '1px'
      el.style.height = '1px'
      el.style.background = 'transparent'
      document.body.appendChild(el)
      dragImage.current = el
    }
    e.dataTransfer.setDragImage(dragImage.current, 0, 0)
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIdx !== idx) setOverIdx(idx)
  }

  function handleDrop() {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      cleanup()
      return
    }
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(overIdx, 0, moved)
    onReorder(next)
    cleanup()
  }

  function cleanup() {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className={className}>
      {items.map((item, idx) => {
        const key = getKey(item)
        const isDragging = dragIdx === idx
        const isOver = overIdx === idx && dragIdx !== idx
        const handle = (
          <span
            className="drag-handle inline-flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnd={cleanup}
            title="Arraste para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </span>
        )
        return (
          <div
            key={key}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={handleDrop}
            style={{
              opacity: isDragging ? 0.4 : 1,
              transform: isOver ? 'translateY(2px)' : undefined,
              borderTop: isOver && dragIdx !== null && dragIdx > idx ? '2px solid #a78bfa' : undefined,
              borderBottom: isOver && dragIdx !== null && dragIdx < idx ? '2px solid #a78bfa' : undefined,
              transition: 'transform 0.12s, opacity 0.12s',
            }}
          >
            {children(item, handle)}
          </div>
        )
      })}
    </div>
  )
}
