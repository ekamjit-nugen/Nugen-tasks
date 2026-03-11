// ============================================================
// Attendance Page
// ============================================================

async function renderAttendance() {
  const content = document.getElementById('page-content')
  const isAdmin = STATE.user?.role === 'admin' || STATE.user?.role === 'manager' || STATE.user?.role === 'hr'
  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().toISOString().slice(0, 7)

  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Attendance</h1><p class="text-gray-400 text-sm mt-1">Track and manage employee attendance</p></div>
      <div class="flex gap-3">
        <button onclick="checkIn()" class="btn-success text-sm"><i class="fas fa-sign-in-alt"></i> Check In</button>
        <button onclick="checkOut()" class="btn-danger text-sm"><i class="fas fa-sign-out-alt"></i> Check Out</button>
        ${isAdmin ? '<button onclick="showMarkAttendance()" class="btn-primary text-sm"><i class="fas fa-plus"></i> Mark Attendance</button>' : ''}
      </div>
    </div>

    <!-- Summary cards -->
    <div id="att-summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>

    <!-- Tabs -->
    <div class="tab-nav mb-6">
      <button class="tab-btn active" onclick="showAttTab('calendar',this)">Calendar View</button>
      <button class="tab-btn" onclick="showAttTab('table',this)">Table View</button>
      ${isAdmin ? '<button class="tab-btn" onclick="showAttTab(\'team\',this)">Team Overview</button>' : ''}
      <button class="tab-btn" onclick="showAttTab('report',this)">My Report</button>
    </div>
    <div id="att-content"></div>`

  await loadAttendanceSummary()
  showAttTab('calendar', document.querySelector('.tab-btn'))
}

async function loadAttendanceSummary() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  try {
    const summary = await API.get(`/api/attendance/summary/${STATE.user?.id}?month=${currentMonth}`)
    const cards = [
      { label: 'Present', value: summary.present, icon: 'fa-check-circle', color: '#10b981' },
      { label: 'Absent', value: summary.absent, icon: 'fa-times-circle', color: '#ef4444' },
      { label: 'Late', value: summary.late, icon: 'fa-clock', color: '#f59e0b' },
      { label: 'Total Hours', value: `${summary.total_hours}h`, icon: 'fa-hourglass', color: '#6366f1' }
    ]
    document.getElementById('att-summary').innerHTML = cards.map(c => `
      <div class="stat-card">
        <div style="width:40px;height:40px;background:${c.color}22;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px">
          <i class="fas ${c.icon}" style="color:${c.color};font-size:18px"></i>
        </div>
        <div class="text-2xl font-bold text-white">${c.value}</div>
        <div class="text-gray-400 text-sm">${c.label}</div>
      </div>`).join('')
  } catch (e) { console.error(e) }
}

async function showAttTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
  const c = document.getElementById('att-content')
  if (tab === 'calendar') await renderAttCalendar(c)
  else if (tab === 'table') await renderAttTable(c)
  else if (tab === 'team') await renderTeamAttendance(c)
  else if (tab === 'report') await renderAttReport(c)
}

async function renderAttCalendar(c) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  try {
    const data = await API.get(`/api/attendance?userId=${STATE.user?.id}&startDate=${monthStr}-01&endDate=${monthStr}-31`)
    const attMap = {}
    data.forEach(a => { attMap[a.date] = a })

    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date().toISOString().split('T')[0]

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    let calHtml = `<div class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-semibold text-white">${new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <div class="flex gap-3 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded att-present inline-block"></span> Present</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded att-absent inline-block"></span> Absent</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded att-late inline-block"></span> Late</span>
        </div>
      </div>
      <div class="grid grid-cols-7 gap-2 mb-2">
        ${days.map(d => `<div class="text-center text-xs font-semibold text-gray-500 py-1">${d}</div>`).join('')}
      </div>
      <div class="att-calendar">
        ${Array.from({ length: firstDay }, () => '<div class="att-day att-empty"></div>').join('')}
        ${Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const att = attMap[dateStr]
          const isToday = dateStr === today
          const isWeekend = new Date(dateStr).getDay() === 0 || new Date(dateStr).getDay() === 6
          const isFuture = dateStr > today
          let cls = 'att-empty'
          if (att) cls = `att-${att.status || 'present'}`
          else if (isWeekend) cls = 'att-empty'
          else if (!isFuture) cls = 'att-absent'
          return `<div class="att-day ${cls}" ${att ? `title="${att.check_in ? `In: ${att.check_in}` : ''}${att.check_out ? ` Out: ${att.check_out}` : ''}${att.work_hours ? ` (${att.work_hours}h)` : ''}"` : ''}
            style="${isToday ? 'outline:2px solid #6366f1;outline-offset:2px' : ''}" onclick="showDayDetail('${dateStr}')">
            ${day}
          </div>`
        }).join('')}
      </div>
      <div class="mt-4 grid grid-cols-2 gap-3">
        ${data.slice(0, 5).map(a => `
          <div class="flex items-center gap-3 p-3 rounded-xl bg-gray-900 border border-gray-800">
            <div class="text-sm font-medium text-white">${formatDate(a.date)}</div>
            ${getStatusBadge(a.status)}
            <div class="ml-auto text-xs text-gray-400">${a.check_in || '--'} → ${a.check_out || '--'}</div>
          </div>`).join('')}
      </div>
    </div>`
    c.innerHTML = calHtml
  } catch (e) { notify('Failed to load attendance calendar', 'error') }
}

async function renderAttTable(c) {
  try {
    const data = await API.get(`/api/attendance?userId=${STATE.user?.id}`)
    c.innerHTML = `
      <div class="card p-0 overflow-hidden">
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th>
            <th>Work Hours</th><th>Notes</th><th>Actions</th>
          </tr></thead>
          <tbody>
            ${data.length ? data.map(a => `
              <tr>
                <td class="font-medium text-white">${formatDate(a.date)}</td>
                <td>${getStatusBadge(a.status)}</td>
                <td class="text-green-400">${a.check_in || '—'}</td>
                <td class="text-red-400">${a.check_out || '—'}</td>
                <td class="text-indigo-400 font-semibold">${a.work_hours ? a.work_hours + 'h' : '—'}</td>
                <td class="text-gray-400 text-sm">${a.notes || '—'}</td>
                <td><button onclick="editAttendance('${a.user_id}','${a.date}',${JSON.stringify(a).replace(/"/g,'&quot;')})" class="btn-secondary text-xs py-1 px-2"><i class="fas fa-edit"></i></button></td>
              </tr>`).join('') :
              `<tr><td colspan="7" class="text-center py-8 text-gray-500">No attendance records found</td></tr>`}
          </tbody>
        </table>
      </div>`
  } catch (e) { notify('Failed to load attendance', 'error') }
}

async function renderTeamAttendance(c) {
  const today = new Date().toISOString().split('T')[0]
  try {
    const data = await API.get(`/api/attendance?startDate=${today}&endDate=${today}`)
    const users = await API.get('/api/users')
    c.innerHTML = `
      <div class="card p-0 overflow-hidden">
        <div class="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 class="font-semibold text-white">Team Attendance - Today</h3>
          <span class="text-gray-400 text-sm">${formatDate(today)}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Employee</th><th>Department</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Action</th></tr></thead>
          <tbody>
            ${users.map(u => {
              const att = data.find(a => a.user_id == u.id)
              return `<tr>
                <td><div class="flex items-center gap-3">${getAvatar(u.name, 32)}<div><div class="font-semibold text-white text-sm">${u.name}</div><div class="text-xs text-gray-500">${u.email}</div></div></div></td>
                <td>${getRoleBadge(u.role)}</td>
                <td>${att ? getStatusBadge(att.status) : '<span class="badge badge-critical">Absent</span>'}</td>
                <td class="text-green-400">${att?.check_in || '—'}</td>
                <td class="text-red-400">${att?.check_out || '—'}</td>
                <td class="text-indigo-400 font-semibold">${att?.work_hours ? att.work_hours + 'h' : '—'}</td>
                <td><button onclick="markUserAttendance(${u.id},'${u.name}')" class="btn-secondary text-xs py-1 px-2"><i class="fas fa-edit mr-1"></i>Mark</button></td>
              </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>`
  } catch (e) { notify('Failed to load team attendance', 'error') }
}

async function renderAttReport(c) {
  const currentMonth = new Date().toISOString().slice(0, 7)
  try {
    const summary = await API.get(`/api/attendance/summary/${STATE.user?.id}?month=${currentMonth}`)
    c.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="font-semibold text-white mb-4">Monthly Summary</h3>
          <div class="space-y-4">
            ${[
              { label: 'Working Days', value: summary.total_days, color: '#6366f1' },
              { label: 'Present Days', value: summary.present, color: '#10b981' },
              { label: 'Absent Days', value: summary.absent, color: '#ef4444' },
              { label: 'Late Arrivals', value: summary.late, color: '#f59e0b' },
              { label: 'Half Days', value: summary.half_day, color: '#8b5cf6' },
              { label: 'Total Hours', value: `${summary.total_hours}h`, color: '#06b6d4' },
              { label: 'Avg Daily Hours', value: `${summary.avg_hours}h`, color: '#f97316' }
            ].map(s => `
              <div class="flex items-center justify-between p-3 rounded-xl bg-gray-900">
                <span class="text-gray-400 text-sm">${s.label}</span>
                <span class="font-bold text-white">${s.value}</span>
              </div>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3 class="font-semibold text-white mb-4">Attendance Rate</h3>
          <div class="text-center py-8">
            <div style="position:relative;width:160px;height:160px;margin:0 auto">
              ${renderCircleProgress(summary.total_days > 0 ? Math.round((summary.present/summary.total_days)*100) : 0)}
            </div>
          </div>
          <div class="grid grid-cols-3 gap-3 mt-4">
            <div class="text-center p-3 bg-green-900/20 rounded-xl border border-green-900">
              <div class="text-2xl font-bold text-green-400">${summary.present}</div>
              <div class="text-xs text-gray-500 mt-1">Present</div>
            </div>
            <div class="text-center p-3 bg-red-900/20 rounded-xl border border-red-900">
              <div class="text-2xl font-bold text-red-400">${summary.absent}</div>
              <div class="text-xs text-gray-500 mt-1">Absent</div>
            </div>
            <div class="text-center p-3 bg-yellow-900/20 rounded-xl border border-yellow-900">
              <div class="text-2xl font-bold text-yellow-400">${summary.late}</div>
              <div class="text-xs text-gray-500 mt-1">Late</div>
            </div>
          </div>
        </div>
      </div>`
  } catch (e) { notify('Failed to load report', 'error') }
}

function renderCircleProgress(pct) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444'
  return `
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r="${radius}" fill="none" stroke="#1f2937" stroke-width="10"/>
      <circle cx="80" cy="80" r="${radius}" fill="none" stroke="${color}" stroke-width="10"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" transform="rotate(-90 80 80)" style="transition:stroke-dashoffset 1s ease"/>
      <text x="80" y="75" text-anchor="middle" fill="white" font-size="28" font-weight="700">${pct}%</text>
      <text x="80" y="98" text-anchor="middle" fill="#6b7280" font-size="12">Attendance</text>
    </svg>`
}

function showDayDetail(date) {
  showMarkAttendance(date)
}

function showMarkAttendance(date = '') {
  showModal(`
    <div class="modal-box" style="max-width:440px">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white"><i class="fas fa-clock text-indigo-400 mr-2"></i>Mark Attendance</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="space-y-4">
        <div><label class="form-label">Employee</label>
          <select id="att-user" class="form-select">
            ${STATE.users.map(u => `<option value="${u.id}" ${u.id == STATE.user?.id ? 'selected' : ''}>${u.name}</option>`).join('')}
          </select></div>
        <div><label class="form-label">Date</label><input id="att-date" type="date" class="form-input" value="${date || new Date().toISOString().split('T')[0]}"></div>
        <div class="grid grid-cols-2 gap-4">
          <div><label class="form-label">Check In</label><input id="att-in" type="time" class="form-input"></div>
          <div><label class="form-label">Check Out</label><input id="att-out" type="time" class="form-input"></div>
        </div>
        <div><label class="form-label">Status</label>
          <select id="att-status" class="form-select">
            <option value="present">Present</option><option value="absent">Absent</option>
            <option value="late">Late</option><option value="half_day">Half Day</option>
            <option value="work_from_home">Work From Home</option>
          </select></div>
        <div><label class="form-label">Notes</label><input id="att-notes" type="text" class="form-input" placeholder="Optional notes..."></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary flex-1">Cancel</button>
        <button onclick="submitAttendance()" class="btn-primary flex-1 justify-center"><i class="fas fa-save"></i> Save</button>
      </div>
    </div>`)
}

async function submitAttendance() {
  const userId = document.getElementById('att-user')?.value
  const date = document.getElementById('att-date')?.value
  if (!userId || !date) return notify('User and date are required', 'error')
  const checkIn = document.getElementById('att-in')?.value
  const checkOut = document.getElementById('att-out')?.value
  let workHours = 0
  if (checkIn && checkOut) {
    const [inH, inM] = checkIn.split(':').map(Number)
    const [outH, outM] = checkOut.split(':').map(Number)
    workHours = Math.round(((outH * 60 + outM) - (inH * 60 + inM)) / 60 * 100) / 100
  }
  try {
    await API.post('/api/attendance', {
      user_id: parseInt(userId), date,
      check_in: checkIn || '', check_out: checkOut || '',
      status: document.getElementById('att-status')?.value || 'present',
      work_hours: workHours,
      notes: document.getElementById('att-notes')?.value || ''
    })
    notify('Attendance marked! ✓', 'success')
    closeModal()
    renderAttendance()
  } catch (e) { notify(e.message, 'error') }
}

function markUserAttendance(userId, userName) {
  showMarkAttendance('')
  setTimeout(() => {
    const sel = document.getElementById('att-user')
    if (sel) sel.value = userId
  }, 100)
}

function editAttendance(userId, date, data) {
  showMarkAttendance(date)
  setTimeout(() => {
    if (document.getElementById('att-user')) document.getElementById('att-user').value = userId
    if (document.getElementById('att-in')) document.getElementById('att-in').value = data.check_in || ''
    if (document.getElementById('att-out')) document.getElementById('att-out').value = data.check_out || ''
    if (document.getElementById('att-status')) document.getElementById('att-status').value = data.status || 'present'
    if (document.getElementById('att-notes')) document.getElementById('att-notes').value = data.notes || ''
  }, 100)
}

// ============================================================
// Resume Builder Page
// ============================================================

async function renderResume() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Resume Builder</h1><p class="text-gray-400 text-sm mt-1">Create and manage professional resumes with AI</p></div>
      <button onclick="navigateTo('ai');setTimeout(()=>showAITab('resume',document.querySelectorAll('.tab-btn')[1]),200)" class="btn-primary"><i class="fas fa-magic"></i> Create with AI</button>
    </div>
    <div id="resumes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="flex items-center justify-center p-8"><div class="spinner"></div></div>
    </div>`
  try {
    const resumes = await API.get(`/api/resumes/${STATE.user?.id}`)
    const grid = document.getElementById('resumes-grid')
    if (!resumes.length) {
      grid.innerHTML = `<div class="col-span-3 empty-state">
        <i class="fas fa-file-alt text-5xl opacity-30"></i>
        <h3 class="text-lg font-semibold text-gray-300 mt-4">No Resumes Yet</h3>
        <p class="text-sm text-gray-500 mt-2 mb-5">Use AI to generate your professional resume</p>
        <button onclick="navigateTo('ai');setTimeout(()=>showAITab('resume',document.querySelectorAll('.tab-btn')[1]),200)" class="btn-primary">
          <i class="fas fa-magic"></i> Generate with AI
        </button>
      </div>`
    } else {
      grid.innerHTML = resumes.map(r => {
        let parsed = {}
        try { parsed = JSON.parse(r.content) } catch {}
        return `
          <div class="card hover:border-indigo-800 transition-all">
            <div class="flex items-start justify-between mb-3">
              <div class="w-12 h-12 bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <i class="fas fa-file-alt text-indigo-400 text-xl"></i>
              </div>
              <div class="flex gap-2">
                <button onclick="viewResume(${r.id})" class="p-2 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-indigo-400"><i class="fas fa-eye text-xs"></i></button>
                <button onclick="deleteResumeItem(${r.id})" class="p-2 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400"><i class="fas fa-trash text-xs"></i></button>
              </div>
            </div>
            <h3 class="font-bold text-white mb-1">${r.title}</h3>
            <p class="text-gray-500 text-xs mb-3">${parsed.personal?.title || 'Professional Resume'}</p>
            <div class="flex items-center justify-between">
              <span class="badge badge-active">${r.template || 'modern'}</span>
              <span class="text-gray-500 text-xs">${formatDate(r.updated_at)}</span>
            </div>
            <button onclick="viewResume(${r.id})" class="btn-secondary w-full text-sm mt-3 justify-center">
              <i class="fas fa-eye mr-2"></i>View & Edit
            </button>
          </div>`
      }).join('')
    }
  } catch (e) { notify('Failed to load resumes', 'error') }
}

async function viewResume(id) {
  try {
    const resumes = await API.get(`/api/resumes/${STATE.user?.id}`)
    const r = resumes.find(x => x.id == id)
    if (!r) return notify('Resume not found', 'error')
    let content = {}
    try { content = JSON.parse(r.content) } catch {}
    showModal(`
      <div class="modal-box modal-box-lg">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white">${r.title}</h2>
          <div class="flex gap-3">
            <button onclick="printResumeModal()" class="btn-secondary text-sm"><i class="fas fa-print mr-2"></i>Print</button>
            <button onclick="closeModal()" class="text-gray-500 hover:text-white p-2"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <div id="resume-modal-preview" style="max-height:70vh;overflow-y:auto"></div>
      </div>`)
    STATE.generatedResume = content
    setTimeout(() => {
      const el = document.getElementById('resume-modal-preview')
      if (el) {
        el.id = 'resume-preview-area'
        renderResumeHTML(content, r.template || 'modern')
      }
    }, 100)
  } catch (e) { notify(e.message, 'error') }
}

function printResumeModal() {
  const content = document.getElementById('resume-html')?.innerHTML
  if (!content) return
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>Resume</title><style>body{margin:20px;font-family:Georgia,serif}@media print{body{margin:0}}</style></head><body>${content}</body></html>`)
  w.document.close(); w.print()
}

