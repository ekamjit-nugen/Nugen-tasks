// ============================================================
// AI Assistant Page
// ============================================================

async function renderAI() {
  const content = document.getElementById('page-content')
  content.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <div><h1 class="text-2xl font-bold text-white flex items-center gap-3"><i class="fas fa-robot text-indigo-400"></i> AI Assistant</h1>
        <p class="text-gray-400 text-sm mt-1">Use natural language to create projects, tasks, resumes, and invoices</p></div>
      ${!STATE.apiKey ? `<button onclick="showApiKeySetup()" class="btn-primary bg-yellow-600 hover:bg-yellow-500"><i class="fas fa-key"></i> Set API Key</button>` : `<div class="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-800 rounded-xl text-sm text-green-400"><i class="fas fa-check-circle"></i> AI Ready</div>`}
    </div>

    ${!STATE.apiKey ? `<div class="card mb-6 border-yellow-800 bg-yellow-900/10">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 bg-yellow-900/40 rounded-xl flex items-center justify-center flex-shrink-0"><i class="fas fa-key text-yellow-400 text-xl"></i></div>
        <div class="flex-1">
          <h3 class="font-semibold text-white mb-1">OpenAI API Key Required</h3>
          <p class="text-gray-400 text-sm">Add your OpenAI API key to enable AI features. Get one at <a href="https://platform.openai.com/api-keys" target="_blank" class="text-indigo-400 hover:underline">platform.openai.com</a></p>
        </div>
        <button onclick="showApiKeySetup()" class="btn-primary text-sm py-2"><i class="fas fa-key"></i> Add Key</button>
      </div>
    </div>` : ''}

    <!-- Tabs -->
    <div class="tab-nav mb-6">
      <button class="tab-btn active" id="ai-tab-tasks" onclick="showAITab('tasks',this)"><i class="fas fa-tasks mr-2"></i>Task Generator</button>
      <button class="tab-btn" id="ai-tab-resume" onclick="showAITab('resume',this)"><i class="fas fa-file-alt mr-2"></i>Resume Builder</button>
      <button class="tab-btn" id="ai-tab-invoice" onclick="showAITab('invoice',this)"><i class="fas fa-file-invoice mr-2"></i>Invoice Creator</button>
      <button class="tab-btn" id="ai-tab-history" onclick="showAITab('history',this)"><i class="fas fa-history mr-2"></i>History</button>
    </div>

    <div id="ai-tab-content">
    </div>`

  showAITab('tasks', document.getElementById('ai-tab-tasks'))
}

function showAITab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  if (btn) btn.classList.add('active')
  const c = document.getElementById('ai-tab-content')
  if (tab === 'tasks') renderAITaskTab(c)
  else if (tab === 'resume') renderAIResumeTab(c)
  else if (tab === 'invoice') renderAIInvoiceTab(c)
  else if (tab === 'history') renderAIHistoryTab(c)
}

function renderAITaskTab(c) {
  c.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div class="card mb-4">
          <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-magic text-indigo-400"></i> Describe Your Project</h3>
          <textarea id="ai-task-prompt" class="form-input" rows="6" placeholder="Describe what you want to create in natural language...

Examples:
• 'Build a mobile app for food delivery with user auth, menu management, and order tracking'
• 'Set up HR onboarding for 5 new developers joining next week'
• 'Create a marketing campaign for Q1 product launch'
• 'Develop REST API with authentication, database design, and documentation'"></textarea>
          <div class="flex gap-3 mt-4 flex-wrap">
            <button onclick="runAITaskGeneration()" class="btn-primary flex-1 justify-center" id="ai-task-btn" ${!STATE.apiKey ? 'disabled title="Add API key first"' : ''}>
              <i class="fas fa-magic"></i> Generate with AI
            </button>
          </div>
          <div class="mt-4">
            <p class="text-xs text-gray-500 mb-3 font-semibold uppercase tracking-wide">Quick Prompts:</p>
            <div class="grid grid-cols-1 gap-2">
              ${[
                ['🚀 IT Sprint', 'Create a 2-week sprint for developing a REST API with authentication, CRUD operations for users and products, unit tests, and deployment to production.'],
                ['🎨 Design Project', 'Create a UX/UI redesign project for our mobile app including user research, wireframes, prototypes, and final design handoff with developer documentation.'],
                ['👥 HR Onboarding', 'Set up a complete employee onboarding project for new hires including documentation review, tool setup, team introductions, training schedule, and 30-60-90 day goals.'],
                ['💰 Finance Audit', 'Create a quarterly financial audit project with data collection, expense review, invoice reconciliation, budget analysis, and stakeholder reporting tasks.'],
                ['📱 App Development', 'Full mobile app development project for an e-commerce platform with backend API, iOS/Android apps, payment integration, and launch preparation.'],
                ['📊 Marketing Campaign', 'Q1 marketing campaign project with market research, content creation, social media strategy, email campaigns, and performance analytics tracking.']
              ].map(([label, prompt]) => `
                <button onclick="setAIPrompt(\`${prompt.replace(/`/g,'\\`')}\`)" class="text-left p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-indigo-700 transition-all group">
                  <div class="text-sm font-medium text-white group-hover:text-indigo-300">${label}</div>
                  <div class="text-xs text-gray-600 mt-1 line-clamp-1">${prompt.slice(0,80)}...</div>
                </button>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-list-check text-green-400"></i> Generated Plan</h3>
          <div id="ai-task-result" class="ai-chat-area" style="min-height:200px">
            <div class="empty-state py-6">
              <i class="fas fa-robot text-4xl text-indigo-400 opacity-50"></i>
              <p class="mt-3 text-sm">AI will generate a structured project plan here.</p>
              <p class="text-xs text-gray-600 mt-1">Projects, tasks, and subtasks will be created automatically.</p>
            </div>
          </div>
        </div>

        <div class="card mt-4">
          <h3 class="font-semibold text-white mb-3 flex items-center gap-2"><i class="fas fa-brain text-purple-400"></i> How AI Works</h3>
          <div class="space-y-3">
            ${[
              ['1', 'Smart Project Detection', 'AI checks if a similar project exists and adds tasks to it instead of creating duplicates'],
              ['2', 'Role-Aware Tasks', 'Tasks are tailored for the right roles (developers, designers, managers, etc.)'],
              ['3', 'Auto Subtask Breakdown', 'Complex tasks are automatically broken down into manageable subtasks'],
              ['4', 'Priority Assignment', 'AI intelligently assigns priorities based on task complexity and context']
            ].map(([n, title, desc]) => `
              <div class="flex gap-3">
                <div class="w-6 h-6 bg-indigo-900/50 rounded-full flex items-center justify-center text-xs text-indigo-400 font-bold flex-shrink-0">${n}</div>
                <div><div class="text-sm font-medium text-white">${title}</div><div class="text-xs text-gray-500">${desc}</div></div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`
}

function setAIPrompt(text) {
  const ta = document.getElementById('ai-task-prompt')
  if (ta) { ta.value = text; ta.focus() }
}

async function runAITaskGeneration() {
  const prompt = document.getElementById('ai-task-prompt')?.value?.trim()
  if (!prompt) return notify('Please describe what you want to create', 'error')
  if (!STATE.apiKey) return notify('Please set your OpenAI API key first', 'error')

  const btn = document.getElementById('ai-task-btn')
  const result = document.getElementById('ai-task-result')
  btn.disabled = true
  btn.innerHTML = '<span class="spinner"></span> Generating...'
  result.innerHTML = `<div class="flex items-center gap-3 p-4"><div class="spinner"></div><div><div class="text-sm text-white font-medium">AI is analyzing your request...</div><div class="text-xs text-gray-500 mt-1">Checking existing projects, generating structure...</div></div></div>`

  try {
    const data = await API.post('/api/ai/generate-tasks', { prompt, userId: STATE.user?.id, apiKey: STATE.apiKey })
    const { plan, results } = data

    result.innerHTML = `
      <div class="ai-bubble">
        <div class="flex items-center gap-2 mb-3">
          <i class="fas fa-check-circle text-green-400"></i>
          <span class="font-semibold text-white text-sm">${results.message}</span>
        </div>
        <div class="mb-3 p-3 bg-gray-900 rounded-xl">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-3 h-3 rounded-full" style="background:${plan.project?.color || '#6366f1'}"></div>
            <span class="font-semibold text-white">${plan.project?.name}</span>
            <span class="badge badge-${plan.project?.priority || 'medium'} text-xs">${plan.project?.priority}</span>
          </div>
          <p class="text-xs text-gray-400">${plan.project?.description || ''}</p>
        </div>
        <div class="text-xs text-gray-400 font-semibold mb-2">CREATED ${results.tasks.length} TASKS:</div>
        ${results.tasks.map((t, i) => `
          <div class="mb-2 p-2 bg-gray-900/50 rounded-lg">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-indigo-400 font-mono text-xs">#${i+1}</span>
              <span class="text-sm text-white font-medium">${t.title}</span>
            </div>
            ${t.subtasks.length > 0 ? `<div class="ml-4">${t.subtasks.map(s => `<div class="flex items-center gap-2 text-xs text-gray-500 py-0.5"><i class="fas fa-angle-right text-gray-700"></i>${s.title}</div>`).join('')}</div>` : ''}
          </div>`).join('')}
        <div class="flex gap-3 mt-4">
          <button onclick="STATE.selectedProject=${results.project_id};navigateTo('tasks')" class="btn-primary text-xs py-2"><i class="fas fa-tasks mr-1"></i> View Tasks</button>
          <button onclick="navigateTo('kanban')" class="btn-secondary text-xs py-2"><i class="fas fa-columns mr-1"></i> Open Kanban</button>
        </div>
      </div>`

    notify(`Created ${results.tasks.length} tasks successfully! 🎉`, 'success')
    STATE.projects = await API.get('/api/projects')
  } catch (e) {
    result.innerHTML = `<div class="ai-bubble border-red-800"><i class="fas fa-times-circle text-red-400 mr-2"></i><span class="text-red-300 text-sm">${e.message}</span></div>`
    notify(e.message, 'error')
  } finally {
    btn.disabled = false
    btn.innerHTML = '<i class="fas fa-magic"></i> Generate with AI'
  }
}

function renderAIResumeTab(c) {
  c.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-file-alt text-indigo-400"></i> Build Your Resume</h3>
        <div class="space-y-4">
          <div><label class="form-label">Job Title / Role</label><input id="res-title" type="text" class="form-input" placeholder="e.g., Senior Software Engineer"></div>
          <div><label class="form-label">Work Experience Summary</label><textarea id="res-exp" class="form-input" rows="4" placeholder="5 years at TechCorp as Backend Developer, worked on microservices, led team of 3 developers, increased performance by 40%..."></textarea></div>
          <div><label class="form-label">Key Skills</label><input id="res-skills" type="text" class="form-input" placeholder="Python, React, AWS, Docker, PostgreSQL, Agile..."></div>
          <div><label class="form-label">Education</label><input id="res-edu" type="text" class="form-input" placeholder="B.S. Computer Science, MIT 2018"></div>
          <div><label class="form-label">Template Style</label>
            <select id="res-template" class="form-select">
              <option value="modern">Modern (Dark with accents)</option>
              <option value="classic">Classic (Traditional)</option>
              <option value="minimal">Minimal (Clean)</option>
              <option value="creative">Creative (Bold)</option>
            </select></div>
          <button onclick="generateResume()" class="btn-primary w-full justify-center" id="res-btn" ${!STATE.apiKey ? 'disabled' : ''}>
            <i class="fas fa-magic"></i> Generate Resume with AI
          </button>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-white">Resume Preview</h3>
          <div class="flex gap-2" id="res-actions" style="display:none!important">
            <button onclick="saveResume()" class="btn-secondary text-xs"><i class="fas fa-save mr-1"></i>Save</button>
            <button onclick="printResume()" class="btn-secondary text-xs"><i class="fas fa-print mr-1"></i>Print</button>
          </div>
        </div>
        <div id="resume-preview-area">
          <div class="empty-state"><i class="fas fa-file-alt text-4xl opacity-30"></i><p class="mt-3 text-sm">Fill in the form and click Generate</p></div>
        </div>
      </div>
    </div>`
}

async function generateResume() {
  const jobTitle = document.getElementById('res-title')?.value?.trim()
  if (!jobTitle) return notify('Please enter a job title', 'error')
  if (!STATE.apiKey) return notify('Please set your OpenAI API key', 'error')

  const btn = document.getElementById('res-btn')
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating...'
  const preview = document.getElementById('resume-preview-area')
  preview.innerHTML = `<div class="flex items-center justify-center p-8"><div class="spinner"></div><span class="ml-3 text-gray-400">AI is crafting your resume...</span></div>`

  try {
    const data = await API.post('/api/ai/generate-resume', {
      userData: STATE.user,
      jobTitle,
      experience: document.getElementById('res-exp')?.value || '',
      skills: document.getElementById('res-skills')?.value || '',
      education: document.getElementById('res-edu')?.value || '',
      userId: STATE.user?.id,
      apiKey: STATE.apiKey
    })
    STATE.generatedResume = data.resumeData
    const template = document.getElementById('res-template')?.value || 'modern'
    renderResumeHTML(data.resumeData, template)
    document.getElementById('res-actions').style.display = 'flex'
    notify('Resume generated! ✓', 'success')
  } catch (e) {
    preview.innerHTML = `<div class="ai-bubble border-red-800 text-red-300 text-sm">${e.message}</div>`
    notify(e.message, 'error')
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Generate Resume with AI'
  }
}

function renderResumeHTML(r, template) {
  const preview = document.getElementById('resume-preview-area')
  if (!r) return
  const accentColor = template === 'modern' ? '#6366f1' : template === 'creative' ? '#f97316' : template === 'minimal' ? '#374151' : '#1e40af'
  preview.innerHTML = `
    <div class="resume-preview" id="resume-html" style="font-size:13px;line-height:1.5">
      <!-- Header -->
      <div style="background:${accentColor};color:white;padding:24px;margin:-40px -40px 24px;border-radius:8px 8px 0 0">
        <h1 style="font-size:26px;font-weight:700;margin:0 0 4px;color:white">${r.personal?.name || STATE.user?.name || 'Your Name'}</h1>
        <div style="font-size:15px;opacity:0.9;color:white">${r.personal?.title || ''}</div>
        <div style="display:flex;gap:16px;margin-top:10px;font-size:12px;flex-wrap:wrap">
          ${r.personal?.email ? `<span style="color:rgba(255,255,255,0.85)">✉ ${r.personal.email}</span>` : ''}
          ${r.personal?.phone ? `<span style="color:rgba(255,255,255,0.85)">📞 ${r.personal.phone}</span>` : ''}
          ${r.personal?.location ? `<span style="color:rgba(255,255,255,0.85)">📍 ${r.personal.location}</span>` : ''}
          ${r.personal?.linkedin ? `<span style="color:rgba(255,255,255,0.85)">💼 ${r.personal.linkedin}</span>` : ''}
        </div>
      </div>
      <!-- Summary -->
      ${r.personal?.summary ? `<div style="margin-bottom:20px"><h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:6px;margin-bottom:10px">Professional Summary</h2><p style="color:#374151;line-height:1.7">${r.personal.summary}</p></div>` : ''}
      <!-- Experience -->
      ${r.experience?.length ? `<div style="margin-bottom:20px"><h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:6px;margin-bottom:12px">Work Experience</h2>${r.experience.map(e => `<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;align-items:start"><div><strong style="font-size:14px;color:#111">${e.role}</strong><div style="color:#6b7280;font-size:12px">${e.company}</div></div><span style="font-size:11px;color:#9ca3af;white-space:nowrap">${e.period || ''}</span></div>${e.description?`<p style="color:#374151;font-size:12px;margin-top:6px">${e.description}</p>`:''}${e.achievements?.length?`<ul style="margin-top:6px;padding-left:16px">${e.achievements.map(a=>`<li style="font-size:12px;color:#374151;margin-bottom:3px">${a}</li>`).join('')}</ul>`:''}</div>`).join('')}</div>` : ''}
      <!-- Skills -->
      ${r.skills ? `<div style="margin-bottom:20px"><h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:6px;margin-bottom:12px">Skills</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${r.skills.technical?.length?`<div><strong style="font-size:12px;color:#374151">Technical</strong><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${r.skills.technical.map(s=>`<span style="background:#e0e7ff;color:${accentColor};padding:2px 10px;border-radius:12px;font-size:11px">${s}</span>`).join('')}</div></div>`:''}${r.skills.soft?.length?`<div><strong style="font-size:12px;color:#374151">Soft Skills</strong><div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:4px">${r.skills.soft.map(s=>`<span style="background:#f3f4f6;color:#374151;padding:2px 10px;border-radius:12px;font-size:11px">${s}</span>`).join('')}</div></div>`:''}</div></div>` : ''}
      <!-- Education -->
      ${r.education?.length ? `<div style="margin-bottom:20px"><h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:6px;margin-bottom:12px">Education</h2>${r.education.map(e=>`<div style="display:flex;justify-content:space-between;margin-bottom:10px"><div><strong style="font-size:13px;color:#111">${e.degree} in ${e.field}</strong><div style="color:#6b7280;font-size:12px">${e.institution}</div></div><span style="font-size:11px;color:#9ca3af">${e.year||''}</span></div>`).join('')}</div>` : ''}
      <!-- Certifications -->
      ${r.certifications?.length ? `<div style="margin-bottom:20px"><h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:6px;margin-bottom:12px">Certifications</h2>${r.certifications.map(c=>`<div style="display:flex;justify-content:space-between;margin-bottom:8px"><div><strong style="font-size:13px;color:#111">${c.name}</strong><span style="color:#6b7280;font-size:12px;margin-left:8px">${c.issuer||''}</span></div><span style="font-size:11px;color:#9ca3af">${c.year||''}</span></div>`).join('')}</div>` : ''}
      <!-- Projects -->
      ${r.projects?.length ? `<div><h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${accentColor};border-bottom:2px solid ${accentColor};padding-bottom:6px;margin-bottom:12px">Key Projects</h2>${r.projects.map(p=>`<div style="margin-bottom:12px"><strong style="font-size:13px;color:#111">${p.name}</strong><p style="font-size:12px;color:#374151;margin:4px 0">${p.description}</p>${p.technologies?.length?`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px">${p.technologies.map(t=>`<span style="background:#fef3c7;color:#92400e;padding:1px 8px;border-radius:10px;font-size:10px">${t}</span>`).join('')}</div>`:''}</div>`).join('')}</div>` : ''}
    </div>`
}

async function saveResume() {
  if (!STATE.generatedResume) return notify('Generate a resume first', 'error')
  try {
    const title = document.getElementById('res-title')?.value || 'My Resume'
    await API.post('/api/resumes', {
      user_id: STATE.user?.id,
      title: `${title} - ${new Date().toLocaleDateString()}`,
      content: JSON.stringify(STATE.generatedResume),
      template: document.getElementById('res-template')?.value || 'modern'
    })
    notify('Resume saved! ✓', 'success')
  } catch (e) { notify(e.message, 'error') }
}

function printResume() {
  const content = document.getElementById('resume-html')?.innerHTML
  if (!content) return
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>Resume</title><style>body{margin:0;padding:20px;font-family:Georgia,serif}@media print{body{margin:0}}</style></head><body>${content}</body></html>`)
  w.document.close()
  w.print()
}

function renderAIInvoiceTab(c) {
  c.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-file-invoice-dollar text-indigo-400"></i> Generate Invoice</h3>
        <div class="space-y-4">
          <div><label class="form-label">Service/Project Description</label>
            <textarea id="inv-desc" class="form-input" rows="4" placeholder="e.g., Website development project with custom design, React frontend, Node.js backend, 80 hours of development work, hosting setup and deployment..."></textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Client Name</label><input id="inv-client" type="text" class="form-input" placeholder="Client Company Inc."></div>
            <div><label class="form-label">Client Email</label><input id="inv-email" type="email" class="form-input" placeholder="client@company.com"></div>
          </div>
          <div><label class="form-label">Client Address</label><input id="inv-addr" type="text" class="form-input" placeholder="123 Business St, City, Country"></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Your Company</label><input id="inv-company" type="text" class="form-input" value="${STATE.user?.name || ''}"></div>
            <div><label class="form-label">Tax Rate (%)</label><input id="inv-tax" type="number" step="0.5" min="0" max="50" class="form-input" value="10"></div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="form-label">Due Date</label><input id="inv-due" type="date" class="form-input"></div>
            <div><label class="form-label">Currency</label><select id="inv-currency" class="form-select">
              <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option><option value="INR">INR (₹)</option>
              <option value="AUD">AUD (A$)</option><option value="CAD">CAD (C$)</option>
            </select></div>
          </div>
          <button onclick="generateInvoiceAI()" class="btn-primary w-full justify-center" id="inv-btn" ${!STATE.apiKey ? 'disabled' : ''}>
            <i class="fas fa-magic"></i> Generate Invoice with AI
          </button>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-white">Invoice Preview</h3>
          <div class="flex gap-2" id="inv-actions" style="display:none!important">
            <button onclick="saveInvoice()" class="btn-secondary text-xs"><i class="fas fa-save mr-1"></i>Save</button>
            <button onclick="printInvoice()" class="btn-secondary text-xs"><i class="fas fa-print mr-1"></i>Print</button>
          </div>
        </div>
        <div id="invoice-preview-area">
          <div class="empty-state"><i class="fas fa-file-invoice text-4xl opacity-30"></i><p class="mt-3 text-sm">Fill in the form and click Generate</p></div>
        </div>
      </div>
    </div>`
}

async function generateInvoiceAI() {
  const description = document.getElementById('inv-desc')?.value?.trim()
  const clientName = document.getElementById('inv-client')?.value?.trim()
  if (!description) return notify('Please describe the services', 'error')
  if (!STATE.apiKey) return notify('Please set your OpenAI API key', 'error')

  const btn = document.getElementById('inv-btn')
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Generating...'
  const preview = document.getElementById('invoice-preview-area')
  preview.innerHTML = `<div class="flex items-center justify-center p-8"><div class="spinner"></div><span class="ml-3 text-gray-400">AI is creating your invoice...</span></div>`

  try {
    const data = await API.post('/api/ai/generate-invoice', {
      description, clientInfo: clientName, userId: STATE.user?.id, apiKey: STATE.apiKey
    })
    const taxRate = parseFloat(document.getElementById('inv-tax')?.value || '10')
    const currency = document.getElementById('inv-currency')?.value || 'USD'
    const items = data.invoiceData?.items || []
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0)
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + taxAmount

    STATE.pendingInvoice = {
      items, subtotal, tax_rate: taxRate, tax_amount: taxAmount, total,
      client_name: document.getElementById('inv-client')?.value || 'Client',
      client_email: document.getElementById('inv-email')?.value || '',
      client_address: document.getElementById('inv-addr')?.value || '',
      company_name: document.getElementById('inv-company')?.value || '',
      due_date: document.getElementById('inv-due')?.value || '',
      currency, notes: data.invoiceData?.notes || '',
      user_id: STATE.user?.id
    }

    renderInvoiceHTML(STATE.pendingInvoice, `INV-${Date.now().toString().slice(-6)}`)
    document.getElementById('inv-actions').style.display = 'flex'
    notify('Invoice generated! ✓', 'success')
  } catch (e) {
    preview.innerHTML = `<div class="ai-bubble border-red-800 text-red-300 text-sm">${e.message}</div>`
    notify(e.message, 'error')
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Generate Invoice with AI'
  }
}

function renderInvoiceHTML(inv, invNum) {
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', AUD:'A$', CAD:'C$' }[inv.currency] || '$'
  const preview = document.getElementById('invoice-preview-area')
  preview.innerHTML = `
    <div class="invoice-preview" id="invoice-html" style="font-size:13px">
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:32px">
        <div>
          <h1 style="font-size:28px;font-weight:800;color:#6366f1;margin:0 0 4px">INVOICE</h1>
          <div style="font-size:16px;font-weight:700;color:#111">${inv.company_name || 'Your Company'}</div>
          <div style="color:#6b7280;font-size:12px">${STATE.user?.email || ''}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:700;color:#111">Invoice #</div>
          <div style="font-size:16px;font-weight:800;color:#6366f1">${invNum}</div>
          <div style="color:#6b7280;font-size:11px;margin-top:4px">Date: ${new Date().toLocaleDateString()}</div>
          ${inv.due_date ? `<div style="color:#ef4444;font-size:11px;font-weight:600">Due: ${new Date(inv.due_date).toLocaleDateString()}</div>` : ''}
        </div>
      </div>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px;display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:6px">Bill To</div>
          <div style="font-weight:700;color:#111;font-size:14px">${inv.client_name}</div>
          ${inv.client_email ? `<div style="color:#6b7280;font-size:12px">${inv.client_email}</div>` : ''}
          ${inv.client_address ? `<div style="color:#6b7280;font-size:12px">${inv.client_address}</div>` : ''}
        </div>
        <div><div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:6px">Payment Details</div>
          <div style="color:#111;font-size:12px">Currency: <strong>${inv.currency}</strong></div>
          <div style="color:#111;font-size:12px">Tax Rate: <strong>${inv.tax_rate}%</strong></div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Description</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Unit Price</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280">Amount</th>
        </tr></thead>
        <tbody>
          ${inv.items.map((item, i) => `
            <tr style="border-bottom:1px solid #f3f4f6;${i%2===0?'':'background:#fafafa'}">
              <td style="padding:10px 12px;color:#111;font-size:13px">${item.description}</td>
              <td style="padding:10px 12px;text-align:center;color:#374151;font-size:13px">${item.quantity || 1}</td>
              <td style="padding:10px 12px;text-align:right;color:#374151;font-size:13px">${sym}${(item.unit_price || 0).toFixed(2)}</td>
              <td style="padding:10px 12px;text-align:right;font-weight:600;color:#111;font-size:13px">${sym}${(item.amount || 0).toFixed(2)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end">
        <div style="width:240px">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#6b7280">Subtotal</span><span style="color:#111">${sym}${inv.subtotal.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px"><span style="color:#6b7280">Tax (${inv.tax_rate}%)</span><span style="color:#111">${sym}${inv.tax_amount.toFixed(2)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #6366f1;margin-top:4px">
            <span style="font-weight:700;font-size:14px;color:#111">Total</span>
            <span style="font-weight:800;font-size:18px;color:#6366f1">${sym}${inv.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      ${inv.notes ? `<div style="margin-top:20px;padding:12px;background:#f9fafb;border-radius:8px"><div style="font-size:11px;font-weight:600;text-transform:uppercase;color:#9ca3af;margin-bottom:4px">Notes</div><p style="font-size:12px;color:#374151">${inv.notes}</p></div>` : ''}
      <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #f3f4f6;color:#9ca3af;font-size:11px">Thank you for your business!</div>
    </div>`
}

async function saveInvoice() {
  if (!STATE.pendingInvoice) return notify('Generate an invoice first', 'error')
  try {
    await API.post('/api/invoices', STATE.pendingInvoice)
    notify('Invoice saved! ✓', 'success')
    STATE.pendingInvoice = null
  } catch (e) { notify(e.message, 'error') }
}

function printInvoice() {
  const content = document.getElementById('invoice-html')?.innerHTML
  if (!content) return
  const w = window.open('', '_blank')
  w.document.write(`<html><head><title>Invoice</title><style>body{margin:20px;font-family:Arial,sans-serif}@media print{body{margin:0}}</style></head><body>${content}</body></html>`)
  w.document.close(); w.print()
}

async function renderAIHistoryTab(c) {
  c.innerHTML = `<div class="card"><h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i class="fas fa-history text-indigo-400"></i> AI Prompt History</h3><div id="history-list"><div class="flex justify-center p-8"><div class="spinner"></div></div></div></div>`
  try {
    const history = await API.get(`/api/ai/history/${STATE.user?.id}`)
    const list = document.getElementById('history-list')
    if (!history.length) {
      list.innerHTML = `<div class="empty-state"><i class="fas fa-history text-3xl opacity-30"></i><p class="mt-3 text-sm">No AI prompts yet</p></div>`
    } else {
      list.innerHTML = `<div class="space-y-3">${history.map(h => `
        <div class="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <span class="badge ${h.module==='tasks'?'badge-in-progress':h.module==='resume'?'badge-done':'badge-medium'} text-xs">${h.module}</span>
            <span class="text-xs text-gray-500">${formatDate(h.created_at)}</span>
          </div>
          <p class="text-sm text-gray-300 line-clamp-2">${h.prompt}</p>
          ${h.status==='completed'?'<div class="text-xs text-green-400 mt-2"><i class="fas fa-check mr-1"></i>Completed</div>':''}
        </div>`).join('')}</div>`
    }
  } catch (e) { notify(e.message, 'error') }
}

function showApiKeySetup() {
  showModal(`
    <div class="modal-box" style="max-width:480px">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-white flex items-center gap-2"><i class="fas fa-key text-yellow-400"></i> OpenAI API Key</h2>
        <button onclick="closeModal()" class="text-gray-500 hover:text-white"><i class="fas fa-times"></i></button>
      </div>
      <p class="text-gray-400 text-sm mb-4">Your API key is stored locally in your browser and never sent to our servers.</p>
      <div class="mb-4">
        <label class="form-label">API Key</label>
        <input id="api-key-input" type="password" class="form-input" placeholder="sk-..." value="${STATE.apiKey}">
      </div>
      <p class="text-xs text-gray-500 mb-6">Get your API key at <a href="https://platform.openai.com/api-keys" target="_blank" class="text-indigo-400 hover:underline">platform.openai.com/api-keys</a></p>
      <div class="flex gap-3">
        <button onclick="closeModal()" class="btn-secondary flex-1">Cancel</button>
        <button onclick="saveApiKey()" class="btn-primary flex-1 justify-center"><i class="fas fa-save"></i> Save Key</button>
      </div>
    </div>`)
}

function saveApiKey() {
  const key = document.getElementById('api-key-input')?.value?.trim()
  if (!key) return notify('Please enter a valid API key', 'error')
  STATE.apiKey = key
  localStorage.setItem('openai_key', key)
  closeModal()
  notify('API key saved! AI features are now enabled. 🤖', 'success')
  renderAI()
  const indicator = document.getElementById('ai-key-indicator')
  if (indicator) {
    indicator.className = 'hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-green-900/30 text-green-400 border border-green-800'
    indicator.innerHTML = '<i class="fas fa-check-circle"></i> AI Ready'
  }
}
