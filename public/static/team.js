// ============================================================
// Team Management Page
// ============================================================

async function renderTeam() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Team</h1><p class="text-gray-400 text-sm mt-1">Manage team members and their roles</p></div>
      <button onclick="showAddTeamMember()" class="btn-primary"><i class="fas fa-user-plus"></i> Add Member</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5" id="team-grid">
      <div class="col-span-3 flex justify-center p-8"><div class="spinner"></div></div>
    </div>`
  await loadTeam()
}

async function loadTeam() {
  try {
    const users = await API.get('/api/users')
    STATE.users = users
    const grid = document.getElementById('team-grid')
    if (!grid) return
    grid.innerHTML = users.map(u => `
      <div class="card hover:border-indigo-800 transition-all">
        <div class="flex items-center gap-4 mb-4">
          ${getAvatar(u.name, 52)}
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-white text-lg truncate">${u.name}</h3>
            <p class="text-gray-400 text-sm truncate">${u.email}</p>
            <div class="mt-1">${getRoleBadge(u.role)}</div>
          </div>
          <div class="flex flex-col gap-1">
            <button onclick="editTeamMember(${u.id})" class="p-2 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-indigo-400"><i class="fas fa-edit text-xs"></i></button>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-gray-900 rounded-xl p-3 text-center">
            <div class="text-xs text-gray-500 mb-1">Department</div>
            <div class="text-sm font-semibold text-white">${u.department || 'N/A'}</div>
          </div>
          <div class="bg-gray-900 rounded-xl p-3 text-center">
            <div class="text-xs text-gray-500 mb-1">Status</div>
            <div>${u.is_active ? '<span class="badge badge-active text-xs">Active</span>' : '<span class="badge badge-critical text-xs">Inactive</span>'}</div>
          </div>
        </div>
        <div class="flex gap-2">
          <button onclick="viewMemberTasks(${u.id},'${u.name}')" class="btn-secondary flex-1 text-sm justify-center py-2">
            <i class="fas fa-tasks mr-1"></i>View Tasks
          </button>
          <button onclick="viewMemberAttendance(${u.id},'${u.name}')" class="btn-secondary flex-1 text-sm justify-center py-2">
            <i class="fas fa-clock mr-1"></i>Attendance
          </button>
        </div>
      </div>`).join('')
  } catch (e) { notify('Failed to load team', 'error') }
}

function showAddTeamMember() {
  showModal(`
    <div class="modal-box" style="max-width:480px">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white"><i class="fas fa-user-plus text-indigo-400 mr-2"></i>Add Team Member</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div><label class="form-label">Full Name</label><input id="tm-name" type="text" class="form-input" placeholder="John Doe"></div>
        <div><label class="form-label">Email</label><input id="tm-email" type="email" class="form-input" placeholder="john@company.com"></div>
        <div><label class="form-label">Password</label><input id="tm-pass" type="password" class="form-input" placeholder="Set initial password"></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Role</label><select id="tm-role" class="form-select">
            <option value="member">Member</option><option value="developer">Developer</option>
            <option value="designer">Designer</option><option value="analyst">Analyst</option>
            <option value="manager">Manager</option><option value="hr">HR</option>
            <option value="finance">Finance</option><option value="admin">Admin</option>
          </select></div>
          <div><label class="form-label">Department</label><input id="tm-dept" type="text" class="form-input" placeholder="Engineering"></div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary flex-1">Cancel</button>
        <button onclick="addTeamMemberSubmit()" class="btn-primary flex-1 justify-center"><i class="fas fa-user-plus"></i> Add Member</button>
      </div>
    </div>`)
}

async function addTeamMemberSubmit() {
  const name = document.getElementById('tm-name')?.value?.trim()
  const email = document.getElementById('tm-email')?.value?.trim()
  const pass = document.getElementById('tm-pass')?.value
  if (!name || !email || !pass) return notify('All fields are required', 'error')
  try {
    await API.post('/api/auth/register', {
      name, email, password: pass,
      role: document.getElementById('tm-role')?.value || 'member',
      department: document.getElementById('tm-dept')?.value || ''
    })
    notify(`${name} added to team! ✓`, 'success')
    closeModal()
    await loadTeam()
  } catch (e) { notify(e.message, 'error') }
}

async function editTeamMember(id) {
  const user = STATE.users.find(u => u.id == id)
  if (!user) return
  showModal(`
    <div class="modal-box" style="max-width:480px">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white"><i class="fas fa-user-edit text-indigo-400 mr-2"></i>Edit Member</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div class="flex items-center gap-4 p-4 bg-gray-900 rounded-xl">
          ${getAvatar(user.name, 48)}
          <div><div class="font-semibold text-white">${user.name}</div><div class="text-gray-400 text-sm">${user.email}</div></div>
        </div>
        <div><label class="form-label">Full Name</label><input id="etm-name" type="text" class="form-input" value="${user.name}"></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Role</label><select id="etm-role" class="form-select">
            ${['member','developer','designer','analyst','manager','hr','finance','admin'].map(r => `<option value="${r}" ${user.role===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`).join('')}
          </select></div>
          <div><label class="form-label">Department</label><input id="etm-dept" type="text" class="form-input" value="${user.department || ''}"></div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary flex-1">Cancel</button>
        <button onclick="updateTeamMember(${id})" class="btn-primary flex-1 justify-center"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </div>`)
}

async function updateTeamMember(id) {
  try {
    await API.put(`/api/users/${id}`, {
      name: document.getElementById('etm-name')?.value,
      role: document.getElementById('etm-role')?.value,
      department: document.getElementById('etm-dept')?.value
    })
    notify('Team member updated! ✓', 'success')
    closeModal()
    await loadTeam()
  } catch (e) { notify(e.message, 'error') }
}

async function viewMemberTasks(userId, name) {
  try {
    const tasks = await API.get(`/api/tasks?userId=${userId}`)
    showModal(`
      <div class="modal-box modal-box-lg">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-white flex items-center gap-3">${getAvatar(name, 36)} ${name}'s Tasks</h2>
          <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
        </div>
        <div style="max-height:60vh;overflow-y:auto">
          ${tasks.length ? `<table class="data-table">
            <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead>
            <tbody>
              ${tasks.map(t => `<tr>
                <td class="font-medium text-white text-sm">${t.title}</td>
                <td class="text-gray-400 text-sm">${t.project_name || '—'}</td>
                <td>${getStatusBadge(t.status)}</td>
                <td>${getPriorityBadge(t.priority)}</td>
                <td class="text-gray-400 text-sm">${formatDate(t.due_date)}</td>
              </tr>`).join('')}
            </tbody>
          </table>` : `<div class="empty-state py-8"><i class="fas fa-tasks text-3xl opacity-30"></i><p class="mt-3 text-sm">No tasks assigned</p></div>`}
        </div>
      </div>`)
  } catch (e) { notify(e.message, 'error') }
}

function viewMemberAttendance(userId, name) {
  navigateTo('attendance')
  setTimeout(() => {
    notify(`Showing attendance for ${name}`, 'info')
  }, 500)
}

// ============================================================
// Settings Page
// ============================================================

function renderSettings() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="max-w-3xl">
      <div class="mb-6"><h1 class="text-2xl font-bold text-white">Settings</h1><p class="text-gray-400 text-sm mt-1">Manage your account and application preferences</p></div>

      <!-- Profile -->
      <div class="card mb-5">
        <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-user text-indigo-400"></i> Profile</h3>
        <div class="flex items-center gap-6 mb-5">
          ${getAvatar(STATE.user?.name, 72)}
          <div>
            <h2 class="text-xl font-bold text-white">${STATE.user?.name}</h2>
            <p class="text-gray-400">${STATE.user?.email}</p>
            <div class="mt-2">${getRoleBadge(STATE.user?.role || 'member')}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="form-label">Full Name</label>
            <input id="set-name" type="text" class="form-input" value="${STATE.user?.name || ''}">
          </div>
          <div>
            <label class="form-label">Department</label>
            <input id="set-dept" type="text" class="form-input" value="${STATE.user?.department || ''}">
          </div>
        </div>
        <button onclick="saveProfileSettings()" class="btn-primary mt-4"><i class="fas fa-save"></i> Save Profile</button>
      </div>

      <!-- AI Config -->
      <div class="card mb-5">
        <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-robot text-purple-400"></i> AI Configuration</h3>
        <div class="mb-4">
          <label class="form-label">OpenAI API Key</label>
          <div class="flex gap-3">
            <input id="set-apikey" type="password" class="form-input flex-1" value="${STATE.apiKey}" placeholder="sk-...">
            <button onclick="saveApiKeyFromSettings()" class="btn-primary"><i class="fas fa-save"></i> Save</button>
          </div>
          <p class="text-xs text-gray-500 mt-2">Your key is stored locally and never shared. Get one at <a href="https://platform.openai.com" target="_blank" class="text-indigo-400">platform.openai.com</a></p>
        </div>
        <div class="flex items-center justify-between p-3 bg-gray-900 rounded-xl">
          <div>
            <div class="text-sm font-semibold text-white">AI Status</div>
            <div class="text-xs text-gray-400">GPT-4o-mini is configured as default model</div>
          </div>
          <div class="${STATE.apiKey ? 'badge badge-done' : 'badge badge-critical'}">
            ${STATE.apiKey ? '✓ Connected' : '✗ Not Set'}
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="card mb-5">
        <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-paint-brush text-orange-400"></i> Preferences</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-900 rounded-xl">
            <div>
              <div class="text-sm font-semibold text-white">Notifications</div>
              <div class="text-xs text-gray-400">Show toast notifications</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked class="sr-only peer" id="pref-notifs">
              <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
          <div class="flex items-center justify-between p-4 bg-gray-900 rounded-xl">
            <div>
              <div class="text-sm font-semibold text-white">Compact Mode</div>
              <div class="text-xs text-gray-400">Reduce padding and spacing</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" class="sr-only peer" id="pref-compact" onchange="toggleCompact(this.checked)">
              <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="card border-red-900/50">
        <h3 class="font-semibold text-red-400 mb-4 flex items-center gap-2"><i class="fas fa-exclamation-triangle"></i> Account</h3>
        <button onclick="logout()" class="btn-danger"><i class="fas fa-sign-out-alt mr-2"></i>Sign Out</button>
      </div>
    </div>`
}

