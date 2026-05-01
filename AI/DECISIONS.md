# Decisões críticas — BSN Solution Site v2

> Log append-only. Sempre que algo afetar mais de uma stack / agente / fase, registrar aqui.

---

## [24_04_2026 09:21] — Admin Home revamp: deprecar `HomeSection` legado

- **Decidido por**: maestro
- **Afeta**: backend (schema.prisma, routes/home.ts, seed.ts), frontend (AdminLayout, App.tsx, HomeSectionsPage.tsx)
- **Motivo**: A tela `/admin/home` atual ("1. Hero & seções") gerencia o model `HomeSection` (com `SectionType` enum: HERO, ABOUT, SERVICES_PREVIEW, etc.), mas **a home pública atual NÃO consome esses dados** — o hero (`HeroOrbitSection`) está 100% hardcoded, o mosaico usa `Service`, a timeline usa `ProcessStep`, etc. O model é legado de uma implementação antiga que foi superada pelas models específicas (`HomeBand`, `HomeLiveCard`, `HomeKPI`, `HomeBrandPill`, `StackItem`, `ProcessStep`, `Service`).
- **Decisão**:
  1. **Não remover** o model `HomeSection` neste PR (segurança de dados históricos); apenas deprecar uso na UI.
  2. Rota `/admin/home` (antiga lista de sections) deixa de ser exposta no sidebar. A rota backend `GET/POST/PUT/DELETE /admin/home` e `/home` continuam existindo mas sem UI que as chame.
  3. Em PR futuro (fora deste escopo), avaliar remoção completa do model + tabela + rotas.
- **Detalhes**:
  - A rota `/admin/home` no `App.tsx` passa a apontar para a nova `AdminHomeHeroPage.tsx` (que edita o novo model `HomeHero`).
  - `HomeSectionsPage.tsx` fica no repo mas sem rota no sidebar nem no `App.tsx`. Pode ser removido depois.
  - Permissões `home.read` / `home.write` são reaproveitadas pela nova tela Hero.

---

## [24_04_2026 09:21] — Novo model `HomeHero` (singleton) para o hero da home pública

- **Decidido por**: maestro
- **Afeta**: backend (schema.prisma + migration + seed + routes/home-extras.ts ou new route), frontend (HeroOrbitSection.tsx + new AdminHomeHeroPage.tsx + api.ts)
- **Motivo**: O hero atual é 100% hardcoded em `HeroOrbitSection.tsx`. O usuário quer poder editar todos os campos pelo admin.
- **Decisão**:
  - Criar model `HomeHero` como **singleton** (padrão do `HomeBand` / `HomeLiveCard`: `findFirst` + `update/create`).
  - Campos do model (mapeados 1:1 com o que aparece no hero atual):
    - `eyebrowText` (ex: `"7 capacidades · 1 parceiro"` — mas o `{services.length}` continua dinâmico: o admin edita o **template** `"{count} capacidades · 1 parceiro"` e o front substitui `{count}`)
    - `title` (String, aceita HTML simples `<em>`, ex: `"Tudo que sua operação precisa <em>girando</em> no mesmo eixo."`)
    - `subtitle` (String, lede abaixo do h1)
    - `ctaPrimaryLabel`, `ctaPrimaryUrl`, `ctaPrimaryIcon` (opcional, default `↗`)
    - `ctaSecondaryLabel`, `ctaSecondaryUrl` (estilo ghost)
    - `badge1Text`, `badge1HasPulse` (boolean — o dot pulsante atual), `badge2Text` (ex: `"🔒 LGPD-ready"`)
    - `showFloatingNodes` (boolean — controla se os 6 cards flutuantes do orbit aparecem; os dados vêm de `Service`)
    - `isActive`, timestamps
  - Rota: adicionar em `routes/home-extras.ts` o par `/home/hero` (público) e `/admin/home/hero` (autenticado, permissão `home.write`). Cache: `CacheKeys.homeHero` (novo).
  - Front: `HeroOrbitSection` passa a receber `hero: HomeHero | null` como prop e renderiza condicionalmente (fallback hardcoded idêntico ao atual pra garantir que se vier null nada quebra). `HomePage.tsx` passa a fazer a query do hero.
- **Detalhes**: ver `AI/TASKS/24_04_2026-09_21_ADMIN_HOME_REVAMP.md` para o detalhe de cada campo.

---

## [24_04_2026 09:21] — Timeline admin: reaproveitar model `ProcessStep` existente

