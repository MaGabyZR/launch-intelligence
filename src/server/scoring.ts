/**
 * Compute a normalized engagement score 0–100.
 * Uses a simple weighted formula — p95 normalization runs during the cron refresh.
 */
export function computeRawScore(likes: number, shares: number, comments: number, impressions: number): number {
  return likes * 0.35 + shares * 0.30 + comments * 0.20 + impressions * 0.15
}

export function normalizeScore(raw: number, p95: number): number {
  if (p95 === 0) return 0
  return Math.min(100, Math.round((raw / p95) * 100))
}

export function scoreLabel(score: number): string {
  if (score >= 75) return 'Viral'
  if (score >= 50) return 'Solid'
  if (score >= 25) return 'Below Avg'
  return 'Low'
}

export function isLowEngagement(score: number, postedAt: Date): boolean {
  const ageMs = Date.now() - postedAt.getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  return score < 25 && ageDays < 14
}
