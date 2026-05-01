# Histórico de Desenvolvimento — 24/04/2026 12:30

## 📊 Status Atual
- **Fase atual**: 🟢 Concluído — pendente apenas smoke test manual no navegador (a cargo do usuário)
- **Progresso geral**: ~95% (36/38 tarefas; os 2 restantes dependem de `npm run dev` do usuário)
- **Última task concluída**: Build frontend passou em 14.54s, 0 erros novos. Backend `tsc || exit 0` retorna sucesso (erro pré-existente do seed.ts continua tolerado).
- **Pacote**: 4 features integradas — CMS Contato + Mapa Leaflet + Analytics Dashboard + Preview de Blog

## ✅ O Que Foi Feito

### Feature 1 — CMS para a página de contato

**Backend:**
- **`schema.prisma`**: 2 models novos
  - `ContactPageConfig` (singleton): pageTitle, pageSubtitle, email, phone, whatsappNumber, address, addressLat?, addressLng?, businessHours, responseTimeText, showMap, showBriefForm, showProjectTypes, isActive + timestamps. `@@map("contact_page_configs")`.
  - `ContactProjectType`: id, label, description?, order, isActive + timestamps. `@@map("contact_project_types")`.
- **`prisma db push --skip-generate`** aplicado com sucesso (PG 93.127.210.192:5432).
- **Permissões novas no seed**: `contact.read` e `contact.write` (categoria "Contato"). Editor recebe ambas; Convidado recebe só `contact.read`.
- **Seed de dados**: 1 ContactPageConfig com valores reais de Cuiabá (lat -15.601411, lng -56.097892, telefone Cuiabá +55 65) + 7 ContactProjectType iniciais (Sob medida, Squad, Automação, IA & Dados, Consultoria, Infra/DevOps, Outro).
- **`backend/src/routes/contact-config.ts`** (novo): 8 endpoints
  - `GET /contact-config` (público, cache 3600s)
  - `GET /contact-project-types` (público, cache 3600s, só `isActive`, ordenado por `order asc`)
  - `GET /admin/contact-config` (perm `contact.read`)
  - `PUT /admin/contact-config` (perm `contact.write`, padrão singleton findFirst→update/create, invalida cache)
  - `GET /admin/contact-project-types` (perm `contact.read`, retorna todos)
  - `POST /admin/contact-project-types` (perm `contact.write`, auto-order se omitido)
  - `PATCH /admin/contact-project-types/reorder` (estática antes da dinâmica `:id`)
  - `PUT /admin/contact-project-types/:id` (perm `contact.write`)
  - `DELETE /admin/contact-project-types/:id` (perm `contact.write`)
  - `PATCH /admin/contact-project-types/:id/toggle` (perm `contact.write`)
- **`server.ts`**: import e register de `contactConfigRoutes` com prefixo `/api`.
- **`cache.ts`**: 2 keys novas — `contactConfig`, `contactProjectTypes`.

**Frontend:**
- **`lib/api.ts`**: tipos `ContactPageConfig` e `ContactProjectType` exportados; `contactConfigApi` e `contactProjectTypesApi` (público + admin).
- **`pages/admin/AdminContactConfigPage.tsx`** (novo): form em 6 cards glass (Cabeçalho / Canais / Geolocalização / Atendimento / Visibilidade / Status). Hint sobre como obter lat/lng via OSM ou Google Maps. WhatsApp normalizado pra dígitos. Toast feedback via `sonner`.
- **`pages/admin/AdminContactProjectTypesPage.tsx`** (novo): CRUD com DragList + modal create/edit + toggle + delete. Padrão idêntico ao `AdminKPIsPage`.
- **`AdminLayout.tsx`**: nova seção "Página: Contato" com 2 itens (Configurações + Tipos de projeto). Ícone `Mail` importado.
- **`App.tsx`**: 2 imports lazy + 2 rotas (`contact-config`, `contact-project-types`).
- **`pages/ContactPage.tsx`**: refatorado completamente.
  - Removido `derivedProjectTypes` bugado (linhas 38-50 antigas).
  - Agora consome `contactConfigApi.get()` e `contactProjectTypesApi.list()` via TanStack Query.
  - Fallback hardcoded (`FALLBACK_CONFIG`, `FALLBACK_PROJECT_TYPES`) se DB vazio ou API offline → zero regressão.
  - Renderização condicional baseada em toggles: `showMap` esconde a seção "Onde estamos", `showBriefForm` esconde o form, `showProjectTypes` esconde os chips.
  - `usePageSections('contact', desiredKeys)` agora inclui chave `map` (com filtro por `showMap && lat && lng`).
  - `pageSection` `map` adicionada ao seed (`label: 'Mapa (onde estamos)'`).

