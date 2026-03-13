import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/server/db'
import { ok, notFound, serverError, badRequest } from '../../../src/server/response'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  const urlParts = (req.url ?? '').split('?')[0].split('/')
  const action = urlParts[urlParts.length - 1]

  if (req.method === 'PATCH') {
    try {
      const { editedText, status } = req.body ?? {}
      const data: Record<string, unknown> = {}
      if (editedText !== undefined) data.editedText = editedText
      if (status !== undefined) data.status = status
      if (!Object.keys(data).length) return badRequest(res, 'No fields to update')

      const updated = await prisma.draft.update({ where: { id }, data })
      return ok(res, updated)
    } catch (err: any) {
      if (err?.code === 'P2025') return notFound(res)
      return serverError(res, err)
    }
  }

  if (req.method === 'POST' && action === 'send') {
    try {
      const updated = await prisma.draft.update({
        where: { id },
        data: { status: 'SENT', sentAt: new Date() },
      })
      return ok(res, updated)
    } catch (err: any) {
      if (err?.code === 'P2025') return notFound(res)
      return serverError(res, err)
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
