import { Hono } from 'hono'
import { Env, getResumesByUser, createResume, updateResume, deleteResume } from '../db/queries'

const resume = new Hono<{ Bindings: Env }>()

resume.get('/:userId', async (c) => {
  try {
    const result = await getResumesByUser(c.env.DB, parseInt(c.req.param('userId')))
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

resume.post('/', async (c) => {
  try {
    const data = await c.req.json()
    const result = await createResume(c.env.DB, {
      ...data,
      content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
    })
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

resume.put('/:id', async (c) => {
  try {
    const data = await c.req.json()
    await updateResume(c.env.DB, parseInt(c.req.param('id')), {
      ...data,
      content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content)
    })
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

resume.delete('/:id', async (c) => {
  try {
    await deleteResume(c.env.DB, parseInt(c.req.param('id')))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default resume
