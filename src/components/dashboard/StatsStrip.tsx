import { TrendingUp, DollarSign, MessageSquareDot, Rocket } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { DashboardStats } from '@/types'

interface Props { stats: DashboardStats }

export default function StatsStrip({ stats }: Props) {
  const cards = [
    { label: 'Launches Tracked', value: stats.totalLaunches.toLocaleString(), sub: 'All time', icon: Rocket, glow: 'shadow-blue-500/10', accent: 'text-blue-400', ring: 'ring-blue-500/20' },
    { label: 'Avg Score', value: stats.avgEngagementScore.toFixed(0), sub: 'out of 100', icon: TrendingUp, glow: 'shadow-emerald-500/10', accent: 'text-emerald-400', ring: 'ring-emerald-500/20' },
    { label: 'Total Raised', value: formatCurrency(stats.totalRaisedAggregate), sub: 'Tracked companies', icon: DollarSign, glow: 'shadow-amber-500/10', accent: 'text-amber-400', ring: 'ring-amber-500/20' },
    { label: 'DMs Pending', value: stats.dmsPendingReview.toString(), sub: 'Awaiting review', icon: MessageSquareDot, glow: 'shadow-purple-500/10', accent: 'text-purple-400', ring: 'ring-purple-500/20' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map(({ label, value, sub, icon: Icon, glow, accent, ring }, i) => (
        <div
          key={label}
          className={`card p-4 flex items-center gap-4 animate-slide-up shadow-lg ${glow}`}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'both' }}
        >
          <div className={`w-10 h-10 rounded-xl ring-1 ${ring} flex items-center justify-center shrink-0 bg-white/[0.03]`}>
            <Icon size={17} className={accent} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-0.5">{label}</p>
            <p className="text-2xl font-display font-semibold text-gray-100 leading-none">{value}</p>
            <p className="text-[11px] text-gray-600 mt-1">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
