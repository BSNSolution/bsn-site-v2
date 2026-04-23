# Code Review — BSN Site v2

**Data:** 23/04/2026
**Escopo:** `frontend/src/` + `backend/src/` (exclui `new-layout*`, `dist`, `node_modules`)
**Autor:** Claude (auditoria automatizada)

---

## 1. Dead files

| Arquivo | Motivo | Removido? |
|---|---|---|
| `frontend/src/components/sections/HeroSection.tsx` | Zero imports. Só referenciado por seus próprios irmãos (também dead). | ✅ |
| `frontend/src/components/sections/ServicesSection.tsx` | Zero imports fora do diretório dead. | ✅ |
| `frontend/src/components/sections/SolutionsSection.tsx` | Zero imports. | ✅ |
| `frontend/src/components/sections/TestimonialsSection.tsx` | Zero imports. | ✅ |
| `frontend/src/components/sections/AboutSection.tsx` | Zero imports. | ✅ |
| `frontend/src/components/sections/ClientsSection.tsx` | Zero imports. | ✅ |
| `frontend/src/components/sections/CTASection.tsx` | Zero imports. | ✅ |
| `frontend/src/hooks/use-scroll-animation.ts` | Só usado pelos components/sections/ (já removidos). | ✅ |
| `frontend/src/hooks/use-cursor.tsx` | Zero imports no projeto. Funcionalidade substituída pelo `MotionLayer`. | ✅ |
| `frontend/src/components/ui/service-icons.tsx` | Usado por `icon-picker.tsx`. **NÃO removido** (falso positivo — grep inicial não pegou path relativo `./service-icons`). | ❌ |
| `new-layout/`, `new-layout-v2/`, `new-layout-v3/` | HTML estático legado de design reference. Única menção em `globals.css` é comentário. **Recomendado** mover para `AI/references/` ou deletar — não removi por ser conteúdo de referência histórica. | ⚠️ manual |

**Pasta `components/sections/` inteira removida.**

---

## 2. Dead code / imports não usados

### Backend

- `backend/src/server.ts` linha 25: `multipart` é importado e registrado — usado nas rotas de upload, OK.
- Nenhum import órfão detectado nas rotas principais.

### Frontend

- Nenhum import não usado detectado nos arquivos tocados nesta sessão.
- Ao reescrever `HomePage`, `ServicesPage`, `SolutionsPage`, `AboutPage`, `BlogPage`, `CareersPage`, `ContactPage`, `AIPage`, mantive apenas imports efetivamente usados.

---

## 3. Duplicação

### CSS duplicado (globals.css)

✅ **Corrigido nesta sessão**:
- `.svc .content` estava duplicado (linhas 2389 e 2424). Consolidado no segundo bloco agregando `display: flex; flex-direction: column; min-height: 0;`.
- `.svc .feats` estava duplicado (linhas 2394 e 2434). Primeiro bloco (só `margin-top: 16px`) removido — o segundo bloco já contém esse `margin-top`.

### Ainda duplicado (não aplicado — risco médio/estético)

Varredura sugere grandes blocos de `.hero-s` / `.eyebrow mono` similares em múltiplas páginas. Como são classes globais compartilhadas, não é duplicação CSS — é reuso correto.

### Componentes / hooks duplicados

- Cada página pública criava seu próprio `<Header /> ... <Footer />` com Hero idêntico em estrutura mas texto diferente. ✅ Esta sessão criou infraestrutura (PageSection + hook + admin) que permite no futuro consolidar o Hero em um `<PublicPageHero />`.
- **Não aplicado** pois mudaria comportamento visível — recomendado em sprint seguinte.

---

## 4. Clean code

### Componentes > 300 linhas

| Arquivo | Linhas | Observação |
|---|---|---|
| `frontend/src/pages/HomePage.tsx` | 540 | Grande pelo número de sections. Splitting em sub-componentes (`HomeHeroOrbit`, `HomeTimelineSection`, etc.) seria próximo passo. |
| `frontend/src/pages/AIPage.tsx` | ~380 | Refatorado com renderers — já está modular. |
| `frontend/src/pages/admin/AdminServicesPage.tsx` | ~700 | Modal com 3 tabs + CRUD de blocks. Split sugerido: extrair `<ServiceDetailTabs />`, `<BlockList />`. |
| `frontend/src/pages/BlogPostPage.tsx` | 338 | `<style>` inline gigante no fim — extrair para `blog-post.css`. |
| `frontend/src/styles/globals.css` | >3000 | CSS monolítico. Split por seção seria refactor médio. |

### `any` / typing fraco

- `backend/src/routes/kpis.ts:46`: `data: data as any` — cast forçado por inferência ZodInfer. Baixo impacto.
- Algumas `queryFn: async () => (await api.get('/...')).data` sem tipagem explícita — herdadas pelo `useQuery<T>`. OK.
- `JSX.Element | null` usado consistentemente nos renderers novos.

