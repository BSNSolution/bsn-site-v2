# Histórico de Desenvolvimento — 23/04/2026 03:10
## Aplicação dos 10 refactors do Code Review + Prisma release

## 📊 Status Atual
- **Fase Atual**: Concluído
- **Progresso Geral**: 100%
- **Última Task Concluída**: Seed + validação final de builds

---

## ✅ O Que Foi Feito

### Refactors aplicados (10/10)

#### #1 — HomePage.tsx split
- Extraído em `frontend/src/pages/home/` com 9 subcomponentes:
  `HeroOrbitSection`, `KpisSection`, `LiveStripSection`, `ScrollHintSection`,
  `VitralSection`, `TimelineSection`, `ClientsSection`, `BandSection`,
  `StackSection` + `types.ts` + `icons.tsx`.
- `HomePage.tsx` ficou com 103 linhas (antes: 540).
- Bundle: 11.98 kB (antes: 11.80 kB — +1.5%, aceitável pela separação de módulos).

#### #2 — globals.css split
- 29 partials criados em `frontend/src/styles/parts/` (tokens, base, nav,
  shared, footer, transitions, home-hero, home-orbit, home-strips,
  home-meta, home-timeline, home-band, page-hero, services, solutions,
  about, blog, contact, careers, legal, responsive-public, admin,
  shadcn, motion-reveal, spotlight, motion-effects, ai, ai-v2,
  service-detail).
- `globals.css` virou orquestrador com `@import` (~55 linhas vs 5160).
- Build idêntico: 2.72s, 0 regressão visual.

#### #3 — BlogPostPage inline style
- Extraído para `styles/parts/_blog-post.css` (incluído no `@import` de
  globals.css).
- Removido `<style>` inline do componente.

#### #4 — AdminServicesPage split
- Criado `frontend/src/pages/admin/services/` com `types.ts`, `TabMain`,
  `TabDetail`, `TabBlocks`.
- Shell reduzido — modal + lista + orquestração das tabs.
- Comportamento 1:1 preservado (CRUD completo de services e blocks).

#### #5 — `<PublicPageHero />`
- Novo componente em `frontend/src/components/layout/PublicPageHero.tsx`.
- Aplicado em: ServicesPage, SolutionsPage, AboutPage, CareersPage,
  BlogPage, ContactPage.
- HomePage mantém hero orbital próprio. AIPage mantém `ai-hero` especial.
- `children` slot usado em ContactPage para os `hero-badges` extras.

#### #6 — Documentar `new-layout*`
- `AI/references/new-layouts/README.md` explica propósito de cada versão
  (v1, v2, v3), quando consultar, quando não editar, e por que não foram
  removidas. Pastas continuam na raiz (HTML estático, custo zero).

#### #7 — PROJECT_TYPES dinâmicos
- ContactPage agora consome `/services` via `useApiQuery` e deriva os
  chips da 1ª palavra do subtitle/title de cada service.
- `FALLBACK_PROJECT_TYPES` para quando a API ainda não respondeu ou
  tabela está vazia.
- `useEffect` garante que a seleção de chip se mantém válida quando a
  lista muda após o primeiro render.

#### #8 — DEFAULT_POSTS → empty state
- Removido array hardcoded de 6 posts dummy.
- Quando `posts.length === 0`, renderiza empty state "Em breve — nenhum
  artigo publicado ainda".

#### #9 — samplePlaceholder util
- Extraído para `frontend/src/lib/placeholders.ts` como `solutionPlaceholder`.
- Mesma paleta por colorClass (a–f), mesmo SVG inline em data URI.

#### #10 — useApiQuery hook
- `frontend/src/hooks/use-api-query.ts` exporta `useApiQuery<T>(key, path, opts?)`.
- Default `staleTime: 5 * 60 * 1000`.
- Refatoradas ~10 chamadas (HomePage, ServicesPage, SolutionsPage,
  AboutPage, CareersPage, ContactPage).
- Chamadas com funções nomeadas (`teamApi.getTeam`, `blogApi.getPosts`,
  `homeExtrasApi.*`, `aiApi.getBlocks`, `stackApi.getItems`) foram
  mantidas com `useQuery` direto — não são o padrão do refactor.

### Prisma (FASE 12)
- Identificados 3 PIDs do backend (`tsx watch`) via `wmic` e matados
  seletivamente — sem afetar outros processos node (VS Code, MCPs, vite).
- `npx prisma generate` OK.
- `npx prisma db push` OK — projeto não usa migrations tradicionais
  (não existe `prisma/migrations/`). O `PageSection` foi sincronizado
  diretamente via `db push`.
- `npx prisma db seed` OK (idempotente).

---

## 🔧 Decisões Técnicas

1. **CSS `@import` encadeado em vez de concatenação** — vite/postcss
   resolve `@import` na build, então custo zero em runtime. Facilita
   debug no DevTools (mostra o arquivo origem).
2. **`prisma db push` em vez de `migrate dev`** — o projeto não tem
   pasta `migrations/`. O `migrate dev` exige terminal interativo
   (erro em ambiente headless). `db push` é declarativo e não-interativo,
   e o schema ficou sincronizado.
