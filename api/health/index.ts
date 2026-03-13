import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.status(200).json({ status: "ok", db: "connected", ts: new Date().toISOString() })
  } catch {
    return res.status(503).json({ status: "error", db: "disconnected" })
  }
}