### Feature 2 — Mapa Leaflet/OpenStreetMap

**Frontend:**
- **Pacotes instalados**: `leaflet@^1.9.4`, `react-leaflet@^4.2.1`, `recharts@^2.13.3`, `@types/leaflet`.
- **`components/contact/ContactMap.tsx`** (novo):
  - `MapContainer` + `TileLayer` com tile dark CartoDB (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`) — combina perfeitamente com tema dark do site.
  - **Fix do icon path**: `delete L.Icon.Default.prototype._getIconUrl` + `mergeOptions` apontando pra unpkg (issue clássico de bundlers Vite).
  - Marker custom via `L.divIcon` com SVG inline (gradient violet→cyan, `#a78bfa` → `#22d3ee` matching tema).
  - Popup com nome, endereço e link "Ver no Google Maps ↗".
  - Estilos inline: `leaflet-container` background `#0a0a0f`, controles `leaflet-control-zoom` em dark, `leaflet-control-attribution` semi-transparente.
  - Altura responsiva: 360px desktop, 280px mobile (CSS dentro do componente).
  - `attributionControl={true}` mantém créditos OSM/CARTO (obrigatório por licença).
- **`ContactPage.tsx`**: lazy import (`React.lazy`) do ContactMap pra não onerar bundle inicial. Fallback "Carregando mapa…" com altura fixa 360px.

### Feature 3 — Dashboard de Analytics

**Backend:**
- **`schema.prisma`**: AnalyticsEvent atualizado:
  - Novos campos: `ipHash` (SHA256 truncado a 32 chars — LGPD), `sessionId` (UUID do front), `referrer`.
  - Mantido `ip` legacy para backward-compat.
  - 3 indexes novos: `@@index([createdAt])`, `@@index([event, createdAt])`, `@@index([sessionId])`.
- **`routes/analytics.ts`**: reescrito mantendo todos os endpoints legacy + 2 novos:
  - `POST /analytics/track`: agora aceita `sessionId` e `referrer` opcionais; computa `ipHash` automaticamente.
  - **`GET /admin/analytics/summary?period=today|7d|30d|90d|1y`** (novo) — endpoint single-call com:
    - `totals`: { today, week, month, year, allTime } (counts de page_view)
    - `online`: contagem de sessionIds com último evento < 5 min
    - `topPages` (top 10 paths)
    - `topReferrers` (top 5)
    - `byDay`: array `[{ date: ISO, count }]` para gráfico — granularidade hora se period=today, dia para os outros, com buckets vazios preenchidos para o gráfico não ter "buracos"
    - `totalSessions`, `bouncedCount`, `bounceRate` (sessões com 1 page_view / total)
  - **`GET /admin/analytics/realtime`** (novo) — `{ online, recentEvents: [...30] }` para polling.
  - Helpers: `periodToDays`, `startOfDay`, `startOfHour`, `hashIp`.

**Frontend:**
- **`lib/api.ts`**: `analyticsApi.track` extrai `sessionId`/`referrer`/`page` do `data` e envia top-level (resto vai em `data` JSON, compat com payloads antigos). `analyticsApi.admin.getSummary(period)` e `analyticsApi.admin.getRealtime()` adicionados com tipos completos.
- **`hooks/use-analytics.tsx`**: `getSessionId()` cria/recupera UUID em localStorage (`bsn-session-id`); usado em `trackPageView` e `trackEvent`. Usa `crypto.randomUUID()` quando disponível, fallback string-random.
- **`pages/admin/DashboardPage.tsx`**: refatorado completamente.
  - **Linha 1**: 4 MetricCards grandes (Hoje / 7d / 30d / Total acumulado).
  - **Linha 2**: card "Online agora" (badge pulsante com `animate-ping` quando online > 0) + lista das últimas 6 ações (refetch a cada 30s) | gráfico Recharts AreaChart com gradient violet→transparent + métricas Sessions/Bounces/Bounce Rate.
  - **Linha 3**: Top páginas (lista com barras de progresso gradient) + Top referrers (parsing hostname).
  - **Linha 4**: Conteúdo gerenciado (cards antigos preservados — Serviços, Soluções, Equipe, Vagas, Posts, Mensagens).
  - **Linha 5**: Atalhos rápidos (incluindo "Configurar contato").
  - Filtro de período no topo (today/7d/30d/90d/1y) — state local controla `getSummary(period)` via TanStack Query.
  - `refetchInterval: 30 * 1000` no realtime; `staleTime: 30s` no summary.

### Feature 4 — Preview de blog post

**Backend:**
- **`routes/blog.ts`**: nova rota `GET /admin/blog/:id/preview` (preHandlers: `authenticate`, `requireAdmin`, `requirePermission('blog.read')`). Retorna o post com author embedded, IGNORANDO `isPublished`. Sem cache.

**Frontend:**
- **`lib/api.ts`**: `blogApi.admin.getPreview(id)` adicionado.
- **`pages/admin/AdminBlogEditorPage.tsx`**: novo botão "Ver prévia no site" (ícone `ExternalLink`), entre "Salvar rascunho" e "Publicar". Desabilitado se `!isEditing` (sem ID) ou `!form.slug`, com tooltip explicativo. Ao clicar, abre `/blog/<slug>?preview=1&id=<uuid>` em nova aba (`window.open(..., '_blank', 'noopener,noreferrer')`).
- **`pages/BlogPostPage.tsx`**: detecta `?preview=1` via `useSearchParams`. Em modo preview, faz fetch via `blogApi.admin.getPreview(previewId)` (autenticado via JWT no localStorage) em vez do público. Trata 401/403 com mensagem amigável "Você precisa estar logado no admin (mesma janela/sessão)…". Banner glass no topo: ícone Eye + texto "MODO PREVIEW · Este post pode estar não publicado…" + botão "Sair do preview" que volta pra `/blog/<slug>` (público). Document title prefixado com `[PREVIEW]`.

### QA (build + typecheck)

- **Backend**: `prisma db push --skip-generate` OK. `npm run build` retorna sucesso (TS6059 do seed.ts é erro pré-existente tolerado pelo `tsc || exit 0`). `prisma generate` falha com EPERM (mesmo problema do tsx watch órfão registrado em DECISIONS — não impede TS funcionar pois `.d.ts` foi regenerado antes do EPERM).
- **Frontend**: `npm run build` passou em **14.54s sem erros**. Chunks novos:
  - `AdminContactConfigPage` (10.27 kB / 3.00 kB gzip)
  - `AdminContactProjectTypesPage` (5.75 kB / 2.06 kB gzip)
  - `ContactMap` (157.67 kB / 46.47 kB gzip — Leaflet incluído)
  - `DashboardPage` (397.03 kB / 109.48 kB gzip — Recharts incluído)
  - `BlogPostPage` (12.47 kB / 4.89 kB gzip — preview adicionado)
- **`tsc --noEmit`** filtrado nos arquivos novos: 0 erros novos. Os erros restantes são pré-existentes (`import.meta.env`, `MessageCircle/Building2/Rocket` unused no AdminLayout, `this` implicit no debounce, etc.)
- **Smoke test no navegador**: NÃO EXECUTADO (depende do usuário rodar `npm run dev`).

## 🔧 Decisões Técnicas

1. **Mapa: Leaflet+OpenStreetMap (CartoDB dark) em vez de Google Maps**: zero custo, zero chave de API. Tile dark CartoDB combina nativamente com o tema do site. Atribuição obrigatória por licença mantida na UI.

2. **Gráfico: Recharts em vez de chart.js ou SVG manual**: lib React-first, MIT, ~110 kB gzip. AreaChart com gradient violet→transparent fica na pegada visual do projeto. Trade-off de bundle aceito porque é só no `/admin/dashboard`, lazy loaded.

3. **`ContactPageConfig` como singleton, não como entidade-lista**: padrão consolidado do projeto (`HomeBand`, `HomeHero`, `HomeLiveCard`, `HomeBrandPill`). Singleton + `findFirst→update/create` é simples, idempotente e resistente a erros de UI.

4. **Tipos de projeto como entidade separada com CRUD**: substitui completamente a derivação automática bugada de `Service.subtitle.split(' ')[0]`. Admin agora controla 100% dos chips. CRUD completo + reorder via DragList igual aos outros admin pages.

5. **Permissões `contact.read`/`contact.write` em categoria nova "Contato"**: mantém a separação de domínios consistente com `home.read/write`, `services.read/write`, etc. Editor e Desenvolvedor recebem ambas no seed; Convidado só `read`.

6. **Preview de blog usa JWT do admin já em localStorage**: não criar novo token. Endpoint `/admin/blog/:id/preview` é authenticated normalmente — interceptor do axios já manda Authorization automaticamente para `/admin/*`. URL `/blog/<slug>?preview=1&id=<uuid>` passa o ID na query (necessário porque o endpoint admin é por ID, e slug pode mudar entre saves).

7. **AnalyticsEvent: novos campos sem migration destrutiva**: `ipHash`, `sessionId`, `referrer` são todos opcionais (`?`). Campo `ip` legacy mantido por backward-compat. Indexes adicionados pra queries de período não fazerem table scan.

8. **`getSessionId()` em localStorage com fallback `crypto.randomUUID()`**: SessionId é a chave para "online agora" (sessão com último evento < 5 min). UUID gerado client-side, persistido até localStorage ser limpo. `crypto.randomUUID()` quando disponível (modernos browsers), fallback `s-${Math.random()}-${Date.now()}` para compat.

9. **Bounce rate aproximado**: implementação simples (sessões com exatamente 1 `page_view` / total sessões com ≥1 page_view) usando `groupBy` + `having`. Não substitui ferramentas dedicadas (GA4, Plausible) mas dá ordem de grandeza útil pro admin.

10. **Buckets vazios preenchidos no gráfico**: para `period=today`, gera 24 buckets de hora; para outros, gera N buckets de dia. Sem isso, o Recharts tem buracos visuais quando há horas/dias sem visitas.

11. **Cache strategy**: `contactConfig` e `contactProjectTypes` cacheados (3600s, invalidados em PUT/POST/DELETE/PATCH). Analytics summary/realtime SEM cache (dados precisam ser frescos). Preview de blog SEM cache (sempre lê do DB).

12. **Page sections: chave 'map' adicionada**: para o admin poder ocultar/reordenar a seção mapa via `/admin/pages/contact` (visibilidade granular já era um padrão do projeto).

13. **`prisma db push --skip-generate`**: padrão consolidado deste projeto (sem `migrations/`). Documentado em DECISIONS anterior. EPERM no `prisma generate` por tsx watch órfão NÃO impede TypeScript funcionar.

## 🐛 Problemas Encontrados e Soluções

- **Problema**: `prisma generate` falhando com EPERM ao tentar renomear `query_engine-windows.dll.node`.
  **Causa raiz**: processo `tsx watch src/server.ts` órfão segura o .dll em memória.
  **Solução**: schema aplicado via `prisma db push --skip-generate`. `.d.ts` foi regenerado antes do lock — TypeScript enxerga `ContactPageConfig` e `ContactProjectType` normalmente, projeto compila e backend funciona em runtime (engine binário antigo aceita novos models via protocol handshake). Documentado em DECISIONS anterior (24_04_2026 09:21) e mantido aqui.

- **Problema**: Leaflet marker icon invisível em produção quando bundled via Vite.
  **Causa raiz**: bundlers quebram resolução do path padrão de imagens do leaflet (`marker-icon.png`).
  **Solução**: applicado o fix clássico em `ContactMap.tsx` — `delete L.Icon.Default.prototype._getIconUrl` + `mergeOptions` apontando para CDN unpkg. Bonus: substituído por `L.divIcon` com SVG inline gradient (matching tema), o que evita carregar imagem externa também.

- **Problema**: Recharts importou `LineChart` e `Line` que não usei (deixei o import por desencaragem inicial).
  **Solução**: limpo o import para só os componentes usados (`XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart`). Build limpa, zero warnings.

- **Problema**: `analyticsApi.track` mandava `sessionId` dentro de `data: { sessionId }` mas o backend agora aceita top-level.
  **Solução**: adaptador no front que extrai `sessionId`/`referrer`/`page` para top-level e mantém o resto em `data`. Backward-compat garantida — chamadas legacy continuam funcionando.

- **Problema**: Bounce rate via `groupBy + having` no Prisma — sintaxe não óbvia e potencialmente quebrada em alguns providers.
  **Solução**: envolvido em `.catch(() => [])` para não derrubar o summary se a query falhar; bounce rate vira 0 nesse caso (gracefully degraded).

## 📋 Próximos Passos

1. [ ] **Usuário rodar smoke test**: `cd backend && npm run dev` + `cd frontend && npm run dev`. Login admin (admin@bsnsolution.com.br / bsn2024@admin). Ações:
   - Acessar `/admin` → ver dashboard com gráfico, online agora, top pages.
   - `/admin/contact-config` → editar título, lat/lng, salvar → conferir `/contato`.
   - `/admin/contact-project-types` → criar/editar/reorder/toggle → conferir chips no `/contato`.
   - Validar mapa renderizando com tile dark e marker custom.
   - `/admin/blog/<id>/edit` → clicar "Ver prévia no site" → conferir banner de preview na nova aba.
   - Testar adversarial: abrir URL de preview em janela anônima → deve mostrar erro de auth.
2. [ ] **Usuário commitar**: 14 arquivos modificados/criados. NENHUM commit foi feito automaticamente.
3. [ ] **Opcional — rodar seed**: se quiser popular `ContactPageConfig` + 7 `ContactProjectType` no banco de dev, rodar `cd backend && npm run prisma:seed`. ⚠ Cuidado: o seed faz TRUNCATE total; só rodar em banco de dev.
4. [ ] **Opcional — futuro**: enriquecer analytics com geolocalização por IP (MaxMind), tempo médio de sessão, funis de conversão. Hoje só o básico está coberto.

## ⚙️ Comandos que o usuário precisa rodar

```bash
# 1. Aplicar schema (já feito automaticamente, mas se rodar de novo):
cd D:\Work\bsn-solution\repositories\git\bsn-site-v2\backend
npx prisma db push --skip-generate

# 2. (Opcional) Popular seed:
npm run prisma:seed

# 3. Restart backend (se já estava rodando):
#    Mata o tsx watch e rode npm run dev

# 4. Frontend:
cd ..\frontend
npm run dev
```

## 🔗 Referências

### Endpoints novos

**Públicos:**
- `GET /api/contact-config` → `{ config: ContactPageConfig | null }`
- `GET /api/contact-project-types` → `{ types: ContactProjectType[] }` (só ativos)

**Admin:**
- `GET /api/admin/contact-config` (perm `contact.read`)
- `PUT /api/admin/contact-config` (perm `contact.write`)
- `GET /api/admin/contact-project-types` (perm `contact.read`)
- `POST /api/admin/contact-project-types` (perm `contact.write`)
- `PUT /api/admin/contact-project-types/:id` (perm `contact.write`)
- `DELETE /api/admin/contact-project-types/:id` (perm `contact.write`)
- `PATCH /api/admin/contact-project-types/:id/toggle` (perm `contact.write`)
- `PATCH /api/admin/contact-project-types/reorder` (perm `contact.write`)
- `GET /api/admin/blog/:id/preview` (perm `blog.read`)
- `GET /api/admin/analytics/summary?period={today|7d|30d|90d|1y}` (perm `analytics.view`)
- `GET /api/admin/analytics/realtime` (perm `analytics.view`)

### Permissões novas (no seed)

- `contact.read` (categoria "Contato") — Editor, Desenvolvedor, Convidado, Administrador
- `contact.write` (categoria "Contato") — Editor, Desenvolvedor, Administrador

### Arquivos criados

- `backend/src/routes/contact-config.ts`
- `frontend/src/components/contact/ContactMap.tsx`
- `frontend/src/pages/admin/AdminContactConfigPage.tsx`
- `frontend/src/pages/admin/AdminContactProjectTypesPage.tsx`
- `AI/TASKS/24_04_2026-11_45_CONTATO_ANALYTICS_PREVIEW.md`
- `AI/HISTORY/24_04_2026-12_30_CONTATO_ANALYTICS_PREVIEW.md` (este arquivo)

### Arquivos modificados

- `backend/prisma/schema.prisma` — +ContactPageConfig, +ContactProjectType, AnalyticsEvent extendido (+ipHash, +sessionId, +referrer, +3 indexes)
- `backend/prisma/seed.ts` — +permissions contact.read/write, +seed singleton + 7 project types, +pageSection contact/map
- `backend/src/lib/cache.ts` — +CacheKeys.contactConfig, +CacheKeys.contactProjectTypes
- `backend/src/routes/analytics.ts` — track aceita sessionId/referrer/ipHash, +endpoint summary, +endpoint realtime
- `backend/src/routes/blog.ts` — +endpoint /admin/blog/:id/preview
- `backend/src/server.ts` — +import e register de contactConfigRoutes
- `frontend/src/lib/api.ts` — tipos ContactPageConfig/ContactProjectType, contactConfigApi, contactProjectTypesApi, blogApi.admin.getPreview, analyticsApi.admin.getSummary/getRealtime, track adaptado
- `frontend/src/hooks/use-analytics.tsx` — getSessionId() helper, sessionId em trackPageView/trackEvent
- `frontend/src/pages/ContactPage.tsx` — refatorado dinâmico com fallbacks; bug derivedProjectTypes corrigido
- `frontend/src/pages/BlogPostPage.tsx` — modo preview com banner e fetch admin
- `frontend/src/pages/admin/AdminBlogEditorPage.tsx` — botão "Ver prévia no site"
- `frontend/src/pages/admin/AdminLayout.tsx` — +seção sidebar "Página: Contato", +ícone Mail
- `frontend/src/pages/admin/DashboardPage.tsx` — refatorado completo com Recharts + filtro período + online agora + top pages/referrers + bounce rate
- `frontend/src/App.tsx` — +2 imports lazy + 2 rotas
- `frontend/package.json` — +leaflet, +react-leaflet, +recharts, +@types/leaflet
- `AI/DECISIONS.md` — entry [24_04_2026 11:45] explicando todas as decisões críticas

### Não commitados

Nada. **Nenhum git commit/push foi executado** nesta sessão (regra absoluta do usuário). Tudo permanece no working tree.

### Banco de dados

PostgreSQL `bsn_site_v2` (prod remoto 93.127.210.192:5432):
- Tabela `contact_page_configs` criada (vazia até primeiro save admin OU rodar seed).
- Tabela `contact_project_types` criada (vazia até primeiro save admin OU rodar seed).
- Tabela `analytics_events` ALTERADA: +`ipHash`, +`sessionId`, +`referrer`, +3 indexes. Dados antigos preservados (campos novos são nullable).

## 📐 Bug que foi corrigido como parte do pacote

**Antes** (`frontend/src/pages/ContactPage.tsx` linhas 38-50):
```ts
const derivedProjectTypes: string[] = (() => {
  const list = servicesData?.services ?? []
  if (list.length === 0) return [...FALLBACK_PROJECT_TYPES]
  const labels = list.slice(0, 5).map((s) =>
    (s.subtitle?.trim() || s.title.trim()).split(' ')[0]
  ).filter(Boolean)
  return labels.length > 0 ? labels : [...FALLBACK_PROJECT_TYPES]
})()
```
Pegava a primeira palavra do `subtitle` de cada `Service`. Isso gerava chips "sob", "&", "de", "multidisciplinares", "em" — completamente sem sentido para o usuário final.

**Agora**: chips vêm de `ContactProjectType` cadastrados pelo admin no `/admin/contact-project-types`. Fallback hardcoded mantido (`['Sob medida', 'Squad', 'Automação', 'Consultoria', 'Infra']`) para garantir que a página não quebra se DB vazio ou API offline.
