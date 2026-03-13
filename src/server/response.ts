import type { VercelRequest, VercelResponse } from '@vercel/node'

export function ok(res: VercelResponse, data: unknown) {
  return res.status(200).json(data)
}

export function created(res: VercelResponse, data: unknown) {
  return res.status(201).json(data)
}

export function badRequest(res: VercelResponse, message: string) {
  return res.status(400).json({ error: message })
}

export function notFound(res: VercelResponse, message = 'Not found') {
  return res.status(404).json({ error: message })
}

export function serverError(res: VercelResponse, err: unknown) {
  console.error(err)
  return res.status(500).json({ error: 'Internal server error' })
}

export function methodNotAllowed(res: VercelResponse) {
  return res.status(405).json({ error: 'Method not allowed' })
}

export function assertMethod(req: VercelRequest, res: VercelResponse, ...methods: string[]): boolean {
  if (!methods.includes(req.method ?? '')) {
    methodNotAllowed(res)
    return false
  }
  return true
}

export function assertCronSecret(req: VercelRequest, res: VercelResponse): boolean {
  const auth = req.headers.authorization
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
