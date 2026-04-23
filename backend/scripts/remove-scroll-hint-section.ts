import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const orders: Record<string, number> = {
  'hero-orbit': 0,
  kpis: 1,
  stack: 2,
  vitral: 3,
  timeline: 4,
  clients: 5,
  band: 6,
}

async function main() {
  const del = await prisma.pageSection.deleteMany({
    where: { page: 'home', sectionKey: 'scroll-hint' },
  })
  console.log(`Removido scroll-hint — ${del.count} linha(s)`)

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
