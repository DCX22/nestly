import { Router } from 'express'
import { pool } from '../db'
import { requireAuth, requireAdmin } from '../middleware/auth'
import { sendInviteEmail } from '../lib/email'

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

  const householdRes = await pool.query(
    'SELECT name FROM households WHERE id = $1',
    [householdId],
  )
  const householdName = householdRes.rows[0]?.name ?? 'your household'

  const { rows } = await pool.query(
    `INSERT INTO household_invites (household_id, email)
     VALUES ($1, $2) RETURNING *`,
    [householdId, email.trim().toLowerCase()],
  )
  const invite = rows[0]

  // Send invite email (non-blocking — don't fail the request if email fails)
  sendInviteEmail(invite.email, invite.invite_token, householdName).catch((err: Error) => {
    console.error('Failed to send invite email:', err.message, err)
  })

  res.status(201).json(invite)
})

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM household_invites WHERE id = $1', [req.params.id])
  res.status(204).send()
})

export default router
