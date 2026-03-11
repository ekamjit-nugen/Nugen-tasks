import { SCHEMA_SQL, SEED_SQL } from './schema'

export type Env = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

export async function initDB(db: D1Database): Promise<void> {
  const statements = SCHEMA_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of statements) {
    await db.prepare(stmt + ';').run()
  }

  // Seed default users
  const seedStatements = SEED_SQL.split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const stmt of seedStatements) {
    await db.prepare(stmt + ';').run()
  }
}

export async function getUserByEmail(db: D1Database, email: string) {
  return await db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').bind(email).first()
}

export async function getUserById(db: D1Database, id: number) {
  return await db.prepare('SELECT id, name, email, role, department, avatar, is_active, created_at FROM users WHERE id = ?').bind(id).first()
}

export async function getAllUsers(db: D1Database) {
  return await db.prepare('SELECT id, name, email, role, department, avatar, is_active, created_at FROM users ORDER BY name').all()
}

export async function createUser(db: D1Database, data: any) {
  return await db.prepare(
    'INSERT INTO users (name, email, password_hash, role, department) VALUES (?, ?, ?, ?, ?)'
  ).bind(data.name, data.email, data.password, data.role || 'member', data.department || '').run()
}

export async function updateUser(db: D1Database, id: number, data: any) {
  return await db.prepare(
    'UPDATE users SET name=?, role=?, department=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(data.name, data.role, data.department || '', id).run()
}

// Projects
export async function getAllProjects(db: D1Database, userId?: number) {
  if (userId) {
    return await db.prepare(`
      SELECT p.*, u.name as owner_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status='done') as done_count
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.owner_id = ? OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ?)
      ORDER BY p.updated_at DESC
    `).bind(userId, userId).all()
  }
  return await db.prepare(`
    SELECT p.*, u.name as owner_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status='done') as done_count
    FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    ORDER BY p.updated_at DESC
  `).all()
}

export async function getProjectById(db: D1Database, id: number) {
  return await db.prepare(`
    SELECT p.*, u.name as owner_name FROM projects p
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE p.id = ?
  `).bind(id).first()
}

export async function findProjectByName(db: D1Database, name: string) {
  return await db.prepare('SELECT * FROM projects WHERE LOWER(name) = LOWER(?)').bind(name).first()
}

export async function createProject(db: D1Database, data: any) {
  return await db.prepare(
    'INSERT INTO projects (name, description, status, priority, category, owner_id, start_date, end_date, color, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    data.name, data.description || '', data.status || 'active',
    data.priority || 'medium', data.category || 'general',
    data.owner_id, data.start_date || '', data.end_date || '',
    data.color || '#6366f1', data.tags || ''
  ).run()
}

export async function updateProject(db: D1Database, id: number, data: any) {
  return await db.prepare(
    'UPDATE projects SET name=?, description=?, status=?, priority=?, category=?, tags=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(data.name, data.description, data.status, data.priority, data.category, data.tags || '', id).run()
}

export async function deleteProject(db: D1Database, id: number) {
  return await db.prepare('DELETE FROM projects WHERE id=?').bind(id).run()
}

// Tasks
export async function getTasksByProject(db: D1Database, projectId: number) {
  return await db.prepare(`
    SELECT t.*, 
      u.name as assignee_name, u.email as assignee_email,
      r.name as reporter_name,
      (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id) as subtask_count,
      (SELECT COUNT(*) FROM subtasks s WHERE s.task_id = t.id AND s.is_completed=1) as subtask_done
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users r ON t.reporter_id = r.id
    WHERE t.project_id = ?
    ORDER BY t.order_index, t.created_at
  `).bind(projectId).all()
}

export async function getAllTasks(db: D1Database, userId?: number) {
  if (userId) {
    return await db.prepare(`
      SELECT t.*, p.name as project_name, u.name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.assignee_id = ? OR t.reporter_id = ?
      ORDER BY t.created_at DESC
    `).bind(userId, userId).all()
  }
  return await db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assignee_name
    FROM tasks t
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u ON t.assignee_id = u.id
    ORDER BY t.created_at DESC
  `).all()
}

export async function getTaskById(db: D1Database, id: number) {
  return await db.prepare(`
    SELECT t.*, u.name as assignee_name, r.name as reporter_name, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users r ON t.reporter_id = r.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.id = ?
  `).bind(id).first()
}

export async function createTask(db: D1Database, data: any) {
  return await db.prepare(
    'INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, reporter_id, due_date, estimated_hours, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    data.project_id, data.title, data.description || '',
    data.status || 'todo', data.priority || 'medium',
    data.assignee_id || null, data.reporter_id || null,
    data.due_date || '', data.estimated_hours || 0, data.tags || ''
  ).run()
}

export async function updateTask(db: D1Database, id: number, data: any) {
  return await db.prepare(
    'UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=?, estimated_hours=?, actual_hours=?, tags=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(
    data.title, data.description, data.status, data.priority,
    data.assignee_id || null, data.due_date || '',
    data.estimated_hours || 0, data.actual_hours || 0, data.tags || '', id
  ).run()
}

export async function deleteTask(db: D1Database, id: number) {
  return await db.prepare('DELETE FROM tasks WHERE id=?').bind(id).run()
}

// Subtasks
export async function getSubtasksByTask(db: D1Database, taskId: number) {
  return await db.prepare(`
    SELECT s.*, u.name as assignee_name FROM subtasks s
    LEFT JOIN users u ON s.assignee_id = u.id
    WHERE s.task_id = ?
    ORDER BY s.order_index, s.created_at
  `).bind(taskId).all()
}

export async function createSubtask(db: D1Database, data: any) {
  return await db.prepare(
    'INSERT INTO subtasks (task_id, title, description, assignee_id, due_date) VALUES (?, ?, ?, ?, ?)'
  ).bind(data.task_id, data.title, data.description || '', data.assignee_id || null, data.due_date || '').run()
}

export async function updateSubtask(db: D1Database, id: number, data: any) {
  return await db.prepare(
    'UPDATE subtasks SET title=?, description=?, status=?, is_completed=?, assignee_id=?, due_date=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(data.title, data.description || '', data.status || 'todo', data.is_completed ? 1 : 0, data.assignee_id || null, data.due_date || '', id).run()
}

export async function deleteSubtask(db: D1Database, id: number) {
  return await db.prepare('DELETE FROM subtasks WHERE id=?').bind(id).run()
}

// Attendance
export async function getAttendance(db: D1Database, userId?: number, startDate?: string, endDate?: string) {
  let query = `SELECT a.*, u.name as user_name, u.department FROM attendance a LEFT JOIN users u ON a.user_id = u.id WHERE 1=1`
  const params: any[] = []
  if (userId) { query += ' AND a.user_id = ?'; params.push(userId) }
  if (startDate) { query += ' AND a.date >= ?'; params.push(startDate) }
  if (endDate) { query += ' AND a.date <= ?'; params.push(endDate) }
  query += ' ORDER BY a.date DESC, a.created_at DESC'
  let stmt = db.prepare(query)
  for (const p of params) stmt = stmt.bind(p)
  return await stmt.all()
}

export async function upsertAttendance(db: D1Database, data: any) {
  return await db.prepare(`
    INSERT INTO attendance (user_id, date, check_in, check_out, status, work_hours, notes, location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      check_in = excluded.check_in,
      check_out = excluded.check_out,
      status = excluded.status,
      work_hours = excluded.work_hours,
      notes = excluded.notes,
      location = excluded.location
  `).bind(
    data.user_id, data.date, data.check_in || '', data.check_out || '',
    data.status || 'present', data.work_hours || 0, data.notes || '', data.location || ''
  ).run()
}

// Resumes
export async function getResumesByUser(db: D1Database, userId: number) {
  return await db.prepare('SELECT * FROM resumes WHERE user_id = ? ORDER BY updated_at DESC').bind(userId).all()
}

export async function createResume(db: D1Database, data: any) {
  return await db.prepare(
    'INSERT INTO resumes (user_id, title, content, template) VALUES (?, ?, ?, ?)'
  ).bind(data.user_id, data.title, data.content, data.template || 'modern').run()
}

export async function updateResume(db: D1Database, id: number, data: any) {
  return await db.prepare(
    'UPDATE resumes SET title=?, content=?, template=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(data.title, data.content, data.template, id).run()
}

export async function deleteResume(db: D1Database, id: number) {
  return await db.prepare('DELETE FROM resumes WHERE id=?').bind(id).run()
}

// Invoices
export async function getInvoicesByUser(db: D1Database, userId: number) {
  return await db.prepare('SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all()
}

export async function getAllInvoices(db: D1Database) {
  return await db.prepare('SELECT i.*, u.name as user_name FROM invoices i LEFT JOIN users u ON i.user_id = u.id ORDER BY i.created_at DESC').all()
}

export async function createInvoice(db: D1Database, data: any) {
  const inv_num = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  return await db.prepare(
    'INSERT INTO invoices (invoice_number, user_id, client_name, client_email, client_address, company_name, company_address, items, subtotal, tax_rate, tax_amount, discount, total, status, due_date, notes, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    inv_num, data.user_id, data.client_name, data.client_email || '',
    data.client_address || '', data.company_name || '', data.company_address || '',
    JSON.stringify(data.items || []), data.subtotal || 0, data.tax_rate || 0,
    data.tax_amount || 0, data.discount || 0, data.total || 0,
    data.status || 'draft', data.due_date || '', data.notes || '', data.currency || 'USD'
  ).run()
}

export async function updateInvoice(db: D1Database, id: number, data: any) {
  return await db.prepare(
    'UPDATE invoices SET client_name=?, client_email=?, client_address=?, company_name=?, company_address=?, items=?, subtotal=?, tax_rate=?, tax_amount=?, discount=?, total=?, status=?, due_date=?, notes=?, currency=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(
    data.client_name, data.client_email || '', data.client_address || '',
    data.company_name || '', data.company_address || '',
    JSON.stringify(data.items || []), data.subtotal || 0, data.tax_rate || 0,
    data.tax_amount || 0, data.discount || 0, data.total || 0,
    data.status || 'draft', data.due_date || '', data.notes || '', data.currency || 'USD', id
  ).run()
}

export async function deleteInvoice(db: D1Database, id: number) {
  return await db.prepare('DELETE FROM invoices WHERE id=?').bind(id).run()
}

// AI Prompts
export async function logAIPrompt(db: D1Database, data: any) {
  return await db.prepare(
    'INSERT INTO ai_prompts (user_id, prompt, module, result, status) VALUES (?, ?, ?, ?, ?)'
  ).bind(data.user_id, data.prompt, data.module || 'tasks', data.result || '', data.status || 'completed').run()
}

export async function getAIPromptHistory(db: D1Database, userId: number) {
  return await db.prepare('SELECT * FROM ai_prompts WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').bind(userId).all()
}

// Sessions
export async function createSession(db: D1Database, userId: number): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').bind(sessionId, userId, expiresAt).run()
  return sessionId
}

export async function getSession(db: D1Database, sessionId: string) {
  return await db.prepare(`
    SELECT s.*, u.id as uid, u.name, u.email, u.role, u.department, u.avatar
    FROM sessions s LEFT JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first()
}

export async function deleteSession(db: D1Database, sessionId: string) {
  return await db.prepare('DELETE FROM sessions WHERE id=?').bind(sessionId).run()
}

// Dashboard stats
export async function getDashboardStats(db: D1Database) {
  const stats: any = {}
  const projects = await db.prepare('SELECT COUNT(*) as c FROM projects').first() as any
  const tasks = await db.prepare('SELECT COUNT(*) as c FROM tasks').first() as any
  const users = await db.prepare('SELECT COUNT(*) as c FROM users').first() as any
  const done = await db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status='done'").first() as any
  const invoices = await db.prepare("SELECT COUNT(*) as c, SUM(total) as total FROM invoices WHERE status='paid'").first() as any
  const today = new Date().toISOString().split('T')[0]
  const attendance = await db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date=? AND status='present'").bind(today).first() as any

  stats.projects = projects?.c || 0
  stats.tasks = tasks?.c || 0
  stats.users = users?.c || 0
  stats.done_tasks = done?.c || 0
  stats.invoices_paid = invoices?.total || 0
  stats.present_today = attendance?.c || 0
  return stats
}
