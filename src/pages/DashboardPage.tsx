import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, RefreshCw, Plus } from 'lucide-react'
import { fetchLaunches, fetchStats, exportData } from '@/lib/api'
import { downloadBlob } from '@/lib/utils'
import type { LaunchFilters } from '@/types'
import FilterBar from '@/components/dashboard/FilterBar'
import StatsStrip from '@/components/dashboard/StatsStrip'
import LaunchTable from '@/components/dashboard/LaunchTable'
import IngestModal from '@/components/dashboard/IngestModal'

export default function DashboardPage() {
  const [filters, setFilters] = useState<LaunchFilters>({ sort: 'engagementScore', platform: 'ALL' })
  const [exporting, setExporting] = useState(false)
  const [ingestOpen, setIngestOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 1000 * 60 * 15,
  })

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['launches', filters],
    queryFn: () => fetchLaunches(filters),
    refetchInterval: 1000 * 60 * 15,
  })

  async function doExport(format: 'csv' | 'json') {
    setExporting(true)
    try {
      const blob = await exportData(filters, format)
      downloadBlob(blob, `launches-${new Date().toISOString().slice(0, 10)}.${format}`)
    } finally { setExporting(false) }
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-4 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-100 tracking-tight">
            Launch Intelligence
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Track startup launches · cross-reference funding · enrich contacts · draft outreach
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <button onClick={() => setIngestOpen(true)} className="btn-primary h-8 px-3 text-xs">
            <Plus size={12} /> Ingest Post
          </button>
          <button onClick={() => doExport('csv')} disabled={exporting} className="btn-outline h-8 px-3 text-xs">
            <Download size={12} /> CSV
          </button>
          <button onClick={() => doExport('json')} disabled={exporting} className="btn-outline h-8 px-3 text-xs">
            <Download size={12} /> JSON
          </button>
          <button onClick={() => refetch()} className="btn-ghost h-8 px-3 text-xs">
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {stats && <StatsStrip stats={stats} />}
      <FilterBar filters={filters} onChange={setFilters} total={data?.total} />
      <LaunchTable launches={data?.items ?? []} isLoading={isLoading} />

      {ingestOpen && <IngestModal onClose={() => setIngestOpen(false)} />}
    </div>
  )
}
