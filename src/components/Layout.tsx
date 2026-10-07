import { useEffect, useRef, useState } from 'react'
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
          className="h-8 w-24 xl:w-32 rounded-full border border-[#b6b6b6] bg-white/80 pl-8 pr-2.5 text-xs text-[#1a3300] placeholder:text-[#1a3300]/40 transition-all focus:w-40 focus:bg-white focus:border-[#1a3300] focus:outline-none"
        />
      </div>
    </form>
  )
}

export function Layout() {
  const { t } = useT()
  const { user, logout } = useAuth()
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({ open: false, mode: 'login' })
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  return (
    <div className="flex min-h-screen flex-col bg-[#fcfaf5] text-[#1a3300]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[#ffe95c] focus:px-3 focus:py-2 focus:text-[#1a3300] focus:shadow-md focus:font-bold"
      >
        {t('app.skipToContent')}
      </a>

      {/* Floating Top Nav Box perfectly aligned with main content */}
      <header className="sticky top-2 sm:top-4 z-30 mx-auto w-full max-w-[1200px] px-2.5 sm:px-6">
        <div
          className="rounded-[14px] sm:rounded-[16px] border border-[#b6b6b6] bg-[#fcfaf5] px-3 py-2 sm:px-5 sm:py-3"
          style={{
            boxShadow: 'rgba(255, 233, 92, 0.25) 0px 8px 24px -4px, rgba(26, 51, 0, 0.06) 0px 1px 3px 0px',
          }}
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            {/* Left: Brand Lockup */}
            <NavLink to="/" className="flex items-center gap-1.5 sm:gap-2 no-underline shrink-0" style={{ color: 'inherit' }}>
              <span
                className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-[6px] text-[#1a3300] bg-[#ffe95c] border border-[#1a3300]/25 font-mono font-black text-xs tracking-tight shadow-2xs"
                aria-hidden="true"
              >
                aws
              </span>
              <span className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-[#1a3300]">
                  Practitioner
                </span>
                <span className="hidden min-[380px]:inline-block rounded-full bg-[#f5f2e9] border border-[#b6b6b6] px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono font-bold text-[#1a3300]/80">
                  CLF-C02
                </span>
              </span>
            </NavLink>

            {/* Center: Desktop Nav Links (1024px+) */}
            <nav aria-label={t('nav.menu')} className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink min-w-0">
              {NAV_PUBLIC.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) => `nav-link !px-2 !py-1 !text-xs xl:!px-2.5 xl:!text-[13px] ${isActive ? 'active' : ''}`}
                >
                  {t(n.key)}
                </NavLink>
              ))}
              {user && NAV_AUTH.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) => `nav-link !px-2 !py-1 !text-xs xl:!px-2.5 xl:!text-[13px] ${isActive ? 'active' : ''}`}
                >
                  {t(n.key)}
                </NavLink>
              ))}
              {user?.role === 'admin' && (
                <NavLink
                  to="/dev/review"
                  className={({ isActive }) =>
                    `nav-link !px-2 !py-1 !text-xs xl:!px-2.5 xl:!text-[13px] text-amber-950 bg-amber-100/60 border-amber-300/80 ${
                      isActive ? 'active !bg-[#ffe95c]' : ''
                    }`
                  }
                >
                  <span className="flex items-center gap-1">
                    <span>🛠️</span>
                    <span>{t('nav.devReview')}</span>
                  </span>
                </NavLink>
              )}
            </nav>

            {/* Right: Search & User Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <NavSearchBar />
              {/* Quick Search Icon Button for Mobile / Tablet */}
              <NavLink
                to="/browse"
                aria-label="Search questions"
                className="grid h-7 w-7 place-items-center rounded-full border border-[#b6b6b6] bg-white/80 text-[#1a3300] lg:hidden hover:border-[#1a3300] hover:bg-white"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </NavLink>
              {user ? (
                /* ── Interactive User Menu Dropdown ── */
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                    className="flex items-center gap-1.5 rounded-full border border-[#b6b6b6] bg-white/90 py-1 pl-1.5 pr-2.5 text-xs font-semibold text-[#1a3300] hover:border-[#1a3300] hover:bg-white transition-all shadow-2xs"
                  >
                    <span className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-full bg-[#ffe95c] border border-[#1a3300]/20 text-[10px] font-black text-[#1a3300]">
                      {user.email[0].toUpperCase()}
                    </span>
                    <span className="hidden sm:inline-block max-w-[85px] lg:max-w-[120px] truncate text-xs">
                      {user.email.split('@')[0]}
                    </span>
                    {user.role === 'admin' && (
                      <span className="rounded bg-amber-100 border border-amber-300 px-1 py-0.2 text-[9px] font-mono font-bold text-amber-900">
                        ADMIN
                      </span>
                    )}
                    <svg
                      className={`h-3 w-3 text-[#1a3300]/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Popover */}
                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-[#b6b6b6] bg-[#fcfaf5] p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                      style={{
                        boxShadow: 'rgba(26, 51, 0, 0.14) 0px 10px 30px -4px, rgba(26, 51, 0, 0.08) 0px 4px 12px 0px',
                      }}
                    >
                      {/* User Info Header */}
                      <div className="rounded-lg bg-white/80 border border-[#b6b6b6]/40 p-2.5 mb-1.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#ffe95c] font-mono font-black text-xs text-[#1a3300]">
                            {user.email[0].toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-[#1a3300]">{user.email}</div>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#1a3300]/70">
                              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                              <span>{user.role === 'admin' ? 'Administrator' : 'Student Account'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200/60 mt-1">
                          🟢 PostgreSQL Database Connected
                        </div>
                      </div>

                      {/* Dropdown Navigation Links */}
                      <div className="space-y-0.5">
                        {user.role === 'admin' && (
                          <NavLink
                            to="/dev/review"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[#1a3300] hover:bg-[#ffe95c]/35 transition-colors no-underline"
                          >
                            <span className="flex items-center gap-2">
                              <span>🛠️</span>
                              <span>Dev Review</span>
                            </span>
                            <span className="rounded bg-amber-100 border border-amber-300 px-1 text-[9px] font-mono font-bold text-amber-900">
                              ADMIN
                            </span>
                          </NavLink>
                        )}

                        <NavLink
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#1a3300] hover:bg-black/5 transition-colors no-underline"
                        >
                          <span>⚙️</span>
                          <span>Settings & Sync</span>
                        </NavLink>

                        <NavLink
                          to="/history"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#1a3300] hover:bg-black/5 transition-colors no-underline"
                        >
                          <span>📜</span>
                          <span>Exam History</span>
                        </NavLink>

                        <NavLink
                          to="/mistakes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[#1a3300] hover:bg-black/5 transition-colors no-underline"
                        >
                          <span>🎯</span>
                          <span>Mistake Bank</span>
                        </NavLink>
                      </div>

                      <div className="my-1.5 border-t border-[#b6b6b6]/40" />

                      {/* Sign Out Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false)
                          logout()
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
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

          {/* Mobile & Tablet Nav Links Row (<1024px) */}
          <nav
            aria-label="Mobile and Tablet Navigation"
            className="lg:hidden mt-2 pt-2 border-t border-[#b6b6b6]/35 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
          >
            {NAV_PUBLIC.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `nav-link !text-xs !py-1 !px-2.5 whitespace-nowrap shrink-0 ${isActive ? 'active' : ''}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
            {user && NAV_AUTH.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) => `nav-link !text-xs !py-1 !px-2.5 whitespace-nowrap shrink-0 ${isActive ? 'active' : ''}`}
              >
                {t(n.key)}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink
                to="/dev/review"
                className={({ isActive }) =>
                  `nav-link !text-xs !py-1 !px-2.5 whitespace-nowrap shrink-0 text-amber-950 bg-amber-100/60 border-amber-300/80 ${
                    isActive ? 'active !bg-[#ffe95c]' : ''
                  }`
                }
              >
                <span>🛠️ {t('nav.devReview')}</span>
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-4 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      {/* Auth Modal */}
      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        initialMode={authModal.mode}
      />

      {/* Warm Cream Footer */}
      <footer className="mt-auto border-t-[1.5px] border-[#b6b6b6] bg-[#fcfaf5]">
        <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 sm:py-5 sm:px-6 text-xs text-[#5e6b54] text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-bold text-[#1a3300]">AWS Certified Cloud Practitioner (CLF-C02)</span>
            <span className="hidden sm:inline">·</span>
            <span>Study Sketchbook on Cream Paper</span>
          </div>
          <div className="max-w-xl text-center sm:text-right">{t('app.disclaimer')}</div>
        </div>
      </footer>
    </div>
  )
}
