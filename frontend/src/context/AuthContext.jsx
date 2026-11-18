import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { clearActiveUserData, setActiveUserId } from '../lib/storage.js'

const AuthContext = createContext(null)

const SESSION_KEY = 'aiq.auth.session'

const AUTHORIZED_ACCOUNTS = [
  { email: 'nakodayush@gmail.com', password: '123456' },
  { email: 'shraddhabanagar@gmail.com', password: '7891011' },
  { email: 'samruddhi1835@gmail.com', password: '12131415' },
  { email: 'smitshripotdar@gmail.com', password: '16171819' },
]

function makeUser(email) {
  return { id: email, email }
}

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const email = typeof parsed?.email === 'string' ? parsed.email.trim().toLowerCase() : ''
    const account = AUTHORIZED_ACCOUNTS.find((item) => item.email === email)
    return account ? makeUser(account.email) : null
  } catch {
    return null
  }
}

function writeStoredSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } catch {}
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredSession)
  const authReady = true

  useEffect(() => {
    setActiveUserId(user?.id ?? null)
  }, [user])

  const login = useCallback(async (email, password) => {
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const account = AUTHORIZED_ACCOUNTS.find(
      (item) => item.email === cleanEmail && item.password === password,
    )
    if (!account) return { ok: false, message: 'Invalid email or password' }

    const nextUser = makeUser(account.email)
    writeStoredSession(nextUser)
    setUser(nextUser)
    return { ok: true }
  }, [])

  const signup = useCallback(async () => ({ ok: false, message: 'Sign-up is not available.' }), [])

  const logout = useCallback(async () => {
    clearActiveUserData()
    clearStoredSession()
    setUser(null)
  }, [])

  const value = {
    isAuthenticated: user !== null,
    userName: user?.email || '',
    user,
    authReady,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
