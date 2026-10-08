import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { allQuestions } from '../lib/questionService'
import { ConfirmDialog } from '../components/ConfirmDialog'

interface AdminOverview {
  summary: {
    total_users: number
    total_attempts: number
    passed_attempts: number
    pass_rate_pct: number
    avg_score_pct: number
    total_bookmarks: number
    total_mistakes: number
  }
  recent_activity: Array<{
    id: string
    user_id: string
    username?: string
    email: string
    score: number
    total: number
    passed?: boolean
    domain_scores?: Record<string, { correct: number; total: number }>
    started_at?: string
    finished_at?: string
  }>
  top_missed: Array<{
    question_id: string
    times_wrong: number
    student_count: number
  }>
  domain_benchmarks: Array<{
    domain: number
    accuracy: number | null
    total_questions: number
  }>
}

interface AdminUserItem {
  id: string
  username?: string
  email: string
  role: 'user' | 'admin'
  created_at: string
  attempts_count: number
  avg_score_pct: number
  passed_count: number
  bookmarks_count: number
  mistakes_count: number
  last_active?: string
}

interface InspectedUserDetail {
  user: {
    id: string
    username?: string
    email: string
    role: 'user' | 'admin'
    created_at: string
    updated_at?: string
  }
  attempts: Array<{
    id: string
    score: number
    total: number
    passed?: boolean
    domain_scores?: Record<string, { correct: number; total: number }>
    started_at?: string
    finished_at?: string
  }>
  bookmarks: Array<{ question_id: string; created_at: string }>
  mistakes: Array<{ question_id: string; times_wrong: number; last_seen?: string }>
  progress: {
    answers: Record<string, any[]>
    confusing: string[]
    settings: Record<string, any>
    updated_at?: string | null
  }
}

export interface InspectedAttempt {
  id: string
  user_id: string
  username?: string
  email?: string
  score: number
  total: number
  passed?: boolean
  answers?: Record<string, string[]> | string
  domain_scores?: Record<string, { correct: number; total: number }> | string
  started_at?: string
  finished_at?: string
}

const DOMAIN_NAMES: Record<number, string> = {
  1: 'Cloud Concepts',
  2: 'Security & Compliance',
  3: 'Cloud Technology & Services',
  4: 'Billing & Pricing',
}