async function deleteResumeItem(id) {
  try {
    await API.delete(`/api/resumes/${id}`)
    notify('Resume deleted', 'info')
    renderResume()
  } catch (e) { notify(e.message, 'error') }
}

// ============================================================
// Invoices Page
// ============================================================

async function renderInvoices() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white">Invoices</h1><p class="text-gray-400 text-sm mt-1">Create and manage invoices with AI assistance</p></div>
      <div class="flex gap-3">
        <button onclick="navigateTo('ai');setTimeout(()=>showAITab('invoice',document.querySelectorAll('.tab-btn')[2]),200)" class="btn-primary"><i class="fas fa-magic"></i> AI Invoice</button>
        <button onclick="showManualInvoice()" class="btn-secondary"><i class="fas fa-plus"></i> Manual</button>
      </div>
    </div>
    <!-- Stats -->
    <div id="inv-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"></div>
    <!-- Filter bar -->
    <div class="flex gap-3 mb-5 flex-wrap">
      <select id="inv-status-filter" onchange="loadInvoices()" class="form-select" style="width:150px">
        <option value="">All Status</option>
        <option value="draft">Draft</option><option value="sent">Sent</option>
        <option value="paid">Paid</option><option value="overdue">Overdue</option>
      </select>
      <div class="search-bar flex-1" style="max-width:300px">
        <i class="fas fa-search text-gray-500 text-sm"></i>
        <input type="text" placeholder="Search invoices..." id="inv-search" oninput="filterInvoiceList(this.value)">
      </div>
    </div>
    <div id="inv-list" class="card p-0 overflow-hidden"></div>`
  await loadInvoices()
}

async function loadInvoices() {
  try {
    const isAdmin = STATE.user?.role === 'admin' || STATE.user?.role === 'finance'
    const invoices = isAdmin ? await API.get('/api/invoices') : await API.get(`/api/invoices?userId=${STATE.user?.id}`)
    STATE.allInvoices = invoices
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0)
    const totalPending = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0)
    const stats = [
      { label: 'Total', value: invoices.length, icon: 'fa-file-invoice', color: '#6366f1' },
      { label: 'Draft', value: invoices.filter(i => i.status === 'draft').length, icon: 'fa-edit', color: '#9ca3af' },
      { label: 'Paid', value: `$${totalPaid.toLocaleString()}`, icon: 'fa-check-circle', color: '#10b981' },
      { label: 'Pending', value: `$${totalPending.toLocaleString()}`, icon: 'fa-clock', color: '#f59e0b' }
    ]
    document.getElementById('inv-stats').innerHTML = stats.map(s => `
      <div class="stat-card">
        <div style="width:38px;height:38px;background:${s.color}22;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:10px">
          <i class="fas ${s.icon}" style="color:${s.color};font-size:16px"></i>
        </div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-gray-400 text-sm">${s.label}</div>
      </div>`).join('')
    filterInvoiceList('')
  } catch (e) { notify('Failed to load invoices', 'error') }
}

function filterInvoiceList(q) {
  if (!STATE.allInvoices) return
  const search = (q || '').toLowerCase()
  const status = document.getElementById('inv-status-filter')?.value
  const filtered = STATE.allInvoices.filter(i =>
    (!search || i.invoice_number?.toLowerCase().includes(search) || i.client_name?.toLowerCase().includes(search)) &&
    (!status || i.status === status)
  )
  renderInvoiceList(filtered)
}

function renderInvoiceList(invoices) {
  const list = document.getElementById('inv-list')
  if (!list) return
  if (!invoices.length) {
    list.innerHTML = `<div class="empty-state p-12"><i class="fas fa-file-invoice text-4xl opacity-30"></i><h3 class="text-lg font-semibold text-gray-300 mt-3">No Invoices Found</h3><p class="text-sm text-gray-500 mt-2 mb-4">Create your first invoice with AI assistance</p></div>`
    return
  }
  const sym = (c) => ({ USD:'$', EUR:'€', GBP:'£', INR:'₹' }[c] || '$')
  list.innerHTML = `
    <table class="data-table">
      <thead><tr>
        <th>Invoice #</th><th>Client</th><th>Amount</th><th>Status</th><th>Due Date</th><th>Created</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${invoices.map(inv => `
          <tr>
            <td class="font-mono text-indigo-400 text-sm">${inv.invoice_number}</td>
            <td>
              <div class="font-semibold text-white text-sm">${inv.client_name}</div>
              ${inv.client_email ? `<div class="text-xs text-gray-500">${inv.client_email}</div>` : ''}
            </td>
            <td><span class="font-bold text-white">${sym(inv.currency)}${parseFloat(inv.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
            <td>${getStatusBadge(inv.status)}</td>
            <td class="${inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== 'paid' ? 'text-red-400' : 'text-gray-400'} text-sm">${formatDate(inv.due_date)}</td>
            <td class="text-gray-500 text-sm">${formatDate(inv.created_at)}</td>
            <td>
              <div class="flex gap-2">
                <button onclick="previewInvoice(${inv.id})" class="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-indigo-400" title="Preview"><i class="fas fa-eye text-xs"></i></button>
                <button onclick="updateInvoiceStatus(${inv.id},'${inv.status === 'draft' ? 'sent' : inv.status === 'sent' ? 'paid' : 'draft'}')" class="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-green-400" title="Update Status"><i class="fas fa-check text-xs"></i></button>
                <button onclick="deleteInvoiceItem(${inv.id})" class="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400" title="Delete"><i class="fas fa-trash text-xs"></i></button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`
}

async function previewInvoice(id) {
  const inv = STATE.allInvoices?.find(i => i.id == id)
  if (!inv) return
  const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || []
  showModal(`
    <div class="modal-box modal-box-lg">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white">${inv.invoice_number}</h2>
        <div class="flex gap-3">
          <button onclick="printInvoiceModal('${id}')" class="btn-secondary text-sm"><i class="fas fa-print mr-2"></i>Print</button>
          <button onclick="closeModal()" class="text-gray-500 hover:text-white p-2"><i class="fas fa-times"></i></button>
        </div>
      </div>
      <div style="max-height:70vh;overflow-y:auto" id="inv-modal-preview"></div>
    </div>`)
  setTimeout(() => {
    const el = document.getElementById('inv-modal-preview')
    if (el) {
      el.id = 'invoice-preview-area'
      renderInvoiceHTML({ ...inv, items }, inv.invoice_number)
    }
  }, 100)
}

function printInvoiceModal() {
  const content = document.getElementById('invoice-html')?.innerHTML
  if (!content) return
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>Invoice</title><style>body{margin:20px;font-family:Arial,sans-serif}@media print{body{margin:0}}</style></head><body>${content}</body></html>`)
  w.document.close(); w.print()
}

