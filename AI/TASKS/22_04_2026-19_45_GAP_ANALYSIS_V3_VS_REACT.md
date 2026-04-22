# Gap Analysis — Protótipo v3 vs React atual

**Status Geral**: 🟡 Em Progresso
**Data**: 22/04/2026 19:45
**Objetivo**: Comparar `new-layout-v3/` (HTML estático final) com implementação React (`frontend/src/`) e corrigir gaps.

---

## Contexto do usuário
> "ainda tá tudo errado e bugado"

Após commit `9302fa4` (fix heights), o usuário continuava vendo problemas. Inspeção ao vivo via Browser MCP em `localhost:3001` confirmou **um bug crítico** e nenhum gap estrutural relevante em outras áreas — o site já está bem fiel ao v3.

---

## FASE 1 — Comparações feitas

### 1.1 `motion.js` v3 vs `MotionLayer.tsx`

- Motion v3 (178 linhas) → MotionLayer.tsx (287 linhas)
- MotionLayer **já é um superconjunto** do motion.js v3. Todas as features do v3 estão presentes:
  - Grain overlay, IntersectionObserver reveal, data-reveal auto-add, reveal groups stagger, h-accent, cursor spotlight em cards, header scroll state, parallax, magnetismo em btn-primary, mouse-follow parallax de orbs, contador animado.
- **BUG CRÍTICO encontrado (linhas 218-256 originais)**: O `rerun` do MutationObserver re-processava apenas `data-reveal` e `.bsn-spot`, **nunca re-rodava o contador** `[data-count]`. Resultado: KPIs ficavam em "0" pra sempre quando vinham via `useQuery` async.
- **Segundo bug menor**: O `if (reduce) return` em linha 91 desligava tudo (inclusive o contador), então usuários com `prefers-reduced-motion: reduce` viam KPIs em "0" sem animação nem valor final.

### 1.2 `shared.css` v3 vs `globals.css`

- shared.css v3 (232 linhas — apenas tokens, bg layers, nav, btn, responsividade base)
- globals.css (3720 linhas — inclui TODO o conteúdo específico das páginas que o v3 tem em `<style>` embutido por HTML)
- Comparação direta da base: **100% portado**. Tokens (`--bg/--ink/--violet/--cyan/--magenta/--amber/--emerald/--line/--glass/--radius`), camadas (`bg-glass/bg-aurora/bg-grid/bg-noise/page-shards`), glass primitive, shell, nav, burger, mobile-sheet, responsividade — todos idênticos.
- Grep confirmou que keyframes `bsnDotPulse`, `bsnShimmer`, `bsnChipSheen`, `bsnBarGrow` e classe `.link-under` estão presentes no globals.css.

### 1.3 HTML v3 vs JSX React

- Páginas HTML v3: 9 (index, servicos, solucoes, sobre, blog, contato, carreiras, privacidade, termos)
- Páginas React: 11 (adiciona BlogPost, NotFound)
- Estrutura: **equivalente**. Todas as classes CSS do v3 (`.hero/.hero-s/.mosaic/.svc-grid/.sol-grid/.about-grid/.values-grid/.team-grid/.feats/.posts/.contact-wrap/.perks/.jobs/.legal/.card-live/.card-pill/.band/.stack`) estão sendo emitidas no JSX.
- As páginas React ainda **adicionam features** que não estão no v3 (CMS-driven, fallbacks, timeline de processos, clients marquee) — isso é melhoria, não gap.

### 1.4 `new-layout/` v1 em git history
- Último commit tocando `new-layout/`: `203150d feat: redesign vitral/glassmorphism em todo o site + CMS para o novo layout`
- Zero stash pendente.
- Nada crítico a recuperar — o v3 já é a versão canônica.

---

## FASE 2 — Inspeção ao vivo via Browser MCP

Todas as páginas capturadas via Browser MCP em `localhost:3001`. Cada página carrega, aplica glassmorphism, mostra conteúdo da API corretamente. Resumo visual:

| Página | Status |
|---|---|
| `/` | OK. Hero orbit funciona, nodes dos serviços renderizam, KPIs agora corretos, live-strip, vitral, timeline, clients marquee, band, stack |
| `/servicos` | OK. Hero + 7 `.svc` cards, features 2x2 |
| `/solucoes` | OK. Hero + 6 `.sol` cards com pills de tech e bullets coloridos |
| `/sobre` | OK. Hero + 4 about cards (missão/visão/forma/evitamos) + valores + team |
| `/blog` | OK. Hero + feat-card + posts |
| `/contato` | OK. Hero + badges LGPD + canais + form com chips |
| `/carreiras` | OK. Hero + 4 perks + 5 vagas dinâmicas da API |
| `/privacidade` | OK. Layout legal com seções numeradas |
| `/termos` | OK (mesma estrutura de privacidade) |
| `/admin/login` | OK. Card de login com glassmorphism, form funcional |

---

## 🐛 BUGS CONFIRMADOS

### BUG-001 (P0 — CRÍTICO) — KPIs zerados ⚠️ → ✅ CORRIGIDO
- **Onde**: `frontend/src/components/layout/MotionLayer.tsx` linhas 195-216 (setup inicial) e linhas 218-261 (MutationObserver rerun)
- **Sintoma**: Seção `.kpis-section` mostra `0+`, `0+`, `0 dias`, `0/7` em vez de `12+`, `80+`, `5 dias`, `24/7`
- **Causa**: Observer do contador criado no primeiro useEffect mount, mas `<span data-count>` só existem depois da `useQuery` terminar. O `rerun` do MutationObserver re-processa `data-reveal` e `.bsn-spot` mas **não chama attach para novos contadores**.
- **Fix aplicado**: Criado função `attachCounter(el)` idempotente (marca `dataset.counterAttached = '1'`), chamada tanto no setup inicial quanto dentro de `rerun()`. Também tratado `prefers-reduced-motion: reduce` — nesse caso define valor final direto (sem animação) e cria um MutationObserver próprio pra pegar elementos novos.

---

## ✅ Não são bugs / não precisam correção
- Snapshot do Browser MCP às vezes mostra árvore incompleta enquanto queries ainda estão carregando. É timing do snapshot, não bug do site.
- Alturas de cards com stretch variável já foram corrigidas no commit anterior (9302fa4).
- Logo SVG da BSN substituído no commit d04e5b3.
- Glassmorphism pesado, page-shards animados, aurora, grain, grid — todos ativos visualmente.

---

## FASE 4 — Correções

### 4.1 Fix do contador KPI — ✅ concluído
- MotionLayer.tsx modificado
- Validado ao vivo: KPIs mostram `12+`, `80+`, `5 dias`, `24/7`

### 4.2 Portar animações/CSS faltando do v3 — ✅ não aplicável
- Comparação completou: nenhuma animação ou regra CSS do v3 está faltando no React.

### 4.3 Ajustar JSX divergente — ✅ não aplicável
- Estruturas são equivalentes; React adiciona features (não subtrai).

### 4.4 Admin — ✅ verificado
- `/admin/login` renderiza corretamente com glassmorphism.

---

## FASE 5 — Validação final

- [ ] Re-capturar todas as páginas após o fix pra confirmar ainda funcionando
- [ ] Rodar `npm run build` no frontend — garantir que o fix não quebrou typecheck
- [ ] Criar `AI/HISTORY/22_04_2026-HH_MM_FIX_GAPS_V3.md`
- [ ] Commit local (sem push)

---

## Métricas
- Total de bugs encontrados: 1 (P0)
- Corrigidos: 1
- Gaps estruturais: 0
- CSS/JS faltando: 0
