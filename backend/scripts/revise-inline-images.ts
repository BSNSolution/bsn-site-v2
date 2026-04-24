/**
 * Revisão definitiva das imagens inline:
 *
 * 1. Pool muito maior (70+ imagens) segmentado por tema fino
 * 2. Cada post recebe 2 imagens únicas diferentes entre si
 * 3. Imagens menores (w=900) para não ocuparem como cover
 * 4. Captions contextuais e descritivas (não "na prática")
 * 5. Nenhuma imagem repetida entre posts
 */
import fs from 'fs'
import path from 'path'

const FILE = path.join(__dirname, 'blog-posts-data.json')
const SYNC = process.argv.includes('--sync')
const API_URL = process.env.BSN_API_URL ?? 'http://localhost:3002/api/v1/blog'
const TOKEN = process.env.BSN_API_TOKEN

interface Post {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string[]
}

// Pool amplo e temático. Cada ID do Unsplash foi escolhido para ilustrar
// conceitos específicos — NÃO foto genérica.
const POOL = {
  // Time, colaboração, squad, gestão
  team: [
    'photo-1522071820081-009f0129c71c',   // reunião de equipe
    'photo-1542744173-8e7e53415bb0',      // team com laptops
    'photo-1521737604893-d14cc237f11d',   // team brainstorm
    'photo-1600880292089-90a7e086ee0c',   // standup
    'photo-1543269865-cbf427effbad',      // workshop post-its
    'photo-1557804506-669a67965ba0',      // reunião estratégia
    'photo-1521737852567-6949f3f9f2b5',   // colaboração
    'photo-1515187029135-18ee286d815b',   // team jovem
    'photo-1552664730-d307ca884978',      // discussão em grupo
    'photo-1573164574572-cb89e39749b4',   // team moderno
  ],
  // Desenvolvimento, codigo, programação
  code: [
    'photo-1555066931-4365d14bab8c',      // código colorido em tela
    'photo-1542831371-29b0f74f9713',      // laptop com código
    'photo-1587620962725-abab7fe55159',   // código close-up
    'photo-1516259762381-22954d7d3ad2',   // workspace de dev
    'photo-1550063873-ab792d00ac73',      // terminal escuro
    'photo-1629654297299-c8506221db00',   // terminal ide
    'photo-1581472723648-909f4851d4ae',   // teclado mecânico
    'photo-1517694712202-14dd9538aa97',   // dev codando
    'photo-1461749280684-dccba630e2f6',   // syntax highlight
    'photo-1542435503-956c469947f6',      // mac + código
  ],
  // IA, LLM, machine learning
  ai: [
    'photo-1620712943543-bcc4688e7485',   // AI abstract
    'photo-1677442136019-21780ecad995',   // chatgpt screenshot
    'photo-1535378917042-10a22c95931a',   // neural network
    'photo-1507146153580-69a1fe6d8aa1',   // rede neural visual
    'photo-1586374579358-9d19d632b6df',   // AI glowing
    'photo-1527474305487-b87b222841cc',   // data flow
  ],
  // Mobile, app, smartphones
  mobile: [
    'photo-1512941937669-90a1b58e7e9c',   // apps no phone
    'photo-1526406915894-7bcd65f60845',   // phone em mão
    'photo-1605236453806-6ff36851218e',   // app UI
    'photo-1572177812156-58036aae439c',   // smartphone UX
    'photo-1556656793-08538906a9f8',      // mobile dev
  ],
  // Design, UX, UI
  design: [
    'photo-1561070791-2526d30994b8',      // UI design wireframe
    'photo-1559028012-481c04fa702d',      // sketches e mockups
    'photo-1586717791821-3f44a563fa4c',   // design system
    'photo-1626785774573-4b799315345d',   // figma-like
    'photo-1581291518633-83b4ebd1d83e',   // journey map
  ],
  // Dados, analytics, dashboards
  data: [
    'photo-1543286386-713bdd548da4',      // gráficos dashboard
    'photo-1551288049-bebda4e38f71',      // analytics laptop
    'photo-1504868584819-f8e8b4b6d7e3',   // data viz abstract
    'photo-1518186285589-2f7649de83e0',   // database concept
    'photo-1460925895917-afdab827c52f',   // bi dashboard
    'photo-1554224155-6726b3ff858f',      // gráficos lineares
  ],
  // Segurança, LGPD, compliance
  security: [
    'photo-1550751827-4bd374c3f58b',      // lock digital
    'photo-1510915361894-db8b60106cb1',   // cyber abstract
    'photo-1496096265110-f83ad7f96608',   // security blue
    'photo-1563013544-824ae1b704d3',      // privacy lock
  ],
  // Arquitetura, servidores, devops, infra
  infra: [
    'photo-1451187580459-43490279c0fa',   // servers rack
    'photo-1558494949-ef010cbdcc31',      // datacenter
    'photo-1639322537228-f710d846310a',   // cloud infra
    'photo-1544197150-b99a580bb7a8',      // cables server
    'photo-1523474253046-8cd2748b5fd2',   // rede de servidores
  ],
  // Estratégia, planejamento, decisão
  strategy: [
    'photo-1486406146926-c627a92ad1ab',   // whiteboard planning
    'photo-1507679799987-c73779587ccf',   // meeting strategy
    'photo-1434626881859-194d67b2b86f',   // chess/decisão
    'photo-1454165804606-c3d57bc86b40',   // post-its estratégia
    'photo-1506784365847-bbad939e9335',   // agenda planner
  ],
  // Startup, mvp, iteração rápida
  startup: [
    'photo-1519389950473-47ba0277781c',   // equipe na mesa
    'photo-1529070538774-1843cb3265df',   // notebook pitch
    'photo-1556761175-b413da4baf72',      // startup office
    'photo-1551434678-e076c223a692',      // whiteboard ideias
  ],
  // Leitura, documentação, conhecimento
  knowledge: [
    'photo-1456324504439-367cee3b3c32',   // livro aberto técnico
    'photo-1532153955177-f59af40d6472',   // study notes
    'photo-1513001900722-370f803f498d',   // books tech
  ],
  // Processo, workflow, automação
  workflow: [
    'photo-1529400971008-f566de0e6dfc',   // workflow board
    'photo-1450101499163-c8848c66ca85',   // connected nodes
    'photo-1455849318743-b2233052fcff',   // pipeline de ideias
  ],
  // Business, contratos, negociação
  business: [
    'photo-1542744173-8e7e53415bb0',      // business deal
    'photo-1454165804606-c3d57bc86b40',   // handshake strategy
    'photo-1556761175-5973dc0f32e7',      // meeting contract
  ],
}

