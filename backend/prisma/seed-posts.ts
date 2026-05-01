/**
 * Script idempotente que recria APENAS os posts iniciais do blog.
 * Usa upsert por slug — se o post existe, mantém o conteúdo atual; se não
 * existe, cria com os defaults. Não apaga nada.
 *
 * Uso: `npx tsx prisma/seed-posts.ts`
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const POSTS = [
  {
    title: 'Por que projetos sob medida superam SaaS genérico em operações complexas.',
    slug: 'sob-medida-vs-saas-generico',
    excerpt:
      'Um estudo com 14 administradoras mostrou que o ROI de soluções customizadas supera o de SaaS em até 3× ao longo de 24 meses — e explicamos por quê.',
    content:
      'Operações complexas acumulam exceções que SaaS genérico não cobre. Este long read apresenta a metodologia que usamos para avaliar quando sob medida vence — e os casos em que SaaS ainda faz sentido.',
    tags: ['Estratégia', 'Long read'],
    isPublished: true,
    isFeatured: true,
    publishedAt: new Date('2026-04-22T09:00:00.000Z'),
  },
  {
    title: 'Quando microserviços param de fazer sentido',
    slug: 'microservicos-deixam-de-fazer-sentido',
    excerpt: 'A hora certa de consolidar serviços sem perder governança.',
    content: 'Nem todo sistema precisa ser distribuído. Apresentamos critérios objetivos.',
    tags: ['Arquitetura'],
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2026-04-18T09:00:00.000Z'),
  },
  {
    title: 'Do briefing ao MVP em 6 semanas: roteiro',
    slug: 'briefing-mvp-6-semanas',
    excerpt: 'O passo-a-passo que usamos para validar produtos em ciclo curto.',
    content: 'Roteiro detalhado por semanas.',
    tags: ['Produto'],
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2026-04-11T09:00:00.000Z'),
  },
  {
    title: 'Observabilidade pragmática em times pequenos',
    slug: 'observabilidade-pragmatica',
    excerpt: 'O mínimo que todo time deveria ter, sem custo proibitivo.',
    content: 'Logs, métricas e traces sem explodir a conta da cloud.',
    tags: ['Infra'],
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2026-04-04T09:00:00.000Z'),
  },
  {
    title: 'Como dizer "não" a features sem perder o cliente',
    slug: 'nao-a-features-sem-perder-cliente',
    excerpt: 'Técnicas para negociar escopo e preservar o roadmap.',
    content: 'A arte de dizer não construtivamente.',
    tags: ['Liderança'],
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2026-03-28T09:00:00.000Z'),
  },
  {
    title: 'Agentes úteis vs. agentes teatrais',
    slug: 'agentes-uteis-vs-teatrais',
    excerpt: 'Quando um agente de IA agrega valor real vs. apenas demonstra tecnologia.',
    content: 'Critérios para avaliar agentes.',
    tags: ['IA aplicada'],
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2026-03-21T09:00:00.000Z'),
  },
  {
    title: 'Assembleia digital auditada em cooperativa com 40k membros',
    slug: 'assembleia-digital-coop-40k',
    excerpt: 'Case detalhado da plataforma que entregamos.',
    content: 'Escala, auditoria e participação em uma assembleia digital.',
    tags: ['Case'],
    isPublished: true,
    isFeatured: false,
    publishedAt: new Date('2026-03-14T09:00:00.000Z'),
  },
]

async function main() {
  console.log('🌱 Seed idempotente de posts...')

  const admin = await prisma.user.findFirst({
    where: { email: 'admin@bsnsolution.com.br' },
  })
  if (!admin) {
    throw new Error('Usuário admin@bsnsolution.com.br não encontrado. Rode o seed completo primeiro.')
  }

  let created = 0
  let kept = 0
  for (const post of POSTS) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } })
    if (existing) {
      kept++
      continue
    }
    await prisma.blogPost.create({
      data: { ...post, authorId: admin.id },
    })
    created++
    console.log(`  + Criado: ${post.slug}`)
  }

  console.log(`\n✅ Concluído. Criados: ${created} · Mantidos (já existiam): ${kept}`)
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
