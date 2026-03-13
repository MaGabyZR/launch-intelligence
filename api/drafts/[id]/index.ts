import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data)
const badRequest = (res: VercelResponse, msg: string) => res.status(400).json({ error: msg })
const notFound = (res: VercelResponse, msg = "Not found") => res.status(404).json({ error: msg })
const serverError = (res: VercelResponse, err: unknown) => { console.error(err); return res.status(500).json({ error: "Internal server error" }) }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  if (req.method === "PATCH") {
    try {
      const { editedText, status } = (req.body ?? {}) as Record<string, string>
      const data: Record<string, unknown> = {}
      if (editedText !== undefined) data.editedText = editedText
      if (status !== undefined) data.status = status
      if (!Object.keys(data).length) return badRequest(res, "No fields to update")
      const updated = await prisma.draft.update({ where: { id }, data })
      return ok(res, updated)
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === "P2025") return notFound(res)
      return serverError(res, err)
    }
  }
  return res.status(405).json({ error: "Method not allowed" })
}