const UNSPLASH_PARAMS = '?q=80&w=900&auto=format&fit=crop'

function toUrl(id: string) {
  return `https://images.unsplash.com/${id}${UNSPLASH_PARAMS}`
}

// Mapa post → categorias ordenadas por relevância para escolher imagens
const POST_CATEGORIES: Record<string, { cats: (keyof typeof POOL)[]; captions: [string, string] }> = {
  'top-empresas-software-house-brasil-como-escolher': {
    cats: ['team', 'business'],
    captions: ['Time de software house em operação', 'Decisão de contratação exige análise técnica'],
  },
  'software-houses-especializadas-inteligencia-artificial': {
    cats: ['ai', 'code'],
    captions: ['Modelos de IA transformam processos de negócio', 'Desenvolvimento especializado exige stack diferente'],
  },
  'aplicativo-mobile-sob-medida-quando-vale-a-pena': {
    cats: ['mobile', 'strategy'],
    captions: ['App mobile sob medida acelera processos de campo', 'ROI do app se mede em economia operacional'],
  },
  'modernizacao-sistemas-legados-guia-pratico': {
    cats: ['code', 'infra'],
    captions: ['Legado acumula dívida técnica em cada release', 'Modernização incremental preserva valor operacional'],
  },
  'ia-atendimento-ao-cliente-o-que-funciona': {
    cats: ['ai', 'workflow'],
    captions: ['Chatbot com IA resolve casos simples em segundos', 'Arquitetura de atendimento híbrido IA + humano'],
  },
  'github-copilot-produtividade-real-desenvolvedores': {
    cats: ['code', 'ai'],
    captions: ['Copilot acelera tarefas repetitivas do dev', 'IA no editor muda o fluxo de programação'],
  },
  'primeiros-passos-github-copilot-guia-pratico': {
    cats: ['code', 'knowledge'],
    captions: ['Setup do Copilot no VS Code é rápido', 'Atalhos certos transformam a experiência'],
  },
  'rpa-automacao-processos-quando-vale-mais-que-ia': {
    cats: ['workflow', 'business'],
    captions: ['RPA replica cliques humanos em processos estáveis', 'Automação certa reduz custo operacional em 70%'],
  },
  'lgpd-desenvolvimento-software-checklist-pratico': {
    cats: ['security', 'data'],
    captions: ['Dados pessoais exigem arquitetura com privacidade por design', 'Inventário de dados é o primeiro passo de compliance'],
  },
  'erp-customizado-vs-prateleira-como-decidir': {
    cats: ['business', 'workflow'],
    captions: ['ERP sob medida mapeia processos reais da operação', 'Decisão custom vs prateleira depende do diferencial'],
  },
  'elixir-para-que-serve-quando-escolher': {
    cats: ['code', 'infra'],
    captions: ['Elixir brilha em sistemas com milhares de conexões simultâneas', 'BEAM roda no coração de WhatsApp e Discord'],
  },
  'design-servico-jornada-completa-processos': {
    cats: ['design', 'strategy'],
    captions: ['Jornada do usuário mapeia pontos de fricção ocultos', 'Design de serviço conecta produto e operação'],
  },
  'por-que-terceirizar-desenvolvimento-software': {
    cats: ['team', 'business'],
    captions: ['Terceirização traz senioridade que seria caro contratar', 'Parceria externa libera foco no core do negócio'],
  },
  'clean-code-solid-clean-architecture-pratica': {
    cats: ['code', 'knowledge'],
    captions: ['Clean Code reduz custo de manutenção no longo prazo', 'SOLID não é dogma — é ferramenta de decisão'],
  },
  'mvp-na-pratica-como-recortar-menor-produto': {
    cats: ['startup', 'strategy'],
    captions: ['MVP testa hipótese de valor com investimento mínimo', 'Recorte certo do escopo acelera validação'],
  },
  'padroes-de-design-programacao-quando-usar': {
    cats: ['code', 'knowledge'],
    captions: ['Design patterns resolvem problemas recorrentes de forma testada', 'Aplicar padrão errado polui mais do que não usar'],
  },
  'squad-as-a-service-alocando-times-resultado': {
    cats: ['team', 'strategy'],
    captions: ['Squad dedicada entrega previsibilidade mês a mês', 'Alocação por resultado muda a dinâmica cliente-fornecedor'],
  },
  'visualizacao-de-dados-principios-para-decisao': {
    cats: ['data', 'design'],
    captions: ['Gráfico bem desenhado acelera decisão executiva', 'Visualização ruim esconde insight valioso'],
  },
  'tech-lead-papel-que-todo-time-precisa': {
    cats: ['team', 'code'],
    captions: ['Tech Lead faz ponte entre código e produto', 'Mentoria técnica acelera juniores em 2x'],
  },
  'pm-ou-po-qual-a-diferenca-qual-precisa': {
    cats: ['strategy', 'team'],
    captions: ['PM pensa estratégia, PO prioriza backlog', 'Papéis complementares em produtos maduros'],
  },
  'melhores-linguagens-aplicacoes-web-2026': {
    cats: ['code', 'infra'],
    captions: ['Cada linguagem web tem contexto ideal de uso', 'Stack moderna combina TypeScript + Go + Rust'],
  },
  'software-sob-medida-negocio-protagonista': {
    cats: ['business', 'strategy'],
    captions: ['Software sob medida reflete processo real do negócio', 'SaaS engessa — custom adapta à operação'],
  },
  'software-customizado-vs-prateleira-matriz-decisao': {
    cats: ['business', 'workflow'],
    captions: ['Matriz de decisão ajuda a comparar TCO real', 'Custo inicial x custo de oportunidade ao longo de 3 anos'],
  },
  '5-prompts-chatgpt-claude-melhorar-codigo': {
    cats: ['ai', 'code'],
    captions: ['LLM vira copiloto quando o prompt é estruturado', 'Code review com IA pega bug antes do humano'],
  },
  'machine-learning-automatizar-tarefas-onde-comecar': {
    cats: ['ai', 'data'],
    captions: ['ML precisa de dado histórico limpo para treinar', 'Modelo em produção requer MLOps — não só notebook'],
  },
  'desenvolvimento-software-do-zero-guia-completo': {
    cats: ['startup', 'workflow'],
    captions: ['Produto do zero começa em discovery, não em código', 'Fases do desenvolvimento reduzem risco de pivô tardio'],
  },
  'alocacao-squads-construir-times-alto-desempenho': {
    cats: ['team', 'workflow'],
    captions: ['Alta performance nasce de composição + missão + autonomia', 'Rituais mínimos mantêm time alinhado sem reunião infinita'],
  },
  'software-house-premium-sinais-clientes-procuram': {
    cats: ['business', 'team'],
    captions: ['Clientes premium filtram fornecedor por sinais objetivos', 'Portfolio auditável é mais forte que slide de vendas'],
  },
  'phoenix-framework-apis-alta-performance-elixir': {
    cats: ['code', 'infra'],
    captions: ['Phoenix entrega APIs com latência P99 abaixo de 10ms', 'Concorrência BEAM escala vertical sem complicação'],
  },
}

