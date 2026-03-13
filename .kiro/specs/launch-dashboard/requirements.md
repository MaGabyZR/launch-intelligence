# Launch Intelligence Dashboard — Requirements

## Deployment Target
**100% Vercel free tier** — no AWS, no Docker, no paid services required to run.
- Frontend: React 18 + Vite SPA → Vercel static hosting
- Backend: TypeScript serverless functions → Vercel Functions (Node.js 20)
- Database: Neon Postgres (free tier — 0.5GB, 10 branches)
- Crons: Vercel Cron (free tier — 2 cron jobs)
- AI: Anthropic Claude API (pay-per-use, ~$0.001/DM)

---

## FR-01: Launch Feed (Core)
As an Analyst, I can view a live table of startup launches from X and LinkedIn.
- AC: Table renders within 2s with server-side pagination (50 rows default)
- AC: Columns: Company, Platform, Posted, Likes, Shares, Score, Raised, YC, Contact
- AC: Auto-refreshes every 15 minutes via TanStack Query refetchInterval
- AC: Data sourced from Neon Postgres `launches` + `companies` tables

## FR-02: Engagement Scoring
- AC: Score = (likes×0.35 + shares×0.30 + comments×0.20 + impressions×0.15) / p95 × 100
- AC: p95 computed across all posts, recomputed hourly by cron
- AC: Color bands: ≥75 green (Viral), 50–74 blue (Solid), 25–49 amber, <25 red (Low)

## FR-03: Funding Data
- AC: Crunchbase API enrichment for total raised, round type, investors
- AC: YC batch pulled from YC directory or manually seeded
- AC: Funding column sortable in dashboard table

## FR-04: Filters & Export
- AC: Platform filter (X / LinkedIn / All), score floor, date range, YC batch, has-funding, search
- AC: Export current filtered view as CSV or JSON (GET /api/export)
- AC: Result count shown when filters active

## FR-05: Contact Enrichment (Bonus 1)
- AC: Expandable panel per company row with: email, phone, LinkedIn URL, X handle
- AC: Confidence badge (High/Medium/Low) per field, shown on hover
- AC: Copy-to-clipboard per field
- AC: Re-enrich button triggers POST /api/companies/:domain/contact
- AC: Apollo.io primary → Hunter.io email fallback
- AC: Cached in Postgres `enriched_at`; stale after 14 days

## FR-06: AI DM Drafting (Bonus 2)
- AC: Vercel Cron runs hourly: finds posts with score < 25 and age < 14 days
- AC: Claude API (claude-haiku, ~$0.001/draft) generates personalized DM
- AC: DMs appear in Outreach Queue page; status: DRAFT → APPROVED → SENT → RESPONDED
- AC: Inline editing with character counter (280 for X, 500 for LinkedIn)
- AC: Send button requires APPROVED status first

## NFR
- No AWS services — all infra on Vercel free tier
- Neon Postgres free tier (0.5GB, sufficient for 100K launches)
- Secrets in Vercel Environment Variables (never in code or .env)
- CRON_SECRET header protects cron endpoints from public invocation
