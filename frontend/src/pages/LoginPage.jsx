import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function authMessage(error) {
  const message =
    typeof error === 'string' ? error : error?.message || 'Something went wrong. Please try again.'
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return 'Invalid email or password.'
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before signing in.'
  }
  if (normalized.includes('user already registered')) {
    return 'An account with this email already exists.'
  }
  if (normalized.includes('password should be at least')) {
    return 'Password must be at least 6 characters.'
  }
  if (normalized.includes('unable to validate email address')) return 'Enter a valid email address.'
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'Unable to reach the authentication service. Try again.'
  }
  return message
}

export default function LoginPage() {
  const { isAuthenticated, login, signup } = useAuth()
  const location = useLocation()

  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />
  }

  const switchTab = (next) => {
    if (next === tab || busy) return
    setTab(next)
    setPassword('')
    setShowPassword(false)
    setErrors({})
    setNotice('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (busy) return

    const cleanEmail = email.trim()
    const nextErrors = {}
    if (!cleanEmail) nextErrors.email = 'Enter your email address.'
    else if (!EMAIL_RE.test(cleanEmail)) nextErrors.email = 'Enter a valid email address.'
    if (!password) nextErrors.password = 'Enter your password.'
    else if (tab === 'signup' && password.length < 6) {
      nextErrors.password = 'Use at least 6 characters.'
    }
    setErrors(nextErrors)
    setNotice('')
    if (Object.keys(nextErrors).length > 0) return

    setBusy(true)
    try {
      const result =
        tab === 'signin'
          ? await login(cleanEmail, password)
          : await signup(cleanEmail, password)
      if (!result.ok) {
        setErrors({ form: authMessage(result.message) })
        return
      }
      if (tab === 'signup' && !result.session) {
        setNotice(`Check ${cleanEmail} to confirm your account, then sign in.`)
        setPassword('')
        return
      }
      window.location.assign(location.state?.from?.pathname || '/dashboard')
    } catch (err) {
      setErrors({ form: authMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="authx">
      <div className="authx__panel authx__panel--form">
        <Link className="authx__brand" to="/" aria-label="QuantNiti home">
          <img
            className="authx__brand-logo"
            src="/svg/logo-horizontal/logo-horizontal-on-dark.svg"
            alt="QuantNiti"
            width={124}
            height={30}
          />
        </Link>

        <div className="authx__wrap">
          <div className="authx__tabs" role="tablist" aria-label="Authentication">
            <button
              className={`authx__tab${tab === 'signin' ? ' authx__tab--active' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              onClick={() => switchTab('signin')}
              disabled={busy}
            >
              Sign In
            </button>
            <button
              className={`authx__tab${tab === 'signup' ? ' authx__tab--active' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === 'signup'}
              onClick={() => switchTab('signup')}
              disabled={busy}
            >
              Sign Up
            </button>
          </div>

          <div className="authx__body" key={tab} aria-live="polite">
            <h1 className="authx__title" tabIndex={-1}>
              {tab === 'signin' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="authx__sub">
              {tab === 'signin'
                ? 'Sign in to your QuantNiti account.'
                : 'Create your QuantNiti account.'}
            </p>

            <form className="authx__form" onSubmit={handleSubmit} noValidate>
              <div className="authx__field">
                <label className="authx__label" htmlFor="auth-email">
                  Email
                </label>
                <input
                  className={`authx__input${errors.email ? ' authx__input--error' : ''}`}
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setErrors((prev) => ({ ...prev, email: '', form: '' }))
                  }}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'auth-email-err' : undefined}
                />
                {errors.email && (
                  <p className="authx__error" id="auth-email-err" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="authx__field">
                <label className="authx__label" htmlFor="auth-password">
                  Password
                </label>
                <div className={`authx__control${errors.password ? ' authx__control--error' : ''}`}>
                  <input
                    className="authx__control-input"
                    id="auth-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                    placeholder={tab === 'signin' ? 'Enter your password' : 'At least 6 characters'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors((prev) => ({ ...prev, password: '', form: '' }))
                    }}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={errors.password ? 'auth-password-err' : undefined}
                  />
                  <button
                    className="authx__peek"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={19} />
                  </button>
                </div>
                {errors.password && (
                  <p className="authx__error" id="auth-password-err" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              {errors.form && (
                <p className="authx__error" role="alert">
                  {errors.form}
                </p>
              )}
              {notice && (
                <p className="authx__notice" role="status">
                  {notice}
                </p>
              )}
              <button className="authx__submit" type="submit" disabled={busy}>
                {busy
                  ? tab === 'signin'
                    ? 'Signing In…'
                    : 'Creating Account…'
                  : tab === 'signin'
                    ? 'Sign In'
                    : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="authx__panel authx__panel--art">
        <div className="art" aria-hidden="true">
          <span className="art__orb art__orb--a" />
          <span className="art__orb art__orb--b" />
          <span className="art__ring" />
        </div>
      </div>
    </div>
  )
}
