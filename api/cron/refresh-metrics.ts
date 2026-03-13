import { PrismaClient } from "@prisma/client"
import type { VercelRequest, VercelResponse } from "@vercel/node"
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
const assertCronSecret = (req: VercelRequest, res: VercelResponse) => { if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) { res.status(401).json({ error: "Unauthorized" }); return false } return true }
const computeRawScore = (likes: number, shares: number, comments: number, impressions: number) => likes * 0.35 + shares * 0.30 + comments * 0.20 + impressions * 0.15
const normalizeScore = (raw: number, p95: number) => p95 === 0 ? 0 : Math.min(100, Math.round((raw / p95) * 100))

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronSecret(req, res)) return
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentLaunches = await prisma.launch.findMany({ where: { postedAt: { gte: sevenDaysAgo }, platform: "X" } })
  let updated = 0
  for (const launch of recentLaunches) {
    if (!process.env.X_BEARER_TOKEN) break
    try {
      const r = await fetch(`https://api.twitter.com/2/tweets/${launch.postId}?tweet.fields=public_metrics`, { headers: { Authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } })
      if (!r.ok) continue
      const data = await r.json() as Record<string, unknown>
      const m = ((data?.data as Record<string, unknown>)?.public_metrics ?? {}) as Record<string, number>
      await prisma.launch.update({ where: { id: launch.id }, data: { likes: m.like_count ?? launch.likes, shares: m.retweet_count ?? launch.shares, comments: m.reply_count ?? launch.comments, impressions: m.impression_count ?? launch.impressions, metricsUpdatedAt: new Date() } })
      updated++
      await new Promise(r => setTimeout(r, 100))
    } catch { /* skip */ }
  }
  const all = await prisma.launch.findMany()
  const rawScores = all.map((l) => computeRawScore(l.likes, l.shares, l.comments, l.impressions)).sort((a: number, b: number) => a - b)
  const p95 = rawScores[Math.floor(rawScores.length * 0.95)] ?? 1
  for (const launch of all) {
    const score = normalizeScore(computeRawScore(launch.likes, launch.shares, launch.comments, launch.impressions), p95)
    if (Math.abs(score - launch.engagementScore) > 0.5) await prisma.launch.update({ where: { id: launch.id }, data: { engagementScore: score } })
  }
  res.json({ ok: true, refreshed: updated, total: recentLaunches.length })
}
