export type Platform = 'X' | 'LINKEDIN'
export type DraftStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'RESPONDED'
export type ConfidenceLevel = 'High' | 'Medium' | 'Low'
export type RoundType = 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Grant' | 'Unknown'

export interface ContactData {
  email?: string | null
  phone?: string | null
  founderLinkedin?: string | null
  founderX?: string | null
  confidence: { email: ConfidenceLevel; phone: ConfidenceLevel; linkedin: ConfidenceLevel; x: ConfidenceLevel }
  enrichedAt?: string | null
}

export interface Company {
  id: string
  domain: string
  name: string
  description: string
  logoUrl?: string | null
  ycBatch?: string | null
  totalRaised: number
  lastRoundType?: RoundType | null
  lastRoundDate?: string | null
  leadInvestors: string[]
  enrichedAt?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  founderLinkedin?: string | null
  founderX?: string | null
  contactConfidence?: ContactData['confidence'] | null
}

export interface LaunchPost {
  id: string
  postId: string
  companyId: string
  company: Company
  platform: Platform
  postUrl: string
  postText: string
  authorHandle: string
  postedAt: string
  likes: number
  shares: number
  comments: number
  impressions: number
  engagementScore: number
  dmDraftId?: string | null
  metricsUpdatedAt: string
}

export interface OutreachDraft {
  id: string
  companyId: string
  launchId: string
  company: Company
  post: LaunchPost
  platform: Platform
  draftText: string
  editedText?: string | null
  status: DraftStatus
  generatedAt: string
  sentAt?: string | null
  respondedAt?: string | null
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  hasMore: boolean
  offset: number
}

export interface DashboardStats {
  totalLaunches: number
  avgEngagementScore: number
  totalRaisedAggregate: number
  dmsPendingReview: number
}

export interface LaunchFilters {
  platform?: Platform | 'ALL'
  minScore?: number
  maxScore?: number
  fromDate?: string
  toDate?: string
  hasFunding?: boolean
  ycBatch?: string
  search?: string
  sort?: 'engagementScore' | 'postedAt' | 'totalRaised'
  sortDir?: 'asc' | 'desc'
  limit?: number
  offset?: number
}
