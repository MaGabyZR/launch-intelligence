import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { ok, serverError, assertMethod } from '../../src/server/response'
import { Prisma } from '@prisma/client'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, 'GET')) return

  try {
    const {
      platform,
      minScore,
      maxScore,
      fromDate,
      toDate,
      hasFunding,
      ycBatch,
      search,
      sort = 'engagementScore',
      sortDir = 'desc',
      limit = '50',
      offset = '0',
    } = req.query as Record<string, string>

    const lim = Math.min(Number(limit), 200)
    const off = Number(offset)

    const where: Prisma.LaunchWhereInput = {}

    if (platform && platform !== 'ALL') {
      where.platform = platform as 'X' | 'LINKEDIN'
    }
    if (minScore || maxScore) {
      where.engagementScore = {
        ...(minScore ? { gte: Number(minScore) } : {}),
        ...(maxScore ? { lte: Number(maxScore) } : {}),
      }
    }
    if (fromDate || toDate) {
      where.postedAt = {
        ...(fromDate ? { gte: new Date(fromDate) } : {}),
        ...(toDate   ? { lte: new Date(toDate)   } : {}),
      }
    }

    const companyWhere: Prisma.CompanyWhereInput = {}
    if (hasFunding === 'true') companyWhere.totalRaised = { gt: 0 }
    if (ycBatch) companyWhere.ycBatch = ycBatch
    if (search)  companyWhere.name    = { contains: search, mode: 'insensitive' }
    if (Object.keys(companyWhere).length > 0) where.company = companyWhere

    const dir = sortDir === 'asc' ? Prisma.SortOrder.asc : Prisma.SortOrder.desc

    const orderBy: Prisma.LaunchOrderByWithRelationInput =
      sort === 'postedAt'      ? { postedAt: dir }
      : sort === 'totalRaised' ? { company: { totalRaised: dir } }
      : { engagementScore: dir }

    const [items, total] = await prisma.$transaction([
      prisma.launch.findMany({
        where,
        orderBy,
        take: lim,
        skip: off,
        include: { company: true },
      }),
      prisma.launch.count({ where }),
    ])

    return ok(res, { items, total, hasMore: off + lim < total, offset: off + lim })
  } catch (err) {
    return serverError(res, err)
  }
}
