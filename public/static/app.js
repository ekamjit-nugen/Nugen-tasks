// ============================================================
// TaskFlow Pro - Main Application State & Utilities
// ============================================================

const STATE = {
  user: null,
  currentPage: 'dashboard',
  projects: [],
  tasks: [],
  users: [],
  selectedProject: null,
  selectedTask: null,
  apiKey: localStorage.getItem('openai_key') || '',
  theme: 'dark',
  sidebarCollapsed: false,
  notifications: []
}

// ============================================================
// Utilities
// ============================================================

const API = {
  async request(method, url, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    }
    if (body) opts.body = JSON.stringify(body)
    try {
      const res = await fetch(url, opts)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      return data
    } catch (e) {
      throw e
    }
  },
  get: (url) => API.request('GET', url),
  post: (url, body) => API.request('POST', url, body),
  put: (url, body) => API.request('PUT', url, body),
  delete: (url) => API.request('DELETE', url)
}

function notify(message, type = 'success', duration = 3500) {
  const container = document.getElementById('notifications')
  if (!container) return
  const id = Date.now()
  const icons = { success: 'fa-check-circle text-green-400', error: 'fa-times-circle text-red-400', info: 'fa-info-circle text-blue-400' }
  const div = document.createElement('div')
  div.className = `notif-item notif-${type}`
  div.id = `notif-${id}`
  div.innerHTML = `<i class="fas ${icons[type]}"></i><span class="text-sm font-medium flex-1">${message}</span><button onclick="this.parentElement.remove()" class="text-gray-500 hover:text-gray-300 ml-2"><i class="fas fa-times text-xs"></i></button>`
  container.appendChild(div)
  setTimeout(() => { const el = document.getElementById(`notif-${id}`); if (el) el.style.animation = 'slideIn 0.3s ease reverse'; setTimeout(() => { const el2 = document.getElementById(`notif-${id}`); if (el2) el2.remove() }, 300) }, duration)
}

function showLoading(id) {
  const el = document.getElementById(id)
  if (el) el.innerHTML = `<div class="flex items-center justify-center p-12"><div class="spinner"></div><span class="ml-3 text-gray-400">Loading...</span></div>`
}

function formatDate(d) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return d }
}

function getStatusBadge(status) {
  const map = {
    'todo': '<span class="badge badge-todo">Todo</span>',
    'in_progress': '<span class="badge badge-in-progress"><i class="fas fa-spinner fa-spin mr-1" style="font-size:10px"></i>In Progress</span>',
    'review': '<span class="badge badge-review">Review</span>',
    'done': '<span class="badge badge-done"><i class="fas fa-check mr-1" style="font-size:10px"></i>Done</span>',
    'active': '<span class="badge badge-active">Active</span>',
    'archived': '<span class="badge badge-todo">Archived</span>',
    'on_hold': '<span class="badge badge-review">On Hold</span>',
    'present': '<span class="badge badge-done">Present</span>',
    'absent': '<span class="badge badge-critical">Absent</span>',
    'late': '<span class="badge badge-medium">Late</span>',
    'half_day': '<span class="badge badge-review">Half Day</span>',
    'paid': '<span class="badge badge-done">Paid</span>',
    'draft': '<span class="badge badge-todo">Draft</span>',
    'sent': '<span class="badge badge-in-progress">Sent</span>',
    'overdue': '<span class="badge badge-critical">Overdue</span>'
  }
  return map[status] || `<span class="badge badge-todo">${status}</span>`
}

function getPriorityBadge(p) {
  const map = {
    'low': '<span class="badge badge-low"><i class="fas fa-arrow-down mr-1" style="font-size:9px"></i>Low</span>',
    'medium': '<span class="badge badge-medium"><i class="fas fa-minus mr-1" style="font-size:9px"></i>Medium</span>',
    'high': '<span class="badge badge-high"><i class="fas fa-arrow-up mr-1" style="font-size:9px"></i>High</span>',
    'critical': '<span class="badge badge-critical"><i class="fas fa-exclamation mr-1" style="font-size:9px"></i>Critical</span>'
  }
  return map[p] || `<span class="badge badge-low">${p}</span>`
}

