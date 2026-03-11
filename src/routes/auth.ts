import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { Env } from '../db/queries'
import {
  getUserByEmail, createSession, getSession, deleteSession, initDB, createUser, getAllUsers
} from '../db/queries'

const auth = new Hono<{ Bindings: Env }>()

auth.post('/login', async (c) => {
  try {
    await initDB(c.env.DB)
    const { email, password } = await c.req.json()
    const user = await getUserByEmail(c.env.DB, email) as any
    if (!user || user.password_hash !== password) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }
    const sessionId = await createSession(c.env.DB, user.id)
    setCookie(c, 'session', sessionId, {
      httpOnly: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7, path: '/'
    })
    return c.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

auth.post('/register', async (c) => {
  try {
    await initDB(c.env.DB)
    const { name, email, password, role, department } = await c.req.json()
    const existing = await getUserByEmail(c.env.DB, email)
    if (existing) return c.json({ error: 'Email already registered' }, 400)
    await createUser(c.env.DB, { name, email, password, role: role || 'member', department })
    const user = await getUserByEmail(c.env.DB, email) as any
    const sessionId = await createSession(c.env.DB, user.id)
    setCookie(c, 'session', sessionId, {
      httpOnly: true, sameSite: 'Lax', maxAge: 60 * 60 * 24 * 7, path: '/'
    })
    return c.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

auth.post('/logout', async (c) => {
  const sessionId = getCookie(c, 'session')
  if (sessionId) {
    await deleteSession(c.env.DB, sessionId)
    deleteCookie(c, 'session', { path: '/' })
  }
  return c.json({ success: true })
})

auth.get('/me', async (c) => {
  try {
    const sessionId = getCookie(c, 'session')
    if (!sessionId) return c.json({ error: 'Not authenticated' }, 401)
    const session = await getSession(c.env.DB, sessionId) as any
    if (!session) return c.json({ error: 'Session expired' }, 401)
    return c.json({
      user: {
        id: session.uid, name: session.name, email: session.email,
        role: session.role, department: session.department, avatar: session.avatar
      }
    })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

auth.get('/users', async (c) => {
  try {
    const users = await getAllUsers(c.env.DB)
    return c.json(users.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default auth
