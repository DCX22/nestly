export type SystemRole = 'admin' | 'member'

export interface ShoppingItem {
  id: string
  household_id: string
  title: string
  quantity: string | null
  is_complete: boolean
  created_at: string
}

export interface Recipe {
  id: string
  household_id: string
  title: string
  servings: number | null
  source_url: string | null
  ingredients: string | null
  method: string | null
  notes: string | null
  created_at: string
}

export interface MealPlanEntry {
  id: string
  household_id: string
  meal_date: string
  meal_type: string
  recipe_id: string | null
  recipe_title: string | null
  created_at: string
}

export interface TodoItem {
  id: string
  household_id: string
  title: string
  notes: string | null
  due_date: string | null
  recurrence: string
  is_complete: boolean
  created_at: string
}

export interface Member {
  id: string
  household_id: string
  user_id: string
  member_email: string
  role: string
}

export interface Membership {
  household_id: string
  member_email: string
  households: { name: string } | Array<{ name: string }>
}

export interface HouseholdSummary {
  id: string
  name: string
  created_at?: string
}

export interface Invite {
  id: string
  household_id: string
  email: string
  invite_token: string
  expires_at: string | null
  accepted_at: string | null
}
