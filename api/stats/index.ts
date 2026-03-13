import { PrismaClient } from "@prisma/client";
import type { VercelRequest, VercelResponse } from "@vercel/node";
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
const ok = (res: VercelResponse, data: unknown) => res.status(200).json(data);
const serverError = (res: VercelResponse, err: unknown) => {
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
};
const assertMethod = (
  req: VercelRequest,
  res: VercelResponse,
  ...methods: string[]
) => {
  if (!methods.includes(req.method ?? "")) {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertMethod(req, res, "GET")) return;
  try {
    const [launchAgg, fundingAgg, pendingCount] = await prisma.$transaction([
      prisma.launch.aggregate({
        _count: { id: true },
        _avg: { engagementScore: true },
      }),
      prisma.company.aggregate({ _sum: { totalRaised: true } }),
      prisma.draft.count({ where: { status: "DRAFT" } }),
    ]);
    return ok(res, {
      totalLaunches: launchAgg._count.id,
      avgEngagementScore: Math.round(launchAgg._avg.engagementScore ?? 0),
      totalRaisedAggregate: fundingAgg._sum.totalRaised ?? 0,
      dmsPendingReview: pendingCount,
    });
  } catch (err) {
    return serverError(res, err);
  }
}
