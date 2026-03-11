// ============================================================
// Dashboard Page
// ============================================================

async function renderDashboard() {
  const content = document.getElementById('page-content')
  content.innerHTML = `<div class="flex items-center justify-between mb-6">
    <div><h1 class="text-2xl font-bold text-white">Dashboard</h1><p class="text-gray-400 text-sm mt-1">Welcome back, ${STATE.user?.name}! Here's your workspace overview.</p></div>
    <button onclick="navigateTo('ai')" class="btn-primary"><i class="fas fa-robot"></i> AI Assistant</button>
  </div>
  <div id="dash-stats" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6"></div>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <div class="card"><h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-folder-open text-indigo-400"></i> Recent Projects</h3><div id="dash-projects"></div></div>
    <div class="card"><h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-tasks text-orange-400"></i> My Tasks</h3><div id="dash-tasks"></div></div>
  </div>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="card"><h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-clock text-green-400"></i> Today's Attendance</h3><div id="dash-attendance"></div></div>
    <div class="card lg:col-span-2"><h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-robot text-purple-400"></i> Quick AI Actions</h3><div id="dash-ai"></div></div>
  </div>`

  try {
    const stats = await API.get('/api/dashboard')
    const statCards = [
      { label: 'Projects', value: stats.projects, icon: 'fa-folder-open', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
      { label: 'Total Tasks', value: stats.tasks, icon: 'fa-tasks', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
      { label: 'Completed', value: stats.done_tasks, icon: 'fa-check-circle', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
      { label: 'Team Members', value: stats.users, icon: 'fa-users', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
      { label: 'Present Today', value: stats.present_today, icon: 'fa-user-clock', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
      { label: 'Revenue', value: '$' + (stats.invoices_paid || 0).toLocaleString(), icon: 'fa-dollar-sign', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' }
    ]
    document.getElementById('dash-stats').innerHTML = statCards.map(s => `
      <div class="stat-card cursor-pointer hover:border-gray-700 transition-all" style="border-color:rgba(${hexToRgb(s.color)},0.2)">
        <div class="flex items-center justify-between mb-3">
          <div style="width:42px;height:42px;background:${s.bg};border-radius:12px;display:flex;align-items:center;justify-content:center">
            <i class="fas ${s.icon}" style="color:${s.color};font-size:18px"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-white mb-1">${s.value}</div>
        <div class="text-gray-400 text-sm">${s.label}</div>
      </div>`).join('')

    // Recent projects
    const projects = STATE.projects.slice(0, 4)
    document.getElementById('dash-projects').innerHTML = projects.length ? projects.map(p => `
      <div onclick="STATE.selectedProject=${p.id};navigateTo('tasks')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 cursor-pointer mb-2 transition-all">
        <div style="width:10px;height:10px;border-radius:50%;background:${p.color || '#6366f1'};flex-shrink:0"></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-white truncate">${p.name}</div>
          <div class="text-xs text-gray-500">${p.task_count || 0} tasks • ${p.done_count || 0} done</div>
        </div>
        <div class="progress-bar w-16">
          <div class="progress-fill" style="width:${p.task_count > 0 ? Math.round((p.done_count/p.task_count)*100) : 0}%;background:${p.color || '#6366f1'}"></div>
        </div>
      </div>`).join('') : '<div class="empty-state py-6"><i class="fas fa-folder-open text-3xl"></i><p class="mt-2 text-sm">No projects yet</p></div>'

    // My tasks
    const myTasks = await API.get(`/api/tasks?userId=${STATE.user?.id}`)
    STATE.tasks = myTasks
    const pendingTasks = myTasks.filter(t => t.status !== 'done').slice(0, 5)
    document.getElementById('dash-tasks').innerHTML = pendingTasks.length ? pendingTasks.map(t => `
      <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 cursor-pointer mb-2 transition-all" onclick="navigateTo('tasks')">
        <div class="w-5 h-5 rounded-md border-2 ${t.status === 'done' ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'} flex items-center justify-center flex-shrink-0">
          ${t.status === 'done' ? '<i class="fas fa-check text-white" style="font-size:9px"></i>' : ''}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-white truncate">${t.title}</div>
          <div class="text-xs text-gray-500">${t.project_name || 'No Project'} ${t.due_date ? '• Due ' + formatDate(t.due_date) : ''}</div>
        </div>
        ${getPriorityBadge(t.priority)}
      </div>`).join('') : '<div class="empty-state py-6"><i class="fas fa-check-circle text-3xl text-green-400"></i><p class="mt-2 text-sm text-green-400">All tasks done! 🎉</p></div>'

    // Attendance today
    const today = new Date().toISOString().split('T')[0]
    const attData = await API.get(`/api/attendance?userId=${STATE.user?.id}&startDate=${today}&endDate=${today}`)
    const todayAtt = attData[0]
    document.getElementById('dash-attendance').innerHTML = `
      <div class="text-center mb-4">
        <div class="text-4xl font-bold text-white mb-1">${todayAtt?.check_in || '--:--'}</div>
        <div class="text-gray-400 text-sm">Check-in Time</div>
        ${todayAtt?.check_out ? `<div class="text-2xl font-semibold text-green-400 mt-2">${todayAtt.check_out}</div><div class="text-gray-400 text-xs">Check-out • ${todayAtt.work_hours || 0}h worked</div>` : ''}
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button onclick="checkIn()" class="btn-success text-center justify-center text-sm"><i class="fas fa-sign-in-alt mr-1"></i>Check In</button>
        <button onclick="checkOut()" class="btn-danger text-center justify-center text-sm"><i class="fas fa-sign-out-alt mr-1"></i>Check Out</button>
      </div>
      <div class="mt-3 text-center text-xs text-gray-500">${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}</div>`

    // AI Quick Actions
    document.getElementById('dash-ai').innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        ${[
          { icon:'fa-project-diagram', title:'Create Project', desc:'AI creates project + tasks from description', action:`navigateTo('ai');setTimeout(()=>{document.getElementById('ai-tab-tasks')?.click()},100)` },
          { icon:'fa-file-alt', title:'Build Resume', desc:'AI generates professional resume for you', action:`navigateTo('resume')` },
          { icon:'fa-file-invoice-dollar', title:'Generate Invoice', desc:'AI creates invoice from project description', action:`navigateTo('invoices')` },
          { icon:'fa-chart-line', title:'Team Insights', desc:'View attendance and performance analytics', action:`navigateTo('attendance')` }
        ].map(a => `
          <div onclick="${a.action}" class="p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-700 cursor-pointer transition-all group">
            <i class="fas ${a.icon} text-indigo-400 text-xl mb-2 group-hover:scale-110 transition-transform inline-block"></i>
            <div class="text-sm font-semibold text-white mb-1">${a.title}</div>
            <div class="text-xs text-gray-500">${a.desc}</div>
          </div>`).join('')}
      </div>`
  } catch (e) { notify('Failed to load dashboard: ' + e.message, 'error') }
}

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '99,102,241'
}

async function checkIn() {
  try {
    const r = await API.post('/api/attendance/checkin', { userId: STATE.user?.id })
    notify(`Checked in at ${r.time} ✓`, 'success')
    renderDashboard()
  } catch (e) { notify(e.message, 'error') }
}
async function checkOut() {
  try {
    const r = await API.post('/api/attendance/checkout', { userId: STATE.user?.id })
    notify(`Checked out at ${r.time} • ${r.workHours}h worked`, 'success')
    renderDashboard()
  } catch (e) { notify(e.message, 'error') }
}

// ============================================================
// Projects Page
// ============================================================

async function renderProjects() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Projects</h1><p class="text-gray-400 text-sm mt-1">Manage all your projects and track progress</p></div>
      <div class="flex gap-3">
        <button onclick="navigateTo('ai')" class="btn-secondary text-sm"><i class="fas fa-robot text-indigo-400"></i> AI Create</button>
        <button onclick="showCreateProject()" class="btn-primary"><i class="fas fa-plus"></i> New Project</button>
      </div>
    </div>
    <div class="flex gap-3 mb-6 flex-wrap">
      <div class="search-bar flex-1" style="max-width:320px">
        <i class="fas fa-search text-gray-500 text-sm"></i>
        <input type="text" placeholder="Search projects..." id="proj-search" oninput="filterProjects(this.value)">
      </div>
      <select id="proj-filter-status" onchange="filterProjects()" class="form-select" style="width:140px">
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="on_hold">On Hold</option>
        <option value="archived">Archived</option>
      </select>
      <select id="proj-filter-priority" onchange="filterProjects()" class="form-select" style="width:140px">
        <option value="">All Priority</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
    </div>
    <div id="projects-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"></div>`
  await loadProjects()
}

async function loadProjects() {
  try {
    STATE.projects = await API.get('/api/projects')
    renderProjectCards(STATE.projects)
  } catch (e) { notify('Failed to load projects', 'error') }
}

function filterProjects(q) {
  const search = (q || document.getElementById('proj-search')?.value || '').toLowerCase()
  const status = document.getElementById('proj-filter-status')?.value
  const priority = document.getElementById('proj-filter-priority')?.value
  const filtered = STATE.projects.filter(p =>
    (!search || p.name.toLowerCase().includes(search) || (p.description||'').toLowerCase().includes(search)) &&
    (!status || p.status === status) &&
    (!priority || p.priority === priority)
  )
  renderProjectCards(filtered)
}

function renderProjectCards(projects) {
  const grid = document.getElementById('projects-grid')
  if (!grid) return
  if (!projects.length) {
    grid.innerHTML = `<div class="col-span-3 empty-state"><i class="fas fa-folder-open"></i><h3 class="text-lg font-semibold text-gray-300 mt-3">No Projects Found</h3><p class="text-sm mt-2 mb-4">Create your first project or use AI to generate one</p><button onclick="showCreateProject()" class="btn-primary"><i class="fas fa-plus"></i> Create Project</button></div>`
    return
  }
  grid.innerHTML = projects.map(p => {
    const progress = p.task_count > 0 ? Math.round((p.done_count / p.task_count) * 100) : 0
    return `<div class="card hover:border-indigo-800 cursor-pointer transition-all group" style="border-top:3px solid ${p.color || '#6366f1'}">
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0 mr-2">
          <h3 class="font-bold text-white text-lg leading-tight truncate group-hover:text-indigo-300 transition-colors">${p.name}</h3>
          <p class="text-gray-400 text-sm mt-1 line-clamp-2">${p.description || 'No description'}</p>
        </div>
        <div class="flex flex-col items-end gap-2">
          ${getStatusBadge(p.status)}
          <div class="flex gap-1">
            <button onclick="event.stopPropagation();editProject(${p.id})" class="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-indigo-400 transition-all" title="Edit"><i class="fas fa-edit text-xs"></i></button>
            <button onclick="event.stopPropagation();deleteProjectConfirm(${p.id},'${p.name}')" class="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-all" title="Delete"><i class="fas fa-trash text-xs"></i></button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 mb-4 flex-wrap">
        ${getPriorityBadge(p.priority)}
        <span class="badge badge-todo"><i class="fas fa-tag mr-1" style="font-size:9px"></i>${p.category || 'general'}</span>
      </div>
      <div class="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span><i class="fas fa-tasks mr-1"></i>${p.task_count || 0} tasks</span>
        <span><i class="fas fa-check mr-1 text-green-500"></i>${p.done_count || 0} done</span>
        <span>${progress}% complete</span>
      </div>
      <div class="progress-bar mb-4">
        <div class="progress-fill" style="width:${progress}%;background:${p.color || '#6366f1'}"></div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-gray-500">
          <i class="fas fa-user"></i><span>${p.owner_name || 'Unknown'}</span>
        </div>
        <button onclick="STATE.selectedProject=${p.id};navigateTo('tasks')" class="btn-primary py-1.5 px-3 text-xs">
          <i class="fas fa-arrow-right"></i> View Tasks
        </button>
      </div>
    </div>`
  }).join('')
}

function showCreateProject() {
  showModal(`
    <div class="modal-box">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2"><i class="fas fa-folder-plus text-indigo-400"></i> New Project</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div><label class="form-label">Project Name *</label><input id="cp-name" type="text" class="form-input" placeholder="e.g., Website Redesign 2025"></div>
        <div><label class="form-label">Description</label><textarea id="cp-desc" class="form-input" rows="3" placeholder="Describe the project goals and scope..."></textarea></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Priority</label>
            <select id="cp-priority" class="form-select">
              <option value="low">Low</option><option value="medium" selected>Medium</option>
              <option value="high">High</option><option value="critical">Critical</option>
            </select></div>
          <div><label class="form-label">Category</label>
            <select id="cp-category" class="form-select">
              <option value="general">General</option><option value="it">IT/Tech</option>
              <option value="design">Design</option><option value="hr">HR</option>
              <option value="finance">Finance</option><option value="marketing">Marketing</option>
              <option value="operations">Operations</option><option value="research">Research</option>
            </select></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Start Date</label><input id="cp-start" type="date" class="form-input"></div>
          <div><label class="form-label">End Date</label><input id="cp-end" type="date" class="form-input"></div>
        </div>
        <div><label class="form-label">Color</label>
          <div class="flex gap-2 flex-wrap">
            ${['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6'].map(c => `
              <div onclick="document.getElementById('cp-color').value='${c}';document.querySelectorAll('.color-opt').forEach(e=>e.style.outline='none');this.style.outline='2px solid white'"
                class="color-opt w-8 h-8 rounded-lg cursor-pointer hover:scale-110 transition-transform" style="background:${c}${c==='#6366f1'?';outline:2px solid white':''}"></div>`).join('')}
            <input id="cp-color" type="color" value="#6366f1" class="w-8 h-8 rounded-lg cursor-pointer" style="background:transparent;border:none;padding:0">
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button onclick="createProjectSubmit()" class="btn-primary"><i class="fas fa-plus"></i> Create Project</button>
      </div>
    </div>`)
}

async function createProjectSubmit() {
  const name = document.getElementById('cp-name')?.value?.trim()
  if (!name) return notify('Project name is required', 'error')
  try {
    const data = {
      name,
      description: document.getElementById('cp-desc')?.value || '',
      priority: document.getElementById('cp-priority')?.value || 'medium',
      category: document.getElementById('cp-category')?.value || 'general',
      start_date: document.getElementById('cp-start')?.value || '',
      end_date: document.getElementById('cp-end')?.value || '',
      color: document.getElementById('cp-color')?.value || '#6366f1',
      owner_id: STATE.user?.id || 1
    }
    const r = await API.post('/api/projects', data)
    notify('Project created successfully! 🎉', 'success')
    closeModal()
    await loadProjects()
  } catch (e) { notify(e.message, 'error') }
}

async function editProject(id) {
  const p = STATE.projects.find(p => p.id == id)
  if (!p) return
  showModal(`
    <div class="modal-box">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white"><i class="fas fa-edit text-indigo-400 mr-2"></i>Edit Project</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div><label class="form-label">Project Name</label><input id="ep-name" type="text" class="form-input" value="${p.name}"></div>
        <div><label class="form-label">Description</label><textarea id="ep-desc" class="form-input" rows="3">${p.description || ''}</textarea></div>
        <div class="grid grid-cols-3 gap-4">
          <div><label class="form-label">Status</label><select id="ep-status" class="form-select">
            <option ${p.status==='active'?'selected':''} value="active">Active</option>
            <option ${p.status==='on_hold'?'selected':''} value="on_hold">On Hold</option>
            <option ${p.status==='archived'?'selected':''} value="archived">Archived</option>
          </select></div>
          <div><label class="form-label">Priority</label><select id="ep-priority" class="form-select">
            ${['low','medium','high','critical'].map(v=>`<option ${p.priority===v?'selected':''} value="${v}">${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
          </select></div>
          <div><label class="form-label">Category</label><select id="ep-category" class="form-select">
            ${['general','it','design','hr','finance','marketing','operations','research'].map(v=>`<option ${p.category===v?'selected':''} value="${v}">${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
          </select></div>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button onclick="updateProjectSubmit(${id})" class="btn-primary"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </div>`)
}

async function updateProjectSubmit(id) {
  try {
    await API.put(`/api/projects/${id}`, {
      name: document.getElementById('ep-name').value,
      description: document.getElementById('ep-desc').value,
      status: document.getElementById('ep-status').value,
      priority: document.getElementById('ep-priority').value,
      category: document.getElementById('ep-category').value,
      tags: ''
    })
    notify('Project updated!', 'success')
    closeModal()
    await loadProjects()
  } catch (e) { notify(e.message, 'error') }
}

function deleteProjectConfirm(id, name) {
  showModal(`
    <div class="modal-box" style="max-width:400px">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <i class="fas fa-trash text-red-400 text-2xl"></i>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Delete Project?</h2>
        <p class="text-gray-400 text-sm mb-6">Are you sure you want to delete "<strong class="text-white">${name}</strong>"? This will also delete all tasks and subtasks. This action cannot be undone.</p>
        <div class="flex gap-3 justify-center">
          <button onclick="closeModal()" class="btn-secondary">Cancel</button>
          <button onclick="deleteProjectConfirmed(${id})" class="btn-danger px-6"><i class="fas fa-trash mr-2"></i>Delete</button>
        </div>
      </div>
    </div>`)
}

async function deleteProjectConfirmed(id) {
  try {
    await API.delete(`/api/projects/${id}`)
    notify('Project deleted', 'info')
    closeModal()
    await loadProjects()
  } catch (e) { notify(e.message, 'error') }
}