- **Decidido por**: maestro
- **Afeta**: frontend (new AdminHomeTimelinePage.tsx + api.ts + AdminLayout sidebar), backend (apenas adicionar `processStepsApi` ao front; backend já está pronto)
- **Motivo**: O model `ProcessStep`, rota `/admin/process-steps` e permissão `process-steps.write` já existem no backend. A tela pública (`TimelineSection`) já consome. Só falta a tela admin pra cadastrar/editar. Criar um novo model seria redundante.
- **Decisão**:
  - Criar `AdminHomeTimelinePage.tsx` que usa CRUD padrão (igual ao `AdminKPIsPage` ou `AdminStackPage`): `DragList` com reorder + modal de criar/editar + toggle active.
  - Adicionar `processStepsApi` em `frontend/src/lib/api.ts`.
  - Adicionar item no sidebar: **"Timeline (ritmo de trabalho)"** dentro da seção "Página: Home".
  - Permissões: `process-steps.write` já existe no seed.

---

## [24_04_2026 execução] — Adicionar `PATCH /admin/process-steps/reorder` (faltava)

- **Decidido por**: maestro (durante execução da Fase 1)
- **Afeta**: backend (process-steps.ts), frontend (processStepsApi.admin.reorder)
- **Motivo**: `process-steps.ts` não tinha endpoint de reorder. Todas as outras entidades com DragList no admin (stack, kpis, about-cards, services, team, clients, testimonials, solutions) já têm `PATCH /admin/<resource>/reorder` aceitando `{ items: [{ id, order }] }`. Timeline admin precisa do mesmo padrão.
- **Detalhes**:
  - Endpoint adicionado depois de `/toggle` — usa `prisma.$transaction(items.map(update))` e invalida `CacheKeys.processSteps`.
  - Permissão: `process-steps.write` (já existe no seed).
  - Rota estática vence param em Fastify, então `/reorder` vs `/:id` não conflita.

---

## [24_04_2026 execução] — `prisma generate` bloqueado por `tsx watch` órfão (não impede compilação)

- **Decidido por**: maestro (durante execução da Fase 1)
- **Afeta**: ambiente de dev local
- **Motivo**: Existe um processo `tsx watch src/server.ts` (PID 98892, iniciado 04:03 do dia 24/04/2026) que segura `node_modules/.prisma/client/query_engine-windows.dll.node`. Isso faz `prisma generate` falhar com EPERM ao tentar renomear o .tmp. **Porém** os arquivos `.js` e `.d.ts` do client foram regenerados com sucesso antes do lock — ou seja, TypeScript enxerga `HomeHero` normalmente e o projeto compila. O engine binário antigo continua sendo usado em runtime (compatível com novos models via protocol handshake).
- **Decisão**: não matar o processo do usuário (pode estar sendo usado intencionalmente). Schema foi aplicado via `prisma db push --skip-generate` com sucesso. Se em algum momento precisar regenerar o engine binário, o usuário pode matar o PID e rodar `npx prisma generate`.

---

## [24_04_2026 11:45] — Pacote 4 features: CMS Contato + Mapa + Analytics Dashboard + Preview Blog

- **Decidido por**: maestro
- **Afeta**: backend (schema + 2 novos routes/contact-config.ts + ajustes em analytics.ts/blog.ts), frontend (3 admin pages novas, ContactPage refatorada, BlogPostPage com preview, DashboardPage redesenhada, novo componente ContactMap)
- **Motivo**: solicitação direta do usuário com 4 features agrupadas. Bug crítico: `ContactPage.tsx` deriva chips de tipo de projeto com `subtitle.split(' ')[0]` gerando lixo ("sob", "de", "&"). Resolver junto com CMS de contato.
- **Decisões técnicas-chave**:

