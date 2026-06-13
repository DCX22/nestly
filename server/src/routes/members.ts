import { Router } from 'express'
import { pool } from '../db'
import { requireAuth } from '../middleware/auth'

const router = Router()
router.use(requireAuth)

router.get('/memberships', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT hm.household_id, hm.member_email, h.name AS household_name
     FROM household_members hm
     JOIN households h ON h.id = hm.household_id
     WHERE hm.user_id = $1
     ORDER BY hm.created_at ASC`,
    [req.auth.userId],
  )
  const memberships = rows.map((r) => ({
    household_id: r.household_id,
    member_email: r.member_email,
    households: { name: r.household_name },
  }))
  res.json(memberships)
})

router.get('/', async (req, res) => {
  const { householdId } = req.query as { householdId: string }
  const isMember = await pool.query(
    'SELECT 1 FROM household_members WHERE user_id = $1 AND household_id = $2',
    [req.auth.userId, householdId],
  )
  const isAdmin = req.auth.systemRole === 'admin'
  if (!isMember.rows.length && !isAdmin) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `SELECT id, household_id, user_id, member_email, role
     FROM household_members WHERE household_id = $1 ORDER BY created_at ASC`,
    [householdId],
  )
  res.json(rows)
})

router.delete('/:id', async (req, res) => {
  if (req.auth.systemRole !== 'admin') {
    res.status(403).json({ message: 'Admin access required' }); return
  }
  await pool.query('DELETE FROM household_members WHERE id = $1', [req.params.id])
  res.status(204).send()
})

export default router
