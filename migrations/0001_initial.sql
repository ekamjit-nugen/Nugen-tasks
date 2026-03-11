CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  department TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT 'general',
  owner_id INTEGER NOT NULL,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  color TEXT DEFAULT '#6366f1',
  tags TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  assignee_id INTEGER,
  reporter_id INTEGER,
  due_date TEXT DEFAULT '',
  estimated_hours REAL DEFAULT 0,
  actual_hours REAL DEFAULT 0,
  tags TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS subtasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo',
  assignee_id INTEGER,
  due_date TEXT DEFAULT '',
  is_completed INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  check_in TEXT DEFAULT '',
  check_out TEXT DEFAULT '',
  status TEXT DEFAULT 'present',
  work_hours REAL DEFAULT 0,
  notes TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS resumes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  template TEXT DEFAULT 'modern',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  company_address TEXT DEFAULT '',
  items TEXT NOT NULL,
  subtotal REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  due_date TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  currency TEXT DEFAULT 'USD',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ai_prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  module TEXT DEFAULT 'tasks',
  result TEXT DEFAULT '',
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);

INSERT OR IGNORE INTO users (id, name, email, password_hash, role, department) VALUES
  (1, 'Admin User', 'admin@taskflow.com', 'admin123', 'admin', 'Management'),
  (2, 'Alice Johnson', 'alice@taskflow.com', 'alice123', 'manager', 'Engineering'),
  (3, 'Bob Smith', 'bob@taskflow.com', 'bob123', 'developer', 'Engineering'),
  (4, 'Carol Davis', 'carol@taskflow.com', 'carol123', 'designer', 'Design'),
  (5, 'David Lee', 'david@taskflow.com', 'david123', 'analyst', 'Finance'),
  (6, 'Eva Martinez', 'eva@taskflow.com', 'eva123', 'hr', 'HR');

INSERT OR IGNORE INTO projects (id, name, description, status, priority, category, owner_id, color) VALUES
  (1, 'Website Redesign 2025', 'Complete overhaul of company website with modern design and better UX', 'active', 'high', 'design', 1, '#6366f1'),
  (2, 'Mobile App Development', 'iOS and Android app for customer self-service portal', 'active', 'critical', 'it', 1, '#8b5cf6'),
  (3, 'Q1 Marketing Campaign', 'Multi-channel marketing campaign for product launch', 'active', 'medium', 'marketing', 1, '#ec4899');

INSERT OR IGNORE INTO tasks (id, project_id, title, description, status, priority, assignee_id, reporter_id, estimated_hours) VALUES
  (1, 1, 'Create wireframes and mockups', 'Design wireframes for all key pages including home, product, about and contact', 'done', 'high', 4, 1, 16),
  (2, 1, 'Implement responsive layout', 'Build mobile-first responsive layout using Tailwind CSS', 'in_progress', 'high', 3, 1, 24),
  (3, 1, 'SEO Optimization', 'Implement meta tags, sitemap, and performance improvements', 'todo', 'medium', 3, 1, 8),
  (4, 2, 'Design system and UI components', 'Create reusable UI component library for the app', 'in_progress', 'critical', 4, 2, 40),
  (5, 2, 'User authentication flow', 'Implement login, register, and password reset with JWT', 'todo', 'critical', 3, 2, 20),
  (6, 2, 'API integration', 'Connect frontend with REST API endpoints', 'todo', 'high', 3, 2, 32),
  (7, 3, 'Content strategy', 'Define content calendar and messaging for Q1 campaign', 'done', 'medium', 5, 1, 12),
  (8, 3, 'Social media setup', 'Setup and optimize all social media profiles', 'in_progress', 'medium', 5, 1, 8);

INSERT OR IGNORE INTO subtasks (task_id, title, is_completed) VALUES
  (1, 'Homepage wireframe', 1),
  (1, 'Product page mockup', 1),
  (1, 'Mobile responsive mockups', 1),
  (2, 'Setup Tailwind configuration', 1),
  (2, 'Build header and navigation', 1),
  (2, 'Build hero section', 0),
  (2, 'Build footer', 0),
  (5, 'JWT token generation', 0),
  (5, 'Login form with validation', 0),
  (5, 'Password reset flow', 0);