async function updateInvoiceStatus(id, status) {
  try {
    const inv = STATE.allInvoices?.find(i => i.id == id)
    if (!inv) return
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || []
    await API.put(`/api/invoices/${id}`, { ...inv, items, status })
    notify(`Invoice marked as ${status}`, 'success')
    await loadInvoices()
  } catch (e) { notify(e.message, 'error') }
}

async function deleteInvoiceItem(id) {
  try {
    await API.delete(`/api/invoices/${id}`)
    notify('Invoice deleted', 'info')
    await loadInvoices()
  } catch (e) { notify(e.message, 'error') }
}

function showManualInvoice() {
  showModal(`
    <div class="modal-box modal-box-lg">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white"><i class="fas fa-file-invoice text-indigo-400 mr-2"></i>New Invoice</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div><label class="form-label">Client Name *</label><input id="mi-client" type="text" class="form-input" placeholder="Client Company"></div>
        <div><label class="form-label">Client Email</label><input id="mi-email" type="email" class="form-input" placeholder="client@company.com"></div>
        <div><label class="form-label">Your Company</label><input id="mi-company" type="text" class="form-input" value="${STATE.user?.name || ''}"></div>
        <div><label class="form-label">Due Date</label><input id="mi-due" type="date" class="form-input"></div>
      </div>
      <div class="mb-4">
        <label class="form-label">Items</label>
        <div id="mi-items">
          <div class="grid grid-cols-12 gap-2 mb-2 text-xs text-gray-500 font-semibold">
            <div class="col-span-6">Description</div><div class="col-span-2">Qty</div>
            <div class="col-span-2">Unit Price</div><div class="col-span-2">Amount</div>
          </div>
          <div id="mi-item-rows">
            ${[1,2,3].map((_, i) => `
              <div class="grid grid-cols-12 gap-2 mb-2 mi-item-row" id="mi-row-${i}">
                <input type="text" class="form-input col-span-6 text-sm" placeholder="Service description" id="mi-desc-${i}">
                <input type="number" class="form-input col-span-2 text-sm" placeholder="1" id="mi-qty-${i}" value="1" min="0" oninput="calcItemTotal(${i})">
                <input type="number" class="form-input col-span-2 text-sm" placeholder="0.00" id="mi-price-${i}" min="0" step="0.01" oninput="calcItemTotal(${i})">
                <input type="text" class="form-input col-span-2 text-sm" placeholder="0.00" id="mi-total-${i}" readonly style="background:#0f172a">
              </div>`).join('')}
          </div>
          <button onclick="addInvoiceRow()" class="text-indigo-400 text-xs hover:text-indigo-300 mt-2"><i class="fas fa-plus mr-1"></i>Add Row</button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="form-label">Tax Rate (%)</label><input id="mi-tax" type="number" step="0.5" class="form-input" value="10" oninput="calcInvoiceTotals()"></div>
        <div><label class="form-label">Currency</label><select id="mi-currency" class="form-select">
          <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option><option value="INR">INR (₹)</option>
        </select></div>
      </div>
      <div class="mt-4 p-4 bg-gray-900 rounded-xl">
        <div class="flex justify-between text-sm text-gray-400 mb-2"><span>Subtotal:</span><span id="mi-subtotal">$0.00</span></div>
        <div class="flex justify-between text-sm text-gray-400 mb-2"><span>Tax:</span><span id="mi-tax-amount">$0.00</span></div>
        <div class="flex justify-between font-bold text-white"><span>Total:</span><span id="mi-total" class="text-indigo-400">$0.00</span></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeModal()" class="btn-secondary flex-1">Cancel</button>
        <button onclick="saveManualInvoice()" class="btn-primary flex-1 justify-center"><i class="fas fa-save"></i> Save Invoice</button>
      </div>
    </div>`)
  window._miRowCount = 3
}

