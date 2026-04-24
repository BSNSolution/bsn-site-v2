/**
 * Script que popula o blog com 36 posts iniciais via API de integração
 * externa (/api/v1/blog). Conteúdo original escrito para BSN Solution,
 * inspirado em pautas de mercado mas sem copiar texto de concorrentes.
 *
 * Usage:
 *   BSN_API_TOKEN=bsn_xxx npx tsx scripts/seed-blog-posts.ts
 */

import fs from 'fs'
import path from 'path'

const API_URL = process.env.BSN_API_URL ?? 'http://localhost:3002/api/v1/blog'
const TOKEN = process.env.BSN_API_TOKEN
if (!TOKEN) {
  console.error('Set BSN_API_TOKEN env var')
  process.exit(1)
}

interface PostInput {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  tags: string[]
  isPublished?: boolean
}

const POSTS: PostInput[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'blog-posts-data.json'), 'utf-8')
)

async function createPost(post: PostInput): Promise<void> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...post, isPublished: false }),
  })
  if (!res.ok) {
    const text = await res.text()
    if (res.status === 409) {
      console.log(`  ↳ slug já existe (pulando)`)
      return
    }
    throw new Error(`[${res.status}] ${text.slice(0, 200)}`)
  }
}

;(async () => {
  console.log(`Criando ${POSTS.length} posts…`)
  let ok = 0, fail = 0
  for (const [i, post] of POSTS.entries()) {
    process.stdout.write(`[${i + 1}/${POSTS.length}] ${post.slug} … `)
    try {
      await createPost(post)
      console.log('ok')
      ok++
    } catch (err: any) {
      console.log(`falhou: ${err.message}`)
      fail++
    }
  }
  console.log(`\nFim: ${ok} ok, ${fail} falhas`)
})()
