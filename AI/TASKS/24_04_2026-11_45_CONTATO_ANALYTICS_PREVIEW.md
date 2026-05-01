# Tasks de Implementação — Pacote 4 features (Contato + Mapa + Analytics + Preview)

**Status Geral**: 🟢 Concluído (pendente smoke test do usuário)
**Última Atualização**: 24/04/2026 12:30
**Objetivo**: Entregar 4 features no BSN Solution Site v2 sem regressões e sem commits automáticos:
1. **CMS de Contato** — singleton `ContactPageConfig` + entidade `ContactProjectType` (com CRUD)
2. **Mapa Leaflet/OSM** na página de contato (dark CartoDB)
3. **Dashboard de Analytics** no admin com métricas (visitas, online agora, top pages, gráfico, etc.)
4. **Preview de blog post** (modo preview com banner) acessível via `/blog/<slug>?preview=1`

## Legenda de Status
- 🟢 Não Iniciado
- 🟡 Em Progresso
- 🟢 Concluído
- 🔴 Bloqueado

---

## FASE 0 — Preparação 🟢

### 0.1 Investigação 🟢
- [x] Mapear schema atual (HomeHero/HomeBand singleton padrão, Service.subtitle origin do bug, AnalyticsEvent já existe, BlogPost já tem viewCount)
- [x] Mapear rotas e padrões: `home-extras.ts` (singleton CRUD), `process-steps.ts` (CRUD + reorder), `analytics.ts` (track + admin stats), `blog.ts` (admin/blog/:id)
- [x] Mapear admin: `AdminLayout` (sidebar com seções colapsáveis), `App.tsx` (rotas lazy), `DragList`, `Select`, `Checkbox`
- [x] Confirmar permissões existentes (não há `contact.*` ainda — vai ser criado)
- [x] Confirmar que `Recharts` e `Leaflet` NÃO estão instalados (vão precisar de install)

### 0.2 Decisões críticas registradas em DECISIONS.md 🟢
- [x] Mapa: Leaflet + react-leaflet + tile dark CartoDB (sem chave de API; sem custos)
- [x] Gráfico: Recharts (lib React-friendly, leve, MIT)
- [x] Permissões novas: `contact.read`, `contact.write` (categoria "Contato"); `analytics.view` já existe
- [x] CacheKeys novos: `contactConfig`, `contactProjectTypes`
- [x] Preview: usa o mesmo JWT do admin já no localStorage (sem novo token), via header Authorization. Rota `/admin/blog/:id/preview` ignora `isPublished`.

---

## FASE 1 — Backend (Feature 1 + 4) 🟡

### 1.1 Schema Prisma + db push 🟢
- [x] Adicionar model `ContactPageConfig` (singleton):
  - `id`, `pageTitle`, `pageSubtitle`, `email`, `phone`, `whatsappNumber`
  - `address` (texto), `addressLat?`, `addressLng?` (Float)
  - `businessHours`, `responseTimeText`
  - `showMap` (bool), `showBriefForm` (bool), `showProjectTypes` (bool)
  - `isActive`, `createdAt`, `updatedAt`
  - `@@map("contact_page_configs")`
- [x] Adicionar model `ContactProjectType`:
  - `id`, `label`, `description?`, `order`, `isActive`, `createdAt`, `updatedAt`
  - `@@map("contact_project_types")`
- [x] Aplicar com `npx prisma db push --skip-generate` (padrão consolidado do projeto, não usa migrate)
- [x] (Opcional) `npx prisma generate` se o lock do .dll permitir; senão TS funciona com .d.ts já regerado

### 1.2 Cache keys 🟢
- [x] Adicionar em `backend/src/lib/cache.ts`:
  - `contactConfig: "contact-config"`
  - `contactProjectTypes: "contact-project-types"`
  - `blogPostPreview: (id: string) => 'blog-preview:${id}'` (não cacheável estritamente — mas chave pra invalidar quando salvar via PUT)

### 1.3 Permissões no seed 🟢
- [x] Adicionar em `backend/prisma/seed.ts` (categoria "Contato"):
  - `contact.read`
  - `contact.write`
- [x] Conectar `contact.read` ao grupo Convidado e `contact.read+contact.write` aos grupos Editor e Desenvolvedor (admin já pega tudo via `connect: allPermissions`).
- [x] Adicionar 1 registro de `ContactPageConfig` no seed com valores hardcoded atuais do `ContactPage.tsx` (email, phone, address) + lat/lng opcionais nulos. Adicionar 6 `ContactProjectType` iniciais: Sob medida, Squad, Automação, Consultoria, Infra, Outro.

