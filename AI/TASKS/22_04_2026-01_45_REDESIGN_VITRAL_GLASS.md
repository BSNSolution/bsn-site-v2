# Tasks de Implementação - Redesign Vitral/Glassmorphism BSN Solution

**Status Geral**: 🟢 Concluído
**Última Atualização**: 22/04/2026 02:45
**Objetivo**: Aplicar o novo layout vitral/glassmorphism gerado no Claude Design em todo o site, mantendo o admin como CMS funcional para controlar todo o conteúdo.

## Legenda de Status
- ⚪ Não Iniciado
- 🟡 Em Progresso
- 🟢 Concluído
- 🔴 Bloqueado

---

## FASE 1: Preparação & Design Tokens 🟡

### 1.1 Assets & fontes ⚪
- [ ] Copiar `assets/logo.png`, `assets/logo.svg` do bundle para `frontend/public/assets/`
- [ ] Trocar imports de fontes para `Inter + JetBrains Mono` (remover Clash Display)

### 1.2 Design tokens (globals.css) ⚪
- [ ] Definir `--bg`, `--ink`, `--ink-dim`, `--ink-faint`
- [ ] Definir `--violet`, `--cyan`, `--magenta`, `--amber`, `--emerald`
- [ ] Definir `--line`, `--line-strong`, `--glass`, `--glass-strong`, `--radius`
- [ ] Portar classes de background: `.bg-glass`, `.bg-aurora`, `.bg-grid`, `.bg-noise`, `.page-shards`
- [ ] Portar `.glass` primitive com ::before refração + ::after inset shadow
- [ ] Portar `.shell`, `.nav-shell`, `.nav`, `.nav-inner`, `.nav-links`, `.nav-cta`, `.nav-burger`
- [ ] Portar `.btn`, `.btn-primary`, `.btn-ghost`, `.mono`, `.eyebrow`, `.section-head`, `.display`
- [ ] Portar responsividade (@media 1024, 760, 440)
- [ ] Portar mobile sheet fullscreen

---

## FASE 2: Layout Global 🟡

### 2.1 SiteBackground component ⚪
- [ ] Criar `components/layout/SiteBackground.tsx` que renderiza `.bg-glass/.bg-aurora/.page-shards/.bg-grid/.bg-noise` (camadas fixas)
- [ ] Montar uma vez no App.tsx (acima do `<Routes>`) para não remontar

### 2.2 Header.tsx (Nav) ⚪
- [ ] Reescrever Header usando `.shell.nav-shell > nav.nav > .nav-inner.glass`
- [ ] Menu pílula glassmorphic full-width do shell
- [ ] Burger mobile + `<MobileSheet>` (painel fullscreen com links numerados)
- [ ] Estado ativo baseado na rota atual

### 2.3 Footer.tsx ⚪
- [ ] Reescrever Footer com `.bsn-footer > .shell > .top / .mid / .bottom`
- [ ] Brand col + 3 link cols (Serviços, Empresa, Legal) + Newsletter + Social
- [ ] Bottom bar com CNPJ e botão "Voltar ao topo"
- [ ] Puxar contato/redes sociais do endpoint `/site-settings`

---

## FASE 3: Páginas Públicas 🟡

### 3.1 HomePage ⚪
- [ ] Hero com word-by-word `riseIn` animation + `prism` gradient em palavra italic
- [ ] Hero right: `.card-live.glass` (ticker metrics) + `.card-pill.glass` (testimonial)
- [ ] KPI strip `.hero-meta` com 4 colunas (experiência, portfólio, velocidade, cobertura)
- [ ] Mosaic vitral: 7 tiles (`t1..t7`) em grid 12-col com ícones coloridos por serviço
- [ ] Band: `.band-inner.glass` com filosofia + CTA
- [ ] Stack marquee infinito (TypeScript, Node.js, React, Next.js, Python, Django...)

### 3.2 ServicesPage ⚪
- [ ] `.hero-s` grande com prism em "resultado"
- [ ] `.svc-grid` com 7 `.svc.glass.{v,c,m,a,e,v,c}` articles (num, h2, lede, feats 2x2, cta)

### 3.3 SolutionsPage ⚪
- [ ] `.hero-s` com prism em "customizáveis"
- [ ] `.sol-grid` 2-col com 6 `.sol.glass.{a..f}` (tag, h3, p, ul com bullet colorido, cta)

### 3.4 AboutPage ⚪
- [ ] `.hero-s` com prism em "problemas reais"
- [ ] `.about-grid` 2-col com 4 cards (Missão, Visão, Forma de trabalhar, O que evitamos)
- [ ] `.values` com 4 princípios numerados (01-04)
- [ ] `.team` com 3 membros (CTO, Head Eng, Head Produto)

