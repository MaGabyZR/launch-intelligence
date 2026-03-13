import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { ok, serverError, assertMethod } from '../../src/server/response'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'GET')) return
  try {
    const [launchAgg, fundingAgg, pendingCount] = await prisma.$transaction([
      prisma.launch.aggregate({
        _count: { id: true },
        _avg: { engagementScore: true },
      }),
      prisma.company.aggregate({
        _sum: { totalRaised: true },
      }),
      prisma.draft.count({ where: { status: 'DRAFT' } }),
    ])

    return ok(res, {
      totalLaunches: launchAgg._count.id,
      avgEngagementScore: Math.round(launchAgg._avg.engagementScore ?? 0),
      totalRaisedAggregate: fundingAgg._sum.totalRaised ?? 0,
      dmsPendingReview: pendingCount,
    })
  } catch (err) {
    return serverError(res, err)
  }
}
