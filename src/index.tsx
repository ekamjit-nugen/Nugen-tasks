import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import auth from './routes/auth'
import api from './routes/api'
import aiRoutes from './routes/aiRoutes'
import attendanceRoutes from './routes/attendance'
import resumeRoutes from './routes/resume'
import invoiceRoutes from './routes/invoices'

type Bindings = {
  DB: D1Database
  OPENAI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true
}))

// API Routes
app.route('/api/auth', auth)
app.route('/api', api)
app.route('/api/ai', aiRoutes)
app.route('/api/attendance', attendanceRoutes)
app.route('/api/resumes', resumeRoutes)
app.route('/api/invoices', invoiceRoutes)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Static files
app.use('/static/*', serveStatic({ root: './' }))

// Serve the main SPA
app.get('*', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TaskFlow Pro – AI-Powered Workspace</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css">
  <link rel="stylesheet" href="/static/styles.css">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
            accent: { 400:'#fb923c',500:'#f97316',600:'#ea580c' }
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen">
  <div id="app"></div>
  <script src="/static/app.js"></script>
  <script src="/static/dashboard.js"></script>
  <script src="/static/tasks.js"></script>
  <script src="/static/ai.js"></script>
  <script src="/static/modules.js"></script>
  <script src="/static/team.js"></script>
</body>
</html>`)
})

export default app
