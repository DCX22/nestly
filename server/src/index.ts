import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

import { sendTestEmail } from './lib/email'
import authRoutes from './routes/auth'
import shoppingRoutes from './routes/shopping'
import recipesRoutes from './routes/recipes'
import mealsRoutes from './routes/meals'
import todosRoutes from './routes/todos'
import membersRoutes from './routes/members'
import householdsRoutes from './routes/households'
import invitesRoutes from './routes/invites'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3002
const isProd = process.env.NODE_ENV === 'production'

if (!isProd) {
  app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
}
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/shopping', shoppingRoutes)
app.use('/api/recipes', recipesRoutes)
app.use('/api/meals', mealsRoutes)
app.use('/api/todos', todosRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/households', householdsRoutes)
app.use('/api/invites', invitesRoutes)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/test-email', async (req, res) => {
  const { to } = req.body as { to?: string }
  if (!to) { res.status(400).json({ error: 'to is required' }); return }
  try {
    await sendTestEmail(to)
    res.json({ ok: true, message: `Test email sent to ${to}` })
  } catch (err) {
    res.status(500).json({ error: (err as Error).message })
  }
})

// Serve built frontend in production
if (isProd) {
  const distPath = path.resolve(process.cwd(), 'public')
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }
}

app.listen(PORT, () => {
  console.log(`Nestly API listening on http://localhost:${PORT}`)
})
