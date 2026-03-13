# Launch Intelligence Dashboard — Design

## Architecture: 100% Vercel Free Tier

```
┌─────────────────────────────────┐
│  Vercel (single project)        │
│                                 │
│  /dist          ← React SPA     │
│  /api/**        ← TS functions  │
│  Cron jobs      ← 2 jobs free   │
└────────────┬────────────────────┘
             │ Neon serverless driver
             ▼
┌────────────────────────────────┐
│  Neon Postgres (free tier)     │
│  companies · launches · drafts │
└────────────────────────────────┘
             
External APIs (all have free tiers):
  X API v2      → ingestion + metric refresh
  Crunchbase    → funding data
  Apollo.io     → contact enrichment
  Hunter.io     → email fallback
  Claude API    → DM generation (pay-per-use)
```

## Why This Stack Is Free
| Service | Free Tier |
|---------|-----------|
| Vercel Hosting | Unlimited static deploys |
| Vercel Functions | 100GB-hrs/month |
| Vercel Cron | 2 cron jobs free |
| Neon Postgres | 0.5GB, 190 compute hours/month |
| X API v2 | 500K tweets/month (Basic) |
| Crunchbase | 200 req/day |
| Apollo.io | 50 credits/month |
| Hunter.io | 25 searches/month |
| Claude Haiku | ~$0.001/DM — minimal cost |

## Stack Decisions

### Frontend
- **React 18 + Vite 5** — SPA, no SSR needed (all data from REST API)
- **TanStack Table v8** — sortable, server-side pagination-ready
- **TanStack Query v5** — caching, 15-min auto-refresh, optimistic updates
- **Tailwind CSS 3** — utility-first, zero runtime, dark industrial theme
- **React Router v6** — client-side routing with Vercel SPA rewrite

### Backend (Vercel Functions — /api/** directory)
Each file in `/api/` becomes a serverless function on Vercel.
No express server needed. Runtime: Node.js 20.

| File | Route |
|------|-------|
| api/launches/index.ts | GET /api/launches |
| api/stats/index.ts | GET /api/stats |
| api/companies/[domain]/contact.ts | GET + POST /api/companies/:domain/contact |
| api/drafts/index.ts | GET /api/drafts |
| api/drafts/[id].ts | PATCH + POST /api/drafts/:id |
| api/export/index.ts | GET /api/export |
| api/health/index.ts | GET /api/health |
| api/cron/refresh-metrics.ts | Cron: 0 */4 * * * |
| api/cron/generate-drafts.ts | Cron: 0 * * * * |

### Database (Neon Postgres + Prisma ORM)
- **Neon** — serverless Postgres; set both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) in env
- **Prisma ORM** — type-safe queries, `prisma/schema.prisma` is the single source of truth
- **prisma db push** — syncs schema to Neon without a migration history (ideal for early dev)
- **prisma migrate dev** — use once the schema is stable to start tracking migrations

Tables: `companies`, `launches`, `drafts`
(see `prisma/schema.prisma` for full schema with indexes and enums)

### Vercel Cron Jobs
Secured via `Authorization: Bearer {CRON_SECRET}` header.
Vercel automatically sends this when invoking cron routes.

```
0 8 * * *  → /api/cron/refresh-metrics   (refresh X metrics, recompute scores — 8am UTC daily)
0 9 * * *  → /api/cron/generate-drafts   (find low-score posts, call Claude — 9am UTC daily)
```

## Environment Variables (set in Vercel dashboard)
```
DATABASE_URL          Neon connection string
X_BEARER_TOKEN        X API v2 bearer token
CRUNCHBASE_API_KEY    Crunchbase basic API key
APOLLO_API_KEY        Apollo.io API key
HUNTER_API_KEY        Hunter.io API key
ANTHROPIC_API_KEY     Anthropic API key (Claude Haiku)
CRON_SECRET           Random string to secure cron endpoints
```

## Engagement Score Formula
```
rawScore = likes*0.35 + shares*0.30 + comments*0.20 + impressions*0.15
p95      = percentile(all_launches, 95)
score    = min(100, round(rawScore / p95 * 100))
```
p95 is recomputed in the refresh-metrics cron every 4 hours.

## DM Prompt (Claude Haiku)
```
System: You are a founder writing a peer-level DM. Warm, specific, brief.
        Never mention engagement metrics. Max {{charLimit}} characters.
User:   Write a DM to the founder of {{name}} ({{description}}).
        Just launched on {{platform}}.
        {{ycBatch?}} {{funding?}}
        Output only the message, nothing else.
```
Model: claude-haiku-4-5-20251001 (~$0.0008 per draft)
