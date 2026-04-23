import { Link } from 'react-router-dom'
import {
  Home,
  Briefcase,
  LayoutGrid,
  Info,
  BookOpen,
  FileText,
  MessageCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

/**
 * Página inicial de gestão de seções — cada card leva a `/admin/pages/:page`
 * onde se reordena / alterna visibilidade das sections da página.
 *
 * Nota: padrão shadcn / admin (não usa `.glass`), conforme CLAUDE.md.
 */

interface PageCard {
  slug: string
  label: string
  description: string
  icon: any
  publicPath: string
}

const PAGES: PageCard[] = [
  {
    slug: 'home',
    label: 'Home',
    description: 'Hero orbit, KPIs, live strip, vitral de serviços, timeline, clientes, band, stack.',
    icon: Home,
    publicPath: '/',
  },
  {
    slug: 'services',
    label: 'Serviços',
    description: 'Hero + grid de serviços.',
    icon: Briefcase,
    publicPath: '/servicos',
  },
  {
    slug: 'solutions',
    label: 'Soluções',
    description: 'Hero + grid de soluções (portfólio).',
    icon: LayoutGrid,
    publicPath: '/solucoes',
  },
  {
    slug: 'about',
    label: 'Sobre',
    description: 'Hero, cards (Missão/Visão/…), valores e time.',
    icon: Info,
    publicPath: '/sobre',
  },
  {
    slug: 'blog',
    label: 'Blog',
    description: 'Hero, post em destaque e grid de posts.',
    icon: BookOpen,
    publicPath: '/blog',
  },
  {
    slug: 'careers',
    label: 'Carreiras',
    description: 'Hero, perks (benefícios) e lista de vagas.',
    icon: FileText,
    publicPath: '/carreiras',
  },
  {
    slug: 'contact',
    label: 'Contato',
    description: 'Hero, canais diretos + formulário.',
    icon: MessageCircle,
    publicPath: '/contato',
  },
  {
    slug: 'ai',
    label: 'Inteligência Artificial',
    description: 'Hero, benefícios, cases, etapas, dados, CTA band.',
    icon: Sparkles,
    publicPath: '/inteligencia-artificial',
  },
]

export default function AdminPagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Seções das páginas
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-xl">
            Reordene e alterne a visibilidade das seções de cada página pública. As alterações
            propagam imediatamente no site.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PAGES.map((page) => {
          const Icon = page.icon
          return (
            <Link
              key={page.slug}
              to={`/admin/pages/${page.slug}`}
              className="group rounded-xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700 transition p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-zinc-800/60 flex items-center justify-center text-zinc-300 group-hover:text-white transition">
                  <Icon className="w-5 h-5" />
                </div>
                <a
                  href={page.publicPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-zinc-500 hover:text-zinc-200 inline-flex items-center gap-1"
                  title="Ver página pública"
                >
                  Abrir <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <div className="text-base font-medium text-zinc-100 group-hover:text-white">
                  {page.label}
                </div>
                <div className="text-xs text-zinc-500 mt-0.5">/{page.slug}</div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{page.description}</p>
              <div className="mt-auto pt-2 text-xs text-zinc-500 group-hover:text-zinc-300">
                Gerenciar seções →
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
