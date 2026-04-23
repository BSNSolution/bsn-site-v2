# CLAUDE.md - BSN Solution Site v2

## Visão Geral
Site institucional da BSN Solution — monorepo com frontend (site público + admin) e backend API.

## Stack Obrigatória (preferências do dono)
- **Backend**: Node.js, TypeScript, Fastify, Prisma ORM, Zod, PostgreSQL
- **Frontend**: React + Vite, TypeScript, Tailwind CSS, Shadcn/ui (Radix), TanStack Query
- **Auth**: JWT (como no ATM) ou Better-Auth
- **Containerização**: Docker + Docker Compose
- **Storage**: Cloudflare R2 para uploads de imagens

## Estrutura do Monorepo (seguir padrão do bsn-atm-site)
```
bsn-site-v2/
├── docker-compose.yml      # PostgreSQL + Redis + (backend/frontend comentados pra dev)
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── server.ts
│       ├── lib/           # prisma, redis, r2, cache, smtp
│       ├── routes/        # auth, services, solutions, testimonials, home, contact, upload, analytics, site-settings, blog, team, portfolio, inbox, jobs
│       └── middleware/    # auth.ts
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
│       ├── pages/         # Index, Servicos, Solucoes, Sobre, Contato, Carreiras, Blog, NotFound
│       ├── pages/admin/   # Dashboard, Login, HomeManagement, ServicesManagement, etc
│       ├── components/    # Header, Footer, sections, admin components
│       ├── components/ui/ # Shadcn components
│       └── hooks/         # use-api, use-toast, use-analytics
└── AI/
    └── TASKS/tasks.md
```

## Design - TEMA ESCURO (inspiração: ateliware.com + bsn-site atual)

