import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { ok, serverError, assertMethod } from '../../src/server/response'
import type { DraftStatus } from '@prisma/client'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'GET')) return
  try {
    const { status } = req.query as Record<string, string>
    const drafts = await prisma.draft.findMany({
      where:   status ? { status: status as DraftStatus } : undefined,
      include: { company: true, launch: true },
      orderBy: { generatedAt: 'desc' },
    })
    return ok(res, drafts)
  } catch (err) { return serverError(res, err) }
}
