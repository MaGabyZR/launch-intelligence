import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { computeRawScore, normalizeScore } from '../../src/server/scoring'
import { ok, badRequest, serverError, assertMethod } from '../../src/server/response'

function parseXUrl(url: string): { postId: string; handle: string } | null {
  const m = url.match(/(?:x\.com|twitter\.com)\/([^/]+)\/status\/(\d+)/)
  if (!m) return null
  return { handle: m[1], postId: m[2] }
}

async function fetchXPost(postId: string): Promise<Record<string, unknown> | null> {
  if (!process.env.X_BEARER_TOKEN) return null
  try {
    const r = await fetch(
      `https://api.twitter.com/2/tweets/${postId}?tweet.fields=public_metrics,created_at,author_id&expansions=author_id&user.fields=username,name`,
      { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }
    )
    if (!r.ok) return null
    return r.json() as Promise<Record<string, unknown>>
  } catch { return null }
}

async function getP95(): Promise<number> {
  const recent = await prisma.launch.findMany({
    select: { likes: true, shares: true, comments: true, impressions: true },
    orderBy: { createdAt: 'desc' },
    take: 500,
  })
  if (recent.length === 0) return 80_000
  const scores = recent
    .map((l) => computeRawScore(l.likes, l.shares, l.comments, l.impressions))
    .sort((a: number, b: number) => a - b)
  return scores[Math.floor(scores.length * 0.95)] ?? 1
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'POST')) return

  const { postUrl, platform = 'X', companyName, companyDomain, companyDescription } = (req.body ?? {}) as Record<string, string>

  if (!postUrl || typeof postUrl !== 'string') {
    return badRequest(res, 'postUrl is required')
  }

  try {
    let postId: string
    let authorHandle: string

    if (platform === 'X') {
      const parsed = parseXUrl(postUrl)
      if (!parsed) return badRequest(res, 'Invalid X post URL — expected https://x.com/handle/status/ID')
      postId = parsed.postId
      authorHandle = `@${parsed.handle}`
    } else {
      postId = postUrl
      authorHandle = companyName ?? 'unknown'
    }

    const existing = await prisma.launch.findUnique({ where: { postId } })
    if (existing) {
      return ok(res, { message: 'Post already tracked', launchId: existing.id, duplicate: true })
    }

    let likes = 0, shares = 0, comments = 0, impressions = 0
    let postText = ''
    let postedAt = new Date()
    let resolvedHandle = authorHandle

    if (platform === 'X') {
      const xData = await fetchXPost(postId)
      const data = xData?.data as Record<string, unknown> | undefined
      const m = (data?.public_metrics ?? {}) as Record<string, number>
      likes       = m.like_count       ?? 0
      shares      = m.retweet_count    ?? 0
      comments    = m.reply_count      ?? 0
      impressions = m.impression_count ?? 0
      if (typeof data?.text === 'string')        postText = data.text
      if (typeof data?.created_at === 'string')  postedAt = new Date(data.created_at)
      const users = (xData?.includes as Record<string, unknown>)?.users
      const user  = Array.isArray(users) ? (users[0] as Record<string, string>) : null
      if (user?.username) resolvedHandle = `@${user.username}`
    }

    const rawHandle  = resolvedHandle.replace('@', '')
    const inferDomain = companyDomain ?? `${rawHandle.toLowerCase()}.com`
    const inferName   = companyName   ?? rawHandle
    const inferDesc   = companyDescription ?? 'Startup tracked via ingest'

    const company = await prisma.company.upsert({
      where:  { domain: inferDomain },
      update: {},
      create: { domain: inferDomain, name: inferName, description: inferDesc, totalRaised: 0, leadInvestors: [] },
    })

    const p95   = await getP95()
    const raw   = computeRawScore(likes, shares, comments, impressions)
    const score = normalizeScore(raw, p95)

    const launch = await prisma.launch.create({
      data: {
        postId, companyId: company.id, platform: platform as 'X' | 'LINKEDIN',
        postUrl, postText, authorHandle: resolvedHandle, postedAt,
        likes, shares, comments, impressions, engagementScore: score,
      },
      include: { company: true },
    })

    if (process.env.CRUNCHBASE_API_KEY && company.totalRaised === 0) {
      const appUrl = process.env.VITE_APP_URL ?? ''
      fetch(`${appUrl}/api/companies/${inferDomain}/funding`, { method: 'POST' }).catch(() => {})
    }

    return ok(res, { message: 'Launch ingested', launchId: launch.id, companyId: company.id, score, duplicate: false })
  } catch (err) {
    return serverError(res, err)
  }
}
