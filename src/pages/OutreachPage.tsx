import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquareDot, Send, CheckCircle, Edit3, RotateCcw, ExternalLink, Sparkles } from 'lucide-react'
import { fetchDrafts, updateDraft, sendDraft } from '@/lib/api'
import { cn, formatRelative, platformBadge, scoreClass, scoreLabel } from '@/lib/utils'
import type { OutreachDraft, DraftStatus } from '@/types'

const TABS: { value: DraftStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'SENT', label: 'Sent' },
  { value: 'RESPONDED', label: 'Responded' },
]

const STATUS_STYLE: Record<DraftStatus, string> = {
  DRAFT: 'bg-white/[0.06] text-gray-400',
  APPROVED: 'bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20',
  SENT: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20',
  RESPONDED: 'bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/20',
}

function DraftCard({ draft }: { draft: OutreachDraft }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(draft.editedText ?? draft.draftText)
  const score = Math.round(draft.post?.engagementScore ?? 0)

  const upd = useMutation({
    mutationFn: (p: Parameters<typeof updateDraft>[1]) => updateDraft(draft.id, p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] })
  })
  const snd = useMutation({
    mutationFn: () => sendDraft(draft.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drafts'] })
  })

  const active = draft.editedText ?? draft.draftText
  const charLimit = draft.platform === 'X' ? 280 : 500

  return (
    <div className="card p-5 space-y-4 animate-slide-up hover:border-white/[0.1] transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-surface-600 to-surface-700 ring-1 ring-white/[0.08] flex items-center justify-center shrink-0 font-display font-bold text-gray-300 text-sm">
            {draft.company.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-100 text-sm">{draft.company.name}</p>
            <p className="text-xs text-gray-600 truncate">{draft.company.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <span className={cn('badge text-[11px]', platformBadge(draft.platform))}>{draft.platform}</span>
          <span className={cn('badge text-[11px] font-mono', scoreClass(score))}>{score} · {scoreLabel(score)}</span>
          <span className={cn('badge text-[11px]', STATUS_STYLE[draft.status])}>{draft.status}</span>
        </div>
      </div>

      {/* Post context */}
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-600 font-medium uppercase tracking-wider text-[10px]">Launch post</span>
          {draft.post?.postUrl && (
            <a href={draft.post.postUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:text-brand-400">
              <ExternalLink size={11} />
            </a>
          )}
        </div>
        <p className="line-clamp-2 text-gray-400">{draft.post?.postText ?? '—'}</p>
        {draft.post?.postedAt && (
          <p className="mt-1.5 text-gray-700">{formatRelative(draft.post.postedAt)} · {(draft.post.likes ?? 0).toLocaleString()} likes</p>
        )}
      </div>

      {/* Draft message */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-brand-400" />
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
              {draft.editedText ? 'Edited Draft' : 'AI Draft'}
            </span>
          </div>
          {['DRAFT', 'APPROVED'].includes(draft.status) && (
            <button onClick={() => { setEditing(!editing); setText(active) }} className="btn-ghost h-6 px-2 text-xs">
              {editing ? <RotateCcw size={10} /> : <Edit3 size={10} />}
              {editing ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              className="input w-full text-sm resize-none h-24 leading-relaxed"
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <span className={cn('text-xs', text.length > charLimit ? 'text-red-400' : 'text-gray-600')}>
                {text.length}/{charLimit}
              </span>
              <button
                onClick={() => { upd.mutate({ editedText: text, status: 'APPROVED' }); setEditing(false) }}
                disabled={upd.isPending}
                className="btn-primary h-7 px-3 text-xs"
              >
                <CheckCircle size={11} /> Save & Approve
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-200 leading-relaxed bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
            {active}
          </p>
        )}
      </div>

      {/* Actions */}
      {!editing && !['SENT', 'RESPONDED'].includes(draft.status) && (
        <div className="flex items-center gap-2">
          {draft.status === 'DRAFT' && (
            <button onClick={() => upd.mutate({ status: 'APPROVED' })} disabled={upd.isPending} className="btn-outline h-8 px-3 text-xs">
              <CheckCircle size={12} /> Approve
            </button>
          )}
          <button
            onClick={() => snd.mutate()}
            disabled={snd.isPending || draft.status === 'DRAFT'}
            title={draft.status === 'DRAFT' ? 'Approve first' : 'Send DM'}
            className={cn('btn-primary h-8 px-4 text-xs ml-auto', draft.status === 'DRAFT' && 'opacity-30')}
          >
            <Send size={12} />
            {snd.isPending ? 'Sending…' : 'Send DM'}
          </button>
        </div>
      )}

      {['SENT', 'RESPONDED'].includes(draft.status) && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-500/70">
          <CheckCircle size={11} />
          {draft.status === 'RESPONDED' ? 'Founder responded 🎉' : draft.sentAt ? `Sent ${formatRelative(draft.sentAt)}` : 'Sent'}
        </div>
      )}
    </div>
  )
}

export default function OutreachPage() {
  const [tab, setTab] = useState<DraftStatus | 'ALL'>('ALL')
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['drafts', tab],
    queryFn: () => fetchDrafts(tab),
  })

  const pending = drafts.filter(d => d.status === 'DRAFT').length

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-gray-100 tracking-tight">Outreach Queue</h1>
          <p className="text-sm text-gray-600 mt-1">AI-drafted DMs for low-engagement launches · review, edit, send</p>
        </div>
        {pending > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2">
            <MessageSquareDot size={13} className="text-brand-400" />
            {pending} pending review
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 glass p-1 rounded-xl w-fit">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
              tab === value ? 'bg-surface-700 text-gray-100 font-medium shadow-sm' : 'text-gray-600 hover:text-gray-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-600 text-sm gap-3">
          <div className="w-5 h-5 border-2 border-brand-500/50 border-t-brand-500 rounded-full animate-spin" />
          Loading drafts…
        </div>
      ) : drafts.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <MessageSquareDot size={36} className="text-gray-800 mb-4" />
          <p className="text-gray-500 text-sm">No drafts in this status.</p>
          <p className="text-gray-700 text-xs mt-1">Low-engagement launches (score &lt; 25) auto-generate drafts every hour.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map(d => <DraftCard key={d.id} draft={d} />)}
        </div>
      )}
    </div>
  )
}
