// ============================================================
// Tasks Page
// ============================================================

async function renderTasks() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Tasks</h1><p class="text-gray-400 text-sm mt-1">Manage and track all tasks across projects</p></div>
      <div class="flex gap-3">
        <button onclick="navigateTo('ai')" class="btn-secondary text-sm"><i class="fas fa-robot text-indigo-400"></i> AI Create</button>
        <button onclick="showCreateTask()" class="btn-primary"><i class="fas fa-plus"></i> New Task</button>
      </div>
    </div>
    <div class="flex gap-3 mb-6 flex-wrap">
      <div class="flex gap-2">
        <select id="task-project-filter" onchange="loadTasksFiltered()" class="form-select" style="width:200px">
          <option value="">All Projects</option>
          ${STATE.projects.map(p => `<option value="${p.id}" ${STATE.selectedProject==p.id?'selected':''}>${p.name}</option>`).join('')}
        </select>
        <select id="task-status-filter" onchange="loadTasksFiltered()" class="form-select" style="width:150px">
          <option value="">All Status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select id="task-priority-filter" onchange="loadTasksFiltered()" class="form-select" style="width:140px">
          <option value="">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="search-bar flex-1" style="max-width:280px">
        <i class="fas fa-search text-gray-500 text-sm"></i>
        <input type="text" placeholder="Search tasks..." id="task-search" oninput="filterTasks(this.value)">
      </div>
      <div class="flex gap-2">
        <button onclick="setTaskView('list')" id="view-list" class="btn-secondary py-2 px-3 text-sm active"><i class="fas fa-list"></i></button>
        <button onclick="setTaskView('grid')" id="view-grid" class="btn-secondary py-2 px-3 text-sm"><i class="fas fa-th"></i></button>
      </div>
    </div>
    <div id="tasks-container"></div>`

  STATE.taskView = 'list'
  await loadTasksFiltered()
}

async function loadTasksFiltered() {
  const projectId = document.getElementById('task-project-filter')?.value
  try {
    let tasks
    if (projectId) {
      tasks = await API.get(`/api/projects/${projectId}/tasks`)
    } else {
      tasks = await API.get('/api/tasks')
    }
    STATE.allTasks = tasks
    filterTasks(document.getElementById('task-search')?.value || '')
  } catch (e) { notify('Failed to load tasks', 'error') }
}

function filterTasks(q) {
  if (!STATE.allTasks) return
  const search = (q || '').toLowerCase()
  const status = document.getElementById('task-status-filter')?.value
  const priority = document.getElementById('task-priority-filter')?.value
  const filtered = STATE.allTasks.filter(t =>
    (!search || t.title.toLowerCase().includes(search) || (t.description||'').toLowerCase().includes(search)) &&
    (!status || t.status === status) &&
    (!priority || t.priority === priority)
  )
  renderTaskList(filtered)
}

function setTaskView(view) {
  STATE.taskView = view
  document.getElementById('view-list')?.classList.toggle('active', view === 'list')
  document.getElementById('view-grid')?.classList.toggle('active', view === 'grid')
  filterTasks(document.getElementById('task-search')?.value || '')
}

function renderTaskList(tasks) {
  const container = document.getElementById('tasks-container')
  if (!container) return
  if (!tasks.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-tasks"></i><h3 class="text-lg font-semibold text-gray-300 mt-3">No Tasks Found</h3><p class="text-sm mt-2 mb-4">Create a new task or use AI to generate tasks</p><button onclick="showCreateTask()" class="btn-primary"><i class="fas fa-plus"></i> Create Task</button></div>`
    return
  }

  if (STATE.taskView === 'grid') {
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">${tasks.map(t => renderTaskCard(t)).join('')}</div>`
    return
  }

  container.innerHTML = `
    <div class="card p-0 overflow-hidden">
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:40px"></th>
            <th>Task</th>
            <th>Project</th>
            <th>Assignee</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Progress</th>
            <th style="width:100px">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map(t => `
            <tr class="cursor-pointer" onclick="openTaskDetail(${t.id})">
              <td><div class="w-5 h-5 rounded border-2 ${t.status==='done'?'bg-indigo-500 border-indigo-500':'border-gray-600'} flex items-center justify-center mx-auto">
                ${t.status==='done'?'<i class="fas fa-check text-white" style="font-size:9px"></i>':''}
              </div></td>
              <td>
                <div class="font-semibold text-white text-sm">${t.title}</div>
                <div class="text-xs text-gray-500 truncate max-w-xs">${t.description || '...'}</div>
                ${t.subtask_count > 0 ? `<div class="text-xs text-indigo-400 mt-1"><i class="fas fa-list-ul mr-1"></i>${t.subtask_done||0}/${t.subtask_count} subtasks</div>` : ''}
              </td>
              <td><span class="text-sm text-gray-300">${t.project_name || '—'}</span></td>
              <td>${t.assignee_name ? `<div class="flex items-center gap-2">${getAvatar(t.assignee_name, 26)}<span class="text-xs text-gray-300">${t.assignee_name}</span></div>` : '<span class="text-gray-600 text-sm">Unassigned</span>'}</td>
              <td>${getPriorityBadge(t.priority)}</td>
              <td>${getStatusBadge(t.status)}</td>
              <td><span class="text-sm ${t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' ? 'text-red-400' : 'text-gray-400'}">${formatDate(t.due_date)}</span></td>
              <td>
                ${t.subtask_count > 0 ? `<div class="flex items-center gap-2"><div class="progress-bar flex-1"><div class="progress-fill" style="width:${Math.round((t.subtask_done/t.subtask_count)*100)}%"></div></div><span class="text-xs text-gray-500">${Math.round((t.subtask_done/t.subtask_count)*100)}%</span></div>` : '<span class="text-gray-600 text-xs">—</span>'}
              </td>
              <td>
                <div class="flex gap-1">
                  <button onclick="event.stopPropagation();openTaskDetail(${t.id})" class="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-400" title="View"><i class="fas fa-eye text-xs"></i></button>
                  <button onclick="event.stopPropagation();editTask(${t.id})" class="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-yellow-400" title="Edit"><i class="fas fa-edit text-xs"></i></button>
                  <button onclick="event.stopPropagation();deleteTaskConfirm(${t.id},'${t.title.replace(/'/g,'')}')" class="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400" title="Delete"><i class="fas fa-trash text-xs"></i></button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`
}

function renderTaskCard(t) {
  const progress = t.subtask_count > 0 ? Math.round((t.subtask_done/t.subtask_count)*100) : 0
  return `
    <div class="kanban-card" onclick="openTaskDetail(${t.id})">
      <div class="flex items-start justify-between mb-2">
        <div class="flex gap-2">${getPriorityBadge(t.priority)}</div>
        ${getStatusBadge(t.status)}
      </div>
      <h4 class="font-semibold text-white text-sm mb-1 line-clamp-2">${t.title}</h4>
      <p class="text-gray-500 text-xs mb-3 line-clamp-2">${t.description || 'No description'}</p>
      ${t.subtask_count > 0 ? `<div class="mb-3"><div class="flex justify-between text-xs text-gray-500 mb-1"><span>Subtasks</span><span>${t.subtask_done||0}/${t.subtask_count}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div></div>` : ''}
      <div class="flex items-center justify-between">
        ${t.assignee_name ? `<div class="flex items-center gap-1">${getAvatar(t.assignee_name, 22)}<span class="text-xs text-gray-400">${t.assignee_name.split(' ')[0]}</span></div>` : '<span class="text-xs text-gray-600">Unassigned</span>'}
        ${t.due_date ? `<span class="text-xs ${new Date(t.due_date)<new Date()&&t.status!=='done'?'text-red-400':'text-gray-500'}">${formatDate(t.due_date)}</span>` : ''}
      </div>
    </div>`
}

async function openTaskDetail(taskId) {
  const existing = document.getElementById('side-panel')
  if (existing) existing.remove()

  const panel = document.createElement('div')
  panel.id = 'side-panel'
  panel.className = 'task-panel'
  panel.innerHTML = `<div class="p-6 border-b border-gray-800 flex items-center justify-between">
    <h2 class="font-bold text-white text-lg">Task Detail</h2>
    <button onclick="closeSidePanel()" class="text-gray-500 hover:text-white p-2 rounded-lg hover:bg-gray-800"><i class="fas fa-times"></i></button>
  </div>
  <div id="task-detail-content" class="p-6"><div class="flex items-center justify-center p-8"><div class="spinner"></div></div></div>`
  document.body.appendChild(panel)

  try {
    const [task, subtasks] = await Promise.all([
      API.get(`/api/tasks/${taskId}`),
      API.get(`/api/tasks/${taskId}/subtasks`)
    ])

    document.getElementById('task-detail-content').innerHTML = `
      <div class="mb-4">
        <div class="flex gap-2 flex-wrap mb-3">${getStatusBadge(task.status)} ${getPriorityBadge(task.priority)}</div>
        <h3 class="text-xl font-bold text-white mb-2">${task.title}</h3>
        <p class="text-gray-400 text-sm leading-relaxed">${task.description || 'No description'}</p>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="bg-gray-900 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Project</div>
          <div class="text-sm font-semibold text-white">${task.project_name || '—'}</div>
        </div>
        <div class="bg-gray-900 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Assignee</div>
          <div class="flex items-center gap-2">${task.assignee_name ? `${getAvatar(task.assignee_name, 24)}<span class="text-sm font-semibold text-white">${task.assignee_name}</span>` : '<span class="text-sm text-gray-600">Unassigned</span>'}</div>
        </div>
        <div class="bg-gray-900 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Due Date</div>
          <div class="text-sm font-semibold ${task.due_date && new Date(task.due_date)<new Date()&&task.status!=='done'?'text-red-400':'text-white'}">${formatDate(task.due_date)}</div>
        </div>
        <div class="bg-gray-900 rounded-xl p-3">
          <div class="text-xs text-gray-500 mb-1">Est. Hours</div>
          <div class="text-sm font-semibold text-white">${task.estimated_hours || 0}h</div>
        </div>
      </div>

      <!-- Status Update -->
      <div class="mb-6">
        <label class="form-label">Update Status</label>
        <div class="flex gap-2 flex-wrap">
          ${['todo','in_progress','review','done'].map(s => `
            <button onclick="updateTaskStatus(${task.id},'${s}')" class="py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${task.status===s?'bg-indigo-600 text-white':'bg-gray-800 text-gray-400 hover:bg-gray-700'}">${s.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</button>`).join('')}
        </div>
      </div>

      <!-- Subtasks -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-white flex items-center gap-2">
            <i class="fas fa-list-ul text-indigo-400"></i> Subtasks
            <span class="text-xs text-gray-500">${subtasks.filter(s=>s.is_completed).length}/${subtasks.length}</span>
          </h4>
          <button onclick="addSubtask(${task.id})" class="text-indigo-400 hover:text-indigo-300 text-xs"><i class="fas fa-plus mr-1"></i>Add</button>
        </div>
        <div id="subtasks-list">
          ${subtasks.map(s => `
            <div class="subtask-item ${s.is_completed?'done':''}" id="subtask-${s.id}">
              <input type="checkbox" ${s.is_completed?'checked':''} onchange="toggleSubtask(${s.id},${task.id},this.checked)"
                class="w-4 h-4 rounded accent-indigo-500 cursor-pointer flex-shrink-0">
              <span class="text-sm flex-1">${s.title}</span>
              <button onclick="deleteSubtaskItem(${s.id},${task.id})" class="text-gray-600 hover:text-red-400"><i class="fas fa-times text-xs"></i></button>
            </div>`).join('') || '<p class="text-gray-600 text-sm text-center py-4">No subtasks yet</p>'}
        </div>
        <div id="new-subtask-form" style="display:none" class="mt-3">
          <div class="flex gap-2">
            <input id="new-subtask-input" type="text" class="form-input flex-1 text-sm" placeholder="Subtask title..." onkeydown="if(event.key==='Enter')saveNewSubtask(${task.id})">
            <button onclick="saveNewSubtask(${task.id})" class="btn-primary py-2 px-3 text-xs"><i class="fas fa-check"></i></button>
            <button onclick="document.getElementById('new-subtask-form').style.display='none'" class="btn-secondary py-2 px-3 text-xs"><i class="fas fa-times"></i></button>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button onclick="editTask(${task.id})" class="btn-secondary flex-1 justify-center text-sm"><i class="fas fa-edit"></i> Edit Task</button>
        <button onclick="deleteTaskConfirm(${task.id},'${task.title.replace(/'/g,'')}')" class="btn-danger text-sm"><i class="fas fa-trash"></i></button>
      </div>`
  } catch (e) { notify('Failed to load task: ' + e.message, 'error') }
}

function addSubtask(taskId) {
  const form = document.getElementById('new-subtask-form')
  if (form) { form.style.display = 'block'; document.getElementById('new-subtask-input')?.focus() }
}

async function saveNewSubtask(taskId) {
  const input = document.getElementById('new-subtask-input')
  const title = input?.value?.trim()
  if (!title) return
  try {
    await API.post('/api/subtasks', { task_id: taskId, title })
    notify('Subtask added!', 'success')
    openTaskDetail(taskId)
  } catch (e) { notify(e.message, 'error') }
}

async function toggleSubtask(subtaskId, taskId, checked) {
  try {
    const subtask = { title: '', description: '', status: checked ? 'done' : 'todo', is_completed: checked, assignee_id: null, due_date: '' }
    const existing = await API.get(`/api/tasks/${taskId}/subtasks`)
    const s = existing.find(x => x.id == subtaskId)
    if (s) await API.put(`/api/subtasks/${subtaskId}`, { ...s, is_completed: checked, status: checked ? 'done' : 'todo' })
    const el = document.getElementById(`subtask-${subtaskId}`)
    if (el) { el.classList.toggle('done', checked); el.querySelector('span').style.textDecoration = checked ? 'line-through' : '' }
  } catch (e) { notify(e.message, 'error') }
}

async function deleteSubtaskItem(subtaskId, taskId) {
  try {
    await API.delete(`/api/subtasks/${subtaskId}`)
    openTaskDetail(taskId)
  } catch (e) { notify(e.message, 'error') }
}

async function updateTaskStatus(taskId, status) {
  try {
    const task = await API.get(`/api/tasks/${taskId}`)
    await API.put(`/api/tasks/${taskId}`, { ...task, status })
    notify(`Status updated to ${status.replace('_',' ')}`, 'success')
    openTaskDetail(taskId)
    await loadTasksFiltered()
  } catch (e) { notify(e.message, 'error') }
}

function showCreateTask() {
  showModal(`
    <div class="modal-box">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white"><i class="fas fa-plus-circle text-indigo-400 mr-2"></i>New Task</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div><label class="form-label">Project *</label>
          <select id="ct-project" class="form-select">
            <option value="">Select Project...</option>
            ${STATE.projects.map(p => `<option value="${p.id}" ${STATE.selectedProject==p.id?'selected':''}>${p.name}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Task Title *</label><input id="ct-title" type="text" class="form-input" placeholder="e.g., Implement user authentication"></div>
        <div><label class="form-label">Description</label><textarea id="ct-desc" class="form-input" rows="3" placeholder="Describe the task in detail..."></textarea></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Priority</label><select id="ct-priority" class="form-select">
            <option value="low">Low</option><option value="medium" selected>Medium</option>
            <option value="high">High</option><option value="critical">Critical</option>
          </select></div>
          <div><label class="form-label">Status</label><select id="ct-status" class="form-select">
            <option value="todo" selected>Todo</option><option value="in_progress">In Progress</option>
            <option value="review">Review</option><option value="done">Done</option>
          </select></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Assignee</label><select id="ct-assignee" class="form-select">
            <option value="">Unassigned</option>
            ${STATE.users.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
          </select></div>
          <div><label class="form-label">Due Date</label><input id="ct-due" type="date" class="form-input"></div>
        </div>
        <div><label class="form-label">Estimated Hours</label><input id="ct-hours" type="number" step="0.5" min="0" class="form-input" placeholder="0"></div>
        <div><label class="form-label">Tags (comma separated)</label><input id="ct-tags" type="text" class="form-input" placeholder="frontend, backend, urgent"></div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button onclick="createTaskSubmit()" class="btn-primary"><i class="fas fa-plus"></i> Create Task</button>
      </div>
    </div>`)
}