function getRoleBadge(role) {
  return `<span class="badge role-${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>`
}

function getAvatar(name, size = 36) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  const initials = (name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
  return `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:${size*0.35}px;font-weight:700;color:white;flex-shrink:0">${initials}</div>`
}

function closeModal() {
  const m = document.getElementById('modal-container')
  if (m) { m.style.opacity = '0'; setTimeout(() => m.remove(), 200) }
}

function showModal(html) {
  const existing = document.getElementById('modal-container')
  if (existing) existing.remove()
  const div = document.createElement('div')
  div.id = 'modal-container'
  div.className = 'modal-overlay'
  div.innerHTML = html
  div.addEventListener('click', (e) => { if (e.target === div) closeModal() })
  document.body.appendChild(div)
}

function closeSidePanel() {
  const p = document.getElementById('side-panel')
  if (p) { p.style.transform = 'translateX(100%)'; setTimeout(() => p.remove(), 300) }
}

// ============================================================
// Authentication
// ============================================================

function renderAuth() {
  document.getElementById('app').innerHTML = `
    <div class="auth-bg min-h-screen flex items-center justify-center p-4">
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;overflow:hidden;pointer-events:none">
        <div style="position:absolute;top:10%;left:10%;width:300px;height:300px;border-radius:50%;background:rgba(99,102,241,0.08);filter:blur(60px)"></div>
        <div style="position:absolute;bottom:20%;right:10%;width:400px;height:400px;border-radius:50%;background:rgba(79,70,229,0.06);filter:blur(80px)"></div>
      </div>
      <div style="width:100%;max-width:900px;display:grid;grid-template-columns:1fr 1fr;gap:0;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.6);border:1px solid rgba(99,102,241,0.2)" class="relative">
        <!-- Left: Branding -->
        <div style="background:linear-gradient(135deg,#1e1b4b,#312e81,#1e1b4b);padding:48px;display:flex;flex-direction:column;justify-content:space-between">
          <div>
            <div class="flex items-center gap-3 mb-8">
              <div style="width:48px;height:48px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:14px;display:flex;align-items:center;justify-content:center">
                <i class="fas fa-bolt text-white text-xl"></i>
              </div>
              <div>
                <div class="text-2xl font-bold text-white">TaskFlow</div>
                <div class="text-indigo-300 text-sm font-medium">Pro Workspace</div>
              </div>
            </div>
            <h2 class="text-3xl font-bold text-white mb-4 leading-tight">AI-Powered<br>Team Management</h2>
            <p class="text-indigo-200 text-sm leading-relaxed mb-8">Manage projects, tasks, attendance, resumes, and invoices — all powered by AI.</p>
          </div>
          <div class="space-y-4">
            ${['Projects & Tasks with AI Assistant','Attendance & HR Management','Resume Builder from AI','Invoice Generator','Role-Based Access Control'].map(f => `
              <div class="flex items-center gap-3">
                <div style="width:28px;height:28px;background:rgba(99,102,241,0.3);border-radius:8px;display:flex;align-items:center;justify-content:center">
                  <i class="fas fa-check text-indigo-300 text-xs"></i>
                </div>
                <span class="text-indigo-200 text-sm">${f}</span>
              </div>`).join('')}
          </div>
          <div class="mt-8 pt-6 border-t border-indigo-800">
            <p class="text-indigo-300 text-xs mb-3 font-semibold">Demo Accounts:</p>
            <div class="grid grid-cols-2 gap-2">
              ${[['admin@taskflow.com','admin123','Admin'],['alice@taskflow.com','alice123','Manager'],['bob@taskflow.com','bob123','Developer'],['carol@taskflow.com','carol123','Designer']].map(([e,p,r]) => `
                <button onclick="fillLogin('${e}','${p}')" class="text-left p-2 rounded-lg hover:bg-indigo-800 transition-all cursor-pointer">
                  <div class="text-indigo-100 text-xs font-semibold">${r}</div>
                  <div class="text-indigo-400 text-xs">${e}</div>
                </button>`).join('')}
            </div>
          </div>
        </div>
        <!-- Right: Login Form -->
        <div style="background:#111827;padding:48px">
          <div id="auth-tabs" class="flex gap-2 mb-8">
            <button id="tab-login" onclick="showAuthTab('login')" class="tab-btn active flex-1">Sign In</button>
            <button id="tab-register" onclick="showAuthTab('register')" class="tab-btn flex-1">Register</button>
          </div>
          <!-- Login Form -->
          <div id="form-login">
            <h3 class="text-xl font-bold text-white mb-6">Welcome back!</h3>
            <div class="space-y-4">
              <div>
                <label class="form-label">Email Address</label>
                <input id="login-email" type="email" placeholder="you@company.com" class="auth-input" onkeydown="if(event.key==='Enter')doLogin()">
              </div>
              <div>
                <label class="form-label">Password</label>
                <input id="login-pass" type="password" placeholder="••••••••" class="auth-input" onkeydown="if(event.key==='Enter')doLogin()">
              </div>
              <button onclick="doLogin()" class="btn-primary w-full justify-center mt-2" id="login-btn">
                <i class="fas fa-sign-in-alt"></i> Sign In
              </button>
            </div>
          </div>
          <!-- Register Form -->
          <div id="form-register" style="display:none">
            <h3 class="text-xl font-bold text-white mb-6">Create Account</h3>
            <div class="space-y-4">
              <div>
                <label class="form-label">Full Name</label>
                <input id="reg-name" type="text" placeholder="John Doe" class="auth-input">
              </div>
              <div>
                <label class="form-label">Email Address</label>
                <input id="reg-email" type="email" placeholder="you@company.com" class="auth-input">
              </div>
              <div>
                <label class="form-label">Password</label>
                <input id="reg-pass" type="password" placeholder="••••••••" class="auth-input">
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="form-label">Role</label>
                  <select id="reg-role" class="form-select">
                    <option value="member">Member</option>
                    <option value="developer">Developer</option>
                    <option value="designer">Designer</option>
                    <option value="analyst">Analyst</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="finance">Finance</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Department</label>
                  <input id="reg-dept" type="text" placeholder="Engineering" class="auth-input" style="padding:10px 14px">
                </div>
              </div>
              <button onclick="doRegister()" class="btn-primary w-full justify-center mt-2">
                <i class="fas fa-user-plus"></i> Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}

function fillLogin(email, pass) {
  document.getElementById('login-email').value = email
  document.getElementById('login-pass').value = pass
}

function showAuthTab(tab) {
  document.getElementById('form-login').style.display = tab === 'login' ? 'block' : 'none'
  document.getElementById('form-register').style.display = tab === 'register' ? 'block' : 'none'
  document.getElementById('tab-login').classList.toggle('active', tab === 'login')
  document.getElementById('tab-register').classList.toggle('active', tab === 'register')
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim()
  const password = document.getElementById('login-pass').value
  if (!email || !password) return notify('Please fill in all fields', 'error')
  const btn = document.getElementById('login-btn')
  btn.innerHTML = '<span class="spinner"></span> Signing in...'
  btn.disabled = true
  try {
    const data = await API.post('/api/auth/login', { email, password })
    STATE.user = data.user
    notify(`Welcome back, ${data.user.name}! 👋`, 'success')
    await initApp()
  } catch (e) {
    notify(e.message, 'error')
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In'
    btn.disabled = false
  }
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim()
  const email = document.getElementById('reg-email').value.trim()
  const password = document.getElementById('reg-pass').value
  const role = document.getElementById('reg-role').value
  const department = document.getElementById('reg-dept').value.trim()
  if (!name || !email || !password) return notify('Please fill all required fields', 'error')
  try {
    const data = await API.post('/api/auth/register', { name, email, password, role, department })
    STATE.user = data.user
    notify(`Account created! Welcome, ${data.user.name}! 🎉`, 'success')
    await initApp()
  } catch (e) { notify(e.message, 'error') }
}

async function logout() {
  await API.post('/api/auth/logout')
  STATE.user = null
  renderAuth()
}

// ============================================================
// App Shell
// ============================================================

async function initApp() {
  // Load initial data
  try {
    STATE.users = await API.get('/api/users')
    STATE.projects = await API.get('/api/projects')
  } catch (e) { console.error('Init load error:', e) }
  renderShell()
  navigateTo('dashboard')
}

function renderShell() {
  const u = STATE.user
  const navItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard' },
    { id: 'projects', icon: 'fa-folder-open', label: 'Projects' },
    { id: 'tasks', icon: 'fa-tasks', label: 'Tasks' },
    { id: 'kanban', icon: 'fa-columns', label: 'Kanban Board' },
    { id: 'ai', icon: 'fa-robot', label: 'AI Assistant' },
    { id: 'attendance', icon: 'fa-clock', label: 'Attendance' },
    { id: 'resume', icon: 'fa-file-alt', label: 'Resume Builder' },
    { id: 'invoices', icon: 'fa-file-invoice-dollar', label: 'Invoices' },
    ...(u?.role === 'admin' || u?.role === 'manager' ? [{ id: 'team', icon: 'fa-users', label: 'Team' }] : []),
    { id: 'settings', icon: 'fa-cog', label: 'Settings' }
  ]

  document.getElementById('app').innerHTML = `
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div style="width:38px;height:38px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <i class="fas fa-bolt text-white"></i>
        </div>
        <div id="sidebar-title" class="overflow-hidden transition-all">
          <div class="font-bold text-white text-lg leading-none">TaskFlow</div>
          <div class="text-indigo-400 text-xs">Pro Workspace</div>
        </div>
      </div>
      <nav class="flex-1 py-4 overflow-y-auto">
        ${navItems.map(item => `
          <div class="sidebar-nav-item" id="nav-${item.id}" onclick="navigateTo('${item.id}')">
            <i class="fas ${item.icon}"></i>
            <span class="sidebar-label transition-all">${item.label}</span>
          </div>`).join('')}
      </nav>
      <div class="p-4 border-t border-gray-800">
        <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 cursor-pointer" onclick="navigateTo('settings')">
          ${getAvatar(u?.name, 36)}
          <div id="sidebar-user" class="overflow-hidden transition-all">
            <div class="text-sm font-semibold text-white truncate">${u?.name || 'User'}</div>
            <div class="text-xs text-gray-400 truncate">${getRoleBadge(u?.role || 'member')}</div>
          </div>
        </div>
        <button onclick="logout()" class="sidebar-nav-item w-full mt-2 text-red-400 hover:bg-red-900/20 hover:text-red-300">
          <i class="fas fa-sign-out-alt"></i>
          <span class="sidebar-label">Sign Out</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content" id="main-content">
      <!-- Topbar -->
      <div class="topbar">
        <div class="flex items-center gap-4">
          <button onclick="toggleSidebar()" class="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800">
            <i class="fas fa-bars"></i>
          </button>
          <div class="search-bar hidden md:flex" style="width:320px">
            <i class="fas fa-search text-gray-500 text-sm"></i>
            <input type="text" placeholder="Search projects, tasks..." id="global-search" oninput="globalSearch(this.value)">
          </div>
        </div>
        <div class="flex items-center gap-3">
          <div id="ai-key-indicator" class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${STATE.apiKey ? 'bg-green-900/30 text-green-400 border border-green-800' : 'bg-yellow-900/30 text-yellow-400 border border-yellow-800'}">
            <i class="fas fa-${STATE.apiKey ? 'check-circle' : 'exclamation-triangle'}"></i>
            ${STATE.apiKey ? 'AI Ready' : 'Set AI Key'}
          </div>
          <button onclick="navigateTo('ai')" class="relative btn-secondary text-sm py-2">
            <i class="fas fa-robot text-indigo-400"></i>
            <span class="hidden md:inline">AI Assistant</span>
          </button>
          <div class="flex items-center gap-2">
            ${getAvatar(u?.name, 34)}
            <div class="hidden md:block">
              <div class="text-sm font-semibold text-white">${u?.name}</div>
              <div class="text-xs text-gray-400">${u?.role}</div>
            </div>
          </div>
        </div>
      </div>
      <!-- Page Content -->
      <div id="page-content" class="p-6"></div>
    </div>

    <!-- Notifications -->
    <div id="notifications" class="notification"></div>
    <!-- Search Results Dropdown -->
    <div id="search-results" style="display:none;position:fixed;top:72px;left:50%;transform:translateX(-50%);width:400px;background:#1f2937;border:1px solid #374151;border-radius:12px;z-index:200;padding:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5)"></div>
  `
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar')
  const main = document.getElementById('main-content')
  STATE.sidebarCollapsed = !STATE.sidebarCollapsed
  if (STATE.sidebarCollapsed) {
    sidebar.classList.add('collapsed')
    main.style.marginLeft = '70px'
    document.querySelectorAll('.sidebar-label, #sidebar-title, #sidebar-user').forEach(e => e.style.display = 'none')
  } else {
    sidebar.classList.remove('collapsed')
    main.style.marginLeft = '260px'
    document.querySelectorAll('.sidebar-label, #sidebar-title, #sidebar-user').forEach(e => e.style.display = '')
  }
}

function navigateTo(page) {
  STATE.currentPage = page
  document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'))
  const navEl = document.getElementById(`nav-${page}`)
  if (navEl) navEl.classList.add('active')
  const content = document.getElementById('page-content')
  if (content) content.innerHTML = ''
  const pages = {
    dashboard: renderDashboard,
    projects: renderProjects,
    tasks: renderTasks,
    kanban: renderKanban,
    ai: renderAI,
    attendance: renderAttendance,
    resume: renderResume,
    invoices: renderInvoices,
    team: renderTeam,
    settings: renderSettings
  }
  if (pages[page]) pages[page]()
}

async function globalSearch(q) {
  const results = document.getElementById('search-results')
  if (!q || q.length < 2) { results.style.display = 'none'; return }
  const matches = [
    ...STATE.projects.filter(p => p.name?.toLowerCase().includes(q.toLowerCase())).map(p => ({ type: 'project', ...p })),
    ...STATE.tasks.filter(t => t.title?.toLowerCase().includes(q.toLowerCase())).map(t => ({ type: 'task', ...t }))
  ].slice(0, 8)
  results.style.display = 'block'
  results.innerHTML = matches.length ? matches.map(m => `
    <div onclick="handleSearchClick('${m.type}','${m.id}')" class="p-3 hover:bg-gray-700 rounded-lg cursor-pointer flex items-center gap-3">
      <i class="fas ${m.type === 'project' ? 'fa-folder text-indigo-400' : 'fa-tasks text-orange-400'} text-sm w-4"></i>
      <div>
        <div class="text-sm font-medium text-white">${m.name || m.title}</div>
        <div class="text-xs text-gray-400">${m.type.charAt(0).toUpperCase() + m.type.slice(1)} ${m.project_name ? '• ' + m.project_name : ''}</div>
      </div>
    </div>`).join('') : '<div class="p-3 text-gray-500 text-sm text-center">No results found</div>'
}

function handleSearchClick(type, id) {
  document.getElementById('search-results').style.display = 'none'
  document.getElementById('global-search').value = ''
  if (type === 'project') { STATE.selectedProject = id; navigateTo('tasks') }
  else navigateTo('tasks')
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('#global-search') && !e.target.closest('#search-results')) {
    const r = document.getElementById('search-results')
    if (r) r.style.display = 'none'
  }
})
