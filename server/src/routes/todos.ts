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
    `SELECT t.*, u.email AS assigned_email
     FROM todos t
     LEFT JOIN users u ON u.id = t.assigned_to
     WHERE t.household_id = $1
     ORDER BY t.is_complete ASC, t.due_date ASC NULLS LAST, t.created_at ASC`,
    [householdId],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { householdId, title, recurrence, notes, due_date, assigned_to } = req.body as {
    householdId: string; title: string; recurrence: string
    notes?: string; due_date?: string; assigned_to?: string
  }
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `INSERT INTO todos (household_id, title, recurrence, notes, due_date, assigned_to)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [householdId, title.trim(), recurrence ?? 'none', notes ?? null, due_date ?? null, assigned_to ?? null],
  )
  res.status(201).json(rows[0])
})

router.patch('/:id/assign', async (req, res) => {
  const { id } = req.params
  const { assigned_to } = req.body as { assigned_to: string | null }
  const existing = await pool.query('SELECT household_id FROM todos WHERE id = $1', [id])
  if (!existing.rows[0] || !await assertMember(req.auth.userId, existing.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `UPDATE todos SET assigned_to = $1 WHERE id = $2
     RETURNING *, (SELECT email FROM users WHERE id = $1) AS assigned_email`,
    [assigned_to ?? null, id],
  )
  res.json(rows[0])
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
     WHERE household_id = $1 AND recurrence IN ('weekly', 'chore') AND is_complete = TRUE`,
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
