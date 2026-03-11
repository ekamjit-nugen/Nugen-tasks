# TaskFlow Pro – AI-Powered Workspace

A comprehensive, AI-powered team management platform for IT and non-IT teams with project management, task tracking, attendance, resume building, and invoice generation.

## 🌐 Live Demo
- **App URL**: https://3000-ie4rvc4zo4uq4ge8me2sj-c81df28e.sandbox.novita.ai
- **Health**: https://3000-ie4rvc4zo4uq4ge8me2sj-c81df28e.sandbox.novita.ai/api/health

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@taskflow.com | admin123 |
| Manager | alice@taskflow.com | alice123 |
| Developer | bob@taskflow.com | bob123 |
| Designer | carol@taskflow.com | carol123 |
| Analyst | david@taskflow.com | david123 |
| HR | eva@taskflow.com | eva123 |

## ✅ Completed Features

### Core Project Management
- **Projects**: Create, edit, delete projects with color coding, categories (IT, Design, HR, Finance, Marketing), priorities, and status tracking
- **Tasks**: Full CRUD with status (Todo, In Progress, Review, Done), priorities, assignments, due dates, time tracking
- **Subtasks**: Hierarchical subtask management with checkbox completion tracking
- **Kanban Board**: Drag & drop task management across status columns
- **Global Search**: Search across projects and tasks in real-time

### AI Integration (Requires OpenAI API Key)
- **AI Task Generator**: Natural language → structured projects + tasks + subtasks
  - Smart duplicate detection: adds to existing project if name matches
  - Context-aware: knows all existing projects, tasks, subtasks
  - Role-aware task generation (dev, design, HR, finance tasks)
  - Automatic subtask breakdown
- **AI Resume Builder**: Generates professional resumes from job description + experience
  - 4 template styles (Modern, Classic, Minimal, Creative)
  - Print/download to PDF
- **AI Invoice Generator**: Creates invoice line items from project descriptions
  - Auto-calculates subtotals, tax, totals
  - Multiple currency support

### HR & Operations
- **Attendance System**:
  - One-click Check In / Check Out
  - Calendar view with color-coded status
  - Team overview for managers/HR
  - Monthly reports with attendance rate visualization
  - Manual attendance entry by admins
- **Resume Builder**: Save and manage multiple resumes per user
- **Invoice Manager**: Create, track, and manage invoices with status workflow

### Team Management
- **Role-Based Access Control**: Admin, Manager, Developer, Designer, Analyst, HR, Finance, Member
- **Team Directory**: View all team members with roles, departments, tasks, attendance
- **User Management**: Add/edit team members (Admin/Manager only)

### Dashboard
- Real-time stats (projects, tasks, users, completion rate, attendance, revenue)
- Quick AI action shortcuts
- Recent projects with progress bars
- My tasks list
- Today's attendance widget

## 🏗️ Tech Stack

- **Backend**: Hono framework on Cloudflare Workers/Pages
- **Database**: Cloudflare D1 (SQLite) with local development mode
- **Frontend**: Vanilla JS SPA with Tailwind CSS
- **AI**: OpenAI GPT-4o-mini via REST API
- **Icons**: FontAwesome 6.4

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Projects & Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/projects` | List / Create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Get / Update / Delete project |
| GET | `/api/projects/:id/tasks` | Get tasks for project |
| GET/POST | `/api/tasks` | List all / Create tasks |
| PUT/DELETE | `/api/tasks/:id` | Update / Delete task |
| GET | `/api/tasks/:id/subtasks` | Get subtasks |
| POST/PUT/DELETE | `/api/subtasks` | Subtask CRUD |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-tasks` | AI creates projects/tasks from prompt |
| POST | `/api/ai/generate-resume` | AI generates resume data |
| POST | `/api/ai/generate-invoice` | AI generates invoice items |
| GET | `/api/ai/history/:userId` | Get AI prompt history |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | Get attendance records |
| POST | `/api/attendance/checkin` | Quick check-in |
| POST | `/api/attendance/checkout` | Quick check-out |
| GET | `/api/attendance/summary/:userId` | Monthly summary |

### Resumes & Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/resumes/:userId` | List user resumes |
| POST/PUT/DELETE | `/api/resumes` | Resume CRUD |
| GET | `/api/invoices` | List invoices |
| POST/PUT/DELETE | `/api/invoices/:id` | Invoice CRUD |

## 🗄️ Data Architecture

### Models
- **users**: id, name, email, password_hash, role, department, is_active
- **projects**: id, name, description, status, priority, category, owner_id, color, tags
- **tasks**: id, project_id, title, status, priority, assignee_id, due_date, estimated_hours
- **subtasks**: id, task_id, title, is_completed, status
- **attendance**: id, user_id, date, check_in, check_out, status, work_hours
- **resumes**: id, user_id, title, content (JSON), template
- **invoices**: id, invoice_number, client_name, items (JSON), total, status
- **ai_prompts**: id, user_id, prompt, module, result

### Storage
- **Cloudflare D1** (SQLite): All relational data
- **Local Dev**: `.wrangler/state/v3/d1/` local SQLite file

## 🚀 Development

```bash
# Install dependencies
npm install

# Apply migrations
npx wrangler d1 migrations apply DB --local

# Build
npm run build

# Start dev server
pm2 start ecosystem.config.cjs

# Or directly
npx wrangler pages dev dist --d1=DB --local --ip 0.0.0.0 --port 3000
```

## 📦 Project Structure

```
webapp/
├── src/
│   ├── index.tsx          # Main Hono app + HTML shell
│   ├── db/
│   │   ├── schema.ts      # DB schema SQL
│   │   └── queries.ts     # All DB query functions
│   └── routes/
│       ├── auth.ts        # Login/register/session
│       ├── api.ts         # Projects/tasks/subtasks
│       ├── aiRoutes.ts    # AI generation endpoints
│       ├── attendance.ts  # Attendance management
│       ├── resume.ts      # Resume CRUD
│       └── invoices.ts    # Invoice CRUD
├── public/static/
│   ├── styles.css         # Custom CSS
│   ├── app.js             # Core app + auth + shell
│   ├── dashboard.js       # Dashboard + Projects UI
│   ├── tasks.js           # Tasks + Kanban UI
│   ├── ai.js              # AI Assistant UI
│   ├── modules.js         # Attendance + Resume + Invoices UI
│   └── team.js            # Team + Settings + Init
├── migrations/
│   └── 0001_initial.sql   # DB schema + seed data
├── ecosystem.config.cjs   # PM2 config
└── wrangler.jsonc         # Cloudflare config
```

## 🔐 AI Configuration
1. Get API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click "Set AI Key" button in the app header or go to Settings
3. Key is stored in localStorage (browser only, never sent to our server)

**Last Updated**: March 2026
**Status**: ✅ Active
