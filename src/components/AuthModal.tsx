import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { allQuestions } from '../lib/questionService'

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset'
type Mode = AuthMode

interface AuthModalProps {
  open: boolean
  onClose: () => void
  initialMode?: AuthMode
}

export function AuthModal({ open, onClose, initialMode = 'login' }: AuthModalProps) {
  const { login, register, requestReset, resetPassword } = useAuth()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')
  const [tokenCopied, setTokenCopied] = useState(false)
  const [showRegisterHint, setShowRegisterHint] = useState(false)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setError('')
      setInfo('')
      setShowRegisterHint(false)
    }
  }, [open, initialMode])

  if (!open) return null

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setMode(initialMode)
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setResetToken('')
      setNewPassword('')
      setError('')
      setInfo('')
      setGeneratedToken('')
      setTokenCopied(false)
      setShowRegisterHint(false)
    }, 200)
  }

  const goTo = (m: Mode) => {
    setMode(m)
    setError('')
    setInfo('')
    setShowRegisterHint(false)
    setGeneratedToken('')
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowRegisterHint(false)
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.error) {
      setError(result.error)
      if (result.notFound) setShowRegisterHint(true)
    } else {
      handleClose()
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const result = await register(email, password)
    setLoading(false)
    if (result.error) setError(result.error)
    else handleClose()
  }

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setGeneratedToken('')
    setLoading(true)
    const result = await requestReset(email)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else if (result.token) {
      setGeneratedToken(result.token)
    } else {
      setInfo('Reset token generated. Check with your admin.')
    }
  }

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    const result = await resetPassword(resetToken.trim(), newPassword)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setInfo('Password reset successfully!')
      setTimeout(() => goTo('login'), 1500)
    }
  }

  const copyToken = () => {
    navigator.clipboard.writeText(generatedToken)
    setTokenCopied(true)
    setTimeout(() => setTokenCopied(false), 2000)
  }

  const titles: Record<Mode, string> = {
    login: 'Sign in',
    register: 'Create account',
    forgot: 'Reset password',
    reset: 'Set new password',
  }
  const subtitles: Record<Mode, string> = {
    login: 'Access your study history, bookmarks & mistakes.',
    register: 'Create a free account to sync your progress.',
    forgot: 'Enter your email to get a password reset token.',
    reset: 'Enter your reset token and choose a new password.',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#1a3300]/30 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-2xl border border-[#b6b6b6] bg-[#fcfaf5] p-6 shadow-xl">
        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full text-[#1a3300]/50 hover:bg-[#1a3300]/08 hover:text-[#1a3300] transition-colors"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-[6px] bg-[#ffe95c] border border-[#1a3300]/25 font-mono font-black text-xs text-[#1a3300]">
            aws
          </span>
          <span className="text-sm font-bold text-[#1a3300]">Practitioner CLF-C02</span>
        </div>

        <h2 id="auth-modal-title" className="mb-1 text-xl font-extrabold tracking-tight text-[#1a3300]">
          {titles[mode]}
        </h2>
        <p className="mb-5 text-xs text-[#1a3300]/60">{subtitles[mode]}</p>

        {/* ── LOGIN ─────────────────────────────────────────── */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3" noValidate>
            <Field id="auth-email" label="Email" type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field id="auth-password" label="Password" type="password" autoComplete="current-password"
              value={password} onChange={setPassword} placeholder="••••••••" />

            {error && <ErrorBox msg={error} />}

            {showRegisterHint && (
              <div className="rounded-lg bg-[#ffe95c]/40 border border-[#ffe95c] px-3 py-2 text-xs text-[#1a3300]">
                No account found with that email.{' '}
                <button type="button" onClick={() => goTo('register')}
                  className="font-bold underline underline-offset-2">
                  Register instead?
                </button>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 !text-sm font-bold">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs text-[#1a3300]/60">
              <span>No account? <TextBtn onClick={() => goTo('register')}>Register</TextBtn></span>
              <TextBtn onClick={() => goTo('forgot')}>Forgot password?</TextBtn>
            </div>
          </form>
        )}

        {/* ── REGISTER ──────────────────────────────────────── */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3" noValidate>
            <div className="rounded-xl border border-[#b6b6b6]/50 bg-white/70 p-3 text-xs space-y-1.5 text-[#1a3300]/80">
              <div className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#1a3300]">Account Features</div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-700">✓</span>
                <span><strong>Save progress online:</strong> sync your exam scores across devices</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-700">✓</span>
                <span><strong>Mistake Bank:</strong> track & drill your weak spots anytime</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-bold text-emerald-700">✓</span>
                <span><strong>Browse & bookmark:</strong> quick access to all {allQuestions.length} questions</span>
              </div>
            </div>

            <Field id="reg-email" label="Email" type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field id="reg-password" label="Password" type="password" autoComplete="new-password"
              value={password} onChange={setPassword} placeholder="Min. 8 characters" />
            <Field id="reg-confirm" label="Confirm password" type="password" autoComplete="new-password"
              value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat password" />

            {error && <ErrorBox msg={error} />}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 !text-sm font-bold">
              {loading ? 'Creating account…' : 'Create account'}
            </button>

            <p className="pt-1 text-center text-xs text-[#1a3300]/60">
              Already have an account? <TextBtn onClick={() => goTo('login')}>Sign in</TextBtn>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD ───────────────────────────────── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit} className="space-y-3" noValidate>
            <Field id="forgot-email" label="Email" type="email" autoComplete="email"
              value={email} onChange={setEmail} placeholder="you@example.com" />

            {error && <ErrorBox msg={error} />}
            {info && <InfoBox msg={info} />}

            {/* Homelab: show the token directly (no email server needed) */}
            {generatedToken && (
              <div className="space-y-2 rounded-lg border border-[#ffe95c] bg-[#ffe95c]/20 p-3">
                <p className="text-xs font-semibold text-[#1a3300]">Your reset token — copy it:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 break-all rounded bg-white/80 px-2 py-1.5 text-[10px] font-mono text-[#1a3300] border border-[#b6b6b6]">
                    {generatedToken}
                  </code>
                  <button type="button" onClick={copyToken}
                    className="flex-shrink-0 rounded-md border border-[#b6b6b6] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1a3300] hover:bg-[#ffe95c]/30 transition-colors">
                    {tokenCopied ? '✓' : 'Copy'}
                  </button>
                </div>
                <button type="button" onClick={() => goTo('reset')}
                  className="w-full text-center text-xs font-semibold text-[#1a3300] underline underline-offset-2">
                  Use this token to reset password →
                </button>
              </div>
            )}

            {!generatedToken && (
              <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 !text-sm font-bold">
                {loading ? 'Generating token…' : 'Get reset token'}
              </button>
            )}

            <p className="pt-1 text-center text-xs text-[#1a3300]/60">
              Remembered it? <TextBtn onClick={() => goTo('login')}>Back to sign in</TextBtn>
            </p>
          </form>
        )}

        {/* ── RESET PASSWORD ────────────────────────────────── */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-3" noValidate>
            <Field id="reset-token" label="Reset token" type="text" autoComplete="off"
              value={resetToken} onChange={setResetToken} placeholder="Paste your token here" />
            <Field id="reset-password" label="New password" type="password" autoComplete="new-password"
              value={newPassword} onChange={setNewPassword} placeholder="Min. 8 characters" />

            {error && <ErrorBox msg={error} />}
            {info && <InfoBox msg={info} />}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 !text-sm font-bold">
              {loading ? 'Resetting…' : 'Reset password'}
            </button>

            <p className="pt-1 text-center text-xs text-[#1a3300]/60">
              <TextBtn onClick={() => goTo('forgot')}>← Back</TextBtn>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Tiny helper components ────────────────────────────────────────────────────

function Field({ id, label, type, autoComplete, value, onChange, placeholder }: {
  id: string; label: string; type: string; autoComplete: string
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-[#1a3300]/80">{label}</label>
      <input
        id={id} type={type} autoComplete={autoComplete} required
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-[#b6b6b6] bg-white px-3 py-2 text-sm text-[#1a3300] placeholder:text-[#1a3300]/35 focus:border-[#1a3300] focus:outline-none focus:ring-2 focus:ring-[#ffe95c]/60 transition-all"
      />
    </div>
  )
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">{msg}</p>
  )
}

function InfoBox({ msg }: { msg: string }) {
  return (
    <p className="rounded-lg bg-[#d1fae5] border border-green-200 px-3 py-2 text-xs font-medium text-green-800">{msg}</p>
  )
}

function TextBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="font-semibold text-[#1a3300] underline underline-offset-2 hover:text-[#1a3300]/70 transition-colors">
      {children}
    </button>
  )
}
