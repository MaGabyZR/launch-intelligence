import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    await prisma.$queryRaw`SELECT 1`
    return res.status(200).json({ status: 'ok', db: 'connected', ts: new Date().toISOString() })
  } catch {
    return res.status(503).json({ status: 'error', db: 'disconnected' })
  }
}
