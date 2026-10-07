import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from './AuthModal'

// Public nav (always visible)
const NAV_PUBLIC: { to: string; key: DictKey; end?: boolean }[] = [
  { to: '/', key: 'nav.dashboard', end: true },
  { to: '/practice', key: 'nav.practice' },
  { to: '/exam', key: 'nav.exam' },
]

// Auth-gated nav (only when logged in)
const NAV_AUTH: { to: string; key: DictKey }[] = [
  { to: '/mistakes', key: 'nav.mistakes' },
  { to: '/browse', key: 'nav.browse' },
  { to: '/history', key: 'nav.history' },
  { to: '/settings', key: 'nav.settings' },
]

function NavSearchBar() {
  const { t } = useT()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (term.trim()) {
      navigate(`/browse?q=${encodeURIComponent(term.trim())}`)
    } else {
      navigate('/browse')
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative hidden lg:block" role="search">
      <label htmlFor="nav-global-search" className="sr-only">
        {t('common.search')}
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1a3300]/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
          />
        </svg>
        <input
          id="nav-global-search"
          type="search"
          placeholder="Search..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="h-8 w-28 xl:w-36 rounded-full border border-[#b6b6b6] bg-white/80 pl-8 pr-2.5 text-xs text-[#1a3300] placeholder:text-[#1a3300]/40 transition-all focus:w-44 focus:bg-white focus:border-[#1a3300] focus:outline-none"
        />
      </div>
    </form>
  )
}

export function Layout() {
  const { t } = useT()
  const { user, logout } = useAuth()
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({ open: false, mode: 'login' })

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfaf5] text-[#1a3300]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[#ffe95c] focus:px-3 focus:py-2 focus:text-[#1a3300] focus:shadow-md focus:font-bold"
      >
        {t('app.skipToContent')}
      </a>

      {/* Floating Top Nav Box perfectly aligned with main content */}
      <header className="sticky top-4 z-30 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <div
          className="rounded-[16px] border border-[#b6b6b6] bg-[#fcfaf5] px-4 py-3 sm:px-5 sm:py-3.5"
          style={{
            boxShadow: 'rgba(255, 233, 92, 0.25) 0px 8px 24px -4px, rgba(26, 51, 0, 0.06) 0px 1px 3px 0px',
          }}
        >
          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            {/* Left: Brand Lockup */}
            <NavLink to="/" className="flex items-center gap-2 no-underline flex-shrink-0" style={{ color: 'inherit' }}>
              <span
                className="grid h-8 w-8 place-items-center rounded-[6px] text-[#1a3300] bg-[#ffe95c] border border-[#1a3300]/25 font-mono font-black text-xs tracking-tight shadow-2xs"
                aria-hidden="true"
              >
                aws
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-[#1a3300]">
                  Practitioner
                </span>
                <span className="rounded-full bg-[#f5f2e9] border border-[#b6b6b6] px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#1a3300]/80">
                  CLF-C02
                </span>
              </span>
            </NavLink>

            {/* Center: Desktop Nav Links */}
            <nav aria-label={t('nav.menu')} className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {NAV_PUBLIC.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {t(n.key)}
                </NavLink>
              ))}
              {user && NAV_AUTH.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {t(n.key)}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink to="/dev/review" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  {t('nav.devReview')}
                </NavLink>
              )}
            </nav>

            {/* Right: Search & Auth */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <NavSearchBar />
              {user ? (
                <div className="flex items-center gap-2">
                  {/* User badge */}
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#b6b6b6] bg-white/80 px-2.5 py-1 text-xs font-medium text-[#1a3300]">
                    <span className="grid h-4 w-4 place-items-center rounded-full bg-[#ffe95c] text-[8px] font-black">
                      {user.email[0].toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="btn-outline !h-8 !py-1 !px-3 !text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModal({ open: true, mode: 'login' })}
                  className="btn-outline !h-8 !py-1 !px-3.5 !text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          {/* Mobile Nav Links Row (<768px only) */}
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden mt-2 pt-2 border-t border-[#b6b6b6]/35 flex items-center gap-1 overflow-x-auto"
          >
            {NAV_PUBLIC.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `nav-link !text-xs !py-1 !px-2.5 ${isActive ? 'active' : ''}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
            {user && NAV_AUTH.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `nav-link !text-xs !py-1 !px-2.5 ${isActive ? 'active' : ''}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      {/* Auth Modal */}
      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        initialMode={authModal.mode}
      />

      {/* Say Briefly Warm Cream Footer */}
      <footer className="mt-auto border-t-[1.5px] border-[#b6b6b6] bg-[#fcfaf5]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 text-xs text-[#5e6b54]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1a3300]">AWS Certified Cloud Practitioner (CLF-C02)</span>
            <span>·</span>
            <span>Study Sketchbook on Cream Paper</span>
          </div>
          <div className="max-w-xl text-right sm:text-left">{t('app.disclaimer')}</div>
        </div>
      </footer>
    </div>
  )
}
