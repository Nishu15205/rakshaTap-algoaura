import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// On Netlify, SQLite must be in /tmp (writable ephemeral storage)
// On local dev, use the default DATABASE_URL (file:./db/custom.db)
function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  
  // Netlify Functions run in AWS Lambda where /tmp is the only writable dir
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return 'file:/tmp/mumaa.db'
  }
  
  return envUrl
}

export const db = new PrismaClient({
  log: [],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
