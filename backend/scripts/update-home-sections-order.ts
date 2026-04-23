import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orders: Record<string, number> = {
  'hero-orbit': 0,
  kpis: 1,
  stack: 2,
  'live-strip': 3,
  'scroll-hint': 4,
  vitral: 5,
  timeline: 6,
  clients: 7,
  band: 8,
}

async function main() {
  for (const [sectionKey, order] of Object.entries(orders)) {
    const result = await prisma.pageSection.updateMany({
      where: { page: 'home', sectionKey },
      data: { order },
    })
    console.log(`[home/${sectionKey}] order=${order} — ${result.count} linha(s)`)
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
