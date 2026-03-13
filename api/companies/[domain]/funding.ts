import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { RoundType } from "@prisma/client"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data)
const notFound = (res: VercelResponse, msg = "Not found") => res.status(404).json({ error: msg })
const serverError = (res: VercelResponse, err: unknown) => { console.error(err); return res.status(500).json({ error: "Internal server error" }) }

const ROUND_MAP: Record<string, RoundType> = { pre_seed: "Pre_Seed", seed: "Seed", series_a: "Series_A", series_b: "Series_B", series_c: "Series_C", series_d: "Series_C", series_e: "Series_C", grant: "Grant", angel: "Pre_Seed", convertible_note: "Pre_Seed" }

async function fetchCrunchbase(slug: string) {
  if (!process.env.CRUNCHBASE_API_KEY) return null
  try {
    const r = await fetch(`https://api.crunchbase.com/api/v4/entities/organizations/${slug}?user_key=${process.env.CRUNCHBASE_API_KEY}&field_ids=short_description,total_funding_usd,last_funding_type,last_funding_at,investor_identifiers`)
    if (!r.ok) return null
    const data = await r.json() as { properties?: { total_funding_usd?: number; last_funding_type?: string; last_funding_at?: string; investor_identifiers?: Array<{ value: string }> } }
    return data?.properties ?? null
  } catch { return null }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { domain } = req.query as { domain: string }
  if (req.method === "GET") {
    try {
      const company = await prisma.company.findUnique({ where: { domain }, select: { totalRaised: true, lastRoundType: true, lastRoundDate: true, leadInvestors: true, updatedAt: true } })
      if (!company) return notFound(res)
      return ok(res, company)
    } catch (err) { return serverError(res, err) }
  }
  if (req.method === "POST") {
    try {
      const company = await prisma.company.findUnique({ where: { domain } })
      if (!company) return notFound(res)
      const org = await fetchCrunchbase(domain)
      if (!org) return ok(res, { message: "No Crunchbase data found", enriched: false })
      const roundKey = (org.last_funding_type ?? "").toLowerCase().replace(/ /g, "_")
      const roundType: RoundType = ROUND_MAP[roundKey] ?? "Unknown"
      const investors = (org.investor_identifiers ?? []).map((i) => i.value).filter(Boolean).slice(0, 10)
      await prisma.company.update({ where: { domain }, data: { totalRaised: org.total_funding_usd ?? company.totalRaised, lastRoundType: roundType, lastRoundDate: org.last_funding_at ?? company.lastRoundDate, leadInvestors: investors.length > 0 ? investors : company.leadInvestors } })
      return ok(res, { message: "Funding enriched", enriched: true, totalRaised: org.total_funding_usd, roundType, investors })
    } catch (err) { return serverError(res, err) }
  }
  return res.status(405).json({ error: "Method not allowed" })
}
