import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', requireAdmin, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, name, created_at FROM households ORDER BY created_at ASC',
  )
  res.json(rows)
})

router.post('/', requireAdmin, async (req, res) => {
  const { name } = req.body as { name: string }
  if (!name?.trim()) {
    res.status(400).json({ message: 'Name required' }); return
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hRes = await client.query(
      'INSERT INTO households (name) VALUES ($1) RETURNING *',
      [name.trim()],
    )
    const household = hRes.rows[0]
    const userRes = await client.query('SELECT email FROM users WHERE id = $1', [req.auth.userId])
    await client.query(
      `INSERT INTO household_members (household_id, user_id, member_email, role)
       VALUES ($1, $2, $3, 'admin')`,
      [household.id, req.auth.userId, userRes.rows[0]?.email ?? ''],
    )
    await client.query('COMMIT')
    res.status(201).json(household)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM households WHERE id = $1', [req.params.id])
  res.status(204).send()
})

export default router
