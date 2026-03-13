import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data)
const notFound = (res: VercelResponse, msg = "Not found") => res.status(404).json({ error: msg })
const serverError = (res: VercelResponse, err: unknown) => { console.error(err); return res.status(500).json({ error: "Internal server error" }) }

async function enrichWithApollo(domain: string, name: string) {
  if (!process.env.APOLLO_API_KEY) return null
  try {
    const r = await fetch("https://api.apollo.io/v1/people/search", { method: "POST", headers: { "Content-Type": "application/json", "x-api-key": process.env.APOLLO_API_KEY }, body: JSON.stringify({ q_organization_domains: domain, person_titles: ["founder", "co-founder", "ceo"], per_page: 1 }) })
    if (!r.ok) return null
    const data = await r.json() as { people?: Array<{ email?: string; phone_numbers?: Array<{ sanitized_number?: string }>; linkedin_url?: string; twitter_url?: string }> }
    const person = data?.people?.[0]
    if (!person) return null
    return { email: person.email ?? null, phone: person.phone_numbers?.[0]?.sanitized_number ?? null, founderLinkedin: person.linkedin_url ?? null, founderX: person.twitter_url ?? null, confidence: { email: person.email ? "High" : "Low", phone: person.phone_numbers?.length ? "Medium" : "Low", linkedin: person.linkedin_url ? "High" : "Low", x: person.twitter_url ? "High" : "Low" } }
  } catch { return null }
}

async function enrichWithHunter(domain: string) {
  if (!process.env.HUNTER_API_KEY) return null
  try {
    const r = await fetch(`https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${process.env.HUNTER_API_KEY}&limit=1`)
    if (!r.ok) return null
    const data = await r.json() as { data?: { emails?: Array<{ value?: string; confidence?: number }> } }
    const email = data?.data?.emails?.[0]
    if (!email?.value) return null
    return { email: email.value, phone: null, founderLinkedin: null, founderX: null, confidence: { email: (email.confidence ?? 0) > 70 ? "High" : "Medium", phone: "Low", linkedin: "Low", x: "Low" } }
  } catch { return null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { domain } = req.query as { domain: string }
  if (req.method === "GET") {
    try {
      const company = await prisma.company.findUnique({ where: { domain }, select: { contactEmail: true, contactPhone: true, founderLinkedin: true, founderX: true, contactConfidence: true, enrichedAt: true } })
      if (!company) return notFound(res)
      return ok(res, { email: company.contactEmail, phone: company.contactPhone, founderLinkedin: company.founderLinkedin, founderX: company.founderX, confidence: company.contactConfidence ?? { email: "Low", phone: "Low", linkedin: "Low", x: "Low" }, enrichedAt: company.enrichedAt })
    } catch (err) { return serverError(res, err) }
  }
  if (req.method === "POST") {
    try {
      const company = await prisma.company.findUnique({ where: { domain } })
      if (!company) return notFound(res)
      let enriched = await enrichWithApollo(domain, company.name)
      if (!enriched?.email) { const hunter = await enrichWithHunter(domain); if (hunter) enriched = enriched ? { ...enriched, email: hunter.email, confidence: { ...enriched.confidence, email: hunter.confidence.email } } : hunter }
      if (!enriched) return ok(res, { message: "No contact data found", enriched: false })
      await prisma.company.update({ where: { domain }, data: { contactEmail: enriched.email, contactPhone: enriched.phone, founderLinkedin: enriched.founderLinkedin, founderX: enriched.founderX, contactConfidence: enriched.confidence, enrichedAt: new Date() } })
      return ok(res, { message: "Enriched", enriched: true, ...enriched })
    } catch (err) { return serverError(res, err) }
  }
  return res.status(405).json({ error: "Method not allowed" })
}
