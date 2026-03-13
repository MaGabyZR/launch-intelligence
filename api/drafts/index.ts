import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { DraftStatus } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data)
const serverError = (res: VercelResponse, err: unknown) => { console.error(err); return res.status(500).json({ error: "Internal server error" }) }
const assertMethod = (req: VercelRequest, res: VercelResponse, ...methods: string[]) => { if (!methods.includes(req.method ?? "")) { res.status(405).json({ error: "Method not allowed" }); return false } return true }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, "GET")) return
  try {
    const { status } = req.query as Record<string, string>
    const drafts = await prisma.draft.findMany({
      where: status ? { status: status as DraftStatus } : undefined,
      include: { company: true, launch: true },
      orderBy: { generatedAt: "desc" },
    })
    return ok(res, drafts)
  } catch (err) { return serverError(res, err) }
}
