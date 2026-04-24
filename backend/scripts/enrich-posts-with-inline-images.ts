/**
 * Enriquece os 34 posts do blog-posts-data.json adicionando 2 imagens inline
 * em cada um (depois da 1ª e 2ª seção ##). Imagens variadas do Unsplash
 * escolhidas por tema, garantindo nenhuma duplicata entre os posts.
 *
 * Executa em 2 modos:
 *   - Sem argumento: atualiza só o arquivo JSON local
 *   - --sync: além do JSON, propaga via PUT /api/v1/blog/:slug (precisa de BSN_API_TOKEN)
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

// Pool de imagens Unsplash agrupadas por tema — IDs únicos. Cada post usa 2
// imagens diferentes de sua categoria primária (ou fallback "generic").
// IDs reais do Unsplash (todos em /photo-XXX formato).
const IMAGE_POOL: Record<string, string[]> = {
  team: [
    'photo-1522071820081-009f0129c71c', // team meeting
    'photo-1542744173-8e7e53415bb0', // team laptops
    'photo-1551836022-deb4988cc6c0', // team brainstorm
    'photo-1556761175-5973dc0f32e7', // team discussion
    'photo-1600880292203-757bb62b4baf', // team office
    'photo-1531482615713-2afd69097998', // team office 2
  ],
  code: [
    'photo-1555066931-4365d14bab8c', // code screen
    'photo-1542831371-29b0f74f9713', // laptop code
    'photo-1587620962725-abab7fe55159', // code close
    'photo-1516259762381-22954d7d3ad2', // dev workspace
    'photo-1504384308090-c894fdcc538d', // code editor
    'photo-1629654297299-c8506221db00', // terminal
  ],
  ai: [
    'photo-1677442136019-21780ecad995', // ai chatgpt
    'photo-1620712943543-bcc4688e7485', // ai brain
    'photo-1561736778-92e52a7769ef', // robot hand
    'photo-1535378917042-10a22c95931a', // ai circuit
    'photo-1507146153580-69a1fe6d8aa1', // neural net
  ],
  architecture: [
    'photo-1451187580459-43490279c0fa', // servers
    'photo-1558494949-ef010cbdcc31', // data center
    'photo-1639322537228-f710d846310a', // cloud infra
    'photo-1544197150-b99a580bb7a8', // cables
    'photo-1532618500676-2e0cbf7ba8b8', // architecture diagram
  ],
  strategy: [
    'photo-1486406146926-c627a92ad1ab', // planning whiteboard
    'photo-1460925895917-afdab827c52f', // analytics dashboard
    'photo-1507679799987-c73779587ccf', // strategy meeting
    'photo-1434626881859-194d67b2b86f', // planning
    'photo-1552664730-d307ca884978', // business strategy
  ],
  mobile: [
    'photo-1512941937669-90a1b58e7e9c', // phone apps
    'photo-1526406915894-7bcd65f60845', // phone in hand
    'photo-1551650975-87deedd944c3', // mobile design
    'photo-1605236453806-6ff36851218e', // phone app ui
  ],
  design: [
    'photo-1561070791-2526d30994b8', // ui design
    'photo-1559028012-481c04fa702d', // wireframe
    'photo-1586717791821-3f44a563fa4c', // sketch
    'photo-1626785774573-4b799315345d', // design tools
  ],
  data: [
    'photo-1543286386-713bdd548da4', // charts
    'photo-1551288049-bebda4e38f71', // analytics
    'photo-1504868584819-f8e8b4b6d7e3', // data viz
    'photo-1518186285589-2f7649de83e0', // database
  ],
  security: [
    'photo-1550751827-4bd374c3f58b', // lock digital
    'photo-1510915361894-db8b60106cb1', // security abstract
    'photo-1496096265110-f83ad7f96608', // cybersec
  ],
  generic: [
    'photo-1498050108023-c5249f4df085', // workspace
    'photo-1522202176988-66273c2fd55f', // meeting
    'photo-1517245386807-bb43f82c33c4', // office modern
    'photo-1497366216548-37526070297c', // office 2
    'photo-1497215728101-856f4ea42174', // collaboration
  ],
}

const UNSPLASH_QUERY = '?q=80&w=1400&auto=format&fit=crop'

function imageUrl(id: string): string {
  return `https://images.unsplash.com/${id}${UNSPLASH_QUERY}`
}

// Mapeia tags/slug-keywords pra categorias de imagens.
function pickCategories(post: Post): string[] {
  const text = (post.slug + ' ' + post.tags.join(' ') + ' ' + post.title).toLowerCase()
  const cats: string[] = []
  if (/squad|time|alocacao|performance|gestao|cultura|carreira|lideranca|tech.?lead/.test(text)) cats.push('team')
  if (/clean.?code|solid|padrao|mvp|elixir|phoenix|copilot|linguagem|refactor|legad|tecnic|arquitet/.test(text)) cats.push('code')
  if (/ia|inteligencia|rpa|automacao|machine.?learning|chatgpt|prompt/.test(text)) cats.push('ai')
  if (/devops|cloud|infra|deploy|servidor|microservico|api/.test(text)) cats.push('architecture')
  if (/estrategi|decisa|escolh|contrat|roi|custo|negoc|posicion|premium|servic|solu|discovery/.test(text)) cats.push('strategy')
  if (/mobile|app|aplicativ|ios|android|flutter/.test(text)) cats.push('mobile')
  if (/design|ux|ui|visualiza/.test(text)) cats.push('design')
  if (/dado|erp|analytic|sql|relatori/.test(text)) cats.push('data')
  if (/lgpd|seguranca|compliance/.test(text)) cats.push('security')
  if (cats.length === 0) cats.push('generic')
  return cats
}

// Round-robin sobre as imagens de cada categoria, garantindo unicidade global.
const used = new Set<string>()

function takeImage(categories: string[]): string {
  for (const cat of categories) {
    const pool = IMAGE_POOL[cat] ?? []
    for (const id of pool) {
      if (!used.has(id)) {
        used.add(id)
        return imageUrl(id)
      }
    }
  }
  // fallback: cycle through generic mesmo repetindo se tudo já usado
  for (const id of IMAGE_POOL.generic) {
    if (!used.has(id)) {
      used.add(id)
      return imageUrl(id)
    }
  }
  return imageUrl(IMAGE_POOL.generic[0])
}

function captionFor(post: Post, nth: number): string {
  const topic = post.tags?.[0] ?? 'contexto'
  const captions = [
    `${post.tags?.[0] ?? 'Tema'} na prática`,
    `Contexto: ${topic}`,
    `Operação real de ${topic}`,
    `Ilustração de ${topic}`,
  ]
  return captions[nth % captions.length]
}

function injectInlineImages(post: Post): string {
  const content = post.content

  // Encontra índices onde começa cada seção "## "
  const sectionStarts: number[] = []
  const re = /^## /gm
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) sectionStarts.push(m.index)

  // Se tem menos de 2 seções, insere só 1 imagem no final da intro
  if (sectionStarts.length === 0) return content

  const cats = pickCategories(post)

  // Posição 1: antes da 2ª seção (se houver), senão no fim
  // Posição 2: antes da 4ª ou última seção
  const insertions: { at: number; markdown: string }[] = []

  const img1 = takeImage(cats)
  const img2 = takeImage(cats)

  const caption1 = captionFor(post, 0)
  const caption2 = captionFor(post, 1)

  const firstInsertAt = sectionStarts[1] ?? content.length
  insertions.push({
    at: firstInsertAt,
    markdown: `\n![${caption1}](${img1})\n\n`,
  })

  if (sectionStarts.length >= 4) {
    const secondInsertAt = sectionStarts[Math.min(sectionStarts.length - 1, 3)]
    insertions.push({
      at: secondInsertAt,
      markdown: `\n![${caption2}](${img2})\n\n`,
    })
  }

  // Aplica de trás pra frente pra não quebrar índices
  insertions.sort((a, b) => b.at - a.at)
  let result = content
  for (const { at, markdown } of insertions) {
    result = result.slice(0, at) + markdown + result.slice(at)
  }
  return result
}

async function main() {
  const raw = fs.readFileSync(FILE, 'utf-8')
  const posts: Post[] = JSON.parse(raw)

  // Marca cover images como usadas (extraindo o id photo-XXX)
  for (const p of posts) {
    const match = p.coverImage.match(/photo-[a-f0-9-]+/)
    if (match) used.add(match[0])
  }

  const updated: Post[] = []
  for (const p of posts) {
    // Evita re-injetar se já tem imagem no content
    if (/!\[[^\]]*\]\([^)]+\)/.test(p.content)) {
      console.log(`skip (já tem imagem): ${p.slug}`)
      updated.push(p)
      continue
    }
    const newContent = injectInlineImages(p)
    updated.push({ ...p, content: newContent })
    console.log(`enriched: ${p.slug}`)
  }

  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2) + '\n', 'utf-8')
  console.log(`\nJSON atualizado: ${FILE}`)

  if (SYNC) {
    if (!TOKEN) {
      console.error('\nBSN_API_TOKEN não definido — skipping sync via API.')
      return
    }
    console.log(`\nSincronizando ${updated.length} posts via API…`)
    let ok = 0
    let fail = 0
    for (const p of updated) {
      process.stdout.write(`  ${p.slug} … `)
      try {
        const res = await fetch(`${API_URL}/${p.slug}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: p.content }),
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(`[${res.status}] ${txt.slice(0, 120)}`)
        }
        console.log('ok')
        ok++
      } catch (err: any) {
        console.log(`falhou: ${err.message}`)
        fail++
      }
    }
    console.log(`\nFim: ${ok} ok, ${fail} falhas`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
