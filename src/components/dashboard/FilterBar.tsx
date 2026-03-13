import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LaunchFilters } from '@/types'

interface Props { filters: LaunchFilters; onChange: (f: LaunchFilters) => void; total?: number }

const YC_BATCHES = ['W22', 'S22', 'W23', 'S23', 'W24', 'S24', 'W25']

export default function FilterBar({ filters, onChange, total }: Props) {
  const set = (p: Partial<LaunchFilters>) => onChange({ ...filters, ...p })
  const active = !!(filters.search || filters.minScore || filters.hasFunding || (filters.platform && filters.platform !== 'ALL') || filters.ycBatch)

  return (
    <div className="card p-3 flex flex-wrap items-center gap-2">
      <SlidersHorizontal size={14} className="text-gray-600 ml-1 shrink-0" />

      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          className="input w-full pl-8 h-8 text-sm"
          placeholder="Search companies…"
          value={filters.search ?? ''}
          onChange={e => set({ search: e.target.value || undefined })}
        />
      </div>

      {/* Platform pills */}
      <div className="flex gap-1">
        {(['ALL', 'X', 'LINKEDIN'] as const).map(p => (
          <button
            key={p}
            onClick={() => set({ platform: p })}
            className={cn(
              'h-8 px-3 rounded-xl text-xs font-medium transition-all duration-150',
              (filters.platform ?? 'ALL') === p
                ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]'
            )}
          >
            {p === 'ALL' ? 'All' : p === 'X' ? '𝕏 Twitter' : 'LinkedIn'}
          </button>
        ))}
      </div>

      {/* Min score */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 whitespace-nowrap">Score ≥</span>
        <input
          type="number" min={0} max={100}
          className="input h-8 w-14 text-center text-sm"
          value={filters.minScore ?? ''}
          onChange={e => set({ minScore: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="0"
        />
      </div>

      {/* YC batch */}
      <select
        className="input h-8 text-sm pr-8"
        value={filters.ycBatch ?? ''}
        onChange={e => set({ ycBatch: e.target.value || undefined })}
      >
        <option value="">All batches</option>
        {YC_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
      </select>

      {/* Funding */}
      <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <input
          type="checkbox"
          className="w-3.5 h-3.5 rounded accent-brand-500"
          checked={!!filters.hasFunding}
          onChange={e => set({ hasFunding: e.target.checked || undefined })}
        />
        Has funding
      </label>

      {/* Sort */}
      <select
        className="input h-8 text-sm ml-auto pr-8"
        value={filters.sort ?? 'engagementScore'}
        onChange={e => set({ sort: e.target.value as LaunchFilters['sort'] })}
      >
        <option value="engagementScore">↓ Score</option>
        <option value="postedAt">↓ Date</option>
        <option value="totalRaised">↓ Raised</option>
      </select>

      {/* Clear + count */}
      {active && (
        <button onClick={() => onChange({ sort: 'engagementScore', platform: 'ALL' })} className="btn-ghost h-8 px-2 text-red-400/70 hover:text-red-400 text-xs">
          <X size={13} />
          Clear
        </button>
      )}
      {total !== undefined && (
        <span className="text-xs text-gray-600 whitespace-nowrap">{total.toLocaleString()} results</span>
      )}
    </div>
  )
}
