/**
 * Sincroniza cover images dos posts já criados com o blog-posts-data.json.
 * Usado depois de trocar imagens duplicadas no JSON — atualiza via API
 * usando Bearer token.
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
  slug: string
  coverImage: string
}

const posts: PostInput[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'blog-posts-data.json'), 'utf-8')
)

;(async () => {
  console.log(`Atualizando ${posts.length} cover images…`)
  let ok = 0
  let fail = 0
  for (const [i, post] of posts.entries()) {
    process.stdout.write(`[${i + 1}/${posts.length}] ${post.slug} … `)
    try {
      const res = await fetch(`${API_URL}/${post.slug}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coverImage: post.coverImage }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`[${res.status}] ${text.slice(0, 120)}`)
      }
      console.log('ok')
      ok++
    } catch (err: any) {
      console.log(`falhou: ${err.message}`)
      fail++
    }
  }
  console.log(`\nFim: ${ok} ok, ${fail} falhas`)
})()
