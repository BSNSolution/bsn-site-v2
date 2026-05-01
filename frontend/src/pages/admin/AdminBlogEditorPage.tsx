import { useState, useEffect, useMemo, useRef, FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImageInput from '@/components/admin/ImageInput'
import {
  Save,
  ArrowLeft,
  Eye,
  Code2,
  Star,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Quote,
  Minus,
  Sparkles,
  Loader2,
  Wand2,
  X,
  ExternalLink,
} from 'lucide-react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { blogApi, uploadApi, aiConfigsApi } from '@/lib/api'
import { useAiEnabled } from '@/hooks/use-ai-enabled'
import { toast } from 'sonner'

interface Post {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string
  isPublished: boolean
  isFeatured: boolean
  publishedAt?: string | null
}

const EMPTY: Post = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverImage: '',
  tags: '',
  isPublished: false,
  isFeatured: false,
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

marked.setOptions({
  gfm: true,
  breaks: true,
})

export default function AdminBlogEditorPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = Boolean(id)

  const [form, setForm] = useState<Post>(EMPTY)
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'edit' | 'preview' | 'split'>('split')
  const [uploadingInline, setUploadingInline] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const inlineInputRef = useRef<HTMLInputElement>(null)
  const scrollSyncLock = useRef<'editor' | 'preview' | null>(null)

  const { enabled: aiEnabled } = useAiEnabled()
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiMode, setAiMode] = useState<'improve' | 'generate' | 'expand' | 'shorten'>('improve')
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiProcessing, setAiProcessing] = useState(false)
  const [aiSelection, setAiSelection] = useState<{ start: number; end: number; text: string } | null>(null)

  useEffect(() => {
    if (!isEditing) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const post = await blogApi.admin.getPost(id!)
        setForm({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? '',
          content: post.content,
          coverImage: post.coverImage ?? '',
          tags: (post.tags ?? []).join(', '),
          isPublished: post.isPublished,
          isFeatured: post.isFeatured,
          publishedAt: post.publishedAt,
        })
      } catch (err) {
        alert('Post não encontrado')
        navigate('/admin/blog')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, isEditing, navigate])

  const previewHtml = useMemo(() => {
    try {
      const raw = marked.parse(form.content || '') as string
      return DOMPurify.sanitize(raw)
    } catch {
      return ''
    }
  }, [form.content])

  function setField<K extends keyof Post>(key: K, value: Post[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  // Abre painel de IA capturando a seleção atual (ou cursor) do textarea
  function openAiPanel() {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = form.content.slice(start, end)
    setAiSelection({ start, end, text: selected })
    // Se nada selecionado, default para "gerar" — com seleção, default "melhorar"
    setAiMode(selected ? 'improve' : 'generate')
    setAiInstruction('')
    setShowAiPanel(true)
  }

  async function runAi() {
    if (!aiSelection) return
    setAiProcessing(true)
    try {
      const textToSend = aiMode === 'generate' ? aiInstruction || 'Escreva um parágrafo sobre este tópico no contexto do post.' : aiSelection.text || aiInstruction
      const { result } = await aiConfigsApi.enhanceText(
        textToSend,
        aiMode,
        aiMode !== 'generate' ? aiInstruction || undefined : undefined
      )
      // Substitui a seleção pelo resultado — se não havia seleção, insere no cursor
      const { start, end } = aiSelection
      const before = form.content.slice(0, start)
      const after = form.content.slice(end)
      const newContent = before + result + after
      setField('content', newContent)
      toast.success('Texto atualizado com IA')
      setShowAiPanel(false)
      setAiInstruction('')
      // Reposiciona cursor após o texto inserido
      setTimeout(() => {
        const ta = textareaRef.current
        if (ta) {
          ta.focus()
          const pos = start + result.length
          ta.setSelectionRange(pos, pos)
        }
      }, 10)
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Falha ao processar com IA')
    } finally {
      setAiProcessing(false)
    }
  }

  // Sincroniza scroll entre textarea (editor) e preview pane no modo split.
  // Calcula proporção (0..1) da posição atual e espelha no outro pane.
  function handleEditorScroll(e: React.UIEvent<HTMLTextAreaElement>) {
    if (view !== 'split') return
    if (scrollSyncLock.current === 'preview') {
      scrollSyncLock.current = null
      return
    }
    const ta = e.currentTarget
    const preview = previewRef.current
    if (!preview) return
    const taMax = ta.scrollHeight - ta.clientHeight
    const prMax = preview.scrollHeight - preview.clientHeight
    if (taMax <= 0 || prMax <= 0) return
    scrollSyncLock.current = 'editor'
    preview.scrollTop = (ta.scrollTop / taMax) * prMax
  }

  function handlePreviewScroll(e: React.UIEvent<HTMLDivElement>) {
    if (view !== 'split') return
    if (scrollSyncLock.current === 'editor') {
      scrollSyncLock.current = null
      return
    }
    const preview = e.currentTarget
    const ta = textareaRef.current
    if (!ta) return
    const prMax = preview.scrollHeight - preview.clientHeight
    const taMax = ta.scrollHeight - ta.clientHeight
    if (taMax <= 0 || prMax <= 0) return
    scrollSyncLock.current = 'preview'
    ta.scrollTop = (preview.scrollTop / prMax) * taMax
  }

  function insertAtCursor(before: string, after = '', placeholder = '') {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = form.content.slice(start, end) || placeholder
    const newContent = form.content.slice(0, start) + before + selected + after + form.content.slice(end)
    setField('content', newContent)
    setTimeout(() => {
      ta.focus()
      const pos = start + before.length
      ta.setSelectionRange(pos, pos + selected.length)
    }, 0)
  }

  async function handleInlineUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingInline(true)
    try {
      const res = await uploadApi.uploadFile(file)
      const url = res.url || res.data?.url
      if (url) insertAtCursor(`![${file.name}](${url})`, '', '')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro no upload')
    } finally {
      setUploadingInline(false)
      if (inlineInputRef.current) inlineInputRef.current.value = ''
    }
  }

  async function handleSave(e: FormEvent, overrides: Partial<Post> = {}) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      ...overrides,
      slug: (overrides.slug ?? form.slug) || slugify(form.title),
      excerpt: form.excerpt || null,
      coverImage: form.coverImage || null,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }
    try {
      if (isEditing) {
        await blogApi.admin.updatePost(id!, payload)
      } else {
        const created = await blogApi.admin.createPost(payload)
        navigate(`/admin/blog/${created.id}/edit`, { replace: true })
      }
      alert('Salvo com sucesso!')
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish(e: FormEvent) {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Preencha título e conteúdo antes de publicar.')
      return
    }
    return handleSave(e, { isPublished: true })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-white" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/blog')} className="p-2 hover:bg-white/10 rounded">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{isEditing ? 'Editar post' : 'Novo post'}</h1>
            <p className="text-xs text-muted-foreground">
              Markdown + GFM. Use a barra de ferramentas acima do editor.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
            <button type="button" onClick={() => setView('edit')} className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${view === 'edit' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}>
              <Code2 className="h-3.5 w-3.5" /> Editor
            </button>
            <button type="button" onClick={() => setView('split')} className={`px-2 py-1 rounded text-xs ${view === 'split' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}>
              Lado a lado
            </button>
            <button type="button" onClick={() => setView('preview')} className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1 ${view === 'preview' ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white'}`}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => handleSave(e as any, { isPublished: false })}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm"
          >
            <Save className="h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar rascunho'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isEditing || !id || !form.slug) return
              const url = `/blog/${form.slug}?preview=1&id=${id}`
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            disabled={!isEditing || !form.slug}
            title={
              !isEditing
                ? 'Salve o rascunho antes de visualizar'
                : !form.slug
                ? 'Defina um slug antes de visualizar'
                : 'Abrir prévia em nova aba'
            }
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="h-4 w-4" /> Ver prévia no site
          </button>
          <button
            type="button"
            onClick={(e) => handlePublish(e as any)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm"
          >
            <Star className="h-4 w-4" /> {form.isPublished ? 'Atualizar publicado' : 'Publicar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Coluna principal */}
        <div className="space-y-3">
          <div className="glass p-4 space-y-3">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
              placeholder="Título do post..."
              className="w-full bg-transparent border-0 outline-none text-2xl font-medium placeholder:text-white/30"
              style={{ letterSpacing: '-0.02em' }}
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="slug-do-post"
                className="flex-1 bg-transparent border-b border-white/10 pb-1 outline-none font-mono text-xs focus:border-primary/50"
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="editor-toolbar flex flex-wrap gap-1 items-center">
            <ToolbarBtn onClick={() => insertAtCursor('## ', '', 'Título')} icon={<Heading2 className="h-4 w-4" />} title="H2" />
            <ToolbarBtn onClick={() => insertAtCursor('### ', '', 'Subtítulo')} icon={<Heading3 className="h-4 w-4" />} title="H3" />
            <span className="w-px h-5 bg-white/10 mx-1" />
            <ToolbarBtn onClick={() => insertAtCursor('**', '**', 'negrito')} icon={<Bold className="h-4 w-4" />} title="Negrito" />
            <ToolbarBtn onClick={() => insertAtCursor('_', '_', 'itálico')} icon={<Italic className="h-4 w-4" />} title="Itálico" />
            <ToolbarBtn onClick={() => insertAtCursor('`', '`', 'código')} icon={<Code2 className="h-4 w-4" />} title="Código inline" />
            <span className="w-px h-5 bg-white/10 mx-1" />
            <ToolbarBtn onClick={() => insertAtCursor('- ', '', 'Item')} icon={<List className="h-4 w-4" />} title="Lista" />
            <ToolbarBtn onClick={() => insertAtCursor('1. ', '', 'Item')} icon={<ListOrdered className="h-4 w-4" />} title="Lista ordenada" />
            <ToolbarBtn onClick={() => insertAtCursor('> ', '', 'Citação')} icon={<Quote className="h-4 w-4" />} title="Citação" />
            <span className="w-px h-5 bg-white/10 mx-1" />
            <ToolbarBtn onClick={() => insertAtCursor('[', '](https://)', 'texto do link')} icon={<Link2 className="h-4 w-4" />} title="Link" />
            <ToolbarBtn onClick={() => inlineInputRef.current?.click()} icon={<ImageIcon className="h-4 w-4" />} title={uploadingInline ? 'Enviando...' : 'Imagem inline'} disabled={uploadingInline} />
            <ToolbarBtn onClick={() => insertAtCursor('\n\n---\n\n')} icon={<Minus className="h-4 w-4" />} title="Divisor" />
            <ToolbarBtn onClick={() => insertAtCursor('\n\n```\n', '\n```\n\n', 'código')} icon={<Code2 className="h-4 w-4" />} title="Bloco de código" />
            <input ref={inlineInputRef} type="file" accept="image/*" onChange={handleInlineUpload} className="hidden" />
            {aiEnabled && (
              <>
                <span className="w-px h-5 bg-white/10 mx-1" />
                <button
                  type="button"
                  onClick={openAiPanel}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-200 hover:bg-violet-500/25 text-xs font-medium"
                  title="Melhorar ou gerar texto com IA"
                >
                  <Sparkles className="h-3.5 w-3.5" /> IA
                </button>
              </>
            )}
          </div>

          {/* Editor / Preview */}
          <div
            className={`grid gap-3 ${view === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} ${view === 'split' ? 'editor-split-panes' : ''}`}
          >
            {(view === 'edit' || view === 'split') && (
              <div className="glass p-0 overflow-hidden editor-pane">
                <textarea
                  ref={textareaRef}
                  value={form.content}
                  onChange={(e) => setField('content', e.target.value)}
                  onScroll={handleEditorScroll}
                  placeholder="Escreva o conteúdo em markdown..."
                  className="w-full h-full bg-transparent border-0 outline-none p-5 font-mono text-sm leading-relaxed placeholder:text-white/30 editor-textarea"
                  style={{ tabSize: 2, resize: view === 'split' ? 'none' : 'vertical' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      insertAtCursor('  ')
                    }
                    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                      e.preventDefault()
                      handleSave(e as any, { isPublished: form.isPublished })
                    }
                  }}
                />
              </div>
            )}
            {(view === 'preview' || view === 'split') && (
              <div
                ref={previewRef}
                onScroll={handlePreviewScroll}
                className="glass p-5 overflow-auto preview-pane"
              >
                <article
                  className="post-preview"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-3">
          <div className="glass p-4 space-y-3">
            <h3 className="text-sm font-medium mb-1">Publicação</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => setField('isPublished', e.target.checked)} />
              <span>Publicado</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setField('isFeatured', e.target.checked)} />
              <span>Em destaque (long read)</span>
            </label>
            {form.publishedAt && (
              <div className="text-[11px] text-muted-foreground font-mono">
                Publicado em {new Date(form.publishedAt).toLocaleString('pt-BR')}
              </div>
            )}
          </div>

          <div className="glass p-4 space-y-3">
            <h3 className="text-sm font-medium mb-1">Resumo (excerpt)</h3>
            <textarea
              value={form.excerpt}
              onChange={(e) => setField('excerpt', e.target.value)}
              rows={4}
              placeholder="Resumo que aparece no card do blog..."
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm"
            />
          </div>

          <div className="glass p-4 space-y-2">
            <ImageInput
              label="Imagem de capa"
              value={form.coverImage}
              onChange={(url) => setField('coverImage', url ?? '')}
              previewHeight={180}
              enableCrop
              cropAspect={16 / 9}
              cropTitle="Editar capa do post"
            />
          </div>

          <div className="glass p-4 space-y-3">
            <h3 className="text-sm font-medium mb-1">Tags</h3>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setField('tags', e.target.value)}
              placeholder="Arquitetura, Produto, IA..."
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded text-sm"
            />
            <p className="text-[11px] text-muted-foreground">Separadas por vírgula.</p>
          </div>
        </aside>
      </div>

      <style>{`
        .editor-toolbar {
          background: rgba(10, 10, 16, 0.95);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          border: 1px solid var(--line-strong);
          border-radius: 12px;
          padding: 8px;
          position: sticky;
          top: 72px;
          z-index: 25;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
        }
        /* garante que a toolbar não se confunda com o card de título/slug acima */
        .editor-toolbar + .grid {
          margin-top: 0;
        }
        /* Modo lado-a-lado: dois panes de altura fixa que rolam independentemente */
        .editor-split-panes .editor-pane,
        .editor-split-panes .preview-pane {
          height: calc(100vh - 220px);
          min-height: 500px;
          max-height: calc(100vh - 160px);
        }
        .editor-split-panes .editor-pane {
          display: flex;
        }
        .editor-split-panes .editor-textarea {
          flex: 1;
          height: 100%;
          overflow-y: auto;
        }
        .editor-split-panes .preview-pane {
          overflow-y: auto;
        }
        /* Fora do modo split, permitir que cresça com o conteúdo */
        .editor-pane:not(.editor-split-panes .editor-pane) .editor-textarea {
          min-height: 500px;
        }
        .post-preview { color: var(--ink); line-height: 1.7; }
        .post-preview h1, .post-preview h2, .post-preview h3 {
          font-family: 'Inter', sans-serif; font-weight: 500; letter-spacing: -0.02em;
          margin-top: 1.5em; margin-bottom: 0.5em;
        }
        .post-preview h1 { font-size: 28px; }
        .post-preview h2 { font-size: 22px; }
        .post-preview h3 { font-size: 18px; }
        .post-preview p { margin: 0.8em 0; color: var(--ink-dim); }
        .post-preview a { color: var(--cyan); text-decoration: underline; }
        .post-preview ul, .post-preview ol { padding-left: 1.4em; margin: 0.8em 0; color: var(--ink-dim); }
        .post-preview li { margin: 0.3em 0; }
        .post-preview blockquote {
          border-left: 3px solid var(--violet);
          padding: 0.3em 0.8em;
          margin: 1em 0;
          color: var(--ink-dim);
          font-style: italic;
          background: rgba(122, 91, 255, 0.05);
          border-radius: 0 8px 8px 0;
        }
        .post-preview code {
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.9em;
          font-family: 'JetBrains Mono', monospace;
        }
        .post-preview pre {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--line);
          padding: 14px;
          border-radius: 10px;
          overflow-x: auto;
        }
        .post-preview pre code { background: none; padding: 0; }
        .post-preview hr { border: 0; border-top: 1px solid var(--line); margin: 2em 0; }
        .post-preview img { max-width: 100%; border-radius: 10px; border: 1px solid var(--line); }
        .post-preview table { width: 100%; border-collapse: collapse; margin: 1em 0; }
        .post-preview th, .post-preview td { border: 1px solid var(--line); padding: 8px; text-align: left; }
        .post-preview th { background: rgba(255, 255, 255, 0.05); }
      `}</style>

      {showAiPanel && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6"
          onClick={() => !aiProcessing && setShowAiPanel(false)}
        >
          <div
            className="glass p-6 w-full max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-violet-300" />
                  Ação de IA no texto
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {aiSelection?.text
                    ? `${aiSelection.text.length} caracteres selecionados — a IA vai substituir pela nova versão.`
                    : 'Nenhum texto selecionado — a IA vai gerar e inserir no cursor atual.'}
                </p>
              </div>
              <button
                onClick={() => !aiProcessing && setShowAiPanel(false)}
                className="text-muted-foreground hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">O que fazer?</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'improve', label: 'Melhorar' , hint: 'corrige e deixa mais direto', needsSel: true },
                    { key: 'expand', label: 'Expandir', hint: 'adiciona detalhes', needsSel: true },
                    { key: 'shorten', label: 'Resumir', hint: 'encurta', needsSel: true },
                    { key: 'generate', label: 'Gerar novo', hint: 'cria do zero', needsSel: false },
                  ] as const).map((m) => {
                    const disabled = m.needsSel && !aiSelection?.text
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setAiMode(m.key)}
                        disabled={disabled}
                        className={`text-left px-3 py-2 rounded-lg border text-sm transition-colors ${
                          aiMode === m.key
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-100'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <div className="font-medium">{m.label}</div>
                        <div className="text-[11px] text-muted-foreground">{m.hint}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1">
                  Instrução opcional
                  <span className="text-xs text-muted-foreground"> (orientação extra pra IA)</span>
                </label>
                <textarea
                  value={aiInstruction}
                  onChange={(e) => setAiInstruction(e.target.value)}
                  rows={3}
                  placeholder={
                    aiMode === 'generate'
                      ? 'Ex: escreva um parágrafo sobre como escolher stack pra MVP'
                      : 'Ex: deixe mais técnico, use exemplo do setor bancário'
                  }
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm outline-none focus:border-white/25 resize-y"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setShowAiPanel(false)}
                disabled={aiProcessing}
                className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-sm disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={runAi}
                disabled={aiProcessing || (aiMode === 'generate' && !aiInstruction)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-200 hover:bg-violet-500/30 text-sm disabled:opacity-60"
              >
                {aiProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Aplicar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ToolbarBtn({ onClick, icon, title, disabled }: { onClick: () => void; icon: React.ReactNode; title: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="p-2 hover:bg-white/10 rounded text-white/80 hover:text-white disabled:opacity-50"
    >
      {icon}
    </button>
  )
}