async function createTaskSubmit() {
  const project_id = document.getElementById('ct-project')?.value
  const title = document.getElementById('ct-title')?.value?.trim()
  if (!project_id) return notify('Please select a project', 'error')
  if (!title) return notify('Task title is required', 'error')
  try {
    await API.post('/api/tasks', {
      project_id: parseInt(project_id), title,
      description: document.getElementById('ct-desc')?.value || '',
      priority: document.getElementById('ct-priority')?.value || 'medium',
      status: document.getElementById('ct-status')?.value || 'todo',
      assignee_id: document.getElementById('ct-assignee')?.value ? parseInt(document.getElementById('ct-assignee').value) : null,
      reporter_id: STATE.user?.id,
      due_date: document.getElementById('ct-due')?.value || '',
      estimated_hours: parseFloat(document.getElementById('ct-hours')?.value || '0'),
      tags: document.getElementById('ct-tags')?.value || ''
    })
    notify('Task created! ✓', 'success')
    closeModal()
    await loadTasksFiltered()
  } catch (e) { notify(e.message, 'error') }
}

async function editTask(id) {
  try {
    const task = await API.get(`/api/tasks/${id}`)
    showModal(`
      <div class="modal-box">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white"><i class="fas fa-edit text-indigo-400 mr-2"></i>Edit Task</h2>
          <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <div class="space-y-4">
          <div><label class="form-label">Title</label><input id="et-title" type="text" class="form-input" value="${task.title}"></div>
          <div><label class="form-label">Description</label><textarea id="et-desc" class="form-input" rows="3">${task.description||''}</textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Priority</label><select id="et-priority" class="form-select">
              ${['low','medium','high','critical'].map(v=>`<option ${task.priority===v?'selected':''} value="${v}">${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
            </select></div>
            <div><label class="form-label">Status</label><select id="et-status" class="form-select">
              ${['todo','in_progress','review','done'].map(v=>`<option ${task.status===v?'selected':''} value="${v}">${v.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>`).join('')}
            </select></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Assignee</label><select id="et-assignee" class="form-select">
              <option value="">Unassigned</option>
              ${STATE.users.map(u=>`<option value="${u.id}" ${task.assignee_id==u.id?'selected':''}>${u.name}</option>`).join('')}
            </select></div>
            <div><label class="form-label">Due Date</label><input id="et-due" type="date" class="form-input" value="${task.due_date||''}"></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Est. Hours</label><input id="et-hours" type="number" step="0.5" class="form-input" value="${task.estimated_hours||0}"></div>
            <div><label class="form-label">Actual Hours</label><input id="et-actual" type="number" step="0.5" class="form-input" value="${task.actual_hours||0}"></div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button onclick="closeModal()" class="btn-secondary">Cancel</button>
          <button onclick="updateTaskSubmit(${id})" class="btn-primary"><i class="fas fa-save"></i> Save</button>
        </div>
      </div>`)
  } catch (e) { notify(e.message, 'error') }
}

async function updateTaskSubmit(id) {
  try {
    const task = await API.get(`/api/tasks/${id}`)
    await API.put(`/api/tasks/${id}`, {
      ...task,
      title: document.getElementById('et-title').value,
      description: document.getElementById('et-desc').value,
      priority: document.getElementById('et-priority').value,
      status: document.getElementById('et-status').value,
      assignee_id: document.getElementById('et-assignee').value || null,
      due_date: document.getElementById('et-due').value,
      estimated_hours: parseFloat(document.getElementById('et-hours').value || '0'),
      actual_hours: parseFloat(document.getElementById('et-actual').value || '0')
    })
    notify('Task updated!', 'success')
    closeModal()
    await loadTasksFiltered()
  } catch (e) { notify(e.message, 'error') }
}

function deleteTaskConfirm(id, title) {
  showModal(`
    <div class="modal-box" style="max-width:400px">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><i class="fas fa-trash text-red-400 text-2xl"></i></div>
        <h2 class="text-xl font-bold text-white mb-2">Delete Task?</h2>
        <p class="text-gray-400 text-sm mb-6">Delete "<strong class="text-white">${title}</strong>" and all its subtasks?</p>
        <div class="flex gap-3 justify-center">
          <button onclick="closeModal()" class="btn-secondary">Cancel</button>
          <button onclick="deleteTaskConfirmed(${id})" class="btn-danger px-6"><i class="fas fa-trash mr-2"></i>Delete</button>
        </div>
      </div>
    </div>`)
}

async function deleteTaskConfirmed(id) {
  try {
    await API.delete(`/api/tasks/${id}`)
    notify('Task deleted', 'info')
    closeModal()
    closeSidePanel()
    await loadTasksFiltered()
  } catch (e) { notify(e.message, 'error') }
}

// ============================================================
// Kanban Board
// ============================================================

async function renderKanban() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Kanban Board</h1><p class="text-gray-400 text-sm mt-1">Drag & drop tasks across stages</p></div>
      <div class="flex gap-3 items-center">
        <select id="kanban-project" onchange="loadKanban()" class="form-select" style="width:220px">
          <option value="">All Projects</option>
          ${STATE.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
        </select>
        <button onclick="showCreateTask()" class="btn-primary"><i class="fas fa-plus"></i> New Task</button>
      </div>
    </div>
    <div id="kanban-board" class="flex gap-4 overflow-x-auto pb-4" style="min-height:600px"></div>`
  await loadKanban()
}

async function loadKanban() {
  const projectId = document.getElementById('kanban-project')?.value
  let tasks
  try {
    if (projectId) tasks = await API.get(`/api/projects/${projectId}/tasks`)
    else tasks = await API.get('/api/tasks')
  } catch (e) { notify('Failed to load kanban', 'error'); return }

  const columns = [
    { status: 'todo', label: 'To Do', icon: 'fa-circle', color: '#6b7280' },
    { status: 'in_progress', label: 'In Progress', icon: 'fa-spinner', color: '#3b82f6' },
    { status: 'review', label: 'Review', icon: 'fa-eye', color: '#f59e0b' },
    { status: 'done', label: 'Done', icon: 'fa-check-circle', color: '#10b981' }
  ]

  const board = document.getElementById('kanban-board')
  board.innerHTML = columns.map(col => {
    const colTasks = tasks.filter(t => t.status === col.status)
    return `
      <div class="kanban-col flex-shrink-0" id="col-${col.status}" ondragover="event.preventDefault()" ondrop="dropTask(event,'${col.status}')">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <div class="flex items-center gap-2">
            <i class="fas ${col.icon}" style="color:${col.color}"></i>
            <span class="font-semibold text-white text-sm">${col.label}</span>
            <span class="bg-gray-800 text-gray-400 text-xs rounded-full px-2 py-0.5">${colTasks.length}</span>
          </div>
          <button onclick="showCreateTask()" class="text-gray-600 hover:text-indigo-400 text-xs"><i class="fas fa-plus"></i></button>
        </div>
        <div id="kanban-col-${col.status}" class="p-2 min-h-[400px]">
          ${colTasks.map(t => `
            <div class="kanban-card" draggable="true" id="task-card-${t.id}"
              ondragstart="dragTask(event,${t.id})" onclick="openTaskDetail(${t.id})">
              <div class="flex items-start justify-between mb-2">
                <div>${getPriorityBadge(t.priority)}</div>
                <div class="flex gap-1">
                  <button onclick="event.stopPropagation();editTask(${t.id})" class="text-gray-600 hover:text-indigo-400 p-1"><i class="fas fa-edit text-xs"></i></button>
                </div>
              </div>
              <h4 class="font-semibold text-white text-sm mb-1 leading-snug">${t.title}</h4>
              <p class="text-gray-500 text-xs mb-3 line-clamp-2">${t.description || ''}</p>
              ${t.subtask_count > 0 ? `<div class="mb-3"><div class="progress-bar"><div class="progress-fill" style="width:${Math.round((t.subtask_done||0)/t.subtask_count*100)}%"></div></div><div class="text-xs text-gray-600 mt-1">${t.subtask_done||0}/${t.subtask_count} subtasks</div></div>` : ''}
              <div class="flex items-center justify-between mt-2">
                ${t.assignee_name ? `<div class="flex items-center gap-1">${getAvatar(t.assignee_name, 22)}<span class="text-xs text-gray-400">${t.assignee_name.split(' ')[0]}</span></div>` : '<div></div>'}
                ${t.due_date ? `<span class="text-xs ${new Date(t.due_date)<new Date()&&t.status!=='done'?'text-red-400':'text-gray-600'}">${formatDate(t.due_date)}</span>` : ''}
              </div>
              ${t.project_name ? `<div class="text-xs text-indigo-400 mt-2"><i class="fas fa-folder mr-1" style="font-size:9px"></i>${t.project_name}</div>` : ''}
            </div>`).join('')}
        </div>
      </div>`
  }).join('')
}

let draggedTaskId = null
function dragTask(e, id) { draggedTaskId = id; e.dataTransfer.effectAllowed = 'move' }
async function dropTask(e, status) {
  e.preventDefault()
  if (!draggedTaskId) return
  try {
    const task = await API.get(`/api/tasks/${draggedTaskId}`)
    await API.put(`/api/tasks/${draggedTaskId}`, { ...task, status })
    await loadKanban()
  } catch (err) { notify('Failed to move task', 'error') }
  draggedTaskId = null
}
