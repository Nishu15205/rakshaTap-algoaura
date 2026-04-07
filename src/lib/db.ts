import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Add a small post-install script check: generate Prisma client on import
export const db = new PrismaClient({
  log: [],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