### 1.4 Rotas backend `routes/contact-config.ts` 🟢
- [x] Criar arquivo novo. 8 endpoints:
  - `GET /contact-config` (público, cache 3600s, retorna `{ config }`)
  - `GET /contact-project-types` (público, cache 3600s, só `isActive`, ordenado por `order asc`)
  - `GET /admin/contact-config` (perm `contact.read`)
  - `PUT /admin/contact-config` (perm `contact.write`, padrão `findFirst→update/create`, valida via Zod, invalida cache)
  - `GET /admin/contact-project-types` (perm `contact.read`, retorna todos incluindo inativos)
  - `POST /admin/contact-project-types` (perm `contact.write`)
  - `PUT /admin/contact-project-types/:id` (perm `contact.write`)
  - `DELETE /admin/contact-project-types/:id` (perm `contact.write`)
  - `PATCH /admin/contact-project-types/:id/toggle` (perm `contact.write`)
  - `PATCH /admin/contact-project-types/reorder` (perm `contact.write`, items: [{id, order}], `prisma.$transaction`)
- [x] Registrar em `backend/src/server.ts` com prefixo `/api`
- [x] Lembrar: em Fastify, `/reorder` (estática) deve ser declarada ANTES de `/:id`/depois mas funciona porque static vence param em find-my-way

### 1.5 Rota backend preview de blog 🟢
- [x] Adicionar em `backend/src/routes/blog.ts`:
  - `GET /admin/blog/:id/preview` (preHandlers: `authenticate`, `requireAdmin`, `requirePermission('blog.read')`)
  - Retorna o post completo (mesmo se `isPublished=false`) com author embedded
  - Sem cache (preview deve sempre refletir DB)
- [x] Frontend `blogApi.admin.getPreview(id)` em `frontend/src/lib/api.ts`

---

## FASE 2 — Backend (Feature 3 — Analytics dashboard) 🟡

### 2.1 Schema AnalyticsEvent — ajuste mínimo 🟢
- [x] Atualmente: `id, event, page, userAgent, ip, data, createdAt`. Adicionar:
  - `ipHash String?` (hash SHA256 do IP para LGPD — não substitui o `ip` legacy, coexistem)
  - `sessionId String?` (UUID gerado no front, usado pra "online agora")
  - `referrer String?`
  - Index `@@index([createdAt])` e `@@index([event, createdAt])` pra queries de período
- [x] Aplicar com `prisma db push --skip-generate`

### 2.2 Atualizar `analytics.ts` rota track 🟢
- [x] Aceitar `sessionId` e `referrer` no body
- [x] Computar `ipHash = sha256(ip).slice(0, 32)` — manter `ip` por enquanto (backward-compat)

### 2.3 Novas rotas admin de analytics 🟢
- [x] Adicionar em `analytics.ts` (mesmo arquivo, manter as existentes):
  - `GET /admin/analytics/summary?period=today|7d|30d|90d|1y` — retorna em UM call:
    - `totals`: `{ today, week, month, year, allTime }` (counts de page_view)
    - `online`: contagem de sessionIds com último evento < 5min
    - `topPages`: top 10 paths de page_view no período
    - `byDay`: array `[{ date, count }]` para gráfico (granularidade dia se period > 1d, hora se period=today)
    - `topReferrers`: top 5
    - `bounceRate`: aproximação (sessões com 1 page_view / total sessões)
  - `GET /admin/analytics/realtime` — `{ online: number, recentEvents: [{event, page, sessionId, createdAt}, ...] }` com últimos 30 eventos
- [x] Permissão `analytics.view` (já existe)
- [x] Sem cache (dados em tempo real)

### 2.4 Frontend api.ts — analyticsApi.admin extra 🟢
- [x] Adicionar `getSummary(period?)` e `getRealtime()` ao `analyticsApi.admin`

---

## FASE 3 — Frontend público (Features 1 + 2) 🟡

### 3.1 Tipos TypeScript 🟢
- [x] `frontend/src/lib/contact-types.ts` (ou append em algum types.ts existente):
  - `ContactPageConfig` interface
  - `ContactProjectType` interface
- [x] `contactConfigApi` e `contactProjectTypesApi` em `lib/api.ts`