// Pool global: IDs já usados (cover images e atribuições anteriores)
const used = new Set<string>()

function pickImage(cats: (keyof typeof POOL)[]): string {
  for (const cat of cats) {
    for (const id of POOL[cat]) {
      if (!used.has(id)) {
        used.add(id)
        return id
      }
    }
  }
  // Fallback: qualquer imagem não usada
  for (const cat of Object.keys(POOL) as (keyof typeof POOL)[]) {
    for (const id of POOL[cat]) {
      if (!used.has(id)) {
        used.add(id)
        return id
      }
    }
  }
  // Last resort: primeira do pool
  return POOL.code[0]
}

function replaceInlineImages(post: Post): string {
  const cfg = POST_CATEGORIES[post.slug]
  if (!cfg) {
    console.warn(`sem config para: ${post.slug}`)
    return post.content
  }

  const id1 = pickImage(cfg.cats)
  const id2 = pickImage(cfg.cats)
  const [cap1, cap2] = cfg.captions

  const url1 = toUrl(id1)
  const url2 = toUrl(id2)

  // Remove todas as imagens inline existentes e captura posições das 2 primeiras
  const imgRegex = /!\[[^\]]*\]\([^)]+\)\n*/g
  const withoutImages = post.content.replace(imgRegex, '')

  // Reinjeta 2 imagens novas em posições estratégicas:
  // - antes da 2ª seção ##
  // - antes da 4ª seção ## (ou no fim se não houver)
  const sectionStarts: number[] = []
  const re = /^## /gm
  let m: RegExpExecArray | null
  while ((m = re.exec(withoutImages))) sectionStarts.push(m.index)

  if (sectionStarts.length === 0) {
    return withoutImages + `\n\n![${cap1}](${url1})\n\n![${cap2}](${url2})\n`
  }

  const insertions: { at: number; md: string }[] = []
  const firstInsertAt = sectionStarts[1] ?? withoutImages.length
  insertions.push({ at: firstInsertAt, md: `\n![${cap1}](${url1})\n\n` })

  if (sectionStarts.length >= 4) {
    const secondInsertAt = sectionStarts[3]
    insertions.push({ at: secondInsertAt, md: `\n![${cap2}](${url2})\n\n` })
  } else if (sectionStarts.length >= 3) {
    const secondInsertAt = sectionStarts[sectionStarts.length - 1]
    insertions.push({ at: secondInsertAt, md: `\n![${cap2}](${url2})\n\n` })
  }

  insertions.sort((a, b) => b.at - a.at)
  let result = withoutImages
  for (const { at, md } of insertions) {
    result = result.slice(0, at) + md + result.slice(at)
  }
  return result
}

