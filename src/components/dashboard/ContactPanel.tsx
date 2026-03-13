import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, Phone, Linkedin, Twitter, Copy, Check, RefreshCw, AlertCircle, DollarSign } from 'lucide-react'
import { fetchContactData, triggerEnrichment, triggerFundingEnrichment } from '@/lib/api'
import { cn, confidenceColor, formatCurrency } from '@/lib/utils'
import type { ConfidenceLevel, ContactData } from '@/types'

function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded-lg hover:bg-white/[0.07] text-gray-600 hover:text-gray-300 transition-all"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
    </button>
  )
}

function Confidence({ level }: { level: ConfidenceLevel }) {
  return (
    <span className={cn('text-[10px] font-medium', confidenceColor(level))}>{level}</span>
  )
}

function Row({ icon: Icon, label, value, confidence, href }: {
  icon: React.ElementType; label: string; value?: string | null; confidence: ConfidenceLevel; href?: string
}) {
  return (
    <div className="flex items-center gap-3 py-2 group">
      <Icon size={13} className={value ? 'text-gray-400' : 'text-gray-700'} />
      <span className="text-[11px] text-gray-600 w-12 shrink-0 uppercase tracking-wider">{label}</span>
      {value ? (
        <>
          {href
            ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-400 hover:text-brand-300 flex-1 truncate transition-colors">{value}</a>
            : <span className="text-xs text-gray-200 font-mono flex-1 truncate">{value}</span>
          }
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Confidence level={confidence} />
            <CopyBtn value={value} />
          </div>
        </>
      ) : (
        <span className="text-xs text-gray-700 italic">Not found</span>
      )}
    </div>
  )
}

interface Props {
  domain: string
  companyName: string
  initialContact?: ContactData | null
  totalRaised?: number
  lastRoundType?: string | null
}

export default function ContactPanel({ domain, companyName, initialContact, totalRaised = 0, lastRoundType }: Props) {
  const [refreshing, setRefreshing]   = useState(false)
  const [fundingMsg, setFundingMsg]   = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: contact, isLoading, refetch } = useQuery({
    queryKey: ['contact', domain],
    queryFn: () => fetchContactData(domain),
    initialData: initialContact ?? undefined,
    staleTime: 1000 * 60 * 60 * 24 * 14,
  })

  const fundingMut = useMutation({
    mutationFn: () => triggerFundingEnrichment(domain),
    onSuccess: (data) => {
      setFundingMsg(data.enriched
        ? `Updated: ${formatCurrency(data.totalRaised ?? 0)} · ${data.roundType?.replace('_', ' ')}`
        : 'No Crunchbase data found')
      qc.invalidateQueries({ queryKey: ['launches'] })
    },
  })

  async function handleContactRefresh() {
    setRefreshing(true)
    try { await triggerEnrichment(domain); await refetch() }
    finally { setRefreshing(false) }
  }

  if (isLoading) return (
    <div className="flex items-center gap-2 text-xs text-gray-600 py-3">
      <div className="w-3 h-3 border border-gray-600 border-t-transparent rounded-full animate-spin" />
      Loading contact data…
    </div>
  )

  const conf = contact?.confidence ?? {
    email: 'Low' as ConfidenceLevel, phone: 'Low' as ConfidenceLevel,
    linkedin: 'Low' as ConfidenceLevel, x: 'Low' as ConfidenceLevel,
  }

  return (
    <div className="glass rounded-xl p-4 max-w-2xl animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-brand-500" />
          <span className="text-xs font-display font-semibold text-gray-300">{companyName} — Contact & Funding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setFundingMsg(null); fundingMut.mutate() }}
            disabled={fundingMut.isPending}
            className="btn-ghost h-6 px-2 text-xs text-amber-400/70 hover:text-amber-400"
            title="Re-enrich funding from Crunchbase"
          >
            <DollarSign size={10} className={fundingMut.isPending ? 'animate-pulse' : ''} />
            {fundingMut.isPending ? 'Fetching…' : 'Crunchbase'}
          </button>
          <button onClick={handleContactRefresh} disabled={refreshing} className="btn-ghost h-6 px-2 text-xs">
            <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
            Apollo
          </button>
        </div>
      </div>

      {/* Funding summary row */}
      <div className="flex items-center gap-3 py-2 mb-1 border-b border-white/[0.04]">
        <DollarSign size={13} className={totalRaised > 0 ? 'text-amber-400' : 'text-gray-700'} />
        <span className="text-[11px] text-gray-600 w-12 shrink-0 uppercase tracking-wider">Raised</span>
        <span className={cn('text-xs font-medium', totalRaised > 0 ? 'text-amber-300' : 'text-gray-600 italic')}>
          {totalRaised > 0 ? `${formatCurrency(totalRaised)} · ${lastRoundType?.replace(/_/g, ' ') ?? ''}` : 'Unknown'}
        </span>
        {fundingMsg && (
          <span className="text-[11px] text-emerald-400/70 ml-auto">{fundingMsg}</span>
        )}
      </div>

      {!contact ? (
        <div className="flex items-center gap-2 text-xs text-amber-400/70 py-2">
          <AlertCircle size={12} />
          No contact data. Click Apollo to fetch via Apollo.io → Hunter.io.
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          <Row icon={Mail}     label="Email"    value={contact.email}           confidence={conf.email}    />
          <Row icon={Phone}    label="Phone"    value={contact.phone}           confidence={conf.phone}    />
          <Row icon={Linkedin} label="LinkedIn" value={contact.founderLinkedin} confidence={conf.linkedin} href={contact.founderLinkedin ?? undefined} />
          <Row icon={Twitter}  label="X"        value={contact.founderX}        confidence={conf.x}        href={contact.founderX ? `https://x.com/${contact.founderX.replace('@', '')}` : undefined} />
        </div>
      )}

      <p className="text-[10px] text-gray-700 mt-3 pt-3 border-t border-white/[0.04]">
        Contact: Apollo.io → Hunter.io fallback · Hover rows to see confidence · Cached 14 days
      </p>
    </div>
  )
}
