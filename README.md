# 🚀 Launch Intelligence Dashboard

AI-powered startup launch tracking & outreach automation.  
**100% free to deploy** — runs entirely on Vercel + Neon Postgres free tiers.

---

## Free Tier Stack

| Service | What it does | Free tier |
|---------|-------------|-----------|
| **Vercel** | Hosts frontend + API functions + crons | Unlimited |
| **Neon** | Serverless Postgres database | 0.5GB, 190 hrs/mo |
| **X API v2** | Pulls launch posts + metrics | 500K tweets/mo |
| **Crunchbase** | Funding data | 200 req/day |
| **Apollo.io** | Contact enrichment | 50 credits/mo |
| **Hunter.io** | Email fallback | 25 searches/mo |
| **Claude Haiku** | DM generation | ~$0.001/draft |

No AWS. No Docker. No servers to manage.

---

## Quick Start (Local Dev)

```bash
# 1. Clone & install
git clone https://github.com/YOUR_ORG/launch-intelligence.git
cd launch-intelligence
npm install

# 2. Set up Neon database
# → Go to neon.tech, create a free project
# → Copy both the *pooled* and *direct* connection strings
cp .env.example .env.local
# Edit .env.local and set:
#   DATABASE_URL=postgresql://...  (pooled — ends in -pooler.xxx)
#   DIRECT_URL=postgresql://...    (direct — no -pooler)

# 3. Create tables + seed with reference data
npm run db:push     # creates tables in Neon
npm run db:seed     # seeds 50+ launches from reference list

# 4. Run locally (Vercel dev handles both frontend + API)
npx vercel dev
# → http://localhost:3000
```

---

## Deploy to Vercel (Free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "feat: launch intelligence dashboard"
git remote add origin https://github.com/YOUR_ORG/launch-intelligence.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import** next to your GitHub repo
3. Vercel auto-detects Vite — keep all defaults
4. **Don't deploy yet** — add env vars first

### Step 3 — Set Environment Variables
In Vercel → your project → **Settings → Environment Variables**, add:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | [neon.tech](https://neon.tech) → Connection Details → **Pooled** connection string |
| `DIRECT_URL` | [neon.tech](https://neon.tech) → Connection Details → **Direct** connection string |
| `X_BEARER_TOKEN` | [developer.x.com](https://developer.x.com) → Your App → Keys |
| `CRUNCHBASE_API_KEY` | [data.crunchbase.com](https://data.crunchbase.com) |
| `APOLLO_API_KEY` | [app.apollo.io](https://app.apollo.io) → Settings → API |
| `HUNTER_API_KEY` | [hunter.io](https://hunter.io/api) |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |
| `CRON_SECRET` | Any random string (run: `openssl rand -hex 32`) |

> **Tip:** X, Crunchbase, Apollo, and Hunter all work without providing a key —
> the app gracefully falls back to seeded/mock data when keys are absent.
> Only `DATABASE_URL` is required to run.

### Step 4 — Deploy
Click **Deploy** in Vercel. Done. Your app is live.

### Step 5 — Seed Production Database
After deploying, run the seed script against your production Neon DB:
```bash
# DATABASE_URL is already in your .env.local pointing at Neon
npm run db:seed
```

---

## How It Works

### API Routes (`/api/*`)
Every `.ts` file in the `/api` directory becomes a Vercel serverless function:

```
GET  /api/launches                    → paginated + filtered launch table
GET  /api/stats                       → dashboard KPI cards
GET  /api/companies/:domain/contact   → enriched contact data
POST /api/companies/:domain/contact   → trigger Apollo/Hunter enrichment
GET  /api/drafts                      → outreach DM queue
PATCH /api/drafts/:id                 → edit/approve draft
POST /api/drafts/:id/send             → mark as sent
GET  /api/export                      → CSV or JSON download
GET  /api/health                      → DB connectivity check
```

### Cron Jobs (auto-run by Vercel)
Defined in `vercel.json`:
```
Every 4 hours → /api/cron/refresh-metrics   (refresh X metrics, recompute scores)
Every hour    → /api/cron/generate-drafts   (find low-score posts, call Claude)
```

### Database Schema
3 tables in Neon Postgres, managed with Drizzle ORM:
- `companies` — company profiles, funding data, enriched contacts
- `launches` — individual posts with engagement metrics + scores
- `drafts` — AI-generated outreach DMs with status tracking

---

## Development Commands

```bash
npm run dev          # Vite dev server (frontend only, http://localhost:5173)
npx vercel dev       # Full stack dev (frontend + API, http://localhost:3000)
npm run build        # Production build → dist/
npm run type-check   # TypeScript type checking
npm run lint         # ESLint
npm run db:push      # Sync prisma/schema.prisma to Neon (creates/alters tables)
npm run db:migrate   # Create a tracked migration (use after db:push stabilises)
npm run db:studio    # Open Prisma Studio at localhost:5555 (visual DB browser)
npm run db:seed      # Seed DB with reference launches
```

---

## Adding New Launches

Option A — **Seed script**: Add entries to `scripts/seed.ts` and re-run `npm run db:seed`

Option B — **Manual API** (build this in Phase 6): `POST /api/ingest` with `{ postUrl, platform }`

Option C — **X Filtered Stream**: Connect the X API v2 filtered stream for real-time ingestion

---

## Kiro Spec Files

```
.kiro/specs/launch-dashboard/
├── requirements.md   → User stories + acceptance criteria
├── design.md         → Architecture + data models + API contracts
└── tasks.md          → 25 implementation tasks across 6 phases
```

Open this project in AWS Kiro → it reads these specs and generates the implementation.

---

## Cost Estimate (Monthly)

| Item | Cost |
|------|------|
| Vercel hosting | $0 |
| Neon Postgres | $0 |
| X API v2 | $0 (Basic tier) |
| Apollo.io | $0 (free tier) |
| Hunter.io | $0 (free tier) |
| Claude Haiku DMs | ~$0.10 (100 drafts/month) |
| **Total** | **~$0.10/month** |
