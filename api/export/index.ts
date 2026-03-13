import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { serverError, assertMethod } from '../../src/server/response'
import { Prisma } from '@prisma/client'

type LaunchRow = {
  company: string; domain: string; platform: string; postedAt: string
  likes: number; shares: number; comments: number; impressions: number
  engagementScore: number; totalRaised: number; roundType: string
  ycBatch: string; postUrl: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'GET')) return
  try {
    const { platform, minScore, search, format = 'csv' } = req.query as Record<string, string>
    const where: Prisma.LaunchWhereInput = {}
    if (platform && platform !== 'ALL') where.platform = platform as 'X' | 'LINKEDIN'
    if (minScore) where.engagementScore = { gte: Number(minScore) }
    if (search)   where.company = { name: { contains: search, mode: 'insensitive' } }

    const launches = await prisma.launch.findMany({
      where, orderBy: { engagementScore: 'desc' }, take: 5000, include: { company: true },
    })

    const items: LaunchRow[] = launches.map((l) => ({
      company:         l.company.name,
      domain:          l.company.domain,
      platform:        l.platform,
      postedAt:        l.postedAt.toISOString(),
      likes:           l.likes,
      shares:          l.shares,
      comments:        l.comments,
      impressions:     l.impressions,
      engagementScore: l.engagementScore,
      totalRaised:     l.company.totalRaised,
      roundType:       l.company.lastRoundType ?? '',
      ycBatch:         l.company.ycBatch ?? '',
      postUrl:         l.postUrl,
    }))

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename="launches.json"')
      return res.send(JSON.stringify(items, null, 2))
    }

    const headers = Object.keys(items[0] ?? {}) as (keyof LaunchRow)[]
    const csv = [
      headers.join(','),
      ...items.map((row: LaunchRow) =>
        headers.map(h => `"${String(row[h] ?? '')}"`).join(',')
      ),
    ].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="launches.csv"')
    return res.send(csv)
  } catch (err) { return serverError(res, err) }
}
