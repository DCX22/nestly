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
  try {
    if (!await assertMember(req.auth.userId, householdId)) {
      res.status(403).json({ message: 'Access denied' }); return
    }
    const { rows } = await pool.query(
      `SELECT *, to_char(meal_date, 'YYYY-MM-DD') AS meal_date
       FROM meal_plan_entries WHERE household_id = $1 ORDER BY meal_date ASC`,
      [householdId],
    )
    res.json(rows)
  } catch (err) {
    console.error('GET /meals error:', err)
    res.status(500).json({ message: 'Failed to load meal plan' })
  }
})

router.put('/', async (req, res) => {
  const { householdId, meal_date, meal_type, recipe_id, recipe_title } = req.body as {
    householdId: string; meal_date: string; meal_type: string
    recipe_id?: string; recipe_title?: string
  }
  try {
    if (!await assertMember(req.auth.userId, householdId)) {
      res.status(403).json({ message: 'Access denied' }); return
    }
    const { rows } = await pool.query(
      `INSERT INTO meal_plan_entries (household_id, meal_date, meal_type, recipe_id, recipe_title)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (household_id, meal_date, meal_type)
       DO UPDATE SET recipe_id = EXCLUDED.recipe_id, recipe_title = EXCLUDED.recipe_title
       RETURNING *`,
      [householdId, meal_date, meal_type, recipe_id ?? null, recipe_title ?? null],
    )
    res.json(rows[0])
  } catch (err) {
    console.error('PUT /meals error:', err)
    res.status(500).json({ message: 'Failed to save meal' })
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const existing = await pool.query('SELECT household_id FROM meal_plan_entries WHERE id = $1', [id])
    if (!existing.rows[0] || !await assertMember(req.auth.userId, existing.rows[0].household_id)) {
      res.status(403).json({ message: 'Access denied' }); return
    }
    await pool.query('DELETE FROM meal_plan_entries WHERE id = $1', [id])
    res.status(204).send()
  } catch (err) {
    console.error('DELETE /meals error:', err)
    res.status(500).json({ message: 'Failed to delete meal' })
  }
})

export default router