function calcItemTotal(i) {
  const qty = parseFloat(document.getElementById(`mi-qty-${i}`)?.value || 0)
  const price = parseFloat(document.getElementById(`mi-price-${i}`)?.value || 0)
  const total = qty * price
  const el = document.getElementById(`mi-total-${i}`)
  if (el) el.value = total.toFixed(2)
  calcInvoiceTotals()
}

function calcInvoiceTotals() {
  const count = window._miRowCount || 3
  let subtotal = 0
  for (let i = 0; i < count; i++) {
    const t = document.getElementById(`mi-total-${i}`)
    if (t) subtotal += parseFloat(t.value || 0)
  }
  const taxRate = parseFloat(document.getElementById('mi-tax')?.value || 10)
  const tax = subtotal * taxRate / 100
  const total = subtotal + tax
  if (document.getElementById('mi-subtotal')) document.getElementById('mi-subtotal').textContent = `$${subtotal.toFixed(2)}`
  if (document.getElementById('mi-tax-amount')) document.getElementById('mi-tax-amount').textContent = `$${tax.toFixed(2)}`
  if (document.getElementById('mi-total')) document.getElementById('mi-total').textContent = `$${total.toFixed(2)}`
}

function addInvoiceRow() {
  const i = window._miRowCount++
  const rows = document.getElementById('mi-item-rows')
  if (!rows) return
  const row = document.createElement('div')
  row.className = 'grid grid-cols-12 gap-2 mb-2 mi-item-row'
  row.id = `mi-row-${i}`
  row.innerHTML = `
    <input type="text" class="form-input col-span-6 text-sm" placeholder="Service description" id="mi-desc-${i}">
    <input type="number" class="form-input col-span-2 text-sm" placeholder="1" id="mi-qty-${i}" value="1" min="0" oninput="calcItemTotal(${i})">
    <input type="number" class="form-input col-span-2 text-sm" placeholder="0.00" id="mi-price-${i}" min="0" step="0.01" oninput="calcItemTotal(${i})">
    <input type="text" class="form-input col-span-2 text-sm" placeholder="0.00" id="mi-total-${i}" readonly style="background:#0f172a">`
  rows.appendChild(row)
}

