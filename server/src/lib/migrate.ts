import { pool } from '../db'

const migrations = [
  `ALTER TABLE todos ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL`,
]

export async function runMigrations(): Promise<void> {
  for (const sql of migrations) {
    await pool.query(sql)
  }
  console.log(`Migrations complete (${migrations.length} ran)`)
}
