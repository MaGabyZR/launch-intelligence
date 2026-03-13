import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatCurrency = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`
  return n > 0 ? `$${n}` : '—'
}

export const formatNumber = (n: number) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toString()
}

export const formatRelative = (iso: string) =>
  formatDistanceToNow(new Date(iso), { addSuffix: true })

export const formatDate = (iso: string) =>
  format(new Date(iso), 'MMM d, yyyy')

export const scoreClass = (s: number) =>
  s >= 75 ? 'score-viral' : s >= 50 ? 'score-solid' : s >= 25 ? 'score-avg' : 'score-low'

export const scoreLabel = (s: number) =>
  s >= 75 ? 'Viral' : s >= 50 ? 'Solid' : s >= 25 ? 'Below avg' : 'Low'

export const platformBadge = (p: string) =>
  p === 'X' ? 'bg-white/[0.07] text-gray-300' : 'bg-blue-950/60 text-blue-300'

export const confidenceColor = (l: string) =>
  l === 'High' ? 'text-emerald-400' : l === 'Medium' ? 'text-amber-400' : 'text-gray-600'

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