async function main() {
  const raw = fs.readFileSync(FILE, 'utf-8')
  const posts: Post[] = JSON.parse(raw)

  // Pré-marca cover images como usadas pra não reaparecerem inline
  for (const p of posts) {
    const m = p.coverImage.match(/photo-[a-f0-9-]+/)
    if (m) used.add(m[0])
  }

  const updated: Post[] = []
  for (const p of posts) {
    const newContent = replaceInlineImages(p)
    updated.push({ ...p, content: newContent })
  }

  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2) + '\n', 'utf-8')
  console.log(`JSON atualizado: ${updated.length} posts revisados`)
  console.log(`Imagens únicas usadas: ${used.size}`)

  if (SYNC) {
    if (!TOKEN) {
      console.error('BSN_API_TOKEN não definido — abortando sync.')
      return
    }
    console.log(`\nSincronizando via API...`)
    let ok = 0, fail = 0
    for (const p of updated) {
      try {
        const res = await fetch(`${API_URL}/${p.slug}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: p.content }),
        })
        if (!res.ok) throw new Error(`${res.status}`)
        ok++
        process.stdout.write('.')
      } catch (err: any) {
        fail++
        process.stdout.write('x')
      }
    }
    console.log(`\nSync: ${ok} ok, ${fail} falhas`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