async function saveManualInvoice() {
  const clientName = document.getElementById('mi-client')?.value?.trim()
  if (!clientName) return notify('Client name is required', 'error')
  const count = window._miRowCount || 3
  const items = []
  for (let i = 0; i < count; i++) {
    const desc = document.getElementById(`mi-desc-${i}`)?.value?.trim()
    if (!desc) continue
    const qty = parseFloat(document.getElementById(`mi-qty-${i}`)?.value || 1)
    const price = parseFloat(document.getElementById(`mi-price-${i}`)?.value || 0)
    items.push({ description: desc, quantity: qty, unit_price: price, amount: qty * price })
  }
  if (!items.length) return notify('Add at least one item', 'error')
  const subtotal = items.reduce((s, i) => s + i.amount, 0)
  const taxRate = parseFloat(document.getElementById('mi-tax')?.value || 10)
  const taxAmount = subtotal * taxRate / 100
  try {
    await API.post('/api/invoices', {
      user_id: STATE.user?.id,
      client_name: clientName,
      client_email: document.getElementById('mi-email')?.value || '',
      company_name: document.getElementById('mi-company')?.value || '',
      due_date: document.getElementById('mi-due')?.value || '',
      currency: document.getElementById('mi-currency')?.value || 'USD',
      items, subtotal, tax_rate: taxRate, tax_amount: taxAmount,
      total: subtotal + taxAmount, status: 'draft'
    })
    notify('Invoice saved! ✓', 'success')
    closeModal()
    await loadInvoices()
  } catch (e) { notify(e.message, 'error') }
}