### Nomes inconsistentes

- `service` vs `svc` — `svc` aparece em classes CSS (ok, é shorthand visual), mas também em variáveis locais (`ServicesPage.tsx`). Consistente com o resto do codebase — não normalizado.
- `slug` / `anchor` em `Service` — ambos têm papel distinto (anchor para /servicos#hash, slug para /servicos/:slug). Bom já está documentado no schema.

---

## 5. Refactors prioritários (top 10)

| # | Arquivo | Problema | Refactor sugerido | Risco |
|---|---|---|---|---|
| 1 | `frontend/src/pages/HomePage.tsx` (540 linhas) | Componente grande concentra lógica de 9 sections | Extrair cada section em componente próprio (`home/HeroOrbit.tsx`, etc.) | Baixo |
| 2 | `frontend/src/styles/globals.css` (3000+) | CSS monolítico — hard to find | Split por seção: `hero.css`, `vitral.css`, `timeline.css`, importados no `globals.css` | Médio |
| 3 | `frontend/src/pages/BlogPostPage.tsx` | `<style>` inline com 100+ linhas | Extrair para `styles/blog-post.css` | Baixo |
| 4 | `frontend/src/pages/admin/AdminServicesPage.tsx` (700+) | Modal com 3 tabs embutido | Split em `ServiceMainTab`, `ServiceHeroTab`, `ServiceBlocksTab` | Médio |
| 5 | Hero copy repetido em cada PageHeaderSection | DRY: 8 heros com mesma estrutura (eyebrow + h1 + p) | Criar `<PublicPageHero eyebrow title lede />` | Médio (muda CSS sutil) |
| 6 | `new-layout*/` na raiz do repo | 3 pastas (quase 200 arquivos) de HTML estático legado | Mover para `AI/references/design-history/` ou remover | Baixo — são reference only |
| 7 | `frontend/src/pages/BlogPage.tsx` `DEFAULT_POSTS` fallback | Fallback estático hardcoded — não editável via admin | Deixar explicit empty-state quando API retornar vazio | Baixo |
| 8 | `ContactPage.tsx` `PROJECT_TYPES` hardcoded | 5 chips de tipo de projeto fora do DB | Derivar de `Service.slug` ativos | Médio (muda payload de `subject`) |
| 9 | `samplePlaceholder()` em `SolutionsPage.tsx` | Função de 30 linhas inline no componente | Extrair para `lib/solution-placeholder.ts` | Baixo |
| 10 | Consolidar `useQuery` repetitivos com helper | Muitas páginas repetem `useQuery({ queryKey, queryFn: async () => (await api.get(...)).data, staleTime })` | `useApiQuery(key, endpoint, options)` wrapper | Baixo |

---

## 6. Refactors aplicados nesta sessão (baixo risco)

- ✅ Removida pasta `frontend/src/components/sections/` (7 arquivos).
- ✅ Removidos hooks órfãos: `use-scroll-animation.ts`, `use-cursor.tsx`.
- ✅ Consolidada duplicação CSS em `.svc .content` e `.svc .feats`.
- ✅ `backend/src/lib/cache.ts` adicionou `pageSections(page)` com comentário.
- ✅ Cada página pública agora tem seu array de section keys tipado (`as const`).

---

## 7. Refactors NÃO aplicados (fora do escopo ou alto risco)

- Renames de API pública (pode quebrar integrações externas).
- Extrair `<PublicPageHero>` — muda CSS sutil entre heros; requer validação visual.
- Remover `new-layout*/` — são referência de design; o dono decide.
- Split de `globals.css` — trabalho médio; não é bloqueio.
- Consolidar `useQuery` — pequeno ganho, mudança espalhada.

---

## 8. Observações sobre regras recentes

- Fixes preservados ✅
  - `.svc .content` ainda tem `display: flex` + `min-height: 0` + `height: 100%` herdado.
  - `.shard` mantido `position: absolute` (não alterado).
  - Spotlight (`::before`/`::after` do card) não tocado.
  - Timeline watermark, gradient border, align-items: stretch — preservados.
- `MotionLayer` (reveal/spotlight/parallax) segue montado apenas no lado público via `App.tsx`.

---

## 9. Métricas finais

| Métrica | Antes | Depois |
|---|---|---|
| Arquivos TS/TSX em `frontend/src` | ~95 | ~86 (-9) |
| Arquivos em `components/sections/` | 7 | 0 (pasta removida) |
| Hooks | 4 | 2 (use-analytics, use-page-sections) |
| Bundle `HomePage.js` | 12.13 kB | 11.80 kB |
| Duplicação `.svc .content` | 2× | 1× |

