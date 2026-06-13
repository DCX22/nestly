import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db'
import { requireAuth, signToken } from '../middleware/auth'

const router = Router()

router.post('/signin', async (req, res) => {
  const { email, password } = req.body as { email: string; password: string }
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' })
    return
  }

  const { rows } = await pool.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email.toLowerCase().trim()],
  )

  const user = rows[0]
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ message: 'Invalid email or password' })
    return
  }

  const roleRow = await pool.query(
    'SELECT system_role FROM user_roles WHERE user_id = $1',
    [user.id],
  )
  const systemRole = roleRow.rows[0]?.system_role ?? 'member'

  const token = signToken({ userId: user.id, email: user.email, systemRole })
  res.json({ token, userId: user.id, email: user.email, systemRole })
})

router.post('/signup', async (req, res) => {
  const { email, password, inviteToken } = req.body as {
    email: string
    password: string
    inviteToken: string
  }

  if (!email || !password || !inviteToken) {
    res.status(400).json({ message: 'Email, password and invite token required' })
    return
  }

  const inviteRes = await pool.query(
    `SELECT id, household_id FROM household_invites
     WHERE invite_token = $1
       AND (email = $2 OR email IS NULL)
       AND accepted_at IS NULL
       AND (expires_at IS NULL OR expires_at > NOW())`,
    [inviteToken, email.toLowerCase().trim()],
  )

  if (inviteRes.rows.length === 0) {
    res.status(400).json({ message: 'Invalid or expired invite token' })
    return
  }

  const invite = inviteRes.rows[0]

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [
    email.toLowerCase().trim(),
  ])

  let userId: string

  if (existing.rows.length > 0) {
    userId = existing.rows[0].id
  } else {
    const hash = await bcrypt.hash(password, 12)
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email.toLowerCase().trim(), hash],
    )
    userId = newUser.rows[0].id
    await pool.query(
      'INSERT INTO user_roles (user_id, system_role) VALUES ($1, $2)',
      [userId, 'member'],
    )
  }

  await pool.query(
    `INSERT INTO household_members (household_id, user_id, member_email)
     VALUES ($1, $2, $3)
     ON CONFLICT (household_id, user_id) DO NOTHING`,
    [invite.household_id, userId, email.toLowerCase().trim()],
  )

  await pool.query(
    'UPDATE household_invites SET accepted_at = NOW() WHERE id = $1',
    [invite.id],
  )

  const roleRow = await pool.query(
    'SELECT system_role FROM user_roles WHERE user_id = $1',
    [userId],
  )
  const systemRole = roleRow.rows[0]?.system_role ?? 'member'

  const token = signToken({ userId, email: email.toLowerCase().trim(), systemRole })
  res.json({ token, userId, email: email.toLowerCase().trim(), systemRole })
})

router.get('/session', requireAuth, async (req, res) => {
  res.json({
    userId: req.auth.userId,
    email: req.auth.email,
    systemRole: req.auth.systemRole,
  })
})

export default router