### 3.2 Componente Mapa 🟢
- [x] Instalar `leaflet@^1.9.4` e `react-leaflet@^4.2.1` (compatível com React 18)
- [x] Tipos: `@types/leaflet`
- [x] Criar `frontend/src/components/contact/ContactMap.tsx`:
  - Props: `lat: number, lng: number, address?: string, name?: string`
  - Tile: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`
  - Attribution: `&copy; OpenStreetMap contributors &copy; CARTO`
  - Marker custom (icon SVG ou DivIcon) com cor accent do projeto
  - Popup: nome + endereço + link "Ver no Google Maps" (`https://www.google.com/maps?q=lat,lng`)
  - Container: `glass` + border radius 18 + altura 360 desktop / 280 mobile
- [x] Importar CSS do leaflet localmente no componente (`import 'leaflet/dist/leaflet.css'`) e fix do icon path padrão (issue conhecido com bundlers)

### 3.3 ContactPage.tsx — refatorar 🟢
- [x] Remover `derivedProjectTypes` (linhas 38-50) — substituir por query do `contactProjectTypesApi.list()`
- [x] Adicionar `useQuery` do `contactConfigApi.get()` e `contactProjectTypesApi.list()`
- [x] Fallback hardcoded para zero regressão se DB vazio:
  - title/lede do hero hoje hardcoded
  - email/phone/address vindos de `settings` (já existe, manter como fallback)
  - Project types: array hardcoded ['Sob medida', 'Squad', 'Automação', 'Consultoria', 'Infra']
- [x] Renderizar:
  - Hero com `pageTitle`/`pageSubtitle` do config (com fallback)
  - Bloco de informações dinâmico (email, phone, whatsapp, address, businessHours, responseTimeText)
  - **Mapa** condicionalmente baseado em `config.showMap && lat && lng`
  - Form completo condicionalmente baseado em `config.showBriefForm`
  - Chips de tipo condicionalmente baseado em `config.showProjectTypes`
- [x] Manter `usePageSections('contact', ...)` — adicionar key `map` ao array `CONTACT_SECTION_KEYS` e mapeie no `sectionRenderers`

---

## FASE 4 — Frontend admin (Features 1, 3, 4) 🟡

### 4.1 AdminContactConfigPage.tsx (singleton — Feature 1) 🟢
- [x] Padrão `AdminHomeBandPage`. Form em cards glass divididos por seções:
  1. Cabeçalho da página (pageTitle, pageSubtitle)
  2. Contato direto (email, phone, whatsappNumber, address)
  3. Geolocalização para o mapa (addressLat, addressLng — number inputs)
  4. Atendimento (businessHours, responseTimeText)
  5. Visibilidade (3 toggles: showMap, showBriefForm, showProjectTypes)
  6. Status (isActive)
- [x] Botão Salvar usa `contactConfigApi.admin.save(data)`
- [x] Hint dizendo "Use o link [openstreetmap.org/search](https://www.openstreetmap.org/search) ou Google Maps pra obter lat/lng"

### 4.2 AdminContactProjectTypesPage.tsx (CRUD — Feature 1) 🟢
- [x] Padrão `AdminKPIsPage` (DragList + modal). Campos do form: label, description, isActive, order.
- [x] DragList chamando `contactProjectTypesApi.admin.reorder()`

### 4.3 AdminLayout sidebar — nova seção "Página: Contato" 🟢
- [x] Adicionar entre "Página: Carreiras" e "Elementos compartilhados":
  ```ts
  { label: 'Página: Contato', items: [
    { name: 'Configurações', href: '/admin/contact-config', icon: Settings, permission: ['contact.read', 'contact.write'] },
    { name: 'Tipos de projeto', href: '/admin/contact-project-types', icon: LayoutGrid, permission: 'contact.write' },
  ]}
  ```

### 4.4 App.tsx — rotas novas 🟢
- [x] Imports lazy: `AdminContactConfigPage`, `AdminContactProjectTypesPage`
- [x] Rotas em `<Route path="/admin">`:
  - `<Route path="contact-config" element={<AdminContactConfigPage />} />`
  - `<Route path="contact-project-types" element={<AdminContactProjectTypesPage />} />`

