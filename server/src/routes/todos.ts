import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

async function assertMember(userId: string, householdId: string): Promise<boolean> {
  const { rows } = await pool.query(
    'SELECT 1 FROM household_members WHERE user_id = $1 AND household_id = $2',
    [userId, householdId],
  )
  return rows.length > 0
}

router.get('/', async (req, res) => {
  const { householdId } = req.query as { householdId: string }
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `SELECT * FROM todos WHERE household_id = $1
     ORDER BY is_complete ASC, due_date ASC NULLS LAST, created_at ASC`,
    [householdId],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { householdId, title, recurrence, notes, due_date } = req.body as {
    householdId: string; title: string; recurrence: string
    notes?: string; due_date?: string
  }
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `INSERT INTO todos (household_id, title, recurrence, notes, due_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [householdId, title.trim(), recurrence ?? 'none', notes ?? null, due_date ?? null],
  )
  res.status(201).json(rows[0])
})

router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { is_complete } = req.body as { is_complete: boolean }
  const existing = await pool.query('SELECT household_id FROM todos WHERE id = $1', [id])
  if (!existing.rows[0] || !await assertMember(req.auth.userId, existing.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    'UPDATE todos SET is_complete = $1 WHERE id = $2 RETURNING *',
    [is_complete, id],
  )
  res.json(rows[0])
})

router.patch('/reset-weekly/:householdId', async (req, res) => {
  const { householdId } = req.params
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  await pool.query(
    `UPDATE todos SET is_complete = FALSE
     WHERE household_id = $1 AND recurrence = 'weekly' AND is_complete = TRUE`,
    [householdId],
  )
  res.status(204).send()
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const existing = await pool.query('SELECT household_id FROM todos WHERE id = $1', [id])
  if (!existing.rows[0] || !await assertMember(req.auth.userId, existing.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  await pool.query('DELETE FROM todos WHERE id = $1', [id])
  res.status(204).send()
})

export default router
