import { Hono } from 'hono'
import { Env, getInvoicesByUser, getAllInvoices, createInvoice, updateInvoice, deleteInvoice } from '../db/queries'

const invoices = new Hono<{ Bindings: Env }>()

invoices.get('/', async (c) => {
  try {
    const userId = c.req.query('userId')
    let result
    if (userId) {
      result = await getInvoicesByUser(c.env.DB, parseInt(userId))
    } else {
      result = await getAllInvoices(c.env.DB)
    }
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

invoices.post('/', async (c) => {
  try {
    const data = await c.req.json()
    const result = await createInvoice(c.env.DB, data)
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

invoices.put('/:id', async (c) => {
  try {
    const data = await c.req.json()
    await updateInvoice(c.env.DB, parseInt(c.req.param('id')), data)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

invoices.delete('/:id', async (c) => {
  try {
    await deleteInvoice(c.env.DB, parseInt(c.req.param('id')))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default invoices
