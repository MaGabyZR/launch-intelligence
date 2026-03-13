import { useState } from 'react'
import {
  useReactTable, getCoreRowModel, getSortedRowModel,
  type SortingState, type ColumnDef, flexRender
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp, ChevronsUpDown, ExternalLink, ChevronRight } from 'lucide-react'
import type { LaunchPost } from '@/types'
import { cn, formatCurrency, formatNumber, formatRelative, scoreClass, scoreLabel, platformBadge } from '@/lib/utils'
import ContactPanel from './ContactPanel'

interface Props { launches: LaunchPost[]; isLoading: boolean }

export default function LaunchTable({ launches, isLoading }: Props) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const columns: ColumnDef<LaunchPost>[] = [
    {
      id: 'company',
      header: 'Company',
      accessorFn: r => r.company.name,
      cell: ({ row }) => {
        const { company } = row.original
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-surface-600 to-surface-700 flex items-center justify-center shrink-0 text-xs font-display font-bold text-gray-300 ring-1 ring-white/[0.08]">
              {company.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-100 truncate">{company.name}</p>
              <p className="text-xs text-gray-600 truncate max-w-[180px]">{company.description}</p>
            </div>
          </div>
        )
      },
      size: 220,
    },
    {
      id: 'platform',
      header: 'Platform',
      accessorFn: r => r.platform,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <span className={cn('badge text-[11px]', platformBadge(row.original.platform))}>
            {row.original.platform === 'X' ? '𝕏' : 'in'} {row.original.platform}
          </span>
          <a href={row.original.postUrl} target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-400 transition-colors">
            <ExternalLink size={11} />
          </a>
        </div>
      ),
      size: 120,
    },
    {
      id: 'postedAt',
      header: 'Posted',
      accessorFn: r => r.postedAt,
      cell: ({ row }) => <span className="text-xs text-gray-500">{formatRelative(row.original.postedAt)}</span>,
      size: 110,
    },
    {
      id: 'likes',
      header: '♥ Likes',
      accessorFn: r => r.likes,
      cell: ({ row }) => <span className="text-sm font-mono text-gray-300">{formatNumber(row.original.likes)}</span>,
      size: 80,
    },
    {
      id: 'shares',
      header: '↻ Shares',
      accessorFn: r => r.shares,
      cell: ({ row }) => <span className="text-sm font-mono text-gray-500">{formatNumber(row.original.shares)}</span>,
      size: 80,
    },
    {
      id: 'engagementScore',
      header: 'Score',
      accessorFn: r => r.engagementScore,
      cell: ({ row }) => {
        const s = Math.round(row.original.engagementScore)
        return (
          <div className="flex items-center gap-2">
            <span className={cn('badge font-mono font-semibold text-xs', scoreClass(s))}>{s}</span>
            <span className="text-[11px] text-gray-600">{scoreLabel(s)}</span>
          </div>
        )
      },
      size: 120,
    },
    {
      id: 'funding',
      header: 'Raised',
      accessorFn: r => r.company.totalRaised,
      cell: ({ row }) => {
        const { company } = row.original
        return company.totalRaised > 0 ? (
          <div>
            <p className="text-sm font-medium text-gray-200">{formatCurrency(company.totalRaised)}</p>
            <p className="text-[11px] text-gray-600">{company.lastRoundType ?? ''}</p>
          </div>
        ) : <span className="text-gray-700 text-sm">—</span>
      },
      size: 110,
    },
    {
      id: 'yc',
      header: 'YC',
      accessorFn: r => r.company.ycBatch ?? '',
      cell: ({ row }) => row.original.company.ycBatch
        ? <span className="badge bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20 text-[11px]">{row.original.company.ycBatch}</span>
        : <span className="text-gray-700 text-xs">—</span>,
      size: 65,
    },
    {
      id: 'contact',
      header: 'Contact',
      enableSorting: false,
      cell: ({ row }) => {
        const isOpen = expandedId === row.original.id
        return (
          <button
            onClick={() => setExpandedId(isOpen ? null : row.original.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all duration-150',
              isOpen
                ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30'
                : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.05]'
            )}
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {isOpen ? 'Close' : 'View'}
          </button>
        )
      },
      size: 80,
    },
  ]

  const table = useReactTable({
    data: launches,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) return (
    <div className="card flex items-center justify-center gap-3 py-16 text-gray-600 text-sm">
      <div className="w-5 h-5 border-2 border-brand-500/50 border-t-brand-500 rounded-full animate-spin" />
      Loading launches…
    </div>
  )

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} className="border-b border-white/[0.05]">
                {hg.headers.map(header => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-left text-[11px] font-medium text-gray-600 uppercase tracking-widest whitespace-nowrap',
                      header.column.getCanSort() && 'cursor-pointer select-none hover:text-gray-400 transition-colors'
                    )}
                    style={{ width: header.column.columnDef.size }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        header.column.getIsSorted() === 'asc' ? <ChevronUp size={11} className="text-brand-400" />
                          : header.column.getIsSorted() === 'desc' ? <ChevronDown size={11} className="text-brand-400" />
                          : <ChevronsUpDown size={11} className="text-gray-700" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-14 text-center text-gray-600 text-sm">
                    No launches match your filters.
                  </td>
                </tr>
              )
              : table.getRowModel().rows.map((row, i) => (
                <>
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors',
                      expandedId === row.original.id && 'bg-brand-500/[0.03]'
                    )}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>

                  {expandedId === row.original.id && (
                    <tr key={`${row.id}-contact`} className="bg-surface-800/40">
                      <td colSpan={columns.length} className="px-6 py-4">
                        <ContactPanel
                          domain={row.original.company.domain}
                          companyName={row.original.company.name}
                          totalRaised={row.original.company.totalRaised}
                          lastRoundType={row.original.company.lastRoundType}
                          initialContact={
                            row.original.company.contactEmail || row.original.company.founderX
                              ? {
                                  email: row.original.company.contactEmail,
                                  phone: row.original.company.contactPhone,
                                  founderLinkedin: row.original.company.founderLinkedin,
                                  founderX: row.original.company.founderX,
                                  confidence: row.original.company.contactConfidence ?? { email: 'Low', phone: 'Low', linkedin: 'Low', x: 'Low' },
                                }
                              : null
                          }
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  )
}
