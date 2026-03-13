import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Link, Plus, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { ingestPost } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props { onClose: () => void }

export default function IngestModal({ onClose }: Props) {
  const qc = useQueryClient()
  const [postUrl, setPostUrl]           = useState('')
  const [platform, setPlatform]         = useState<'X' | 'LINKEDIN'>('X')
  const [companyDomain, setDomain]      = useState('')
  const [companyName, setName]          = useState('')
  const [companyDesc, setDesc]          = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { mutate, isPending, data, error, reset } = useMutation({
    mutationFn: () => ingestPost({
      postUrl,
      platform,
      companyName:        companyName   || undefined,
      companyDomain:      companyDomain || undefined,
      companyDescription: companyDesc   || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['launches'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const isXUrl = postUrl.match(/(?:x\.com|twitter\.com)\/[^/]+\/status\/\d+/)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative card p-6 w-full max-w-md space-y-5 animate-slide-up shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30 flex items-center justify-center">
              <Plus size={14} className="text-brand-400" />
            </div>
            <h2 className="font-display font-semibold text-gray-100">Ingest Launch Post</h2>
          </div>
          <button onClick={onClose} className="btn-ghost h-7 w-7 p-0 flex items-center justify-center">
            <X size={14} />
          </button>
        </div>

        {/* Success state */}
        {data && !data.duplicate && (
          <div className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <CheckCircle size={15} className="text-emerald-400 mt-0.5 shrink-0" />
            <div className="text-sm">
              <p className="text-emerald-300 font-medium">Launch ingested!</p>
              <p className="text-emerald-500/70 text-xs mt-0.5">Score: {data.score} · <a href="#" onClick={onClose} className="underline">View in dashboard</a></p>
            </div>
          </div>
        )}

        {data?.duplicate && (
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertCircle size={15} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-300">This post is already tracked.</p>
          </div>
        )}

        {!data && (
          <>
            {/* Platform toggle */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Platform</label>
              <div className="flex gap-1.5">
                {(['X', 'LINKEDIN'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={cn(
                      'flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                      platform === p
                        ? 'bg-brand-500/20 text-brand-400 ring-1 ring-brand-500/30'
                        : 'text-gray-500 hover:text-gray-300 bg-white/[0.03] hover:bg-white/[0.06]'
                    )}
                  >
                    {p === 'X' ? '𝕏 Twitter / X' : 'LinkedIn'}
                  </button>
                ))}
              </div>
            </div>

            {/* Post URL */}
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Post URL</label>
              <div className="relative">
                <Link size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  className={cn(
                    'input w-full pl-8',
                    postUrl && !isXUrl && platform === 'X' && 'border-red-500/40 focus:ring-red-500/40'
                  )}
                  placeholder="https://x.com/handle/status/1234567890"
                  value={postUrl}
                  onChange={e => { setPostUrl(e.target.value); reset() }}
                />
              </div>
              {postUrl && !isXUrl && platform === 'X' && (
                <p className="text-xs text-red-400/70 mt-1">Must be an x.com or twitter.com status URL</p>
              )}
            </div>

            {/* Advanced: company override */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              {showAdvanced ? '▾' : '▸'} Override company details (optional)
            </button>

            {showAdvanced && (
              <div className="space-y-3 pl-3 border-l border-white/[0.06]">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Company domain</label>
                  <input className="input w-full text-sm" placeholder="acme.com" value={companyDomain} onChange={e => setDomain(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Company name</label>
                  <input className="input w-full text-sm" placeholder="Acme Inc." value={companyName} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Description</label>
                  <input className="input w-full text-sm" placeholder="One-line description" value={companyDesc} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="btn-outline flex-1">Cancel</button>
              <button
                onClick={() => mutate()}
                disabled={isPending || !postUrl || (platform === 'X' && !isXUrl)}
                className="btn-primary flex-1"
              >
                {isPending
                  ? <><Loader2 size={13} className="animate-spin" /> Ingesting…</>
                  : <><Plus size={13} /> Ingest Post</>
                }
              </button>
            </div>
          </>
        )}

        {data && (
          <div className="flex gap-2">
            <button onClick={() => { reset(); setPostUrl('') }} className="btn-outline flex-1">Add Another</button>
            <button onClick={onClose} className="btn-primary flex-1">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}
