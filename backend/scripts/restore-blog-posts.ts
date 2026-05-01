/**
 * Helper one-shot pra restaurar os 29 posts do blog-posts-data.json.
 * Cria token API temporário (scope blog:write + upload:write), chama o
 * seed-blog-posts via fetch, depois revoga o token.
 *
 * Uso: BSN_API_URL=http://localhost:3002 npx tsx scripts/restore-blog-posts.ts
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { createHash, randomBytes } from 'crypto'

const prisma = new PrismaClient()

const BASE = process.env.BSN_API_URL ?? 'http://localhost:3002'
const API_URL = `${BASE}/api/v1/blog`

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
  fs.readFileSync(path.join(__dirname, 'blog-posts-data.json'), 'utf-8'),
)

async function createTempToken() {
  const plain = 'bsn_' + randomBytes(30).toString('base64url')
  const hash = createHash('sha256').update(plain).digest('hex')
  const prefix = plain.slice(0, 12)
  const token = await prisma.apiToken.create({
    data: {
      name: 'TEMP — restore-blog-posts',
      tokenHash: hash,
      tokenPrefix: prefix,
      scopes: ['blog:read', 'blog:write', 'upload:write'],
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1h
    },
  })
  return { id: token.id, plain }
}

async function revokeToken(id: string) {
  await prisma.apiToken.update({
    where: { id },
    data: { isActive: false },
  })
}

async function createPost(post: PostInput, token: string): Promise<'created' | 'skipped' | 'error'> {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...post, isPublished: false }),
    })
    if (res.status === 409) return 'skipped'
    if (!res.ok) {
      const text = await res.text()
      console.error(`  ✗ ${post.slug} [${res.status}] ${text.slice(0, 200)}`)
      return 'error'
    }
    return 'created'
  } catch (err: any) {
    console.error(`  ✗ ${post.slug} ${err?.message ?? err}`)
    return 'error'
  }
}

async function main() {
  console.log(`🌱 Restaurando ${POSTS.length} posts via ${API_URL}`)
  const { id, plain } = await createTempToken()
  console.log(`🔑 Token temporário criado (expira em 1h, scopes: blog:write, upload:write)`)

  let created = 0,
    skipped = 0,
    errors = 0
  try {
    for (const post of POSTS) {
      const result = await createPost(post, plain)
      if (result === 'created') {
        created++
        console.log(`  ✓ ${post.slug}`)
      } else if (result === 'skipped') {
        skipped++
      } else {
        errors++
      }
    }
  } finally {
    await revokeToken(id)
    console.log(`🔒 Token temporário revogado.`)
  }

  console.log(
    `\n✅ Concluído. Criados: ${created} · Pulados (já existiam): ${skipped} · Erros: ${errors}`,
  )
}

main()
  .catch((err) => {
    console.error('❌ Falha geral:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
