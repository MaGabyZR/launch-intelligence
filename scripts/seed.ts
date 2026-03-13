/**
 * Seed script — run once after `npm run db:push`
 * Usage: npm run db:seed
 * Requires DATABASE_URL (and DIRECT_URL) in .env.local
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// All reference URLs from Launch_Video_Refs.docx
const REFERENCE_POSTS = [
  // Primary launch references
  { handle: 'getcaptionsapp',  postId: '1929554635544461727', platform: 'X' as const },
  { handle: 'abhshkdz',        postId: '1932469194978922555', platform: 'X' as const },
  { handle: 'itsalfredw',      postId: '1915065644875411730', platform: 'X' as const },
  { handle: 'antonosika',      postId: '1948017850809270314', platform: 'X' as const },
  { handle: 'ycombinator',     postId: '1953186461848879188', platform: 'X' as const },
  { handle: 'weberwongwong',   postId: '1894794612398792974', platform: 'X' as const },
  { handle: 'willahmed',       postId: '1920486427176898599', platform: 'X' as const },
  { handle: 'thejamescad',     postId: '1955339868659388418', platform: 'X' as const },
  { handle: 'dylanottt',       postId: '1942324855954890983', platform: 'X' as const },
  { handle: 'Lauramaywendel',  postId: '1952727329932706210', platform: 'X' as const },
  { handle: 'Aiswarya_Sankar', postId: '1955284660822606013', platform: 'X' as const },
  { handle: 'devvmandal',      postId: '1952737863189078492', platform: 'X' as const },
  { handle: 'TarunAmasa',      postId: '1953130965355905140', platform: 'X' as const },
  { handle: 'dom_lucre',       postId: '1930377511009194271', platform: 'X' as const },
  { handle: 'kuseHQ',          postId: '1956362632849686979', platform: 'X' as const },
  { handle: 'annarmonaco',     postId: '1957474116640133252', platform: 'X' as const },
  { handle: 'aquavoice_',      postId: '1958577295528272331', platform: 'X' as const },
  { handle: 'adilbuilds',      postId: '1960730479503741432', platform: 'X' as const },
  { handle: 'devv_ai',         postId: '1960353809798238539', platform: 'X' as const },
  { handle: 'nichochar',       postId: '1958563340588081162', platform: 'X' as const },
  { handle: 'samuelbeek',      postId: '1962543194937180371', platform: 'X' as const },
  { handle: 'exaailabs',       postId: '1963262700123000947', platform: 'X' as const },
  { handle: 'ccharliewu',      postId: '1963333351622001047', platform: 'X' as const },
  { handle: 'Creatify_AI',     postId: '1963285168535613554', platform: 'X' as const },
  { handle: 'audrlo',          postId: '1963540707576336452', platform: 'X' as const },
  { handle: 'amasad',          postId: '1965800350071590966', platform: 'X' as const },
  { handle: 'reve',            postId: '1967640858372751540', platform: 'X' as const },
  { handle: 'varunvummadi',    postId: '1986088112544428100', platform: 'X' as const },
  { handle: 'calumworthy',     postId: '1988283207138324487', platform: 'X' as const },
  { handle: 'karim_rc',        postId: '1995538458836959487', platform: 'X' as const },
  // Other launch styles
  { handle: 'rork_app',        postId: '1925631069484691934', platform: 'X' as const },
  { handle: 'Joe_Scheidler',   postId: '1925232521173983288', platform: 'X' as const },
  { handle: 'kevinlu625',      postId: '1942252767999111250', platform: 'X' as const },
  { handle: 'konstipaulus',    postId: '1930700980498170242', platform: 'X' as const },
  { handle: 'OfficialLoganK',  postId: '1952732206176112915', platform: 'X' as const },
  { handle: 'gabrielramans',   postId: '1938286214273986783', platform: 'X' as const },
  { handle: 'odysseyml',       postId: '1927767196756853179', platform: 'X' as const },
  { handle: 'aibek_design',    postId: '1957856991608512898', platform: 'X' as const },
  { handle: 'PrimeIntellect',  postId: '1960783427948699680', platform: 'X' as const },
  { handle: 'AnhPhuNguyen1',   postId: '1958199821048705312', platform: 'X' as const },
  { handle: 'mignano',         postId: '1965780172688494653', platform: 'X' as const },
  { handle: 'awwstn',          postId: '1970115256614883470', platform: 'X' as const },
  { handle: 'lovable_dev',     postId: '1972680165378650391', platform: 'X' as const },
  { handle: 'saidhanak',       postId: '1991148680947097809', platform: 'X' as const },
  { handle: 'suptejas',        postId: '1991161542029500788', platform: 'X' as const },
  { handle: 'tonyzzhao',       postId: '1991204839578300813', platform: 'X' as const },
  { handle: 'gradiumai',       postId: '1995826566543081700', platform: 'X' as const },
  { handle: 'rincidium',       postId: '1995946528343818656', platform: 'X' as const },
  { handle: 'boomsupersonic',  postId: '1998392027936125275', platform: 'X' as const },
  // Post tracker
  { handle: 'perplexity_ai',   postId: '2026695550771540489', platform: 'X' as const },
  { handle: 'exaailabs',       postId: '2022022631244149076', platform: 'X' as const },
  { handle: 'itsalfredw',      postId: '2022003226808398043', platform: 'X' as const },
  { handle: 'polyaivoice',     postId: '2023789465509015972', platform: 'X' as const },
  { handle: 'braintrust',      postId: '2023801035647799634', platform: 'X' as const },
  { handle: 'dbabbs',          postId: '2026341750168543504', platform: 'X' as const },
  { handle: 'koahlabs',        postId: '2026334549966242189', platform: 'X' as const },
  { handle: 'moonlake',        postId: '2026718586354487435', platform: 'X' as const },
  { handle: 'encord_team',     postId: '2027054134629736785', platform: 'X' as const },
]

// Company data keyed by handle — extend as you add real enrichment
// Note: Prisma RoundType enum uses underscores: Pre_Seed, Series_A, etc.
type RoundType = 'Pre_Seed' | 'Seed' | 'Series_A' | 'Series_B' | 'Series_C' | 'Grant' | 'Unknown'
interface CompanyInfo {
  name: string; description: string; domain: string
  ycBatch?: string; totalRaised: number; lastRoundType?: RoundType; leadInvestors: string[]
}

const COMPANY_DATA: Record<string, CompanyInfo> = {
  getcaptionsapp: { name: 'Captions',       description: 'AI-powered video captioning & editing',            domain: 'getcaptions.app',   ycBatch: 'W22', totalRaised: 7_500_000,   lastRoundType: 'Series_A', leadInvestors: ['a16z', 'YC'] },
  devv_ai:        { name: 'Devv AI',         description: 'AI search engine for developers',                  domain: 'devv.ai',           ycBatch: 'S23', totalRaised: 2_000_000,   lastRoundType: 'Seed',     leadInvestors: ['YC'] },
  aquavoice_:     { name: 'Aqua Voice',      description: 'Voice-first AI writing assistant',                 domain: 'aquavoice.io',                      totalRaised: 500_000,     lastRoundType: 'Pre_Seed', leadInvestors: ['Angels'] },
  Creatify_AI:    { name: 'Creatify AI',     description: 'AI video ad creation platform',                    domain: 'creatify.ai',       ycBatch: 'W24', totalRaised: 15_000_000,  lastRoundType: 'Series_A', leadInvestors: ['Sequoia', 'YC'] },
  perplexity_ai:  { name: 'Perplexity AI',   description: 'AI-powered answer engine',                         domain: 'perplexity.ai',                     totalRaised: 165_000_000, lastRoundType: 'Series_B', leadInvestors: ['IVP', 'NEA'] },
  antonosika:     { name: 'Lovable',         description: 'AI software engineer that builds full-stack apps', domain: 'lovable.dev',                       totalRaised: 7_000_000,   lastRoundType: 'Seed',     leadInvestors: ['EQT Ventures'] },
  lovable_dev:    { name: 'Lovable',         description: 'AI software engineer that builds full-stack apps', domain: 'lovable.dev',                       totalRaised: 7_000_000,   lastRoundType: 'Seed',     leadInvestors: ['EQT Ventures'] },
  gradiumai:      { name: 'Gradium AI',      description: 'AI-powered education platform',                    domain: 'gradium.ai',        ycBatch: 'S24', totalRaised: 1_200_000,   lastRoundType: 'Seed',     leadInvestors: ['YC'] },
  exaailabs:      { name: 'Exa AI',          description: 'Web search API for AI applications',               domain: 'exa.ai',            ycBatch: 'W23', totalRaised: 17_000_000,  lastRoundType: 'Series_A', leadInvestors: ['Lightspeed', 'YC'] },
  amasad:         { name: 'Replit',          description: 'AI-powered collaborative coding platform',         domain: 'replit.com',                        totalRaised: 222_000_000, lastRoundType: 'Series_B', leadInvestors: ['a16z', 'Coatue'] },
  PrimeIntellect: { name: 'Prime Intellect', description: 'Decentralized AI training infrastructure',         domain: 'primeintellect.ai',                 totalRaised: 5_900_000,   lastRoundType: 'Seed',     leadInvestors: ['Distributed Global'] },
  rork_app:       { name: 'Rork',            description: 'AI mobile app builder',                            domain: 'rork.app',                          totalRaised: 0,                              leadInvestors: [] },
  mignano:        { name: 'Artifact News',   description: 'AI-powered news aggregator',                       domain: 'artifact.news',                     totalRaised: 0,                              leadInvestors: [] },
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function computeScore(l: number, s: number, c: number, i: number, p95 = 80_000): number {
  return Math.min(100, Math.round(((l * 0.35 + s * 0.30 + c * 0.20 + i * 0.15) / p95) * 100))
}

async function seed() {
  console.log('🌱 Seeding database with Prisma…')

  // Clear existing data in dependency order (drafts → launches → companies)
  await prisma.draft.deleteMany()
  await prisma.launch.deleteMany()
  await prisma.company.deleteMany()
  console.log('  ✓ Cleared existing data')

  // Upsert companies, deduplicated by domain
  const domainToId = new Map<string, string>()

  for (const post of REFERENCE_POSTS) {
    const info = COMPANY_DATA[post.handle]
    if (!info || domainToId.has(info.domain)) continue

    const company = await prisma.company.upsert({
      where:  { domain: info.domain },
      update: {},
      create: {
        domain:        info.domain,
        name:          info.name,
        description:   info.description,
        ycBatch:       info.ycBatch ?? null,
        totalRaised:   info.totalRaised,
        lastRoundType: info.lastRoundType ?? null,
        leadInvestors: info.leadInvestors,
      },
    })
    domainToId.set(info.domain, company.id)
    console.log(`  ✓ Company: ${info.name}`)
  }

  // Insert launches, skipping duplicate postIds
  const seenPostIds = new Set<string>()
  let launchCount = 0

  for (const post of REFERENCE_POSTS) {
    if (seenPostIds.has(post.postId)) continue
    seenPostIds.add(post.postId)

    const info   = COMPANY_DATA[post.handle]
    const domain = info?.domain ?? `${post.handle.toLowerCase()}.com`

    // Ensure a company row exists for handles not in COMPANY_DATA
    let companyId = domainToId.get(domain)
    if (!companyId) {
      const company = await prisma.company.upsert({
        where:  { domain },
        update: {},
        create: {
          domain,
          name:          post.handle,
          description:   'Startup launch tracked from reference list',
          totalRaised:   0,
          leadInvestors: [],
        },
      })
      companyId = company.id
      domainToId.set(domain, companyId)
    }

    const likes       = rand(50, 8_000)
    const shares      = rand(10, 1_500)
    const comments    = rand(5, 500)
    const impressions = rand(5_000, 400_000)
    const score       = computeScore(likes, shares, comments, impressions)
    const daysAgo     = rand(0, 90)
    const postedAt    = new Date(Date.now() - daysAgo * 86_400_000)

    await prisma.launch.upsert({
      where:  { postId: post.postId },
      update: {},
      create: {
        postId:          post.postId,
        companyId,
        platform:        post.platform,
        postUrl:         `https://x.com/${post.handle}/status/${post.postId}`,
        postText:        `${info?.name ?? post.handle} just launched! Check it out →`,
        authorHandle:    `@${post.handle}`,
        postedAt,
        likes,
        shares,
        comments,
        impressions,
        engagementScore: score,
      },
    })
    launchCount++
  }

  console.log(`\n✅ Seeded ${launchCount} launches across ${domainToId.size} companies`)
  await prisma.$disconnect()
}

seed().catch(err => {
  console.error(err)
  prisma.$disconnect()
  process.exit(1)
})
