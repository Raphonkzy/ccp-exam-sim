import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { AuthModal } from '../components/AuthModal'
import { useT } from '../i18n'
import type { DictKey } from '../i18n/en'
import { DomainChart } from '../components/DomainChart'
import { allQuestions } from '../lib/questionService'
import { computeStreak, domainAccuracy, latestWrongIds, overall } from '../lib/stats'

const DOMAIN_CARDS_BASE = [
  {
    domain: 1,
    weight: '24%',
    badgeBorder: '#0d9488',
    borderTop: '#0d9488',
    color: '#0d9488',
    shortName: 'Concepts',
  },
  {
    domain: 2,
    weight: '30%',
    badgeBorder: '#16a34a',
    borderTop: '#16a34a',
    color: '#16a34a',
    shortName: 'Security',
  },
  {
    domain: 3,
    weight: '34%',
    badgeBorder: '#9333ea',
    borderTop: '#9333ea',
    color: '#9333ea',
    shortName: 'Technology',
  },
  {
    domain: 4,
    weight: '12%',
    badgeBorder: '#cb5521',
    borderTop: '#cb5521',
    color: '#cb5521',
    shortName: 'Billing',
  },
]

const DOMAIN_CARDS = DOMAIN_CARDS_BASE.map((item) => ({
  ...item,
  count: allQuestions.filter((q) => q.domain === item.domain).length,
}))

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string
  value: string
  hint?: string
  icon: React.ReactNode
}) {
  return (
    <div className="card card-hover flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70">{label}</span>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--surface-2)] border border-[var(--color-pencil-gray)] text-[var(--color-forest-ink)]">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <div className="text-3xl font-extrabold tracking-tight text-[var(--color-forest-ink)]" style={{ fontFamily: 'var(--font-display)' }}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-[var(--color-forest-ink)]/70">{hint}</div>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { t } = useT()
  const { data } = useApp()
  const { user } = useAuth()
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'register' }>({ open: false, mode: 'register' })
  const navigate = useNavigate()
  const o = overall(data)
  const acc = domainAccuracy(data)
  const streak = computeStreak(data)
  const wrong = latestWrongIds(data)
  const withData = acc.filter((a) => a.pct !== null)
  const weakest = withData.length ? withData.reduce((a, b) => ((a.pct ?? 0) <= (b.pct ?? 0) ? a : b)) : null

  return (
    <div className="grid gap-8">
      <section
        className="relative overflow-hidden rounded-2xl border-[1.5px] border-[var(--border)] bg-[var(--surface)] p-6 sm:p-10"
        style={{
          boxShadow: '0 4px 18px -4px var(--glow)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="tagline-badge mb-3">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6 4.4 2.3 7.2L12 16.5l-6.3 4.5 2.3-7.2-6-4.4h7.6z"/>
              </svg>
              <span>AWS CLF-C02 STUDY DESK</span>
            </div>
            <h1 className="h1 text-[var(--color-forest-ink)] mt-1">
              AWS <span className="highlight">Certified</span> Cloud Practitioner
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[var(--color-forest-ink)]/85 leading-relaxed font-normal">
              Creative agency sketchbook on cream paper with {allQuestions.length} exam-accurate scenario questions covering all 4 blueprint domains.
            </p>
            <div className="mt-2 text-xs font-mono text-[var(--color-forest-ink)]/60">
              no account required · 100% free · exam simulation ready
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <Link to="/practice" className="btn-primary no-underline text-center text-base py-3 px-6 inline-flex items-center justify-center gap-2">
              <span>{t('dashboard.startPractice')}</span>
              <span className="font-mono">→</span>
            </Link>
            <Link to="/exam" className="btn-outline no-underline text-center text-base py-3 px-6 bg-[var(--surface)]">
              <span>{t('dashboard.startExam')}</span>
            </Link>
          </div>
        </div>
      </section>

      {!user && (
        <section
          className="card flex flex-col md:flex-row md:items-center justify-between gap-4 border-[1.5px] border-[var(--border)] bg-[var(--surface-2)]"
          style={{
            boxShadow: '0 2px 10px -2px var(--glow)',
          }}
        >
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--accent)] border border-[var(--border-strong)] px-2.5 py-0.5 text-[10px] font-mono font-bold text-[var(--accent-text)] shadow-2xs">
                STUDY ANYWHERE
              </span>
              <span className="text-sm font-bold text-[var(--color-forest-ink)]">
                Save your progress online & unlock all features
              </span>
            </div>
            <p className="text-xs text-[var(--color-forest-ink)]/75 max-w-2xl leading-relaxed">
              Practice anytime as a guest, or create an account to save your exam scores online, track recurring mistakes, and access bookmarks across all your devices.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAuthModal({ open: true, mode: 'register' })}
            className="btn-primary !py-2.5 !px-4 !text-xs font-bold inline-flex items-center justify-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto md:self-center"
          >
            <span>Create Free Account</span>
            <span className="font-mono">→</span>
          </button>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
          label={t('dashboard.answered')}
          value={String(o.answeredUnique)}
          hint={t('dashboard.answeredOf', { n: o.answeredUnique, total: allQuestions.length })}
        />
        <StatCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          label={t('dashboard.accuracy')}
          value={o.pct === null ? 'N/A' : `${o.pct}%`}
          hint={o.total ? `${o.correct}/${o.total} ${t('review.correct')}` : undefined}
        />
        <StatCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          label={t('dashboard.streak')}
          value={t('dashboard.streakDays', { n: streak })}
          hint={t('dashboard.streakHint')}
        />
        <StatCard
          icon={
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          label={t('dashboard.attempts')}
          value={String(data.sessions.length)}
          hint={wrong.length > 0 ? t('dashboard.mistakesCta', { n: wrong.length }) : undefined}
        />
      </div>

      <section aria-labelledby="domains-heading">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="domains-heading" className="h2 text-[var(--color-forest-ink)]">
            Domains & Study Sets
          </h2>
          <span className="text-xs font-mono text-[var(--color-forest-ink)]/70 font-medium">CLF-C02 Blueprint Weighted</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DOMAIN_CARDS.map((card) => {
            const domainAcc = acc.find((a) => a.domain === card.domain)
            const pct = domainAcc?.pct ?? null
            const label = t(`domain.${card.domain}` as DictKey)

            return (
              <div
                key={card.domain}
                className="domain-card flex flex-col justify-between"
                style={{
                  borderTop: `4px solid ${card.borderTop}`,
                }}
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span
                      className="chip font-mono font-bold text-xs"
                      style={{
                        background: `color-mix(in srgb, ${card.color} 18%, var(--surface))`,
                        color: card.color,
                        borderColor: card.badgeBorder,
                      }}
                    >
                      Domain {card.domain} · {card.weight}
                    </span>
                    <span className="text-xs font-mono font-bold text-[var(--color-forest-ink)]/70">{card.count} Qs</span>
                  </div>

                  <h3 className="font-bold text-base text-[var(--color-forest-ink)] line-clamp-2 mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
                    {label}
                  </h3>
                  <p className="text-xs text-[var(--color-forest-ink)]/80 leading-relaxed">
                    {card.shortName} and core AWS architectural practices.
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[var(--border)]/50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] block font-mono text-[var(--color-forest-ink)]/70 font-semibold">Mastery</span>
                    <span className="text-sm font-extrabold text-[var(--color-forest-ink)]">
                      {pct === null ? 'Not started' : `${pct}%`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/practice', { state: { domain: card.domain } })}
                    className="btn btn-sm !rounded-[6px] text-xs font-semibold hover:border-[var(--border-strong)]"
                  >
                    Study →
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2" aria-labelledby="dom-acc">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 id="dom-acc" className="h2 text-[var(--color-forest-ink)]">
              {t('dashboard.domainAccuracy')}
            </h2>
            <span className="text-xs font-mono text-[var(--color-forest-ink)]/70">All recorded attempts</span>
          </div>

          {o.total === 0 ? (
            <div className="py-8 text-center">
              <p className="font-semibold text-[var(--color-forest-ink)]">{t('dashboard.noData')}</p>
              <p className="text-[var(--color-forest-ink)]/70 mt-1 text-sm">{t('dashboard.noDataHint')}</p>
              <Link to="/practice" className="btn-primary mt-4 inline-flex no-underline text-xs">
                <span>{t('dashboard.startPractice')}</span>
                <span className="font-mono">→</span>
              </Link>
            </div>
          ) : (
            <DomainChart
              data={acc.map((a) => ({
                domain: a.domain,
                pct: a.pct,
                detail: a.total ? `${a.correct}/${a.total}` : undefined,
              }))}
            />
          )}
        </section>

        <section className="card flex flex-col justify-between" aria-labelledby="focus">
          <div>
            <h2 id="focus" className="h2 mb-2 text-[var(--color-forest-ink)]">
              {t('dashboard.weakTitle')}
            </h2>
            {weakest ? (
              <div className="mt-2">
                <p className="text-sm text-[var(--color-forest-ink)]/85 leading-relaxed">
                  {t('dashboard.weakBody', {
                    domain: t(`domain.${weakest.domain}` as DictKey),
                    pct: weakest.pct ?? 0,
                  })}
                </p>
                <button
                  type="button"
                  className="btn-primary !py-2 !px-4 mt-4 text-xs font-semibold inline-flex items-center gap-1.5"
                  onClick={() => navigate('/practice', { state: { domain: weakest.domain } })}
                >
                  <span>{t('dashboard.weakPractice')}</span>
                  <span className="font-mono">→</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-forest-ink)]/70 leading-relaxed">{t('dashboard.weakNone')}</p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2 pt-6 border-t border-[var(--color-pencil-gray)]/40">
            {wrong.length > 0 && (
              <Link to="/mistakes" className="btn text-center text-sm no-underline">
                {t('dashboard.mistakesCta', { n: wrong.length })}
              </Link>
            )}
            <Link to="/browse" className="btn text-center text-sm no-underline">
              {t('nav.browse')} {allQuestions.length} Questions
            </Link>
          </div>
        </section>
      </div>

      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal((prev) => ({ ...prev, open: false }))}
        initialMode={authModal.mode}
      />
    </div>
  )
}