export default function DevDashboard() {
  const { user: currentAdmin } = useAuth()
  const [tab, setTab] = useState<'monitor' | 'users'>('monitor')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerMsg, setBannerMsg] = useState<{ type: 'good' | 'bad'; text: string } | null>(null)

  // Data
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [users, setUsers] = useState<AdminUserItem[]>([])

  // Filtering & Search for Users tab
  const [userQuery, setUserQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'attempts' | 'score' | 'active'>('created_desc')

  // Inspect Modal
  const [inspectUserId, setInspectUserId] = useState<string | null>(null)
  const [inspectData, setInspectData] = useState<InspectedUserDetail | null>(null)
  const [inspectLoading, setInspectLoading] = useState(false)
  const [inspectTab, setInspectTab] = useState<'attempts' | 'mistakes' | 'bookmarks'>('attempts')

  // Exam / Practice Session Review Modal
  const [reviewedAttempt, setReviewedAttempt] = useState<InspectedAttempt | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct'>('all')

  // Confirmation Dialog
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    body: string
    confirmLabel: string
    danger?: boolean
    action: () => Promise<void>
  } | null>(null)

  const showBanner = (text: string, type: 'good' | 'bad' = 'good') => {
    setBannerMsg({ type, text })
    setTimeout(() => setBannerMsg(null), 4000)
  }

  const openAttemptReview = async (attempt: InspectedAttempt) => {
    setReviewFilter('all')
    let parsed: any = null
    if (typeof attempt.answers === 'string') {
      try { parsed = JSON.parse(attempt.answers) } catch {}
    } else if (attempt.answers && typeof attempt.answers === 'object') {
      parsed = attempt.answers
    }

    if (parsed && Object.keys(parsed).length > 0) {
      setReviewedAttempt({ ...attempt, answers: parsed })
      return
    }

    setReviewLoading(true)
    setReviewedAttempt(attempt)
    try {
      const res = await fetch(`/api/user/admin/attempts/${attempt.id}`, { credentials: 'include' })
      if (res.ok) {
        const fullData = await res.json()
        let fullAnswers = fullData.answers
        if (typeof fullAnswers === 'string') {
          try { fullAnswers = JSON.parse(fullAnswers) } catch {}
        }
        setReviewedAttempt({ ...attempt, ...fullData, answers: fullAnswers })
      }
    } catch {
      // Retain attempt info
    } finally {
      setReviewLoading(false)
    }
  }

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const [ovRes, usrRes] = await Promise.all([
        fetch('/api/user/admin/overview', { credentials: 'include' }),
        fetch('/api/user/admin/users', { credentials: 'include' }),
      ])

      if (!ovRes.ok || !usrRes.ok) {
        throw new Error('Failed to load developer dashboard data. Ensure server is online.')
      }

      const [ovData, usrData] = await Promise.all([ovRes.json(), usrRes.json()])
      setOverview(ovData)
      setUsers(usrData)
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleInspectUser = async (userId: string) => {
    setInspectUserId(userId)
    setInspectLoading(true)
    setInspectData(null)
    setInspectTab('attempts')

    try {
      const res = await fetch(`/api/user/admin/users/${userId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to load user profile.')
      const data = await res.json()
      setInspectData(data)
    } catch (err: any) {
      showBanner(err.message || 'Error loading user data', 'bad')
      setInspectUserId(null)
    } finally {
      setInspectLoading(false)
    }
  }

  const handleToggleRole = (user: AdminUserItem) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    const roleTitle = nextRole === 'admin' ? 'Promote to Administrator' : 'Demote to Student'

    setConfirmModal({
      open: true,
      title: `${roleTitle}?`,
      body: `Are you sure you want to change the role of ${user.username ? `@${user.username}` : user.email} to "${nextRole}"?`,
      confirmLabel: nextRole === 'admin' ? 'Make Admin' : 'Change to Student',
      danger: nextRole !== 'admin',
      action: async () => {
        try {
          const res = await fetch(`/api/user/admin/users/${user.id}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role: nextRole }),
          })
          const resData = await res.json()
          if (!res.ok) throw new Error(resData.error || 'Failed to update role')
          showBanner(`User role updated to ${nextRole}.`)
          await loadData(true)
          if (inspectData && inspectData.user.id === user.id) {
            setInspectData({
              ...inspectData,
              user: { ...inspectData.user, role: nextRole },
            })
          }
        } catch (err: any) {
          showBanner(err.message || 'Error updating role', 'bad')
        } finally {
          setConfirmModal(null)
        }
      },
    })
  }

  const handleResetUserData = (user: { id: string; username?: string; email: string }) => {
    setConfirmModal({
      open: true,
      title: 'Reset Student Study Data?',
      body: `This will erase all exam attempts, mistakes, bookmarks, and answer records for ${
        user.username ? `@${user.username}` : user.email
      }. The user account credentials will be kept. This action cannot be undone.`,
      confirmLabel: 'Reset Data',
      danger: true,
      action: async () => {
        try {
          const res = await fetch(`/api/user/admin/users/${user.id}/reset`, {
            method: 'POST',
            credentials: 'include',
          })
          const resData = await res.json()
          if (!res.ok) throw new Error(resData.error || 'Failed to reset student data')
          showBanner(`Study data for ${user.username ? `@${user.username}` : user.email} has been reset.`)
          await loadData(true)
          if (inspectUserId === user.id) {
            handleInspectUser(user.id)
          }
        } catch (err: any) {
          showBanner(err.message || 'Error resetting data', 'bad')
        } finally {
          setConfirmModal(null)
        }
      },
    })
  }

  const handleDeleteUser = (user: { id: string; username?: string; email: string }) => {
    setConfirmModal({
      open: true,
      title: 'Delete User Account?',
      body: `Permanently delete the account and all associated test data for ${
        user.username ? `@${user.username}` : user.email
      }? This action is irreversible.`,
      confirmLabel: 'Delete Account',
      danger: true,
      action: async () => {
        try {
          const res = await fetch(`/api/user/admin/users/${user.id}`, {
            method: 'DELETE',
            credentials: 'include',
          })
          const resData = await res.json()
          if (!res.ok) throw new Error(resData.error || 'Failed to delete user')
          showBanner(`User ${user.username ? `@${user.username}` : user.email} was removed.`)
          if (inspectUserId === user.id) {
            setInspectUserId(null)
            setInspectData(null)
          }
          await loadData(true)
        } catch (err: any) {
          showBanner(err.message || 'Error deleting user', 'bad')
        } finally {
          setConfirmModal(null)
        }
      },
    })
  }

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase()
    return users
      .filter((u) => {
        if (roleFilter !== 'all' && u.role !== roleFilter) return false
        if (q) {
          const matchesEmail = u.email.toLowerCase().includes(q)
          const matchesUsername = u.username ? u.username.toLowerCase().includes(q) : false
          if (!matchesEmail && !matchesUsername) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'created_desc') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }
        if (sortBy === 'created_asc') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        }
        if (sortBy === 'attempts') {
          return b.attempts_count - a.attempts_count
        }
        if (sortBy === 'score') {
          return b.avg_score_pct - a.avg_score_pct
        }
        if (sortBy === 'active') {
          const ta = a.last_active ? new Date(a.last_active).getTime() : 0
          const tb = b.last_active ? new Date(b.last_active).getTime() : 0
          return tb - ta
        }
        return 0
      })
  }, [users, userQuery, roleFilter, sortBy])

  // Parsed Attempt Questions & Mistake Review
  const parsedAnswers: Record<string, string[]> = useMemo(() => {
    if (!reviewedAttempt?.answers) return {}
    if (typeof reviewedAttempt.answers === 'string') {
      try { return JSON.parse(reviewedAttempt.answers) } catch { return {} }
    }
    return (reviewedAttempt.answers as Record<string, string[]>) || {}
  }, [reviewedAttempt])

  const parsedDomainScores = useMemo(() => {
    if (!reviewedAttempt?.domain_scores) return {}
    if (typeof reviewedAttempt.domain_scores === 'string') {
      try { return JSON.parse(reviewedAttempt.domain_scores) } catch { return {} }
    }
    return (reviewedAttempt.domain_scores as Record<string, { correct: number; total: number }>) || {}
  }, [reviewedAttempt])

  const attemptQuestionList = useMemo(() => {
    const qids = Object.keys(parsedAnswers)
    return qids.map((qid, idx) => {
      const qObj = allQuestions.find((q) => q.id === qid)
      const selected = parsedAnswers[qid] ?? []
      const correctOptions = qObj?.correctOptionIds ?? []
      const isCorrect =
        Boolean(qObj) &&
        selected.length === correctOptions.length &&
        selected.every((id) => correctOptions.includes(id))

      return {
        index: idx + 1,
        qid,
        question: qObj,
        selected,
        correctOptions,
        isCorrect,
      }
    })
  }, [parsedAnswers])

  const wrongCount = useMemo(() => attemptQuestionList.filter((x) => !x.isCorrect).length, [attemptQuestionList])
  const correctCount = useMemo(() => attemptQuestionList.filter((x) => x.isCorrect).length, [attemptQuestionList])

  const filteredQuestionList = useMemo(() => {
    if (reviewFilter === 'wrong') return attemptQuestionList.filter((x) => !x.isCorrect)
    if (reviewFilter === 'correct') return attemptQuestionList.filter((x) => x.isCorrect)
    return attemptQuestionList
  }, [attemptQuestionList, reviewFilter])

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="fade-up flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-900 tracking-wider">
              DEVELOPER CONTROL CONSOLE
            </span>
            <span className="text-xs text-[var(--muted)]">v2.1</span>
          </div>
          <h1 className="h1 text-[var(--color-forest-ink)]">Developer & Platform Console</h1>
          <p className="text-sm text-[var(--color-forest-ink)]/70 mt-1">
            Monitor real-time student practice performance, examine simulation metrics, and maintain user accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            className="btn !py-1.5 !px-3.5 !text-xs font-semibold inline-flex items-center gap-1.5"
            title="Refresh dashboard metrics"
          >
            <svg
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          <Link
            to="/dev/review"
            className="btn-outline !py-1.5 !px-3.5 !text-xs font-semibold no-underline inline-flex items-center gap-1"
          >
            <span>Questions Audit</span>
            <span className="text-[10px]">→</span>
          </Link>
        </div>
      </div>

      {bannerMsg && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium transition-all animate-in fade-in ${
            bannerMsg.type === 'good'
              ? 'bg-[#d1fae5] border-green-300 text-green-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {bannerMsg.text}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <p className="font-bold mb-1">Failed to connect to backend</p>
          <p>{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] gap-2">
        <button
          type="button"
          onClick={() => setTab('monitor')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 ${
            tab === 'monitor'
              ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--color-forest-ink)]'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Activity Monitor</span>
          {overview && (
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.2 text-[10px] font-mono font-bold text-[var(--color-forest-ink)]">
              {overview.summary.total_attempts} exams
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab('users')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors inline-flex items-center gap-2 ${
            tab === 'users'
              ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--color-forest-ink)]'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span>User Maintenance</span>
          <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.2 text-[10px] font-mono font-bold text-[var(--color-forest-ink)]">
            {users.length}
          </span>
        </button>
      </div>

      {loading ? (
        <div className="card py-16 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--color-forest-ink)]" />
          <p className="mt-3 text-xs font-semibold text-[var(--muted)]">Loading platform data…</p>
        </div>
      ) : tab === 'monitor' && overview ? (
        /* TAB 1: MONITORING DASHBOARD */
        <div className="grid gap-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="card !p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Registered Students</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-forest-ink)]">
                  {overview.summary.total_users}
                </span>
                <span className="text-[11px] text-[var(--muted)]">accounts</span>
              </div>
            </div>

            <div className="card !p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Exams Taken</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-forest-ink)]">
                  {overview.summary.total_attempts}
                </span>
                <span className="rounded bg-emerald-100 border border-emerald-300 px-1.5 py-0.2 text-[10px] font-mono font-bold text-emerald-800">
                  {overview.summary.pass_rate_pct}% pass rate
                </span>
              </div>
            </div>

            <div className="card !p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Average Score</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-forest-ink)]">
                  {overview.summary.avg_score_pct}%
                </span>
                <span className="text-[11px] text-[var(--muted)]">across all tests</span>
              </div>
            </div>

            <div className="card !p-4 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">Mistakes Logged</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[var(--color-forest-ink)]">
                  {overview.summary.total_mistakes}
                </span>
                <span className="text-[11px] text-[var(--muted)]">flagged items</span>
              </div>
            </div>
          </div>

          {/* Domain Benchmarks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--color-forest-ink)]">Domain Performance Benchmarks</h2>
                <p className="text-xs text-[var(--muted)]">Aggregate student accuracy across the 4 CLF-C02 official domains.</p>
              </div>
              <span className="chip !text-[11px] font-mono">Exam Weights</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {overview.domain_benchmarks.map((d) => {
                const acc = d.accuracy !== null ? d.accuracy : 0
                const colorClass =
                  acc >= 75 ? 'bg-emerald-600' : acc >= 60 ? 'bg-amber-500' : 'bg-rose-500'

                return (
                  <div key={d.domain} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase text-[var(--muted)]">
                          Domain {d.domain}
                        </span>
                        <span className="font-mono text-xs font-extrabold text-[var(--color-forest-ink)]">
                          {d.accuracy !== null ? `${d.accuracy}%` : 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[var(--color-forest-ink)] line-clamp-1">
                        {DOMAIN_NAMES[d.domain]}
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                          style={{ width: `${Math.min(100, Math.max(0, acc))}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-[10px] text-[var(--muted)] font-mono">
                        {d.total_questions} questions answered
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2-Column Section: Live Activity Feed + Top Missed Questions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Exam Activity (2 cols) */}
            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-forest-ink)]">Recent Student Exams</h2>
                  <p className="text-xs text-[var(--muted)]">Live stream of finished practice & exam simulations.</p>
                </div>
                <span className="text-xs font-mono text-[var(--muted)]">{overview.recent_activity.length} recent</span>
              </div>

              {overview.recent_activity.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--muted)]">
                  No exam attempts recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted)] font-semibold">
                        <th className="py-2 pr-3">Student</th>
                        <th className="py-2 px-3">Score</th>
                        <th className="py-2 px-3">Result</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 pl-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]/60">
                      {overview.recent_activity.map((att) => {
                        const pct = att.total > 0 ? Math.round((att.score / att.total) * 100) : 0
                        const isPass = att.passed ?? pct >= 70

                        return (
                          <tr key={att.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                            <td className="py-2.5 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] font-mono font-bold text-[10px] text-[var(--color-forest-ink)] border border-[var(--border)]">
                                  {(att.username ? att.username[0] : att.email[0]).toUpperCase()}
                                </span>
                                <div>
                                  <div className="font-bold text-[var(--color-forest-ink)]">
                                    {att.username ? `@${att.username}` : att.email.split('@')[0]}
                                  </div>
                                  <div className="text-[10px] text-[var(--muted)]">{att.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono">
                              <span className="font-bold text-[var(--color-forest-ink)]">{att.score}</span>
                              <span className="text-[var(--muted)]">/{att.total}</span>
                              <span className="text-[11px] text-[var(--muted)] ml-1.5">({pct}%)</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                                  isPass
                                    ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                                    : 'bg-rose-100 border border-rose-300 text-rose-900'
                                }`}
                              >
                                {isPass ? 'PASSED' : 'FAILED'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[11px] text-[var(--muted)] font-mono whitespace-nowrap">
                              {att.finished_at ? new Date(att.finished_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openAttemptReview(att)}
                                  className="btn !py-1 !px-2.5 !text-[11px] font-semibold text-emerald-900 border-emerald-300 hover:bg-emerald-50"
                                  title="Review exam questions and student mistakes"
                                >
                                  Review
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInspectUser(att.user_id)}
                                  className="btn !py-1 !px-2 !text-[11px] font-semibold"
                                  title="Inspect student profile"
                                >
                                  User
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Missed Questions (1 col) */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-[var(--color-forest-ink)]">Top Struggled Questions</h2>
                  <p className="text-xs text-[var(--muted)]">Most frequent mistakes across all users.</p>
                </div>
              </div>

              {overview.top_missed.length === 0 ? (
                <div className="py-10 text-center text-xs text-[var(--muted)]">
                  No mistake data accumulated yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {overview.top_missed.map((item, idx) => {
                    const qObj = allQuestions.find((q) => q.id === item.question_id)

                    return (
                      <div
                        key={item.question_id}
                        className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 p-2.5 text-xs transition-colors hover:border-[var(--color-forest-ink)]"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-black text-[var(--muted)]">
                              #{idx + 1}
                            </span>
                            <span className="rounded bg-white border border-[var(--border)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--color-forest-ink)]">
                              {item.question_id}
                            </span>
                            {qObj && (
                              <span className="chip !text-[9px] !py-0.2">
                                Domain {qObj.domain}
                              </span>
                            )}
                          </div>
                          <span className="rounded bg-rose-100 border border-rose-300 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-900">
                            {item.times_wrong}x wrong
                          </span>
                        </div>
                        <p className="line-clamp-2 text-[11px] font-medium text-[var(--color-forest-ink)]">
                          {qObj ? qObj.question : 'Question definition'}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-[var(--muted)] font-mono">
                          <span>{item.student_count} students affected</span>
                          <Link
                            to={`/browse?q=${item.question_id}`}
                            className="font-bold underline text-[var(--color-forest-ink)] hover:text-black"
                          >
                            View in Bank →
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : tab === 'users' ? (
        /* TAB 2: REGISTERED USERS DIRECTORY & MAINTENANCE */
        <div className="grid gap-4">
          {/* Controls Bar */}
          <div className="card !p-3 sm:!p-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-4 items-end">
            <div className="sm:col-span-2">
              <label htmlFor="user-search" className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Search Students
              </label>
              <div className="relative">
                <input
                  id="user-search"
                  type="search"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Filter by username or email…"
                  className="field w-full text-xs"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role-filter" className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Role
              </label>
              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="field w-full text-xs"
              >
                <option value="all">All Roles ({users.length})</option>
                <option value="user">Students ({users.filter((u) => u.role === 'user').length})</option>
                <option value="admin">Administrators ({users.filter((u) => u.role === 'admin').length})</option>
              </select>
            </div>

            <div>
              <label htmlFor="sort-by" className="mb-1 block text-xs font-semibold text-[var(--muted)]">
                Sort By
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="field w-full text-xs"
              >
                <option value="created_desc">Newest Joined</option>
                <option value="created_asc">Oldest Joined</option>
                <option value="attempts">Most Exams Taken</option>
                <option value="score">Highest Avg Score</option>
                <option value="active">Recently Active</option>
              </select>
            </div>
          </div>

          {/* Directory Count */}
          <div className="flex items-center justify-between text-xs text-[var(--muted)] px-1">
            <span>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered accounts
            </span>
          </div>

          {/* Users Table */}
          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--muted)] font-semibold">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3 text-center">Exams</th>
                    <th className="py-3 px-3 text-center">Avg Score</th>
                    <th className="py-3 px-3 text-center">Passed</th>
                    <th className="py-3 px-3 text-center">Mistakes</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-[var(--muted)]">
                        No registered users match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = currentAdmin?.id === u.id
                      const initial = (u.username ? u.username[0] : u.email[0]).toUpperCase()

                      return (
                        <tr key={u.id} className="hover:bg-[var(--surface-2)]/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] font-mono font-black text-xs text-[var(--color-forest-ink)] border border-[var(--border)] shrink-0">
                                {initial}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[var(--color-forest-ink)]">
                                    {u.username ? `@${u.username}` : u.email.split('@')[0]}
                                  </span>
                                  {isSelf && (
                                    <span className="rounded bg-sky-100 border border-sky-300 px-1 text-[9px] font-mono font-bold text-sky-800">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[var(--muted)] truncate max-w-[200px]">
                                  {u.email}
                                </div>
                                <div className="text-[10px] text-[var(--muted)]/70 font-mono">
                                  Joined {new Date(u.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                                u.role === 'admin'
                                  ? 'bg-amber-100 border border-amber-300 text-amber-900'
                                  : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--color-forest-ink)]'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-bold text-[var(--color-forest-ink)]">
                            {u.attempts_count}
                          </td>

                          <td className="py-3 px-3 text-center font-mono font-bold text-[var(--color-forest-ink)]">
                            {u.attempts_count > 0 ? `${u.avg_score_pct}%` : '—'}
                          </td>

                          <td className="py-3 px-3 text-center font-mono">
                            <span className={u.passed_count > 0 ? 'text-emerald-700 font-bold' : 'text-[var(--muted)]'}>
                              {u.passed_count}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-mono text-[var(--color-forest-ink)]">
                            {u.mistakes_count}
                          </td>

                          <td className="py-3 px-3 font-mono text-[11px] text-[var(--muted)] whitespace-nowrap">
                            {u.last_active ? new Date(u.last_active).toLocaleDateString() : 'Never'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleInspectUser(u.id)}
                                className="btn !py-1 !px-2.5 !text-[11px] font-semibold"
                                title="Inspect this student's exam and test data"
                              >
                                Inspect
                              </button>

                              {!isSelf && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRole(u)}
                                    className="btn !py-1 !px-2 !text-[11px]"
                                    title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                                  >
                                    {u.role === 'admin' ? 'Demote' : 'Promote'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleResetUserData(u)}
                                    className="btn !py-1 !px-2 !text-[11px] text-amber-800 hover:border-amber-400"
                                    title="Reset all test and progress data"
                                  >
                                    Reset
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    className="btn !py-1 !px-2 !text-[11px] text-rose-700 hover:border-rose-400"
                                    title="Delete user account"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* STUDENT DATA INSPECTOR MODAL */}
      {inspectUserId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-[#0a192f]/50 backdrop-blur-sm transition-opacity"
            onClick={() => setInspectUserId(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl no-scrollbar flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setInspectUserId(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--color-forest-ink)] transition-colors"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {inspectLoading || !inspectData ? (
              <div className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--color-forest-ink)]" />
                <p className="mt-2 text-xs text-[var(--muted)]">Loading student profile…</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--accent)] font-mono font-black text-base text-[var(--color-forest-ink)] border border-[var(--border)] shrink-0">
                      {(inspectData.user.username ? inspectData.user.username[0] : inspectData.user.email[0]).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[var(--color-forest-ink)]">
                          {inspectData.user.username ? `@${inspectData.user.username}` : inspectData.user.email.split('@')[0]}
                        </h2>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                            inspectData.user.role === 'admin'
                              ? 'bg-amber-100 border border-amber-300 text-amber-900'
                              : 'bg-[var(--surface-2)] border border-[var(--border)] text-[var(--color-forest-ink)]'
                          }`}
                        >
                          {inspectData.user.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">{inspectData.user.email}</p>
                      <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                        ID: {inspectData.user.id} · Registered {new Date(inspectData.user.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {currentAdmin?.id !== inspectData.user.id && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResetUserData(inspectData.user)}
                        className="btn !py-1.5 !px-3 !text-xs text-amber-900 border-amber-300 hover:bg-amber-50"
                      >
                        Reset Study Data
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(inspectData.user)}
                        className="btn !py-1.5 !px-3 !text-xs text-rose-700 border-rose-300 hover:bg-rose-50"
                      >
                        Delete User
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Exams Taken</span>
                    <p className="text-xl font-extrabold text-[var(--color-forest-ink)] mt-1 font-mono">
                      {inspectData.attempts.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Exams Passed</span>
                    <p className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
                      {inspectData.attempts.filter((a) => a.passed || (a.total > 0 && a.score / a.total >= 0.7)).length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Mistakes Bank</span>
                    <p className="text-xl font-extrabold text-[var(--color-forest-ink)] mt-1 font-mono">
                      {inspectData.mistakes.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Bookmarked</span>
                    <p className="text-xl font-extrabold text-[var(--color-forest-ink)] mt-1 font-mono">
                      {inspectData.bookmarks.length}
                    </p>
                  </div>
                </div>

                {/* Subtabs inside inspector */}
                <div className="flex border-b border-[var(--border)] gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectTab('attempts')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      inspectTab === 'attempts'
                        ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                        : 'border-transparent text-[var(--muted)]'
                    }`}
                  >
                    Exam Sessions ({inspectData.attempts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectTab('mistakes')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      inspectTab === 'mistakes'
                        ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                        : 'border-transparent text-[var(--muted)]'
                    }`}
                  >
                    Mistake Bank ({inspectData.mistakes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectTab('bookmarks')}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      inspectTab === 'bookmarks'
                        ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                        : 'border-transparent text-[var(--muted)]'
                    }`}
                  >
                    Bookmarks ({inspectData.bookmarks.length})
                  </button>
                </div>

                {/* Tab content */}
                {inspectTab === 'attempts' && (
                  <div>
                    {inspectData.attempts.length === 0 ? (
                      <p className="py-8 text-center text-xs text-[var(--muted)]">
                        This student hasn't completed any exam sessions yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {inspectData.attempts.map((att) => {
                          const pct = att.total > 0 ? Math.round((att.score / att.total) * 100) : 0
                          const passed = att.passed ?? pct >= 70

                          return (
                            <div
                              key={att.id}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                                      passed
                                        ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                                        : 'bg-rose-100 border border-rose-300 text-rose-900'
                                    }`}
                                  >
                                    {passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                  <span className="font-mono font-bold text-sm text-[var(--color-forest-ink)]">
                                    {att.score} / {att.total} ({pct}%)
                                  </span>
                                </div>
                                <p className="text-[11px] text-[var(--muted)] font-mono">
                                  {att.finished_at ? new Date(att.finished_at).toLocaleString() : 'Date missing'}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  openAttemptReview({
                                    ...att,
                                    user_id: inspectData.user.id,
                                    username: inspectData.user.username,
                                    email: inspectData.user.email,
                                  })
                                }
                                className="btn !py-1 !px-3 !text-[11px] font-semibold text-emerald-900 border-emerald-300 hover:bg-emerald-50 self-start sm:self-auto"
                              >
                                Review Questions & Mistakes →
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {inspectTab === 'mistakes' && (
                  <div>
                    {inspectData.mistakes.length === 0 ? (
                      <p className="py-8 text-center text-xs text-[var(--muted)]">
                        No recorded mistakes in bank for this student.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                        {inspectData.mistakes.map((m) => {
                          const qObj = allQuestions.find((q) => q.id === m.question_id)

                          return (
                            <div
                              key={m.question_id}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs text-[var(--color-forest-ink)]">
                                    {m.question_id}
                                  </span>
                                  {qObj && (
                                    <span className="chip !text-[10px]">Domain {qObj.domain}</span>
                                  )}
                                </div>
                                <span className="rounded bg-rose-100 border border-rose-300 px-1.5 py-0.2 font-mono text-[10px] font-bold text-rose-900">
                                  Failed {m.times_wrong} times
                                </span>
                              </div>
                              <p className="text-xs text-[var(--color-forest-ink)] mt-1">
                                {qObj ? qObj.question : 'Question content'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {inspectTab === 'bookmarks' && (
                  <div>
                    {inspectData.bookmarks.length === 0 ? (
                      <p className="py-8 text-center text-xs text-[var(--muted)]">
                        No bookmarks saved by this student.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                        {inspectData.bookmarks.map((b) => {
                          const qObj = allQuestions.find((q) => q.id === b.question_id)

                          return (
                            <div
                              key={b.question_id}
                              className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 p-3 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-mono font-bold text-xs text-[var(--color-forest-ink)]">
                                  {b.question_id}
                                </span>
                                {qObj && (
                                  <span className="chip !text-[10px]">Domain {qObj.domain}</span>
                                )}
                              </div>
                              <p className="text-xs text-[var(--color-forest-ink)] mt-1">
                                {qObj ? qObj.question : 'Question content'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* DETAILED EXAM & PRACTICE SESSION REVIEW MODAL */}
      {reviewedAttempt && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-[#0a192f]/60 backdrop-blur-sm transition-opacity"
            onClick={() => setReviewedAttempt(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 shadow-2xl no-scrollbar flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setReviewedAttempt(null)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--color-forest-ink)] transition-colors"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {reviewLoading ? (
              <div className="py-16 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--color-forest-ink)]" />
                <p className="mt-2 text-xs text-[var(--muted)]">Loading full session answers & questions…</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="border-b border-[var(--border)] pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded bg-sky-100 border border-sky-300 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-900">
                          ATTEMPT REVIEW
                        </span>
                        <span className="text-xs text-[var(--muted)] font-mono">
                          ID: {reviewedAttempt.id}
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-[var(--color-forest-ink)]">
                        {reviewedAttempt.username ? `@${reviewedAttempt.username}` : reviewedAttempt.email || 'Student'} — Exam & Practice Review
                      </h2>
                      <p className="text-xs text-[var(--muted)] font-mono">
                        Finished {reviewedAttempt.finished_at ? new Date(reviewedAttempt.finished_at).toLocaleString() : '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-mono text-xl font-black text-[var(--color-forest-ink)]">
                          {reviewedAttempt.score} / {reviewedAttempt.total}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--muted)]">
                          {reviewedAttempt.total > 0 ? Math.round((reviewedAttempt.score / reviewedAttempt.total) * 100) : 0}% Score
                        </div>
                      </div>
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-mono font-bold ${
                          (reviewedAttempt.passed ?? (reviewedAttempt.total > 0 && reviewedAttempt.score / reviewedAttempt.total >= 0.7))
                            ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                            : 'bg-rose-100 border border-rose-300 text-rose-900'
                        }`}
                      >
                        {(reviewedAttempt.passed ?? (reviewedAttempt.total > 0 && reviewedAttempt.score / reviewedAttempt.total >= 0.7))
                          ? 'PASSED'
                          : 'FAILED'}
                      </span>
                    </div>
                  </div>

                  {/* Domain Performance Summary */}
                  {parsedDomainScores && Object.keys(parsedDomainScores).length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[var(--border)]/60">
                      {Object.entries(parsedDomainScores).map(([dNumStr, stat]: [string, any]) => {
                        const dNum = Number(dNumStr)
                        const acc = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
                        return (
                          <div key={dNum} className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-2 text-center">
                            <span className="text-[10px] font-mono font-bold text-[var(--muted)] block truncate">
                              D{dNum}: {DOMAIN_NAMES[dNum] || `Domain ${dNum}`}
                            </span>
                            <p className="text-xs font-mono font-black text-[var(--color-forest-ink)] mt-0.5">
                              {stat.correct}/{stat.total} ({acc}%)
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReviewFilter('all')}
                      className={`btn !py-1 !px-3 !text-xs font-semibold ${
                        reviewFilter === 'all' ? '!bg-[var(--color-forest-ink)] !text-[var(--color-cream-paper)]' : ''
                      }`}
                    >
                      All Questions ({attemptQuestionList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter('wrong')}
                      className={`btn !py-1 !px-3 !text-xs font-semibold text-rose-900 border-rose-300 ${
                        reviewFilter === 'wrong' ? '!bg-rose-600 !text-white !border-rose-600' : 'hover:bg-rose-50'
                      }`}
                    >
                      Mistakes Only ({wrongCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewFilter('correct')}
                      className={`btn !py-1 !px-3 !text-xs font-semibold text-emerald-900 border-emerald-300 ${
                        reviewFilter === 'correct' ? '!bg-emerald-600 !text-white !border-emerald-600' : 'hover:bg-emerald-50'
                      }`}
                    >
                      Correct ({correctCount})
                    </button>
                  </div>

                  <span className="text-xs text-[var(--muted)] font-mono">
                    Showing {filteredQuestionList.length} of {attemptQuestionList.length} items
                  </span>
                </div>

                {/* Questions Review List */}
                {filteredQuestionList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[var(--muted)]">
                    {attemptQuestionList.length === 0
                      ? 'No recorded question selections available for this attempt.'
                      : reviewFilter === 'wrong'
                      ? 'No incorrect answers in this attempt! 100% correct.'
                      : 'No questions match the current filter.'}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[58vh] overflow-y-auto no-scrollbar pr-1">
                    {filteredQuestionList.map((item) => {
                      const qObj = item.question

                      return (
                        <div
                          key={item.qid}
                          className={`rounded-xl border p-4 text-xs transition-colors ${
                            item.isCorrect
                              ? 'border-emerald-200 bg-emerald-50/20'
                              : 'border-rose-200 bg-rose-50/25'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[var(--color-forest-ink)]">
                                Question #{item.index} · {item.qid}
                              </span>
                              {qObj && (
                                <span className="chip !text-[10px]">
                                  Domain {qObj.domain}
                                </span>
                              )}
                            </div>

                            <span
                              className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                                item.isCorrect
                                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                                  : 'bg-rose-100 border border-rose-300 text-rose-900'
                              }`}
                            >
                              {item.isCorrect ? '✓ CORRECT' : '✗ WRONG'}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-[var(--color-forest-ink)] leading-snug mb-3">
                            {qObj ? qObj.question : `Question ${item.qid}`}
                          </p>

                          {/* Options */}
                          {qObj?.options ? (
                            <div className="space-y-1.5">
                              {qObj.options.map((opt) => {
                                const isSelected = item.selected.includes(opt.id)
                                const isAnswer = item.correctOptions.includes(opt.id)

                                let optStyle = 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]'
                                let optBadge = null

                                if (isSelected && !isAnswer) {
                                  optStyle = 'border-rose-400 bg-rose-100/60 text-rose-950 font-medium'
                                  optBadge = (
                                    <span className="rounded bg-rose-200 border border-rose-300 text-rose-900 px-1.5 py-0.2 text-[9px] font-mono font-bold shrink-0">
                                      STUDENT CHOSE (INCORRECT)
                                    </span>
                                  )
                                } else if (isAnswer) {
                                  optStyle = 'border-emerald-400 bg-emerald-100/60 text-emerald-950 font-medium'
                                  optBadge = (
                                    <span className="rounded bg-emerald-200 border border-emerald-300 text-emerald-900 px-1.5 py-0.2 text-[9px] font-mono font-bold shrink-0">
                                      {isSelected ? '✓ CORRECT (STUDENT SELECTED)' : '✓ CORRECT ANSWER (MISSED)'}
                                    </span>
                                  )
                                }

                                return (
                                  <div
                                    key={opt.id}
                                    className={`flex items-start justify-between gap-2 rounded-lg border p-2.5 transition-colors ${optStyle}`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="font-mono font-bold text-xs shrink-0">{opt.id}.</span>
                                      <span className="text-xs leading-relaxed">{opt.text}</span>
                                    </div>
                                    {optBadge}
                                  </div>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="p-2 text-xs font-mono text-[var(--muted)]">
                              Student selected: {item.selected.join(', ') || 'None'}
                            </div>
                          )}

                          {/* Explanation */}
                          {qObj?.explanation && (
                            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/70 p-3 text-xs leading-relaxed text-[var(--color-forest-ink)]">
                              <strong className="block text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] mb-1">
                                Official AWS Explanation:
                              </strong>
                              {qObj.explanation}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmModal && (
        <ConfirmDialog
          open={confirmModal.open}
          title={confirmModal.title}
          confirmLabel={confirmModal.confirmLabel}
          danger={confirmModal.danger}
          onCancel={() => setConfirmModal(null)}
          onConfirm={() => confirmModal.action()}
        >
          {confirmModal.body}
        </ConfirmDialog>
      )}
    </div>
  )
}
