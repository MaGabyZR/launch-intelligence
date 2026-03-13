import { PrismaClient } from '@prisma/client'

// Prevent multiple Prisma instances in hot-reload / serverless environments.
// In production each function invocation is fresh, so globalThis is a no-op guard.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
