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
    `SELECT * FROM shopping_items WHERE household_id = $1
     ORDER BY is_complete ASC, created_at DESC`,
    [householdId],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { householdId, title, quantity } = req.body as {
    householdId: string; title: string; quantity?: string
  }
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `INSERT INTO shopping_items (household_id, title, quantity)
     VALUES ($1, $2, $3) RETURNING *`,
    [householdId, title.trim(), quantity?.trim() || null],
  )
  res.status(201).json(rows[0])
})

router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { is_complete } = req.body as { is_complete: boolean }
  const item = await pool.query('SELECT household_id FROM shopping_items WHERE id = $1', [id])
  if (!item.rows[0] || !await assertMember(req.auth.userId, item.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    'UPDATE shopping_items SET is_complete = $1 WHERE id = $2 RETURNING *',
    [is_complete, id],
  )
  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const item = await pool.query('SELECT household_id FROM shopping_items WHERE id = $1', [id])
  if (!item.rows[0] || !await assertMember(req.auth.userId, item.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  await pool.query('DELETE FROM shopping_items WHERE id = $1', [id])
  res.status(204).send()
})

router.delete('/', async (req, res) => {
  const { householdId } = req.query as { householdId: string }
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  await pool.query(
    'DELETE FROM shopping_items WHERE household_id = $1 AND is_complete = TRUE',
    [householdId],
  )
  res.status(204).send()
})

export default router