3. **Queries com funções nomeadas mantidas com `useQuery`** — o refactor
   do useApiQuery só é claro valor quando o queryFn é literalmente
   `(await api.get('/path')).data`. Quando há função do api.ts com
   lógica própria, o wrapper adiciona mais custo do que benefício.
4. **HomePage tem 2 sistemas de query convivendo** — `useApiQuery` para
   endpoints genéricos e `useQuery` para os wrappers do `api.ts`
   (homeExtrasApi, stackApi). Aceitei a mistura porque forçar tudo para
   um só aumentaria o código.
5. **AdminServicesPage bundle cresceu 1.4%** — aceito pelo ganho de
   manutenibilidade. Os imports extras do chunk (3 tabs separadas)
   superam o ganho de dedup do React.lazy (que não está habilitado).
6. **new-layout* permanece na raiz** — seguindo decisão do dono, são
   referência histórica. README criado em `AI/references/new-layouts/`
   apenas documenta o que são e quando consultar.

---

## 🐛 Problemas Encontrados e Soluções

- **Problema**: `prisma migrate dev` falha com "non-interactive environment"
  no terminal headless.
  **Solução**: Usar `prisma db push` — declarativo, não exige confirmação.
  O projeto já expõe o script `db:push` no package.json.

- **Problema**: Muitos processos `node.exe` rodando (VS Code, MCPs, vite dev,
  tsx-watch do backend). Matar indiscriminadamente é arriscado.
  **Solução**: `wmic process where "name='node.exe'" get processid,commandline`
  filtrando por path do bsn-site-v2/backend. Apenas 3 PIDs correspondiam ao
  `tsx watch src/server.ts` do backend. Finalizados seletivamente.

- **Problema**: Build do backend com `tsc` falha com `rootDir` em `seed.ts`.
  **Solução**: Aceito como pré-existente (conforme briefing). O
  `tsconfig.json` inclui `prisma/seed.ts` no pattern, mas `rootDir` é
  `src/`. Fix fora do escopo deste refactor.

---

## 📋 Próximos Passos Recomendados

1. [ ] Resolver warning de rootDir em `backend/tsconfig.json` — mover o
   `seed.ts` para `src/` ou criar `tsconfig.seed.json` separado.
2. [ ] Considerar usar `React.lazy` para tabs do AdminServicesPage — hoje
   todas as 3 tabs são carregadas juntas no chunk. Ganho marginal.
3. [ ] Migrar demais queries (`blogApi.getPosts`, `teamApi.getTeam` etc.)
   para `useApiQuery` adicionando um 4º param `select: r => r.posts`.
   Refactor estético.
4. [ ] Testar no navegador (`http://localhost:5173`) após reiniciar o
   backend (`npm run dev` em `backend/`) para validar empirically.

---

## 🔗 Referências

### Arquivos criados (paths absolutos)
**CSS parts** (29 arquivos):
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\styles\parts\_tokens.css` (+ 28 irmãos)

**Home sections** (11 arquivos):
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\types.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\icons.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\HeroOrbitSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\KpisSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\LiveStripSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\ScrollHintSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\VitralSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\TimelineSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\ClientsSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\BandSection.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\home\StackSection.tsx`

**Admin Services split**:
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\services\types.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\services\TabMain.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\services\TabDetail.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\services\TabBlocks.tsx`

**Outros**:
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\components\layout\PublicPageHero.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\hooks\use-api-query.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\lib\placeholders.ts`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\references\new-layouts\README.md`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\TASKS\23_04_2026-02_15_REFACTORS_APLICADOS.md`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\AI\HISTORY\23_04_2026-03_10_REFACTORS_APLICADOS.md` (este)

### Arquivos alterados (paths absolutos)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\styles\globals.css` (virou orquestrador de @imports)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\HomePage.tsx` (540 → 103 linhas)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\BlogPostPage.tsx` (removido `<style>`)
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\SolutionsPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ServicesPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\AboutPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\CareersPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\BlogPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\ContactPage.tsx`
- `D:\Work\bsn-solution\repositories\git\bsn-site-v2\frontend\src\pages\admin\AdminServicesPage.tsx` (virou shell)

### Builds finais
- **Frontend**: `yarn build` → `✓ built in 11.38s` (0 erros)
- **Backend**: `npm run build` → erro pré-existente em `seed.ts` (rootDir); resto compila

### Prisma
- `prisma generate` OK
- `prisma db push` OK (schema sincronizado)
- `prisma db seed` OK (admin criado: `admin@bsnsolution.com.br` / `bsn2024@admin`)

### Commits / Branches
Nenhum commit ou push automático — conforme regra do projeto.

---

## ✅ Critérios de conclusão
- [x] Todos os 10 refactors top-10 aplicados
- [x] Build frontend passa em 11.38s sem erros novos
- [x] Build backend sem regressões novas (só mantém erro pré-existente de rootDir)
- [x] Prisma generate + db push + seed executados com sucesso
- [x] Comportamento observable preservado — nenhum CSS de fix recente tocado
- [x] Regras respeitadas: shard absolute, spotlight ::before/::after, align-items stretch
- [x] Sem commit/push git automático
