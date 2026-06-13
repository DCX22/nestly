import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/', requireAdmin, async (req, res) => {
  const { householdId } = req.query as { householdId: string }
  const { rows } = await pool.query(
    `SELECT id, household_id, email, invite_token, expires_at, accepted_at
     FROM household_invites
     WHERE household_id = $1 AND accepted_at IS NULL
     ORDER BY created_at DESC`,
    [householdId],
  )
  res.json(rows)
})

router.post('/', requireAdmin, async (req, res) => {
  const { householdId, email } = req.body as { householdId: string; email: string }
  if (!householdId || !email?.trim()) {
    res.status(400).json({ message: 'householdId and email required' }); return
  }
  const { rows } = await pool.query(
    `INSERT INTO household_invites (household_id, email)
     VALUES ($1, $2) RETURNING *`,
    [householdId, email.trim().toLowerCase()],
  )
  res.status(201).json(rows[0])
})

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM household_invites WHERE id = $1', [req.params.id])
  res.status(204).send()
})

export default router
