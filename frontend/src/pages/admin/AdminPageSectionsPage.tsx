import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUp, ArrowDown, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { pageSectionsApi, type PageSection } from '@/lib/api'

/**
 * Administração das sections de uma página específica.
 * - Reordenar (setas ↑/↓ — sem dnd-kit para manter a dependência mínima)
 * - Toggle de isVisible
 * Salvamento otimista com rollback em erro.
 */

const PAGE_LABELS: Record<string, { label: string; publicPath: string }> = {
  home: { label: 'Home', publicPath: '/' },
  services: { label: 'Serviços', publicPath: '/servicos' },
  solutions: { label: 'Soluções', publicPath: '/solucoes' },
  about: { label: 'Sobre', publicPath: '/sobre' },
  blog: { label: 'Blog', publicPath: '/blog' },
  careers: { label: 'Carreiras', publicPath: '/carreiras' },
  contact: { label: 'Contato', publicPath: '/contato' },
  ai: { label: 'Inteligência Artificial', publicPath: '/inteligencia-artificial' },
}

export default function AdminPageSectionsPage() {
  const { page = '' } = useParams<{ page: string }>()
  const meta = PAGE_LABELS[page]

  const [sections, setSections] = useState<PageSection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    if (!meta) {
      setError('Página inválida.')
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        setLoading(true)
        setError('')
        const data = await pageSectionsApi.getSectionsAdmin(page)
        setSections(
          [...data.sections].sort((a, b) => a.order - b.order)
        )
      } catch {
        setError('Erro ao carregar sections. A tabela está populada? Rode o seed.')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, meta])

  async function handleToggle(section: PageSection) {
    const prev = sections
    const next = sections.map((s) =>
      s.id === section.id ? { ...s, isVisible: !s.isVisible } : s
    )
    setSections(next)
    setSavingId(section.id)
    try {
      await pageSectionsApi.updateSection(page, section.id, {
        isVisible: !section.isVisible,
      })
    } catch {
      setSections(prev) // rollback
      setError('Erro ao salvar. Tente novamente.')
      setTimeout(() => setError(''), 4000)
    } finally {
      setSavingId(null)
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const prev = sections
    const next = [...sections]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    // reindexar order local
    const reordered = next.map((s, i) => ({ ...s, order: i }))
    setSections(reordered)
    try {
      await pageSectionsApi.reorder(
        page,
        reordered.map((s) => s.id)
      )
    } catch {
      setSections(prev) // rollback
      setError('Erro ao reordenar. Tente novamente.')
      setTimeout(() => setError(''), 4000)
    }
  }

  if (!meta) {
    return (
      <div className="text-zinc-400">
        Página inválida.{' '}
        <Link to="/admin/pages" className="text-zinc-200 underline">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            to="/admin/pages"
            className="text-xs text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3 h-3" /> Voltar para páginas
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Seções — {meta.label}
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Arraste com as setas para reordenar. Alterne o olho para esconder do site público.
          </p>
        </div>
        <a
          href={meta.publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-300 hover:text-white inline-flex items-center gap-1 border border-zinc-800 rounded-md px-3 py-1.5"
        >
          Ver página pública <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {error && (
        <div className="rounded-md border border-red-900/40 bg-red-950/20 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500 text-sm">Carregando…</div>
      ) : sections.length === 0 ? (
        <div className="rounded-md border border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-400">
          Nenhuma section encontrada. Rode <code className="text-zinc-200">npx prisma db seed</code>{' '}
          para popular a tabela <code className="text-zinc-200">page_sections</code>.
        </div>
      ) : (
        <ul className="space-y-2">
          {sections.map((section, idx) => (
            <li
              key={section.id}
              className="rounded-md border border-zinc-800 bg-zinc-900/40 px-4 py-3 flex items-center gap-3"
            >
              <div className="font-mono text-xs text-zinc-500 w-8 text-right">
                {String(idx + 1).padStart(2, '0')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-zinc-100 font-medium truncate">
                  {section.label}
                </div>
                <div className="text-xs text-zinc-500 font-mono">
                  {section.sectionKey}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                  className="w-8 h-8 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  title="Subir"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === sections.length - 1}
                  className="w-8 h-8 rounded-md border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  title="Descer"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleToggle(section)}
                  disabled={savingId === section.id}
                  className={
                    section.isVisible
                      ? 'w-8 h-8 rounded-md border border-emerald-800/60 bg-emerald-900/20 text-emerald-300 hover:bg-emerald-900/40 inline-flex items-center justify-center ml-2 disabled:opacity-50'
                      : 'w-8 h-8 rounded-md border border-zinc-700 bg-zinc-800/60 text-zinc-500 hover:bg-zinc-800 inline-flex items-center justify-center ml-2 disabled:opacity-50'
                  }
                  title={section.isVisible ? 'Visível — clique para ocultar' : 'Oculta — clique para exibir'}
                >
                  {section.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
