import type { VercelRequest, VercelResponse } from '@vercel/node'
import { prisma } from '../../src/server/db'
import { isLowEngagement } from '../../src/server/scoring'
import { assertCronSecret } from '../../src/server/response'
import type { Company, Launch } from '@prisma/client'

async function generateDM(company: Company, post: Launch): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return `Hey! Saw the ${company.name} launch — ${company.description}. Really interesting angle. Would love to connect and hear how it's going!`
  }

  const charLimit = post.platform === 'X' ? 280 : 500
  const prompt = [
    `Write a ${charLimit}-char max DM to the founder of "${company.name}" (${company.description}).`,
    `They just launched on ${post.platform}.`,
    company.ycBatch ? `They are a ${company.ycBatch} YC company.` : '',
    company.totalRaised > 0 ? `They raised ${company.lastRoundType ?? 'funding'} ($${(company.totalRaised / 1e6).toFixed(1)}M).` : '',
    `Tone: peer-to-peer founder, warm, specific, curious. Never mention engagement or follower counts.`,
    `Output only the message text, nothing else.`,
  ].filter(Boolean).join(' ')

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await r.json()
  return data?.content?.[0]?.text ?? `Hey! Loved seeing the ${company.name} launch. Would love to connect.`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!assertCronSecret(req, res)) return

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

  const candidates = await prisma.launch.findMany({
    where: {
      engagementScore: { lt: 25 },
      postedAt:        { gt: fourteenDaysAgo },
      dmDraftId:       null,
    },
    include: { company: true },
    take: 20,
  })

  let generated = 0
  for (const launch of candidates) {
    if (!isLowEngagement(launch.engagementScore, launch.postedAt)) continue
    try {
      const draftText = await generateDM(launch.company, launch)

      const draft = await prisma.draft.create({
        data: {
          companyId: launch.company.id,
          launchId:  launch.id,
          platform:  launch.platform,
          draftText,
        },
      })

      await prisma.launch.update({
        where: { id: launch.id },
        data:  { dmDraftId: draft.id },
      })
      generated++
    } catch { /* skip individual failures */ }
  }

  res.json({ ok: true, generated, candidates: candidates.length })
}
