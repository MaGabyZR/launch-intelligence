import { Outlet, NavLink } from 'react-router-dom'
import { Zap, LayoutDashboard, MessageSquareDot, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '@/lib/api'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/outreach', label: 'Outreach', icon: MessageSquareDot },
]

export default function Layout() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats, refetchInterval: 60000 })

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 border-b border-white/[0.06] flex items-center px-5 gap-6 sticky top-0 z-50 bg-surface-900/80 backdrop-blur-xl">
        {/* Wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Zap size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-sm tracking-tight text-gray-100">
            Launch<span className="text-brand-400">Intel</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm transition-all duration-150',
                isActive
                  ? 'bg-brand-500/15 text-brand-400 font-medium'
                  : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.05]'
              )}
            >
              <Icon size={14} />
              {label}
              {to === '/outreach' && stats?.dmsPendingReview ? (
                <span className="ml-0.5 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {stats.dmsPendingReview}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        {/* Live indicator */}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-600">
          <Circle size={6} className="fill-emerald-500 text-emerald-500 animate-pulse-dot" />
          Live
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
