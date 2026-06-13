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
    'SELECT * FROM recipes WHERE household_id = $1 ORDER BY created_at DESC',
    [householdId],
  )
  res.json(rows)
})

router.post('/', async (req, res) => {
  const { householdId, title, servings, source_url, ingredients, method, notes } = req.body as {
    householdId: string; title: string; servings?: number
    source_url?: string; ingredients?: string; method?: string; notes?: string
  }
  if (!await assertMember(req.auth.userId, householdId)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `INSERT INTO recipes (household_id, title, servings, source_url, ingredients, method, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [householdId, title.trim(), servings ?? null, source_url ?? null,
     ingredients ?? null, method ?? null, notes ?? null],
  )
  res.status(201).json(rows[0])
})

router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { title, servings, source_url, ingredients, method, notes } = req.body as {
    title?: string; servings?: number; source_url?: string
    ingredients?: string; method?: string; notes?: string
  }
  const existing = await pool.query('SELECT household_id FROM recipes WHERE id = $1', [id])
  if (!existing.rows[0] || !await assertMember(req.auth.userId, existing.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  const { rows } = await pool.query(
    `UPDATE recipes SET
       title = COALESCE($1, title),
       servings = $2,
       source_url = $3,
       ingredients = $4,
       method = $5,
       notes = $6
     WHERE id = $7 RETURNING *`,
    [title?.trim() ?? null, servings ?? null, source_url ?? null,
     ingredients ?? null, method ?? null, notes ?? null, id],
  )
  res.json(rows[0])
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  const existing = await pool.query('SELECT household_id FROM recipes WHERE id = $1', [id])
  if (!existing.rows[0] || !await assertMember(req.auth.userId, existing.rows[0].household_id)) {
    res.status(403).json({ message: 'Access denied' }); return
  }
  await pool.query('DELETE FROM recipes WHERE id = $1', [id])
  res.status(204).send()
})

export default router