### Mapa: Leaflet + OpenStreetMap (CartoDB dark tile)
- **Não Google Maps**: requer chave/billing. Leaflet+OSM é gratuito.
- **Tile dark CartoDB** (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`): combina com tema dark do site sem CSS extra.
- **Pacotes**: `leaflet@^1.9.4`, `react-leaflet@^4.2.1`, `@types/leaflet`. Tem que importar `'leaflet/dist/leaflet.css'` no componente E aplicar fix do icon path (issue conhecido: bundlers Vite quebram resolução do marker icon padrão).

### Gráfico do dashboard: Recharts
- **Recharts** (`npm i recharts`): React-friendly, MIT, baseado em D3 sem trazer todo o D3.
- Alternativas descartadas: chart.js (não-react-first), vanilla SVG (muito boilerplate).

### CMS de Contato: 1 singleton + 1 entidade-lista
- **`ContactPageConfig`** (singleton): padrão `HomeHero`/`HomeBand` (`findFirst` + update/create). Inclui `addressLat`/`addressLng` para o mapa, toggles `showMap`/`showBriefForm`/`showProjectTypes`.
- **`ContactProjectType`** (entidade separada com CRUD + reorder): permite admin criar/editar/ordenar tipos arbitrariamente. Substitui completamente a derivação automática bugada de `Service.subtitle`.
- **Permissões novas**: `contact.read` e `contact.write` na categoria "Contato" (similar a `home.read`/`home.write`). Admin-grupo já pega tudo via `connect: allPermissions`. Editor/Desenvolvedor recebem ambas no seed.

### Preview de blog post
- **Sem token novo**: usa o JWT do admin já no localStorage (`bsn-auth-token`). Rota `/admin/blog/:id/preview` é authenticada via header Authorization (interceptor já trata `/admin/*`).
- **Query param**: `/blog/<slug>?preview=1&id=<uuid>` — passa o ID na query porque o endpoint admin é por ID e o slug pode mudar (ainda assim, slug fica para reaproveitar a URL).
- **BlogPostPage detecta** `?preview=1`, faz fetch via `blogApi.admin.getPreview(id)` (autenticado) em vez do público, mostra banner "Modo preview — não publicado" e respeita `isPublished=false`.
- **Visitante anônimo** que tente acessar `?preview=1` recebe 401 do interceptor → mostra mensagem amigável.

### AnalyticsEvent: campos novos
- Adicionar `ipHash` (sha256 truncado a 32 chars — LGPD), `sessionId` (UUID gerado no front, persiste em localStorage), `referrer`. **Manter `ip` legacy** para backward-compat sem migration destrutiva.
- Index `@@index([createdAt])` e `@@index([event, createdAt])` para acelerar queries de período.
- "Online agora" = sessões com último evento < 5 min.
- "Bounce rate" aproximado = sessões com 1 page_view / total sessões no período.

### Cache strategy
- `contactConfig` e `contactProjectTypes`: TTL 3600s (público), invalidar em PUT/POST/DELETE/PATCH (toggle, reorder).
- `analytics/summary` e `analytics/realtime`: **sem cache** (dados em tempo real). TanStack Query no frontend usa `refetchInterval: 30000` para o realtime.
- Preview de blog: **sem cache** (sempre lê do DB para refletir edições recentes).

### `prisma db push --skip-generate` (consolidado)
- Esse projeto não usa `prisma migrate dev` (sem pasta `migrations/`). Toda mudança de schema vai via `prisma db push`. Documentado em history anterior (24_04_2026-09_45) que o EPERM no `prisma generate` por tsx watch órfão NÃO impede TypeScript funcionar (.d.ts já regenerado).

---

## [24_04_2026 09:21] — Mosaico admin: nova tela FOCADA nos campos de mosaico da home (reaproveita model `Service`)

- **Decidido por**: maestro
- **Afeta**: frontend (new AdminHomeServicesMosaicPage.tsx), backend (novas rotas `GET/PUT /admin/services/home-mosaic` ou reaproveitar PUT `/admin/services/:id` — decidir na implementação)
- **Motivo**: O mosaico da home (`VitralSection`) consome a entidade `Service` (mesma coisa da página `/servicos`). Criar uma entidade separada duplicaria dados. Mas `AdminServicesPage` é um CRUD genérico e NÃO foca nos campos específicos do mosaico (`tileClass`, `numLabel`, `homePill`, `homePillTags`, `iconName`, `anchor`, `order`).
- **Decisão**:
  - Criar `AdminHomeServicesMosaicPage.tsx` que:
    1. Lista os serviços ativos **com foco nos campos do mosaico** (title + numLabel + tileClass + iconName + pill/tags + order + isActive).
    2. Permite reordenar via `DragList` (já existe API de reorder em services).
    3. Modal "Editar no mosaico" edita APENAS os campos relevantes pro mosaico (`tileClass`, `numLabel`, `homePill`, `homePillTags`, `iconName`, `anchor`, `order`, `isActive`). Não permite editar `title`/`description`/`slug` aqui (isso fica no `AdminServicesPage` para não duplicar responsabilidade).
    4. Mostra nota "Para editar título, descrição e página de detalhe, use `Página: Serviços → Serviços (mosaico + lista)`".
  - **Backend**: não precisa de rota nova — reaproveita `PUT /admin/services/:id` e `GET /admin/services`. O filtro/projeção é client-side.
  - Sidebar: item **"Mosaico de serviços"** logo abaixo de "3. Stack (marquee)", na seção "Página: Home".
  - Permissão: `services.write` (já existe).

---
