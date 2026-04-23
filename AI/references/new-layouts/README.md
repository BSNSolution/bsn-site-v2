# new-layout* — protótipos HTML de referência

**Propósito:** arquivos em `new-layout/`, `new-layout-v2/` e `new-layout-v3/`
(na raiz do monorepo) são **protótipos estáticos** que nortearam o design
da versão React atual. **Não são código de produção**.

Use esta pasta (`AI/references/new-layouts/`) como índice documental — os
arquivos em si continuam na raiz, para poderem ser abertos rapidamente via
`open-with-browser` sem navegar na árvore do `AI/`.

---

## Estrutura das pastas

### `new-layout/` — v1
Primeira iteração do redesign. Mais plana, menos glassmorphism.
Útil como referência de estrutura de seções (hero, mosaic, clients,
timeline) antes da adoção definitiva do tema vitral.

### `new-layout-v2/` — v2
Iteração intermediária. Introduziu:
- Heróis com `orbit-ring` (girando).
- Cards glass com `shard` (blob colorido blur).
- Marquee duplo de clients.
- Timeline zigzag inicial.

### `new-layout-v3/` — v3 (base do React atual)
Iteração **final** — tudo o que está em `frontend/src/styles/parts/` é
derivado dela. Contém, entre outros:
- `motion.css` — origem do spotlight cursor-aware e reveal-on-scroll.
- `home.html`, `services.html`, `solutions.html`, `about.html`, `blog.html`,
  `careers.html`, `contact.html`, `legal.html` — ground truth visual.
- `service-detail.html` e `ia.html` — páginas criadas depois, seguindo o
  mesmo padrão.

---

## Quando consultar

1. Dúvida sobre comportamento visual esperado de alguma seção.
2. Reintroduzir animação/efeito que foi perdido durante uma refatoração.
3. Validar se mudança no React manteve a UX do protótipo.

---

## Quando **não** editar

- **Nunca** edite os HTMLs para "consertar" algo no site. A única coisa
  que edita o site é o React em `frontend/src/`. Os protótipos são
  congelados como referência histórica.
- Se alterar o design do site, documente em `AI/DECISIONS.md`/`AI/HISTORY/`
  — não é obrigatório manter os protótipos alinhados.

---

## Por que não removemos

Foram discutidos no code review de 23/04/2026 como candidatos a remoção
(`AI/AUDITORIAS/23_04_2026-CODE_REVIEW.md` item #6). Decisão do dono:
**manter como referência**, porque:
- Custo zero (HTML estático, não entra no bundle nem no deploy do React).
- Documentam a "intenção" do design, útil para onboarding de novos devs.
- Permitem comparar rapidamente (side-by-side) o resultado vs. o desenho.
