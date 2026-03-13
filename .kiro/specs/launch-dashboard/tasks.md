# Launch Intelligence Dashboard — Implementation Tasks

## Phase 1: Project Setup & Database (Day 1)

- [ ] **1.1** Clone repo, run `npm install`, confirm dev server starts (`npm run dev`)
- [ ] **1.2** Create Neon project at neon.tech → copy `DATABASE_URL` to `.env.local`
- [ ] **1.3** Run `npm run db:push` → syncs `prisma/schema.prisma` to Neon (creates all tables)
- [ ] **1.4** Run `npm run db:seed` → seeds 50+ reference launches from the docx
- [ ] **1.5** Confirm seed: run `npm run db:studio` → Prisma Studio opens at localhost:5555, verify rows in all 3 tables
- [ ] **1.6** Test `/api/health` locally via `vercel dev` → should return `{ status: "ok", db: "connected" }`

## Phase 2: Core API (Day 1-2)

- [ ] **2.1** Test `GET /api/launches` — returns paginated list with company join
- [ ] **2.2** Test `GET /api/stats` — returns totalLaunches, avgScore, totalRaised, dmsPending
- [ ] **2.3** Test `GET /api/export?format=csv` — downloads CSV file
- [ ] **2.4** Add X API bearer token to env → test metric refresh on 1 post
- [ ] **2.5** Add Crunchbase key → enrich 3 companies with funding data, verify in DB

## Phase 3: Frontend (Day 2-3)

- [ ] **3.1** Dashboard renders stats strip with real DB data
- [ ] **3.2** Filter bar: platform pills, score filter, YC dropdown, search, clear button
- [ ] **3.3** LaunchTable: sorting, expandable rows, score color badges
- [ ] **3.4** ContactPanel: expand per row, copy buttons, confidence badges, re-enrich
- [ ] **3.5** CSV/JSON export button downloads filtered dataset
- [ ] **3.6** Outreach page: tabbed status view, draft cards with edit + approve + send flow

## Phase 4: Enrichment & AI (Day 3-4)

- [ ] **4.1** Add Apollo.io key → test POST /api/companies/:domain/contact enrichment
- [ ] **4.2** Add Hunter.io key → verify email fallback works when Apollo returns nothing
- [ ] **4.3** Add Anthropic key → test cron/generate-drafts manually (POST with CRON_SECRET header)
- [ ] **4.4** Verify draft appears in Outreach Queue with correct company + post context
- [ ] **4.5** Test edit → approve → send flow end-to-end

## Phase 5: Deploy to Vercel (Day 4)

- [ ] **5.1** Push repo to GitHub (`git init && git add . && git commit && git push`)
- [ ] **5.2** Import repo at vercel.com/new → Vercel auto-detects Vite
- [ ] **5.3** Add all environment variables in Vercel dashboard (Settings → Environment Variables):
       - `DATABASE_URL` (from Neon → pooled connection string)
       - `DIRECT_URL` (from Neon → direct/unpooled connection string — required by Prisma)
       - `X_BEARER_TOKEN`
       - `CRUNCHBASE_API_KEY`
       - `APOLLO_API_KEY`
       - `HUNTER_API_KEY`
       - `ANTHROPIC_API_KEY`
       - `CRON_SECRET` (any random string, e.g. `openssl rand -hex 32`)
- [ ] **5.4** Click Deploy → verify production URL loads dashboard
- [ ] **5.5** Check `/api/health` on production URL → `{ status: "ok", db: "connected" }`
- [ ] **5.6** Verify Vercel Cron tab shows 2 active crons (refresh-metrics, generate-drafts)
- [ ] **5.7** Wait 1 hour → verify drafts appear in Outreach Queue (or trigger cron manually)

## Phase 6: Ingestion (built — ready to use)

- [x] **6.1** `POST /api/ingest` endpoint built — accepts `{ postUrl, platform, companyName?, companyDomain?, companyDescription? }`
- [x] **6.2** Parses X post URL → extracts postId + handle → fetches live metrics from X API
- [x] **6.3** Extracts company domain from handle or explicit override
- [x] **6.4** Upserts company → computes engagement score → inserts launch
- [x] **6.5** Auto-triggers Crunchbase funding enrichment if `CRUNCHBASE_API_KEY` is set
- [x] **6.6** "Ingest Post" button in dashboard header opens modal UI
- [ ] **6.7** Wire up X filtered stream for real-time auto-ingestion (optional enhancement)

## File Map
```
launch-intelligence/
├── .github/workflows/ci.yml         # Lint + type-check on PR
├── .kiro/specs/launch-dashboard/    # This spec
├── api/
│   ├── db/
│   │   └── client.ts                # Prisma singleton (safe for serverless)
│   ├── lib/
│   │   ├── scoring.ts               # Engagement score formula
│   │   └── response.ts              # Shared API helpers
│   ├── launches/index.ts            # GET /api/launches
│   ├── stats/index.ts               # GET /api/stats
│   ├── ingest/index.ts              # POST /api/ingest (parse URL, fetch X metrics, upsert)
│   ├── companies/[domain]/contact.ts # GET + POST Apollo/Hunter enrichment
│   ├── companies/[domain]/funding.ts # GET + POST Crunchbase funding enrichment
│   ├── drafts/index.ts              # GET /api/drafts
│   ├── drafts/[id]/index.ts         # PATCH /api/drafts/:id
│   ├── drafts/[id]/send.ts          # POST /api/drafts/:id/send
│   ├── export/index.ts              # GET /api/export
│   ├── health/index.ts              # GET /api/health
│   └── cron/
│       ├── refresh-metrics.ts       # 0 */4 * * *
│       └── generate-drafts.ts       # 0 * * * *
├── scripts/seed.ts                  # One-time DB seed (50+ reference URLs)
├── src/
│   ├── components/
│   │   ├── ui/Layout.tsx
│   │   └── dashboard/
│   │       ├── StatsStrip.tsx
│   │       ├── FilterBar.tsx
│   │       ├── LaunchTable.tsx
│   │       └── ContactPanel.tsx
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   └── OutreachPage.tsx
│   ├── lib/{api.ts, utils.ts}
│   ├── types/index.ts
│   ├── App.tsx · main.tsx · index.css
├── .env.example                     # All required env vars documented
├── prisma/schema.prisma             # Prisma schema (3 models + enums, source of truth)
├── vercel.json                      # SPA rewrite + cron schedule
├── vite.config.ts                   # Proxy /api → localhost:3000 in dev
└── package.json
```
