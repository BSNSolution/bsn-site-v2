import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orders: Record<string, number> = {
  hero: 0,
  benefits: 1,
  cases: 2,
  data: 3,
  stages: 4,
  'cta-band': 5,
}

async function main() {
  for (const [sectionKey, order] of Object.entries(orders)) {
    const result = await prisma.pageSection.updateMany({
      where: { page: 'ai', sectionKey },
      data: { order },
    })
    console.log(`[ai/${sectionKey}] order=${order} — ${result.count} linha(s)`)
  }
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
