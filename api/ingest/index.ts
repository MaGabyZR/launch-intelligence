import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data)
const badRequest = (res: VercelResponse, msg: string) => res.status(400).json({ error: msg })
const serverError = (res: VercelResponse, err: unknown) => { console.error(err); return res.status(500).json({ error: "Internal server error" }) }
const assertMethod = (req: VercelRequest, res: VercelResponse, ...methods: string[]) => { if (!methods.includes(req.method ?? "")) { res.status(405).json({ error: "Method not allowed" }); return false } return true }
const computeRawScore = (likes: number, shares: number, comments: number, impressions: number) => likes * 0.35 + shares * 0.30 + comments * 0.20 + impressions * 0.15
const normalizeScore = (raw: number, p95: number) => p95 === 0 ? 0 : Math.min(100, Math.round((raw / p95) * 100))

function parseXUrl(url: string) {
  const m = url.match(/(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/)
  return m ? { handle: m[1], postId: m[2] } : null
}

async function fetchXPost(postId: string): Promise<Record<string, unknown> | null> {
  if (!process.env.X_BEARER_TOKEN) return null
  try {
    const r = await fetch(`https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics,created_at&expansions=author_id&user.fields=username`, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } })
    return r.ok ? r.json() as Promise<Record<string, unknown>> : null
  } catch { return null }
}

async function getP95(): Promise<number> {
  const recent = await prisma.launch.findMany({ select: { likes: true, shares: true, comments: true, impressions: true }, orderBy: { createdAt: "desc" }, take: 500 })
  if (!recent.length) return 80000
  const scores = recent.map((l) => computeRawScore(l.likes, l.shares, l.comments, l.impressions)).sort((a: number, b: number) => a - b)
  return scores[Math.floor(scores.length * 0.95)] ?? 1
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, "POST")) return
  const { postUrl, platform = "X", companyName, companyDomain, companyDescription } = (req.body ?? {}) as Record<string, string>
  if (!postUrl) return badRequest(res, "postUrl is required")
  try {
    let postId: string, authorHandle: string
    if (platform === "X") {
      const parsed = parseXUrl(postUrl)
      if (!parsed) return badRequest(res, "Invalid X post URL — expected https://x.com/handle/status/ID")
      postId = parsed.postId; authorHandle = `@${parsed.handle}`
    } else { postId = postUrl; authorHandle = companyName ?? "unknown" }

    const existing = await prisma.launch.findUnique({ where: { postId } })
    if (existing) return ok(res, { message: "Post already tracked", launchId: existing.id, duplicate: true })

    let likes = 0, shares = 0, comments = 0, impressions = 0, postText = "", postedAt = new Date(), resolvedHandle = authorHandle
    if (platform === "X") {
      const xData = await fetchXPost(postId)
      const d = xData?.data as Record<string, unknown> | undefined
      const m = (d?.public_metrics ?? {}) as Record<string, number>
      likes = m.like_count ?? 0; shares = m.retweet_count ?? 0; comments = m.reply_count ?? 0; impressions = m.impression_count ?? 0
      if (typeof d?.text === "string") postText = d.text
      if (typeof d?.created_at === "string") postedAt = new Date(d.created_at)
      const users = (xData?.includes as Record<string, unknown>)?.users
      const user = Array.isArray(users) ? (users[0] as Record<string, string>) : null
      if (user?.username) resolvedHandle = `@${user.username}`
    }

    const inferDomain = companyDomain ?? `${resolvedHandle.replace("@", "").toLowerCase()}.com`
    const company = await prisma.company.upsert({ where: { domain: inferDomain }, update: {}, create: { domain: inferDomain, name: companyName ?? resolvedHandle.replace("@", ""), description: companyDescription ?? "Startup tracked via ingest", totalRaised: 0, leadInvestors: [] } })
    const score = normalizeScore(computeRawScore(likes, shares, comments, impressions), await getP95())
    const launch = await prisma.launch.create({ data: { postId, companyId: company.id, platform: platform as "X" | "LINKEDIN", postUrl, postText, authorHandle: resolvedHandle, postedAt, likes, shares, comments, impressions, engagementScore: score }, include: { company: true } })
    return ok(res, { message: "Launch ingested", launchId: launch.id, companyId: company.id, score, duplicate: false })
  } catch (err) { return serverError(res, err) }
}
