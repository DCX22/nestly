import type {
  HouseholdSummary,
  Invite,
  MealPlanEntry,
  Member,
  Membership,
  Recipe,
  ShoppingItem,
  SystemRole,
  TodoItem,
} from '../types'

const BASE = '/api'

function getToken(): string | null {
  return localStorage.getItem('nestly-token')
}

function setToken(token: string): void {
  localStorage.setItem('nestly-token', token)
}

function clearToken(): void {
  localStorage.removeItem('nestly-token')
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as unknown as T

  const data = await res.json()
  if (!res.ok) throw new Error(data.message ?? 'Request failed')
  return data as T
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SessionUser {
  userId: string
  email: string
  systemRole: SystemRole
}

export const auth = {
  async getSession(): Promise<SessionUser | null> {
    if (!getToken()) return null
    try {
      return await request<SessionUser>('GET', '/auth/session')
    } catch {
      clearToken()
      return null
    }
  },

  async signIn(email: string, password: string): Promise<SessionUser> {
    const data = await request<SessionUser & { token: string }>(
      'POST', '/auth/signin', { email, password },
    )
    setToken(data.token)
    return { userId: data.userId, email: data.email, systemRole: data.systemRole }
  },

  async signUp(email: string, password: string, inviteToken: string): Promise<SessionUser> {
    const data = await request<SessionUser & { token: string }>(
      'POST', '/auth/signup', { email, password, inviteToken },
    )
    setToken(data.token)
    return { userId: data.userId, email: data.email, systemRole: data.systemRole }
  },

  signOut(): void {
    clearToken()
  },
}

// ── Memberships ───────────────────────────────────────────────────────────────

export async function getMemberships(): Promise<Membership[]> {
  return request<Membership[]>('GET', '/members/memberships')
}

// ── Shopping ──────────────────────────────────────────────────────────────────

export async function getShoppingItems(householdId: string): Promise<ShoppingItem[]> {
  return request<ShoppingItem[]>('GET', `/shopping?householdId=${householdId}`)
}

export async function addShoppingItem(
  householdId: string, title: string, quantity?: string,
): Promise<ShoppingItem> {
  return request<ShoppingItem>('POST', '/shopping', { householdId, title, quantity })
}

export async function toggleShoppingItem(id: string, is_complete: boolean): Promise<ShoppingItem> {
  return request<ShoppingItem>('PATCH', `/shopping/${id}`, { is_complete })
}

export async function deleteShoppingItem(id: string): Promise<void> {
  return request<void>('DELETE', `/shopping/${id}`)
}

export async function clearCompletedItems(householdId: string): Promise<void> {
  return request<void>('DELETE', `/shopping?householdId=${householdId}`)
}

// ── Recipes ───────────────────────────────────────────────────────────────────

export async function getRecipes(householdId: string): Promise<Recipe[]> {
  return request<Recipe[]>('GET', `/recipes?householdId=${householdId}`)
}

export async function addRecipe(data: {
  householdId: string; title: string; servings?: number | null
  source_url?: string | null; ingredients?: string | null
  method?: string | null; notes?: string | null
}): Promise<Recipe> {
  return request<Recipe>('POST', '/recipes', data)
}

export async function updateRecipe(id: string, data: {
  title?: string; servings?: number | null; source_url?: string | null
  ingredients?: string | null; method?: string | null; notes?: string | null
}): Promise<Recipe> {
  return request<Recipe>('PATCH', `/recipes/${id}`, data)
}

export async function deleteRecipe(id: string): Promise<void> {
  return request<void>('DELETE', `/recipes/${id}`)
}

// ── Meal Plan ─────────────────────────────────────────────────────────────────

export async function getMealPlan(householdId: string): Promise<MealPlanEntry[]> {
  return request<MealPlanEntry[]>('GET', `/meals?householdId=${householdId}`)
}

export async function upsertMealEntry(data: {
  householdId: string; meal_date: string; meal_type: string
  recipe_id?: string | null; recipe_title?: string | null
}): Promise<MealPlanEntry> {
  return request<MealPlanEntry>('PUT', '/meals', data)
}

export async function deleteMealEntry(id: string): Promise<void> {
  return request<void>('DELETE', `/meals/${id}`)
}

// ── Todos ─────────────────────────────────────────────────────────────────────

export async function getTodos(householdId: string): Promise<TodoItem[]> {
  return request<TodoItem[]>('GET', `/todos?householdId=${householdId}`)
}

export async function addTodo(data: {
  householdId: string; title: string; recurrence: string
  notes?: string | null; due_date?: string | null; assigned_to?: string | null
}): Promise<TodoItem> {
  return request<TodoItem>('POST', '/todos', data)
}

export async function assignTodo(id: string, assigned_to: string | null): Promise<TodoItem> {
  return request<TodoItem>('PATCH', `/todos/${id}/assign`, { assigned_to })
}

export async function toggleTodo(id: string, is_complete: boolean): Promise<TodoItem> {
  return request<TodoItem>('PATCH', `/todos/${id}`, { is_complete })
}

export async function deleteTodo(id: string): Promise<void> {
  return request<void>('DELETE', `/todos/${id}`)
}

export async function resetWeeklyTodos(householdId: string): Promise<void> {
  return request<void>('PATCH', `/todos/reset-weekly/${householdId}`)
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function getMembers(householdId: string): Promise<Member[]> {
  return request<Member[]>('GET', `/members?householdId=${householdId}`)
}

export async function removeMember(id: string): Promise<void> {
  return request<void>('DELETE', `/members/${id}`)
}

// ── Households (admin) ────────────────────────────────────────────────────────

export async function getHouseholds(): Promise<HouseholdSummary[]> {
  return request<HouseholdSummary[]>('GET', '/households')
}

export async function createHousehold(name: string): Promise<HouseholdSummary> {
  return request<HouseholdSummary>('POST', '/households', { name })
}

export async function deleteHousehold(id: string): Promise<void> {
  return request<void>('DELETE', `/households/${id}`)
}

// ── Invites (admin) ───────────────────────────────────────────────────────────

export async function getInvites(householdId: string): Promise<Invite[]> {
  return request<Invite[]>('GET', `/invites?householdId=${householdId}`)
}

export async function createInvite(householdId: string, email: string): Promise<Invite> {
  return request<Invite>('POST', '/invites', { householdId, email })
}

export async function cancelInvite(id: string): Promise<void> {
  return request<void>('DELETE', `/invites/${id}`)
}