### 4.5 DashboardPage.tsx — refatorar para analytics (Feature 3) 🟢
- [x] Adicionar Recharts: `npm i recharts`
- [x] Layout novo:
  - **Linha 1**: 4 cards de métricas grandes (Hoje, 7d, 30d, Total) — usando `analyticsApi.admin.getSummary`
  - **Linha 2**: Card "Online agora" com badge pulsante + lista das últimas 5 ações (refetch a cada 30s via TanStack Query `refetchInterval: 30000`)
  - **Linha 3**: Gráfico de linha (Recharts `LineChart`) com visitas por dia/hora dependendo do período + filtro de período (botões)
  - **Linha 4**: Top pages + Top referrers + Bounce rate (3 colunas)
  - **Linha 5**: Manter os cards de "stats" antigos (Serviços/Soluções/Equipe etc.) como bloco secundário
- [x] Filtros de período: hoje | 7d | 30d | 90d | 1y (state local)
- [x] Manter atalhos rápidos no fim

### 4.6 AdminBlogEditorPage.tsx — botão preview (Feature 4) 🟢
- [x] Adicionar botão "Ver prévia no site" entre "Salvar rascunho" e "Publicar"
- [x] Se `!isEditing` (sem ID ainda) → desabilitado com tooltip "Salve antes de visualizar"
- [x] Se editing → abre `/blog/<slug>?preview=1` em nova aba (`window.open(..., '_blank')`)

### 4.7 BlogPostPage.tsx — modo preview (Feature 4) 🟢
- [x] Detectar `?preview=1` via `useSearchParams`
- [x] Se preview, fazer fetch via `blogApi.admin.getPreview(id)` em vez de `getPost(slug)`
  - Problema: tem só o slug na URL. **Solução**: a rota admin é por `id`. **Opção A**: passar id também no query (`?preview=1&id=<uuid>`); **Opção B**: criar `/admin/blog/preview/:slug`. Adotaremos **Opção A** (simpler, ID já fica na URL ao abrir do editor).
- [x] Banner glass no topo: "🔒 Modo preview — este post ainda não está publicado" + botão "Sair do modo preview"
- [x] Se 401/403, mostrar erro "Você precisa estar logado como admin pra ver preview"

---

## FASE 5 — QA & Validação 🟡

### 5.1 Build backend 🟢
- [x] `cd backend && npm run build` — deve passar com warnings tolerados (`tsc || exit 0`)
- [x] `npx prisma db push` — confirmar tabelas criadas

### 5.2 Build frontend 🟢
- [x] `cd frontend && npm run build` — deve passar sem erros novos
- [x] `npx tsc --noEmit` — só erros pré-existentes (gtag, etc.)

### 5.3 Smoke tests no navegador 🟡 (depende do usuário rodar `npm run dev`)
- [ ] Login admin
- [ ] Configurações Contato → editar → salvar → verificar `/contato`
- [ ] Tipos de projeto → criar/editar/reorder/toggle → verificar chips
- [ ] Mapa renderiza com lat/lng setados
- [ ] Dashboard mostra métricas, gráfico, top pages, online agora
- [ ] Blog editor → "Ver prévia no site" → abre preview em nova aba com banner
- [ ] Visitante anônimo no preview → 401 → mensagem de erro

---

## 📊 Métricas de Progresso

- Total de Tarefas: 38 (estimativa)
- Concluídas: 36 (todas exceto smoke test no navegador, que depende do usuário)
- Em Progresso: 0
- Bloqueadas: 0
- Progresso: ~95%

## 🔗 Referências cruzadas

- Schema atual: `backend/prisma/schema.prisma`
- Padrão singleton CRUD: `backend/src/routes/home-extras.ts` (HomeBand/HomeHero/etc.)
- Padrão CRUD com reorder: `backend/src/routes/process-steps.ts`
- Padrão admin singleton form: `frontend/src/pages/admin/AdminHomeBandPage.tsx`
- Padrão admin CRUD com DragList: `frontend/src/pages/admin/AdminKPIsPage.tsx`
- Sidebar pattern: `frontend/src/pages/admin/AdminLayout.tsx`
- Rotas lazy: `frontend/src/App.tsx`
- Bug atual a corrigir: `frontend/src/pages/ContactPage.tsx` linhas 38-50 (`derivedProjectTypes`)

## ⚠️ Restrições absolutas

- NUNCA `git push`, `git commit`, criar branch
- Bancos via MCP somente leitura (não usado neste pacote, mas vale a regra)
- Glassmorphism dark consistente
- Mobile responsivo
- Fallback hardcoded em todos os consumidores caso DB esteja vazio
