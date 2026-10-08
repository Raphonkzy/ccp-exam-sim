import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { AuthModal } from './AuthModal'
import { useVisitorTracker } from '../lib/visitorTracker'

// Public nav (always visible)
const NAV_PUBLIC: { to: string; key: DictKey; end?: boolean }[] = [
  { to: '/', key: 'nav.dashboard', end: true },
  { to: '/practice', key: 'nav.practice' },
  { to: '/exam', key: 'nav.exam' },
]

// Auth-gated nav (only when logged in): secondary links live in the user dropdown
const NAV_AUTH: { to: string; key: DictKey }[] = [
  { to: '/browse', key: 'nav.browse' },
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
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Search..."
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="h-8 w-24 xl:w-32 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-8 pr-2.5 text-xs text-[var(--color-forest-ink)] placeholder:text-[var(--color-forest-ink)]/40 transition-all focus:w-40 focus:bg-[var(--surface)] focus:border-[var(--color-forest-ink)] focus:outline-none"
        />
      </div>
    </form>
  )
}

export function Layout() {
  useVisitorTracker()
  const { t } = useT()
  const { user } = useAuth()
  const { handleLogout } = useApp()
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
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--color-forest-ink)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--accent)] focus:px-3 focus:py-2 focus:text-[var(--color-forest-ink)] focus:shadow-md focus:font-bold"
      >
        {t('app.skipToContent')}
      </a>

      <header className="sticky top-2 sm:top-4 z-30 mx-auto w-full max-w-[1200px] px-2.5 sm:px-6">
        <div
          className="rounded-[14px] sm:rounded-[16px] border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-3 py-2 sm:px-5 sm:py-3 transition-shadow"
          style={{
            boxShadow: '0 2px 10px -3px var(--glow)',
          }}
        >
          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
            <NavLink to="/" className="flex items-center gap-1.5 sm:gap-2 no-underline shrink-0" style={{ color: 'inherit' }}>
              <span
                className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-[6px] text-[var(--color-forest-ink)] bg-[var(--accent)] border border-[var(--border)] font-mono font-black text-xs tracking-tight shadow-2xs"
                aria-hidden="true"
              >
                aws
              </span>
              <span className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-[var(--color-forest-ink)]">
                  Practitioner
                </span>
                <span className="hidden min-[380px]:inline-block rounded-full bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.2 text-[9px] sm:text-[10px] font-mono font-bold text-[var(--color-forest-ink)]/80">
                  CLF-C02
                </span>
              </span>
            </NavLink>

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
                <>
                  <NavLink
                    to="/dev"
                    end
                    className={({ isActive }) =>
                      `nav-link !px-2 !py-1 !text-xs xl:!px-2.5 xl:!text-[13px] text-amber-950 bg-amber-100/60 border-amber-300/80 ${
                        isActive ? 'active !bg-[#ffe95c]' : ''
                      }`
                    }
                  >
                    <span>{t('nav.devDashboard')}</span>
                  </NavLink>
                  <NavLink
                    to="/dev/review"
                    className={({ isActive }) =>
                      `nav-link !px-2 !py-1 !text-xs xl:!px-2.5 xl:!text-[13px] text-amber-950 bg-amber-100/60 border-amber-300/80 ${
                        isActive ? 'active !bg-[#ffe95c]' : ''
                      }`
                    }
                  >
                    <span>{t('nav.devReview')}</span>
                  </NavLink>
                </>
              )}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <NavSearchBar />
              <NavLink
                to="/browse"
                aria-label="Search questions"
                className="grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--color-forest-ink)] lg:hidden hover:border-[var(--color-forest-ink)]"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </NavLink>
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-label="User menu"
                    className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] py-1 pl-1.5 pr-2.5 text-xs font-semibold text-[var(--color-forest-ink)] hover:border-[var(--color-forest-ink)] transition-all shadow-2xs"
                  >
                    <span className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-full bg-[var(--accent)] border border-[var(--border)] text-[10px] font-black text-[var(--color-forest-ink)]">
                      {(user.username ? user.username[0] : user.email[0]).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline-block max-w-[85px] lg:max-w-[120px] truncate text-xs">
                      {user.username || user.email.split('@')[0]}
                    </span>
                    {user.role === 'admin' && (
                      <span className="rounded bg-amber-100 border border-amber-300 px-1 py-0.2 text-[9px] font-mono font-bold text-amber-900">
                        ADMIN
                      </span>
                    )}
                    <svg
                      className={`h-3 w-3 text-[var(--color-forest-ink)]/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-[min(16rem,calc(100vw-1.5rem))] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                    >
                      <div className="rounded-lg bg-[var(--surface-2)] border border-[var(--border)]/50 p-2.5 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] font-mono font-black text-xs text-[var(--color-forest-ink)] border border-[var(--border)]">
                            {(user.username ? user.username[0] : user.email[0]).toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-[var(--color-forest-ink)]">
                              {user.username ? `@${user.username}` : user.email.split('@')[0]}
                            </div>
                            <div className="truncate text-[10px] text-[var(--color-forest-ink)]/70">
                              {user.email}
                            </div>
                            {user.role === 'admin' && (
                              <div className="text-[10px] font-semibold text-amber-900">Administrator</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        {user.role === 'admin' && (
                          <>
                            <NavLink
                              to="/dev"
                              end
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--color-forest-ink)] hover:bg-[var(--surface-2)] transition-colors no-underline"
                            >
                              <span>Dev Dashboard</span>
                              <span className="rounded bg-amber-100 border border-amber-300 px-1 text-[9px] font-mono font-bold text-amber-900">
                                ADMIN
                              </span>
                            </NavLink>
                            <NavLink
                              to="/dev/review"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--color-forest-ink)] hover:bg-[var(--surface-2)] transition-colors no-underline"
                            >
                              <span>Questions Review</span>
                              <span className="rounded bg-amber-100 border border-amber-300 px-1 text-[9px] font-mono font-bold text-amber-900">
                                DEV
                              </span>
                            </NavLink>
                          </>
                        )}

                        <NavLink
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-forest-ink)] hover:bg-[var(--surface-2)] transition-colors no-underline"
                        >
                          <span>Settings</span>
                        </NavLink>

                        <NavLink
                          to="/history"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-forest-ink)] hover:bg-[var(--surface-2)] transition-colors no-underline"
                        >
                          <span>Exam History</span>
                        </NavLink>

                        <NavLink
                          to="/mistakes"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-forest-ink)] hover:bg-[var(--surface-2)] transition-colors no-underline"
                        >
                          <span>Mistake Bank</span>
                        </NavLink>
                      </div>

                      <div className="my-1.5 border-t border-[var(--border)]/40" />

                      <button
                        type="button"
                        onClick={async () => {
                          setUserMenuOpen(false)
                          await handleLogout()
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
                <div className="flex items-center gap-1.5">
                  <NavLink
                    to="/settings"
                    aria-label="Settings"
                    title="Settings & Themes"
                    className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--color-forest-ink)] hover:border-[var(--color-forest-ink)] transition-colors"
                  >
                    <svg className="h-4 w-4 opacity-75" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setAuthModal({ open: true, mode: 'login' })}
                    className="btn-outline !h-8 !py-1 !px-3.5 !text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>

          <nav
            aria-label="Mobile and Tablet Navigation"
            className="lg:hidden mt-2 pt-2 border-t border-[var(--border)]/40 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
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
              <>
                <NavLink
                  to="/dev"
                  end
                  className={({ isActive }) =>
                    `nav-link !text-xs !py-1 !px-2.5 whitespace-nowrap shrink-0 text-amber-950 bg-amber-100/60 border-amber-300/80 ${
                      isActive ? 'active !bg-[var(--accent)]' : ''
                    }`
                  }
                >
                  <span>Dev Dashboard</span>
                </NavLink>
                <NavLink
                  to="/dev/review"
                  className={({ isActive }) =>
                    `nav-link !text-xs !py-1 !px-2.5 whitespace-nowrap shrink-0 text-amber-950 bg-amber-100/60 border-amber-300/80 ${
                      isActive ? 'active !bg-[var(--accent)]' : ''
                    }`
                  }
                >
                  <span>{t('nav.devReview')}</span>
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-3 py-4 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        initialMode={authModal.mode}
      />

      <footer className="mt-auto border-t-[1.5px] border-[var(--border)] bg-[var(--surface)]/80">
        <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 sm:py-5 sm:px-6 text-xs text-[var(--muted)] text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-bold text-[var(--color-forest-ink)]">AWS Certified Cloud Practitioner (CLF-C02)</span>
            <span className="hidden sm:inline">·</span>
            <span>Study Sketchbook</span>
            <span className="hidden sm:inline">·</span>
            <span className="font-mono text-[11px] font-semibold text-[var(--color-forest-ink)]/80">
              Made by <strong className="font-bold text-[var(--color-forest-ink)]">raphonkzy</strong>
            </span>
          </div>
          <div className="max-w-xl text-center sm:text-right">{t('app.disclaimer')}</div>
        </div>
      </footer>
    </div>
  )
}