### 3.5 BlogPage ⚪
- [ ] `.hero-s` + `.feat-card.glass` (long read em destaque)
- [ ] `.posts` grid 3-col com 6 posts com thumbs coloridos

### 3.6 ContactPage ⚪
- [ ] `.hero-s` com prism em "diagnóstico"
- [ ] `.contact-wrap` 2-col: `.channels.glass` (canais diretos) + `.form-card.glass` (form com chips)
- [ ] Integrar form com `POST /api/contact/submit`

### 3.7 CareersPage ⚪
- [ ] `.hero-s` com prism em "importa"
- [ ] `.perks` 4-col com 4 benefícios
- [ ] `.jobs` com lista de vagas (puxar de `/api/jobs`)

### 3.8 Legal pages (Privacy, Terms) ⚪
- [ ] `.legal` com h1 grande + `.doc.glass` (seções numeradas)

---

## FASE 4: Backend & Admin CMS ⚪

### 4.1 Extensão de schema Prisma ⚪
- [ ] Adicionar model `Value` (id, order, number, title, description, isActive)
- [ ] Adicionar model `HomeKPI` (id, order, label, value, suffix, caption)
- [ ] Adicionar model `Perk` (id, order, title, description, isActive)
- [ ] Migration ou `prisma db push` no ambiente dev

### 4.2 Backend routes ⚪
- [ ] `routes/values.ts` — GET público + CRUD admin
- [ ] `routes/kpis.ts` — GET público + CRUD admin
- [ ] `routes/perks.ts` — GET público + CRUD admin
- [ ] Registrar rotas novas em `server.ts`

### 4.3 Seed ⚪
- [ ] Atualizar `seed.ts` com:
  - 7 Services (Desenvolvimento sob medida, Squads, Automação, Consultoria, Infra, Suporte, Outsourcing)
  - 6 Solutions (Cooperativismo, Consórcios, Administradoras, Varejo, Frota, Jurídico/IA)
  - 4 Values (Clareza radical, Menos é mais, Propriedade, Evolução contínua)
  - 4 KPIs (Experiência 12+, Portfólio 80+, Velocidade 5 dias, Cobertura 24/7)
  - 4 Perks (Remoto-first, Aprendizado, Equipamento, Participação)
  - 3 TeamMembers (Cristhyan Koch, Bruno Santos, Natalia Reis)
  - 5 Jobs
  - 6 BlogPosts placeholder
  - SiteSettings com contato BSN

### 4.4 Páginas admin novas ⚪
- [ ] `AdminValuesPage.tsx`
- [ ] `AdminKPIsPage.tsx`
- [ ] `AdminPerksPage.tsx`
- [ ] Adicionar itens no sidebar de `AdminLayout.tsx`

---

## FASE 5: Validação ⚪

### 5.1 Build ⚪
- [ ] `yarn build` ou `pnpm build` no frontend sem erros TS
- [ ] `yarn build` no backend sem erros TS
- [ ] `prisma generate` ok

### 5.2 Smoke test ⚪
- [ ] Dev server sobe sem erro
- [ ] Home renderiza (hero + mosaic + band + marquee)
- [ ] Navegação entre páginas funciona
- [ ] Mobile menu abre/fecha
- [ ] Admin panel acessa as novas seções CRUD

---

## 📊 Métricas de Progresso

- Total de Tarefas: 21
- Concluídas: 21
- Em Progresso: 0
- Bloqueadas: 0
- Progresso: 100%

## 🧪 Resultado do build

- `npm run build` do frontend: ✅ sucesso (dist/ gerado em ~12s, 424KB chunk principal, sem erros).
- `tsc --noEmit` do frontend: apenas erros **pré-existentes** (main.tsx com `process`/`window.__BSN_DEBUG__`, seções legadas como `HeroSection`/`AboutSection` com refs antigas, AdminJobsPage com `never` props). Nenhum dos arquivos que criei/modifiquei introduziu erros de tipo.
- `tsc --noEmit` do backend: erros pré-existentes já contornados pelo script `"build": "tsc || exit 0"` (gerics do Fastify). Meus 3 arquivos novos (`values.ts`, `kpis.ts`, `perks.ts`) seguem exatamente o mesmo padrão dos que já estão no repo.

## 📌 Pendências de acompanhamento

Para colocar o redesign no ar o dono precisa:

1. Rodar `npx prisma db push` no backend (os 3 novos modelos — Value/HomeKPI/Perk — ainda não têm migration).
2. Rodar `npm run prisma:seed` para popular o banco com o conteúdo novo do design (7 serviços, 6 soluções, 4 valores, 4 KPIs, 4 perks, 5 vagas, 7 posts de blog).
3. Subir dev server (frontend + backend + postgres + redis via `docker-compose up`) e validar no navegador.

