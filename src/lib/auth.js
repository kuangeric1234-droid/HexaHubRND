const SESSION_KEY = 'hexahub_session'
const DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function setSession(token, email) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    token,
    email,
    expiresAt: Date.now() + DURATION_MS,
  }))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function isLoggedIn() {
  return getSession() !== null
}

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Login failed')
  setSession(data.token, data.email)
  return data
}
