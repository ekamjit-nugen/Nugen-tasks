import { Hono } from 'hono'
import { Env } from '../db/queries'
import {
  getAllProjects, getProjectById, findProjectByName, createProject, updateProject, deleteProject,
  getTasksByProject, getTaskById, createTask, updateTask, deleteTask,
  getSubtasksByTask, createSubtask, updateSubtask, deleteSubtask,
  getDashboardStats, getAllTasks, getAllUsers, updateUser
} from '../db/queries'

const api = new Hono<{ Bindings: Env }>()

// Dashboard
api.get('/dashboard', async (c) => {
  try {
    const stats = await getDashboardStats(c.env.DB)
    return c.json(stats)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Projects
api.get('/projects', async (c) => {
  try {
    const userId = c.req.query('userId')
    const result = await getAllProjects(c.env.DB, userId ? parseInt(userId) : undefined)
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.get('/projects/:id', async (c) => {
  try {
    const project = await getProjectById(c.env.DB, parseInt(c.req.param('id')))
    if (!project) return c.json({ error: 'Project not found' }, 404)
    return c.json(project)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.post('/projects', async (c) => {
  try {
    const data = await c.req.json()
    const result = await createProject(c.env.DB, data)
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.put('/projects/:id', async (c) => {
  try {
    const data = await c.req.json()
    await updateProject(c.env.DB, parseInt(c.req.param('id')), data)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.delete('/projects/:id', async (c) => {
  try {
    await deleteProject(c.env.DB, parseInt(c.req.param('id')))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Tasks
api.get('/tasks', async (c) => {
  try {
    const userId = c.req.query('userId')
    const result = await getAllTasks(c.env.DB, userId ? parseInt(userId) : undefined)
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.get('/projects/:id/tasks', async (c) => {
  try {
    const result = await getTasksByProject(c.env.DB, parseInt(c.req.param('id')))
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.get('/tasks/:id', async (c) => {
  try {
    const task = await getTaskById(c.env.DB, parseInt(c.req.param('id')))
    if (!task) return c.json({ error: 'Task not found' }, 404)
    return c.json(task)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.post('/tasks', async (c) => {
  try {
    const data = await c.req.json()
    const result = await createTask(c.env.DB, data)
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.put('/tasks/:id', async (c) => {
  try {
    const data = await c.req.json()
    await updateTask(c.env.DB, parseInt(c.req.param('id')), data)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.delete('/tasks/:id', async (c) => {
  try {
    await deleteTask(c.env.DB, parseInt(c.req.param('id')))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Subtasks
api.get('/tasks/:id/subtasks', async (c) => {
  try {
    const result = await getSubtasksByTask(c.env.DB, parseInt(c.req.param('id')))
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.post('/subtasks', async (c) => {
  try {
    const data = await c.req.json()
    const result = await createSubtask(c.env.DB, data)
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.put('/subtasks/:id', async (c) => {
  try {
    const data = await c.req.json()
    await updateSubtask(c.env.DB, parseInt(c.req.param('id')), data)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.delete('/subtasks/:id', async (c) => {
  try {
    await deleteSubtask(c.env.DB, parseInt(c.req.param('id')))
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Users management
api.get('/users', async (c) => {
  try {
    const result = await getAllUsers(c.env.DB)
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

api.put('/users/:id', async (c) => {
  try {
    const data = await c.req.json()
    await updateUser(c.env.DB, parseInt(c.req.param('id')), data)
    return c.json({ success: true })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default api