async function saveProfileSettings() {
  try {
    await API.put(`/api/users/${STATE.user?.id}`, {
      name: document.getElementById('set-name')?.value || STATE.user?.name,
      role: STATE.user?.role,
      department: document.getElementById('set-dept')?.value || ''
    })
    STATE.user.name = document.getElementById('set-name')?.value
    STATE.user.department = document.getElementById('set-dept')?.value
    notify('Profile updated! ✓', 'success')
  } catch (e) { notify(e.message, 'error') }
}

function saveApiKeyFromSettings() {
  const key = document.getElementById('set-apikey')?.value?.trim()
  if (!key) return notify('Please enter an API key', 'error')
  STATE.apiKey = key
  localStorage.setItem('openai_key', key)
  notify('API key saved! AI features enabled. 🤖', 'success')
  const indicator = document.getElementById('ai-key-indicator')
  if (indicator) {
    indicator.className = 'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-green-900/30 text-green-400 border border-green-800'
    indicator.innerHTML = '<i class="fas fa-check-circle"></i> AI Ready'
  }
}

function toggleCompact(on) {
  document.body.style.fontSize = on ? '13px' : ''
}

// ============================================================
// App Initialization
// ============================================================

async function init() {
  try {
    // Show loading state
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-950">
        <div class="text-center">
          <div style="width:56px;height:56px;background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
            <i class="fas fa-bolt text-white text-2xl"></i>
          </div>
          <div class="text-xl font-bold text-white mb-2">TaskFlow Pro</div>
          <div class="spinner mx-auto mt-4"></div>
        </div>
      </div>`

    // Check existing session
    const data = await API.get('/api/auth/me')
    if (data.user) {
      STATE.user = data.user
      await initApp()
    } else {
      renderAuth()
    }
  } catch (e) {
    renderAuth()
  }
}

// Start the app
init()
