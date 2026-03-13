import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { computeRawScore, normalizeScore } from '../../src/server/scoring'
import { assertCronSecret } from '../../src/server/response'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronSecret(req, res)) return

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentLaunches = await prisma.launch.findMany({
    where: { postedAt: { gte: sevenDaysAgo }, platform: 'X' },
  })

  let updated = 0
  for (const launch of recentLaunches) {
    if (!process.env.X_BEARER_TOKEN) break
    try {
      const r = await fetch(
        `https://api.twitter.com/2/tweets/${launch.postId}?tweet.fields=public_metrics`,
        { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } }
      )
      if (!r.ok) continue
      const data = await r.json() as Record<string, unknown>
      const m = ((data?.data as Record<string, unknown>)?.public_metrics ?? {}) as Record<string, number>
      if (!m) continue
      await prisma.launch.update({
        where: { id: launch.id },
        data: {
          likes:       m.like_count       ?? launch.likes,
          shares:      m.retweet_count    ?? launch.shares,
          comments:    m.reply_count      ?? launch.comments,
          impressions: m.impression_count ?? launch.impressions,
          metricsUpdatedAt: new Date(),
        },
      })
      updated++
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch { /* skip */ }
  }

  const all = await prisma.launch.findMany()
  const rawScores = all
    .map((l) => computeRawScore(l.likes, l.shares, l.comments, l.impressions))
    .sort((a: number, b: number) => a - b)
  const p95 = rawScores[Math.floor(rawScores.length * 0.95)] ?? 1

  for (const launch of all) {
    const raw   = computeRawScore(launch.likes, launch.shares, launch.comments, launch.impressions)
    const score = normalizeScore(raw, p95)
    if (Math.abs(score - launch.engagementScore) > 0.5) {
      await prisma.launch.update({ where: { id: launch.id }, data: { engagementScore: score } })
    }
  }

  let cbEnriched = 0
  if (process.env.CRUNCHBASE_API_KEY) {
    const unenriched = await prisma.company.findMany({ where: { totalRaised: 0, enrichedAt: null }, take: 10 })
    for (const company of unenriched) {
      try {
        const appUrl = process.env.VITE_APP_URL ?? 'http://localhost:3000'
        const r = await fetch(`${appUrl}/api/companies/${company.domain}/funding`, { method: 'POST' })
        if (r.ok) cbEnriched++
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch { /* skip */ }
    }
  }

  res.json({ ok: true, refreshed: updated, total: recentLaunches.length, cbEnriched })
}
