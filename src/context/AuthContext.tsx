import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface AuthUser {
  id: string
  email: string
  role: 'user' | 'admin'
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string; notFound?: boolean }>
  logout: () => Promise<void>
  register: (email: string, password: string) => Promise<{ error?: string }>
  requestReset: (email: string) => Promise<{ error?: string; token?: string }>
  resetPassword: (token: string, password: string) => Promise<{ error?: string }>
}

const AuthCtx = createContext<AuthContextValue | null>(null)

const API = '/api'

/** Safely parse JSON — returns null if the response isn't valid JSON (e.g. HTML 404 pages) */
async function safeJson(r: Response): Promise<Record<string, unknown>> {
  try {
    return await r.json()
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount: check if we have a valid session cookie
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setUser((data as { user: AuthUser | null }).user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    let r: Response
    try {
      r = await fetch(`${API}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      return { error: 'Cannot reach the server. Is the backend running?' }
    }
    const data = await safeJson(r)
    if (!r.ok) {
      const msg = (data.error as string) ?? 'Login failed'
      const notFound = data.code === 'USER_NOT_FOUND' || r.status === 404
      return { error: msg, notFound }
    }
    setUser(data.user as AuthUser)
    return {}
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    let r: Response
    try {
      r = await fetch(`${API}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      return { error: 'Cannot reach the server. Is the backend running?' }
    }
    const data = await safeJson(r)
    if (!r.ok) return { error: (data.error as string) ?? 'Registration failed' }
    // Auto-login after register
    return login(email, password)
  }, [login])

  const logout = useCallback(async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch { /* ignore */ }
    setUser(null)
  }, [])

  const requestReset = useCallback(async (email: string) => {
    let r: Response
    try {
      r = await fetch(`${API}/auth/request-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      return { error: 'Cannot reach the server. Is the backend running?' }
    }
    const data = await safeJson(r)
    if (!r.ok) return { error: (data.error as string) ?? 'Request failed' }
    return { token: data.token as string | undefined }
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    let r: Response
    try {
      r = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
    } catch {
      return { error: 'Cannot reach the server. Is the backend running?' }
    }
    const data = await safeJson(r)
    if (!r.ok) return { error: (data.error as string) ?? 'Reset failed' }
    return {}
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, register, requestReset, resetPassword }),
    [user, loading, login, logout, register, requestReset, resetPassword]
  )
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): AuthContextValue {
  const v = useContext(AuthCtx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}

