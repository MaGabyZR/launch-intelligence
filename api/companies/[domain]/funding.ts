import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../../src/server/db'
import { ok, notFound, serverError } from '../../../src/server/response'
import type { RoundType } from '@prisma/client'

// ── Crunchbase API helpers ────────────────────────────────────────────────

interface CrunchbaseOrg {
  name?: string
  short_description?: string
  total_funding_usd?: number
  last_funding_type?: string
  last_funding_at?: string
  investor_identifiers?: Array<{ value: string }>
}

// Map Crunchbase funding types → Prisma RoundType enum
const ROUND_MAP: Record<string, RoundType> = {
  pre_seed:     'Pre_Seed',
  seed:         'Seed',
  series_a:     'Series_A',
  series_b:     'Series_B',
  series_c:     'Series_C',
  series_d:     'Series_C',
  series_e:     'Series_C',
  series_f:     'Series_C',
  grant:        'Grant',
  angel:        'Pre_Seed',
  convertible_note: 'Pre_Seed',
  corporate_round: 'Unknown',
  debt_financing:  'Unknown',
  equity_crowdfunding: 'Seed',
  initial_coin_offering: 'Unknown',
  post_ipo_equity: 'Unknown',
  post_ipo_debt:   'Unknown',
  private_equity:  'Series_C',
  secondary_market: 'Unknown',
  undisclosed:     'Unknown',
}

async function fetchCrunchbase(domain: string): Promise<CrunchbaseOrg | null> {
  if (!process.env.CRUNCHBASE_API_KEY) return null
  try {
    // Crunchbase Basic API v4: lookup by domain
    const url = `https://api.crunchbase.com/api/v4/entities/organizations/${domain}?user_key=${process.env.CRUNCHBASE_API_KEY}&field_ids=short_description,total_funding_usd,last_funding_type,last_funding_at,investor_identifiers`
    const r = await fetch(url)
    if (!r.ok) return null
    const data = await r.json()
    return data?.properties ?? null
  } catch { return null }
}

async function searchCrunchbase(name: string): Promise<CrunchbaseOrg | null> {
  if (!process.env.CRUNCHBASE_API_KEY) return null
  try {
    const r = await fetch(
      `https://api.crunchbase.com/api/v4/autocompletes?user_key=${process.env.CRUNCHBASE_API_KEY}&query=${encodeURIComponent(name)}&collection_ids=organizations&limit=1`
    )
    if (!r.ok) return null
    const data = await r.json()
    const slug = data?.entities?.[0]?.identifier?.permalink
    if (!slug) return null

    // Fetch full org data
    const r2 = await fetch(
      `https://api.crunchbase.com/api/v4/entities/organizations/${slug}?user_key=${process.env.CRUNCHBASE_API_KEY}&field_ids=short_description,total_funding_usd,last_funding_type,last_funding_at,investor_identifiers`
    )
    if (!r2.ok) return null
    const data2 = await r2.json()
    return data2?.properties ?? null
  } catch { return null }
}

// ── Handler ───────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { domain } = req.query as { domain: string }

  // GET — return cached funding data
  if (req.method === 'GET') {
    try {
      const company = await prisma.company.findUnique({
        where: { domain },
        select: {
          totalRaised:   true,
          lastRoundType: true,
          lastRoundDate: true,
          leadInvestors: true,
          updatedAt:     true,
        },
      })
      if (!company) return notFound(res)
      return ok(res, company)
    } catch (err) { return serverError(res, err) }
  }

  // POST — trigger fresh Crunchbase enrichment
  if (req.method === 'POST') {
    try {
      const company = await prisma.company.findUnique({ where: { domain } })
      if (!company) return notFound(res)

      // Try domain first, fall back to name search
      let org = await fetchCrunchbase(domain)
      if (!org?.total_funding_usd) org = await searchCrunchbase(company.name)

      if (!org) {
        return ok(res, { message: 'No Crunchbase data found', enriched: false })
      }

      const roundKey = (org.last_funding_type ?? '').toLowerCase().replace(/ /g, '_')
      const roundType: RoundType = ROUND_MAP[roundKey] ?? 'Unknown'
      const investors = (org.investor_identifiers ?? [])
        .map((i) => i.value)
        .filter(Boolean)
        .slice(0, 10)

      await prisma.company.update({
        where: { domain },
        data: {
          totalRaised:   org.total_funding_usd   ?? company.totalRaised,
          lastRoundType: roundType,
          lastRoundDate: org.last_funding_at     ?? company.lastRoundDate,
          leadInvestors: investors.length > 0 ? investors : company.leadInvestors,
          // Only update description if it's still the placeholder
          ...(company.description === 'Startup tracked via ingest' && org.short_description
            ? { description: org.short_description }
            : {}),
        },
      })

      return ok(res, {
        message:      'Funding enriched',
        enriched:     true,
        totalRaised:  org.total_funding_usd,
        roundType,
        investors,
      })
    } catch (err) { return serverError(res, err) }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
