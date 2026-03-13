import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/server/db'
import { ok, notFound, serverError } from '../../../src/server/response'

async function enrichViaApollo(domain: string) {
  if (!process.env.APOLLO_API_KEY) return null
  try {
    const r = await fetch('https://api.apollo.io/v1/organizations/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': process.env.APOLLO_API_KEY },
      body: JSON.stringify({ domain }),
    })
    if (!r.ok) return null
    const data = await r.json()
    const person = data?.organization?.person
    return person ? {
      email: person.email ?? null,
      phone: person.phone ?? null,
      linkedin: person.linkedin_url ? `https://linkedin.com/in/${person.linkedin_url}` : null,
      x: person.twitter_url ? `@${person.twitter_url.split('/').pop()}` : null,
    } : null
  } catch { return null }
}

async function enrichEmailViaHunter(domain: string) {
  if (!process.env.HUNTER_API_KEY) return null
  try {
    const r = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}&limit=1`
    )
    if (!r.ok) return null
    const data = await r.json()
    const email = data?.data?.emails?.[0]
    return email ? { email: email.value, confidence: email.confidence > 70 ? 'High' : 'Medium' } : null
  } catch { return null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { domain } = req.query as { domain: string }

  if (req.method === 'GET') {
    try {
      const company = await prisma.company.findUnique({ where: { domain } })
      if (!company) return notFound(res)
      return ok(res, {
        email: company.contactEmail,
        phone: company.contactPhone,
        founderLinkedin: company.founderLinkedin,
        founderX: company.founderX,
        confidence: company.contactConfidence ?? { email: 'Low', phone: 'Low', linkedin: 'Low', x: 'Low' },
        enrichedAt: company.enrichedAt,
      })
    } catch (err) { return serverError(res, err) }
  }

  if (req.method === 'POST') {
    try {
      const company = await prisma.company.findUnique({ where: { domain } })
      if (!company) return notFound(res)

      const apollo = await enrichViaApollo(domain)
      let email = apollo?.email ?? null
      let emailConfidence: 'High' | 'Medium' | 'Low' = apollo?.email ? 'High' : 'Low'

      if (!email) {
        const hunter = await enrichEmailViaHunter(domain)
        if (hunter) { email = hunter.email; emailConfidence = hunter.confidence as 'High' | 'Medium' }
      }

      await prisma.company.update({
        where: { domain },
        data: {
          contactEmail: email,
          contactPhone: apollo?.phone ?? company.contactPhone,
          founderLinkedin: apollo?.linkedin ?? company.founderLinkedin,
          founderX: apollo?.x ?? company.founderX,
          contactConfidence: {
            email: emailConfidence,
            phone: apollo?.phone ? 'Medium' : 'Low',
            linkedin: apollo?.linkedin ? 'High' : 'Low',
            x: apollo?.x ? 'High' : 'Low',
          },
          enrichedAt: new Date(),
        },
      })

      return ok(res, { message: 'Enrichment complete' })
    } catch (err) { return serverError(res, err) }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