### Cores BSN Solution
- **Background principal**: #080808 (quase preto, como o site atual)
- **Cards/Surfaces**: #111111 a #1a1a1a
- **Texto principal**: #f5f5f5 (off-white)
- **Texto secundário**: #a0a0a0
- **Accent/Primary**: Azul BSN (#1e40af ou similar — ajustar baseado no logo)
- **Accent secundário**: Gradientes sutis de azul para roxo
- **Borders**: #1f2937 (cinza escuro sutil)
- **Hover states**: Elevação sutil com brilho/glow

### Estilo Visual (inspirado na ateliware.com/pt-br/servicos/)
- Layout clean e moderno
- **GLASSMORPHISM** nos cards e elementos UI:
  - `bg-white/5 backdrop-blur-xl border border-white/10`
  - Efeito de vidro fosco em cards, modais, header
  - Gradientes sutis por trás dos cards glass
  - Shadows com cor (ex: `shadow-blue-500/10`)
- Cards com hover effects (elevação + glow sutil)
- Tipografia: Inter ou Poppins (bold headers, light body)
- Seções bem espaçadas com padding generoso
- Animações sutis de entrada (fade-in, slide-up)
- CTAs grandes e destacados
- Gradientes escuros como background de seções alternadas
- Ícones do Lucide React

### Páginas do Site Público
1. **Home** - Hero impactante + serviços + soluções + depoimentos + CTA
2. **Serviços** - Cards dos serviços com detalhes (estilo ateliware)
3. **Soluções/Portfólio** - Projetos realizados com screenshots
4. **Sobre** - História, equipe, valores
5. **Blog** - Artigos (simples, futuro)
6. **Contato** - Formulário + info
7. **Carreiras** - Vagas abertas
8. **Política de Privacidade / Termos**

### Admin Panel
- Dashboard com métricas (visitas, mensagens, etc)
- CRUD completo pra todas as seções do site
- Upload de imagens para R2
- Inbox de mensagens de contato
- Gestão de vagas
- Settings (logo, favicon, nome do site, redes sociais)
- Mesmo padrão do bsn-atm-site

## Banco de Dados (Prisma Schema)
Seguir o schema do bsn-atm-site como base, adaptando:
- User, HomeSection, Service, Solution, Testimonial, ContactInfo, SocialMedia, FooterMenu
- ContactMessage + MessageReply (inbox)
- UploadedImage, SiteSettings, AnalyticsEvent
- Blog (novo: Post com title, slug, content, excerpt, coverImage, author, tags, isPublished)
- Team (nome, cargo, foto, bio, redes sociais)
- Portfolio (nome, descrição, imagens, tecnologias, url)
- Job + JobApplication
- Client (logos de clientes)

## Conteúdo Inicial (seed)
A BSN Solution é uma empresa de tecnologia de Cuiabá-MT que oferece:
- Desenvolvimento Web & Mobile
- Inteligência Artificial & Automação
- Consultoria de TI
- UI/UX Design
- DevOps & Cloud
- Suporte e Manutenção

Placeholder content é OK pro seed — o admin permite editar tudo depois.

## Docker Compose
- postgres:16-alpine (porta 5432)
- redis:7-alpine (porta 6379)
- Backend e frontend comentados (pra dev local) mas com config pronta

## Regras
- NUNCA fazer git push automático
- Manter AI/TASKS/tasks.md atualizado
- Commits semânticos (feat:, fix:, chore:, etc)
- Código limpo, tipado, sem any
- Todos os textos do site em PT-BR
- ESLint + Biome para linting
- Variáveis de ambiente via .env (com .env.example)

## SEO — Regras obrigatórias

Sempre que criar/alterar/remover algo que afete URLs públicas ou conteúdo
indexável, atualizar estes arquivos **no mesmo PR/commit**:

- `frontend/public/sitemap.xml` — adicionar/remover `<url>` para rotas novas,
  atualizar `changefreq`/`priority` quando fizer sentido.
- `frontend/public/robots.txt` — incluir `Disallow:` para áreas privadas
  (admin, dashboards, rotas internas) e garantir que o `Sitemap:` aponta para
  o domínio correto.
- Meta tags dinâmicas via `react-helmet-async` nas páginas novas (title,
  description, og:image, canonical).
- Schema.org (JSON-LD) apropriado para o tipo de conteúdo
  (`Service`, `Article`, `BreadcrumbList`, `FAQPage`, etc).

Exemplos que disparam atualização:
- Nova rota pública (ex: `/cases`, `/eventos`, `/servicos/novo-slug`)
- Nova página de detalhe dinâmica (ex: novo blog post, novo serviço)
- Página removida ou movida (remover do sitemap + redirect quando aplicável)
- Nova área admin/privada (adicionar `Disallow:` no robots)

## Credenciais padrão do Admin
- Email: admin@bsnsolution.com.br
- Senha: bsn2024@admin

## Referências locais (para estudar padrões)
- /tmp/bsn-atm-site/ — monorepo de referência (copiar padrões de admin, API, docker)
- /tmp/bsn-site/ — site atual (cores, conteúdo atual)
- /tmp/bsn-site-api/ — API atual (padrões de rotas, schemas)

## Skills de Design (OBRIGATÓRIO LER antes de fazer frontend)
Referências de design em AI/references/:
- **awwwards-design.md** — LEIA PRIMEIRO. Padrões de sites premiados, scroll animations, choreographed motion
- **frontend-design-ultimate.md** — Anti-AI-slop, tipografia bold, designs memoráveis
- **superdesign.md** — Guidelines de UI moderno, cores, layout
- **lb-motion-skill.md** — Framer Motion patterns (animações)
- **shadcn-ui.md** — Shadcn/ui best practices, forms, dark mode

## MCPs disponíveis (via mcporter CLI)
Você pode usar MCPs via: `mcporter call <server.tool> --args '{"key":"value"}' --output json`
- **brave-search**: `mcporter call brave-search.brave_web_search --args '{"query":"..."}'` — busca web
- **github**: `mcporter call github.<tool>` — operações GitHub (list_issues, create_pull_request, etc)
- **filesystem**: `mcporter call filesystem.<tool>` — operações de arquivo seguras
- **sqlite**: `mcporter call sqlite.query --args '{"sql":"..."}'` — banco SQLite local
- **context7**: buscar docs atualizadas de qualquer lib
- **dokploy**: gerenciar deploy (67 tools)
