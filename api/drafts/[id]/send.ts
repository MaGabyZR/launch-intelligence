import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/server/db'
import { ok, notFound, serverError, methodNotAllowed } from '../../../src/server/response'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const { id } = req.query as { id: string }

  try {
    const updated = await prisma.draft.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    })
    return ok(res, updated)
  } catch (err: any) {
    if (err?.code === 'P2025') return notFound(res, `Draft ${id} not found`)
    return serverError(res, err)
  }
}
