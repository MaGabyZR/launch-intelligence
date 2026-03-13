import type { LaunchPost, OutreachDraft, DashboardStats, LaunchFilters, PaginatedResponse, ContactData } from '@/types'

const BASE = ''  // Same origin — Vercel handles /api/* routing

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error(`API error ${r.status}: ${await r.text()}`)
  return r.json()
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`API error ${r.status}`)
  return r.json()
}

export const fetchLaunches = (filters: LaunchFilters = {}) =>
  get<PaginatedResponse<LaunchPost>>('/api/launches', filters as Record<string, unknown>)

export const fetchStats = () =>
  get<DashboardStats>('/api/stats')

export const fetchContactData = (domain: string) =>
  get<ContactData>(`/api/companies/${domain}/contact`)

export const triggerEnrichment = (domain: string) =>
  post<{ message: string }>(`/api/companies/${domain}/contact`)

export const fetchDrafts = (status?: string) =>
  get<OutreachDraft[]>('/api/drafts', status ? { status } : undefined)

export const updateDraft = (id: string, payload: { editedText?: string; status?: string }) =>
  patch<OutreachDraft>(`/api/drafts/${id}`, payload)

export const sendDraft = (id: string) =>
  post<{ ok: boolean }>(`/api/drafts/${id}/send`)

export const ingestPost = (payload: { postUrl: string; platform?: string; companyName?: string; companyDomain?: string; companyDescription?: string }) =>
  post<{ message: string; launchId: string; companyId: string; score: number; duplicate: boolean }>('/api/ingest', payload)

export const triggerFundingEnrichment = (domain: string) =>
  post<{ message: string; enriched: boolean; totalRaised?: number; roundType?: string; investors?: string[] }>(`/api/companies/${domain}/funding`)

export async function exportData(filters: LaunchFilters, format: 'csv' | 'json'): Promise<Blob> {
  const url = new URL('/api/export', window.location.origin)
  url.searchParams.set('format', format)
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  })
  const r = await fetch(url.toString())
  if (!r.ok) throw new Error('Export failed')
  return r.blob()
}
