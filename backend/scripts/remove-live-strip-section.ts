import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orders: Record<string, number> = {
  'hero-orbit': 0,
  kpis: 1,
  stack: 2,
  'scroll-hint': 3,
  vitral: 4,
  timeline: 5,
  clients: 6,
  band: 7,
}

async function main() {
  const del = await prisma.pageSection.deleteMany({
    where: { page: 'home', sectionKey: 'live-strip' },
  })
  console.log(`Removido live-strip — ${del.count} linha(s)`)

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
