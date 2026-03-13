import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data)
const notFound = (res: VercelResponse, msg = "Not found") => res.status(404).json({ error: msg })
const serverError = (res: VercelResponse, err: unknown) => { console.error(err); return res.status(500).json({ error: "Internal server error" }) }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" })
  const { id } = req.query as { id: string }
  try {
    const updated = await prisma.draft.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } })
    return ok(res, updated)
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === "P2025") return notFound(res, `Draft ${id} not found`)
    return serverError(res, err)
  }
}
