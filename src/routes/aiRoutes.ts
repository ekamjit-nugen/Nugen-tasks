import { Hono } from 'hono'
import { Env, getAllProjects, findProjectByName, createProject, createTask, createSubtask, logAIPrompt, getAIPromptHistory } from '../db/queries'

const ai = new Hono<{ Bindings: Env }>()

async function callOpenAI(apiKey: string, messages: any[], model = 'gpt-4o-mini'): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 2000 })
  })
  const data = await response.json() as any
  if (!response.ok) throw new Error(data.error?.message || 'OpenAI API error')
  return data.choices[0].message.content
}

// AI: Convert prompt to projects/tasks/subtasks
ai.post('/generate-tasks', async (c) => {
  try {
    const { prompt, userId, apiKey: clientKey } = await c.req.json()
    const apiKey = c.env.OPENAI_API_KEY || clientKey
    if (!apiKey) return c.json({ error: 'OpenAI API key not configured' }, 400)

    // Get existing projects context
    const existingProjects = await getAllProjects(c.env.DB)
    const projectsContext = (existingProjects.results as any[]).map((p: any) =>
      `Project: "${p.name}" (ID: ${p.id}, Status: ${p.status})`
    ).join('\n')

    const systemPrompt = `You are a project management AI assistant. You help create structured project plans.

EXISTING PROJECTS IN THE SYSTEM:
${projectsContext || 'No existing projects'}

RULES:
1. If the user's request matches an existing project (by name similarity), add tasks to that project instead of creating a new one
2. Generate appropriate tasks and subtasks based on the context (IT, HR, Finance, Design, etc.)
3. Be smart about team roles: developers get coding tasks, designers get UI tasks, managers get planning tasks, HR gets people tasks, finance gets invoice/budget tasks
4. Return ONLY valid JSON, no markdown

Return this JSON structure:
{
  "action": "create_new" | "add_to_existing",
  "project": {
    "id": null (or existing project ID if adding to existing),
    "name": "Project Name",
    "description": "Description",
    "category": "it|design|hr|finance|marketing|general",
    "priority": "low|medium|high|critical",
    "color": "#hexcolor"
  },
  "tasks": [
    {
      "title": "Task Title",
      "description": "Task description",
      "priority": "low|medium|high|critical",
      "status": "todo",
      "estimated_hours": number,
      "tags": "tag1,tag2",
      "subtasks": [
        {"title": "Subtask title", "description": "..."}
      ]
    }
  ]
}`

    const response = await callOpenAI(apiKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ])

    let plan: any
    try {
      plan = JSON.parse(response)
    } catch {
      const match = response.match(/\{[\s\S]*\}/)
      if (match) plan = JSON.parse(match[0])
      else return c.json({ error: 'Failed to parse AI response' }, 500)
    }

    // Execute the plan
    const results: any = { project_id: null, tasks: [], message: '' }

    if (plan.action === 'add_to_existing' && plan.project.id) {
      results.project_id = plan.project.id
      results.message = `Adding tasks to existing project: ${plan.project.name}`
    } else {
      // Check if project with same name exists
      const existing = await findProjectByName(c.env.DB, plan.project.name)
      if (existing) {
        results.project_id = (existing as any).id
        results.message = `Adding tasks to existing project: ${plan.project.name}`
      } else {
        const proj = await createProject(c.env.DB, {
          ...plan.project,
          owner_id: userId || 1
        })
        results.project_id = proj.meta.last_row_id
        results.message = `Created new project: ${plan.project.name}`
      }
    }

    // Create tasks
    for (const task of plan.tasks || []) {
      const t = await createTask(c.env.DB, {
        ...task,
        project_id: results.project_id,
        reporter_id: userId || 1
      })
      const taskId = t.meta.last_row_id
      const subtaskResults = []
      for (const st of task.subtasks || []) {
        const s = await createSubtask(c.env.DB, { ...st, task_id: taskId })
        subtaskResults.push({ id: s.meta.last_row_id, title: st.title })
      }
      results.tasks.push({ id: taskId, title: task.title, subtasks: subtaskResults })
    }

    await logAIPrompt(c.env.DB, {
      user_id: userId || 1, prompt, module: 'tasks',
      result: JSON.stringify(results), status: 'completed'
    })

    return c.json({ success: true, plan, results })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// AI: Generate Resume
ai.post('/generate-resume', async (c) => {
  try {
    const { userData, jobTitle, experience, skills, education, userId, apiKey: clientKey } = await c.req.json()
    const apiKey = c.env.OPENAI_API_KEY || clientKey
    if (!apiKey) return c.json({ error: 'OpenAI API key not configured' }, 400)

    const prompt = `Create a professional resume for the following person:
Name: ${userData?.name || 'Professional'}
Job Title: ${jobTitle}
Experience: ${experience}
Skills: ${skills}
Education: ${education}

Return a JSON object with this structure:
{
  "personal": { "name": "", "title": "", "email": "", "phone": "", "location": "", "linkedin": "", "summary": "" },
  "experience": [{ "company": "", "role": "", "period": "", "description": "", "achievements": [""] }],
  "education": [{ "institution": "", "degree": "", "field": "", "year": "" }],
  "skills": { "technical": [""], "soft": [""], "languages": [""] },
  "certifications": [{ "name": "", "issuer": "", "year": "" }],
  "projects": [{ "name": "", "description": "", "technologies": [""] }]
}`

    const response = await callOpenAI(apiKey, [
      { role: 'system', content: 'You are a professional resume writer. Return ONLY valid JSON.' },
      { role: 'user', content: prompt }
    ])

    let resumeData: any
    try {
      resumeData = JSON.parse(response)
    } catch {
      const match = response.match(/\{[\s\S]*\}/)
      resumeData = match ? JSON.parse(match[0]) : {}
    }

    await logAIPrompt(c.env.DB, {
      user_id: userId || 1,
      prompt: `Resume: ${jobTitle}`, module: 'resume',
      result: JSON.stringify(resumeData), status: 'completed'
    })

    return c.json({ success: true, resumeData })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// AI: Generate Invoice
ai.post('/generate-invoice', async (c) => {
  try {
    const { description, clientInfo, userId, apiKey: clientKey } = await c.req.json()
    const apiKey = c.env.OPENAI_API_KEY || clientKey
    if (!apiKey) return c.json({ error: 'OpenAI API key not configured' }, 400)

    const prompt = `Create invoice line items for: "${description}"
Client: ${clientInfo || 'Client'}

Return JSON with structure:
{
  "items": [{ "description": "", "quantity": 1, "unit_price": 0, "amount": 0 }],
  "notes": "",
  "payment_terms": ""
}`

    const response = await callOpenAI(apiKey, [
      { role: 'system', content: 'You are an invoice generator. Return ONLY valid JSON.' },
      { role: 'user', content: prompt }
    ])

    let invoiceData: any
    try {
      invoiceData = JSON.parse(response)
    } catch {
      const match = response.match(/\{[\s\S]*\}/)
      invoiceData = match ? JSON.parse(match[0]) : {}
    }

    return c.json({ success: true, invoiceData })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// AI Prompt History
ai.get('/history/:userId', async (c) => {
  try {
    const result = await getAIPromptHistory(c.env.DB, parseInt(c.req.param('userId')))
    return c.json(result.results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default ai
