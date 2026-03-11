import { Hono } from 'hono'
import { Env, getAttendance, upsertAttendance } from '../db/queries'

const attendance = new Hono<{ Bindings: Env }>()

attendance.get('/', async (c) => {
  try {
    const userId = c.req.query('userId')
    const startDate = c.req.query('startDate')
    const endDate = c.req.query('endDate')
    const result = await getAttendance(
      c.env.DB,
      userId ? parseInt(userId) : undefined,
      startDate, endDate
    )
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

attendance.post('/', async (c) => {
  try {
    const data = await c.req.json()
    await upsertAttendance(c.env.DB, data)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

attendance.put('/:userId/:date', async (c) => {
  try {
    const data = await c.req.json()
    await upsertAttendance(c.env.DB, {
      ...data,
      user_id: parseInt(c.req.param('userId')),
      date: c.req.param('date')
    })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Check in
attendance.post('/checkin', async (c) => {
  try {
    const { userId } = await c.req.json()
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const checkIn = now.toTimeString().split(' ')[0].slice(0, 5)
    await upsertAttendance(c.env.DB, {
      user_id: userId, date, check_in: checkIn, status: 'present'
    })
    return c.json({ success: true, time: checkIn, date })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Check out
attendance.post('/checkout', async (c) => {
  try {
    const { userId } = await c.req.json()
    const now = new Date()
    const date = now.toISOString().split('T')[0]
    const checkOut = now.toTimeString().split(' ')[0].slice(0, 5)
    // Get existing check-in to calculate work hours
    const existing = await c.env.DB.prepare(
      'SELECT check_in FROM attendance WHERE user_id = ? AND date = ?'
    ).bind(userId, date).first() as any
    let workHours = 0
    if (existing?.check_in) {
      const [inH, inM] = existing.check_in.split(':').map(Number)
      const [outH, outM] = checkOut.split(':').map(Number)
      workHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100
    }
    await upsertAttendance(c.env.DB, {
      user_id: userId, date, check_out: checkOut,
      work_hours: workHours, status: 'present',
      check_in: existing?.check_in || ''
    })
    return c.json({ success: true, time: checkOut, workHours, date })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Get summary/report
attendance.get('/summary/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'))
    const month = c.req.query('month') || new Date().toISOString().slice(0, 7)
    const start = `${month}-01`
    const end = `${month}-31`
    const result = await getAttendance(c.env.DB, userId, start, end)
    const records = result.results as any[]
    const summary = {
      total_days: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      half_day: records.filter(r => r.status === 'half_day').length,
      total_hours: records.reduce((s, r) => s + (r.work_hours || 0), 0).toFixed(2),
      avg_hours: records.length ? (records.reduce((s, r) => s + (r.work_hours || 0), 0) / records.length).toFixed(2) : 0,
      records
    }
    return c.json(summary)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default attendance
