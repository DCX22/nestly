import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import dayjs from 'dayjs'
import * as api from './lib/api'
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
} from './types'

const mealTypes = ['breakfast', 'lunch', 'dinner'] as const

type Tab = 'shopping' | 'recipes' | 'meal-plan' | 'todos' | 'group' | 'admin-suite'
type ThemeMode = 'system' | 'light' | 'dark'
type ColourTheme = 'default' | 'ocean' | 'forest' | 'sunset' | 'rose' | 'slate' | 'candy'

const DEMO_HOUSEHOLD_ID = 'demo-household'

function scaleIngredients(text: string, factor: number): string {
  if (Math.abs(factor - 1) < 0.001) return text
  return text.replace(/\d+(\.\d+)?/g, (match) => {
    const scaled = parseFloat(match) * factor
    const rounded = Math.round(scaled * 10) / 10
    return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded)
  })
}

function makeDemoData() {
  const today = dayjs()
  const monday = today.startOf('week').add(1, 'day')
  const fmt = (d: ReturnType<typeof dayjs>) => d.format('YYYY-MM-DD')

  const shopping: ShoppingItem[] = [
    { id: 's1', household_id: DEMO_HOUSEHOLD_ID, title: 'Whole milk', quantity: '2L', is_complete: false, created_at: '' },
    { id: 's2', household_id: DEMO_HOUSEHOLD_ID, title: 'Sourdough bread', quantity: null, is_complete: false, created_at: '' },
    { id: 's3', household_id: DEMO_HOUSEHOLD_ID, title: 'Cheddar cheese', quantity: '400g', is_complete: false, created_at: '' },
    { id: 's4', household_id: DEMO_HOUSEHOLD_ID, title: 'Free-range eggs', quantity: '12 pack', is_complete: true, created_at: '' },
    { id: 's5', household_id: DEMO_HOUSEHOLD_ID, title: 'Unsalted butter', quantity: '250g', is_complete: true, created_at: '' },
    { id: 's6', household_id: DEMO_HOUSEHOLD_ID, title: 'Pasta (penne)', quantity: '500g', is_complete: false, created_at: '' },
  ]

  const recipes: Recipe[] = [
    {
      id: 'r1', household_id: DEMO_HOUSEHOLD_ID, title: 'Spaghetti Bolognese',
      servings: 4, source_url: null,
      ingredients: '500g beef mince\n1 onion, diced\n2 garlic cloves\n400g chopped tomatoes\n2 tbsp tomato puree\n1 tsp dried oregano\nSalt & pepper',
      method: '1. Fry onion until soft.\n2. Add garlic and mince, cook until browned.\n3. Add tomatoes, puree and oregano.\n4. Simmer 20 mins. Serve over spaghetti.',
      notes: null, created_at: '',
    },
    {
      id: 'r2', household_id: DEMO_HOUSEHOLD_ID, title: 'Chicken Tikka Masala',
      servings: 4, source_url: null,
      ingredients: '600g chicken breast, cubed\n1 onion\n400ml coconut milk\n3 tbsp tikka paste\n400g chopped tomatoes\nFresh coriander',
      method: '1. Marinate chicken in tikka paste 30 mins.\n2. Cook chicken until charred.\n3. Fry onion, add tomatoes and coconut milk.\n4. Add chicken, simmer 15 mins.',
      notes: null, created_at: '',
    },
    {
      id: 'r3', household_id: DEMO_HOUSEHOLD_ID, title: 'Avocado Toast',
      servings: 2, source_url: null,
      ingredients: '2 slices sourdough\n1 ripe avocado\nJuice of half a lemon\nChilli flakes\nSalt & pepper\n2 poached eggs (optional)',
      method: '1. Toast bread.\n2. Mash avocado with lemon juice, season.\n3. Spread on toast, top with chilli flakes and eggs.',
      notes: null, created_at: '',
    },
  ]

  const mealPlan: MealPlanEntry[] = [
    { id: 'm1', household_id: DEMO_HOUSEHOLD_ID, meal_date: fmt(monday), meal_type: 'dinner', recipe_id: 'r1', recipe_title: 'Spaghetti Bolognese', created_at: '' },
    { id: 'm2', household_id: DEMO_HOUSEHOLD_ID, meal_date: fmt(monday.add(1, 'day')), meal_type: 'lunch', recipe_id: 'r3', recipe_title: 'Avocado Toast', created_at: '' },
    { id: 'm3', household_id: DEMO_HOUSEHOLD_ID, meal_date: fmt(monday.add(2, 'day')), meal_type: 'dinner', recipe_id: 'r2', recipe_title: 'Chicken Tikka Masala', created_at: '' },
    { id: 'm4', household_id: DEMO_HOUSEHOLD_ID, meal_date: fmt(monday.add(4, 'day')), meal_type: 'dinner', recipe_id: 'r1', recipe_title: 'Spaghetti Bolognese', created_at: '' },
  ]

  const todos: TodoItem[] = [
    { id: 't1', household_id: DEMO_HOUSEHOLD_ID, title: 'Hoover downstairs', notes: null, due_date: null, recurrence: 'weekly', is_complete: false, created_at: '' },
    { id: 't2', household_id: DEMO_HOUSEHOLD_ID, title: 'Clean bathroom', notes: null, due_date: null, recurrence: 'weekly', is_complete: true, created_at: '' },
    { id: 't3', household_id: DEMO_HOUSEHOLD_ID, title: 'Take bins out', notes: null, due_date: null, recurrence: 'weekly', is_complete: false, created_at: '' },
    { id: 't4', household_id: DEMO_HOUSEHOLD_ID, title: 'Book dentist appointment', notes: null, due_date: null, recurrence: 'none', is_complete: false, created_at: '' },
    { id: 't5', household_id: DEMO_HOUSEHOLD_ID, title: 'Buy birthday card for Mum', notes: null, due_date: null, recurrence: 'none', is_complete: false, created_at: '' },
  ]

  const members: Member[] = [
    { id: 'mem1', household_id: DEMO_HOUSEHOLD_ID, user_id: 'demo-user', member_email: 'demo@nestly.local', role: 'admin' },
    { id: 'mem2', household_id: DEMO_HOUSEHOLD_ID, user_id: 'demo-user-2', member_email: 'alice@nestly.local', role: 'member' },
  ]

  const memberships: Membership[] = [
    { household_id: DEMO_HOUSEHOLD_ID, member_email: 'demo@nestly.local', households: { name: 'Demo Household' } },
  ]

  return { shopping, recipes, mealPlan, todos, members, memberships }
}

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-nest">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
          <rect width="48" height="48" rx="10" fill="#1e1b4b"/>
          <path d="M10,30 A14,14 0 0,1 38,30" fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round"/>
          <path d="M14,30 A10,10 0 0,1 34,30" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round"/>
          <path d="M18,30 A6,6 0 0,1 30,30" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round"/>
          <ellipse cx="21" cy="22" rx="3" ry="2.2" fill="#c4b5fd"/>
          <ellipse cx="27" cy="22" rx="3" ry="2.2" fill="#a78bfa"/>
        </svg>
      </div>
      <p className="loading-label">Loading...</p>
    </div>
  )
}

function App() {
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [systemRole, setSystemRole] = useState<SystemRole>('member')
  const [isDemoMode, setIsDemoMode] = useState(false)

  const [memberships, setMemberships] = useState<Membership[]>([])
  const [activeHouseholdId, setActiveHouseholdId] = useState<string>('')
  const [activeTab, setActiveTab] = useState<Tab>('shopping')

  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [mealPlan, setMealPlan] = useState<MealPlanEntry[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [members, setMembers] = useState<Member[]>([])

  const [adminHouseholds, setAdminHouseholds] = useState<HouseholdSummary[]>([])
  const [adminHouseholdId, setAdminHouseholdId] = useState<string>('')
  const [adminMembers, setAdminMembers] = useState<Member[]>([])
  const [adminInvites, setAdminInvites] = useState<Invite[]>([])

  const [status, setStatus] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loadingData, setLoadingData] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = window.localStorage.getItem('theme-mode')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
    return 'system'
  })
  const [colourTheme, setColourTheme] = useState<ColourTheme>(() => {
    const stored = window.localStorage.getItem('colour-theme')
    if (stored === 'ocean' || stored === 'forest' || stored === 'sunset' || stored === 'rose' || stored === 'slate' || stored === 'candy') return stored
    return 'default'
  })

  const activeMembership = useMemo(
    () => memberships.find((m) => m.household_id === activeHouseholdId) ?? null,
    [memberships, activeHouseholdId],
  )

  const getHouseholdName = (membership: Membership | null) => {
    if (!membership?.households) return null
    if (Array.isArray(membership.households)) return membership.households[0]?.name ?? null
    return membership.households.name
  }

  const hasMembership = memberships.length > 0
  const isSystemAdmin = systemRole === 'admin'

  function enterDemoMode() {
    const data = makeDemoData()
    setIsDemoMode(true)
    setUserEmail('demo@nestly.local')
    setMemberships(data.memberships)
    setActiveHouseholdId(DEMO_HOUSEHOLD_ID)
    setShoppingItems(data.shopping)
    setRecipes(data.recipes)
    setMealPlan(data.mealPlan)
    setTodos(data.todos)
    setMembers(data.members)
    setLoadingAuth(false)
    setStatus('Demo mode — changes are temporary and not saved.')
  }

  useEffect(() => {
    const tokenFromUrl = new URLSearchParams(window.location.search).get('invite')
    if (tokenFromUrl) {
      setStatus('Invite token found. Use "Accept Invite" to join your household.')
    }

    const initSession = async () => {
      const session = await api.auth.getSession()
      if (session) {
        setUserId(session.userId)
        setUserEmail(session.email)
        setSystemRole(session.systemRole)
      }
      setLoadingAuth(false)
    }

    initSession().catch((err: Error) => {
      setError(err.message)
      setLoadingAuth(false)
    })
  }, [])

  useEffect(() => {
    if (!userId) {
      setMemberships([])
      setActiveHouseholdId('')
      setSystemRole('member')
      setAdminHouseholds([])
      setAdminHouseholdId('')
      return
    }

    const bootstrap = async () => {
      setError('')
      await Promise.all([loadMemberships()])
    }

    void bootstrap()
  }, [userId])

  useEffect(() => {
    if (!activeHouseholdId || isDemoMode) return
    void loadHouseholdData(activeHouseholdId)
  }, [activeHouseholdId])

  useEffect(() => {
    if (!isSystemAdmin) {
      setAdminHouseholds([])
      setAdminHouseholdId('')
      return
    }
    void loadAdminHouseholds()
  }, [isSystemAdmin])

  useEffect(() => {
    if (!isSystemAdmin || !adminHouseholdId) return
    void loadAdminHouseholdData(adminHouseholdId)
  }, [isSystemAdmin, adminHouseholdId])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolved = themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode
      document.documentElement.setAttribute('data-theme', resolved)
    }
    applyTheme()
    const onSystemChange = () => { if (themeMode === 'system') applyTheme() }
    media.addEventListener('change', onSystemChange)
    window.localStorage.setItem('theme-mode', themeMode)
    return () => media.removeEventListener('change', onSystemChange)
  }, [themeMode])

  useEffect(() => {
    if (colourTheme === 'default') {
      document.documentElement.removeAttribute('data-colour')
    } else {
      document.documentElement.setAttribute('data-colour', colourTheme)
    }
    window.localStorage.setItem('colour-theme', colourTheme)
  }, [colourTheme])

  async function loadMemberships() {
    try {
      const data = await api.getMemberships()
      setMemberships(data)
      if (data.length > 0) {
        setActiveHouseholdId((current) => current || data[0].household_id)
      }
      // set system role from token — already set during login/session check
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function loadHouseholdData(householdId: string) {
    setLoadingData(true)
    try {
      const [shopping, recipeList, meals, todoList, memberList] = await Promise.all([
        api.getShoppingItems(householdId),
        api.getRecipes(householdId),
        api.getMealPlan(householdId),
        api.getTodos(householdId),
        api.getMembers(householdId),
      ])
      setShoppingItems(shopping)
      setRecipes(recipeList)
      setMealPlan(meals)
      setTodos(todoList)
      setMembers(memberList)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingData(false)
    }
  }

  async function loadAdminHouseholds() {
    try {
      const rows = await api.getHouseholds()
      setAdminHouseholds(rows)
      if (rows.length > 0) {
        setAdminHouseholdId((current) => current || rows[0].id)
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function loadAdminHouseholdData(householdId: string) {
    try {
      const [memberList, inviteList] = await Promise.all([
        api.getMembers(householdId),
        api.getInvites(householdId),
      ])
      setAdminMembers(memberList)
      setAdminInvites(inviteList)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false)
      setUserEmail('')
      setMemberships([])
      setActiveHouseholdId('')
      setShoppingItems([])
      setRecipes([])
      setMealPlan([])
      setTodos([])
      setMembers([])
      setStatus('')
      return
    }
    api.auth.signOut()
    setUserId(null)
    setUserEmail('')
    setStatus('Signed out.')
  }

  if (loadingAuth) return <LoadingScreen />



  if (!userId && !isDemoMode) {
    return (
      <AuthPanel
        setError={setError}
        setStatus={setStatus}
        onSignedIn={(session) => {
          setUserId(session.userId)
          setUserEmail(session.email)
          setSystemRole(session.systemRole)
          setError('')
        }}
        onEnterDemo={enterDemoMode}
      />
    )
  }

  if (!hasMembership && !isSystemAdmin) {
    return (
      <div className="shell">
        <header className="hero">
          <h1>Nestly</h1>
          <p>Signed in as <strong>{userEmail}</strong>. You do not have household access yet.</p>
          <button className="ghost" type="button" onClick={signOut}>Sign out</button>
        </header>
        <StatusBar error={error} status={status} />
      </div>
    )
  }

  return (
    <div className="shell">
      <header className="hero">
        <div>
          <h1>{getHouseholdName(activeMembership) ?? 'Household'}</h1>
          <p>{isDemoMode ? 'Demo mode — changes are not saved' : `Signed in as ${userEmail}`}</p>
        </div>

        <div className="row">
          {hasMembership ? (
            <select value={activeHouseholdId} onChange={(e) => setActiveHouseholdId(e.target.value)}>
              {memberships.map((m) => (
                <option key={m.household_id} value={m.household_id}>
                  {getHouseholdName(m) ?? 'Unnamed'}
                </option>
              ))}
            </select>
          ) : null}

          <select value={colourTheme} onChange={(e) => setColourTheme(e.target.value as ColourTheme)} aria-label="Colour theme">
            <option value="default">🟣 Default</option>
            <option value="ocean">🔵 Ocean</option>
            <option value="forest">🟢 Forest</option>
            <option value="sunset">🟠 Sunset</option>
            <option value="rose">🌸 Rose</option>
            <option value="slate">⬜ Slate</option>
            <option value="candy">💜 Candy</option>
          </select>
          <select value={themeMode} onChange={(e) => setThemeMode(e.target.value as ThemeMode)} aria-label="Theme mode">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>

          <button className="ghost" type="button" onClick={signOut}>
            {isDemoMode ? 'Exit Demo' : 'Sign out'}
          </button>
        </div>
      </header>

      <nav className="tabs">
        {hasMembership ? (
          <>
            <button className={activeTab === 'shopping' ? 'active' : ''} type="button" onClick={() => setActiveTab('shopping')}>Shopping</button>
            <button className={activeTab === 'recipes' ? 'active' : ''} type="button" onClick={() => setActiveTab('recipes')}>Recipes</button>
            <button className={activeTab === 'meal-plan' ? 'active' : ''} type="button" onClick={() => setActiveTab('meal-plan')}>Meal Plan</button>
            <button className={activeTab === 'todos' ? 'active' : ''} type="button" onClick={() => setActiveTab('todos')}>To-Do's</button>
            <button className={activeTab === 'group' ? 'active' : ''} type="button" onClick={() => setActiveTab('group')}>Group</button>
          </>
        ) : null}
        {isSystemAdmin ? (
          <button className={activeTab === 'admin-suite' ? 'active' : ''} type="button" onClick={() => setActiveTab('admin-suite')}>Admin Suite</button>
        ) : null}
      </nav>


      {activeTab === 'shopping' && hasMembership ? (
        <ShoppingSection
          householdId={activeHouseholdId}
          items={shoppingItems}
          isDemoMode={isDemoMode}
          onDemoUpdate={setShoppingItems}
          onRefresh={() => loadHouseholdData(activeHouseholdId)}
          onError={setError}
        />
      ) : null}

      {activeTab === 'recipes' && hasMembership ? (
        <RecipesSection
          householdId={activeHouseholdId}
          recipes={recipes}
          isDemoMode={isDemoMode}
          onDemoUpdate={setRecipes}
          onRefresh={() => loadHouseholdData(activeHouseholdId)}
          onError={setError}
        />
      ) : null}

      {activeTab === 'meal-plan' && hasMembership ? (
        <MealPlanSection
          householdId={activeHouseholdId}
          recipes={recipes}
          entries={mealPlan}
          isDemoMode={isDemoMode}
          onDemoUpdate={setMealPlan}
          onRefresh={() => loadHouseholdData(activeHouseholdId)}
          onError={setError}
        />
      ) : null}

      {activeTab === 'todos' && hasMembership ? (
        <TodoSection
          householdId={activeHouseholdId}
          todos={todos}
          members={members}
          isDemoMode={isDemoMode}
          onDemoUpdate={setTodos}
          onRefresh={() => loadHouseholdData(activeHouseholdId)}
          onError={setError}
        />
      ) : null}

      {activeTab === 'group' && hasMembership ? <GroupSection members={members} /> : null}

      {activeTab === 'admin-suite' && isSystemAdmin ? (
        <AdminSuite
          households={adminHouseholds}
          selectedHouseholdId={adminHouseholdId}
          selectedMembers={adminMembers}
          selectedInvites={adminInvites}
          onSelectHousehold={setAdminHouseholdId}
          onRefreshHouseholds={loadAdminHouseholds}
          onRefreshSelected={adminHouseholdId ? () => loadAdminHouseholdData(adminHouseholdId) : async () => undefined}
          onError={setError}
          onStatus={setStatus}
        />
      ) : null}

      <StatusBar error={error} status={status} />
    </div>
  )
}

function AuthPanel({
  setError,
  setStatus,
  onSignedIn,
  onEnterDemo,
}: {
  setError: (v: string) => void
  setStatus: (v: string) => void
  onSignedIn: (session: api.SessionUser) => void
  onEnterDemo: () => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteToken, setInviteToken] = useState(
    new URLSearchParams(window.location.search).get('invite') ?? '',
  )

  const signIn = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const session = await api.auth.signIn(email, password)
      onSignedIn(session)
      setStatus('Signed in successfully.')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const acceptInvite = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!inviteToken) { setError('Invite token is required.'); return }
    try {
      const session = await api.auth.signUp(email, password, inviteToken)
      onSignedIn(session)
      setStatus('Invite accepted. You now have household access.')
      const url = new URL(window.location.href)
      url.searchParams.delete('invite')
      window.history.replaceState({}, '', url.toString())
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="shell auth-shell">
      <header className="hero">
        <div>
          <h1>Nestly</h1>
          <p>Invite-only household planning for shopping, recipes, meals, and recurring todos.</p>
        </div>
      </header>

      <section className="card">
        <h2>Sign In</h2>
        <form onSubmit={signIn} className="stack">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Sign In</button>
        </form>
      </section>

      <section className="card">
        <h2>Accept Invite</h2>
        <form onSubmit={acceptInvite} className="stack">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder="Choose a password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input type="text" required placeholder="Invite token" value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} />
          <button type="submit">Accept Invite</button>
        </form>
      </section>

    </div>
  )
}

function ShoppingSection({
  householdId, items, isDemoMode, onDemoUpdate, onRefresh, onError,
}: {
  householdId: string; items: ShoppingItem[]; isDemoMode: boolean
  onDemoUpdate: (items: ShoppingItem[]) => void
  onRefresh: () => Promise<void>; onError: (v: string) => void
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [title, setTitle] = useState('')
  const [quantity, setQuantity] = useState('')

  const addItem = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    if (isDemoMode) {
      onDemoUpdate([{ id: crypto.randomUUID(), household_id: householdId, title: trimmed, quantity: quantity.trim() || null, is_complete: false, created_at: '' }, ...items])
      setTitle(''); setQuantity(''); setShowAddModal(false); return
    }
    try {
      await api.addShoppingItem(householdId, trimmed, quantity.trim() || undefined)
      setTitle(''); setQuantity(''); setShowAddModal(false)
      await onRefresh()
    } catch (err) { onError((err as Error).message) }
  }

  const toggle = async (item: ShoppingItem) => {
    if (isDemoMode) { onDemoUpdate(items.map((i) => i.id === item.id ? { ...i, is_complete: !i.is_complete } : i)); return }
    try { await api.toggleShoppingItem(item.id, !item.is_complete); await onRefresh() }
    catch (err) { onError((err as Error).message) }
  }

  const remove = async (id: string) => {
    if (isDemoMode) { onDemoUpdate(items.filter((i) => i.id !== id)); return }
    try { await api.deleteShoppingItem(id); await onRefresh() }
    catch (err) { onError((err as Error).message) }
  }

  const clearCompleted = async () => {
    const completedIds = items.filter((i) => i.is_complete).map((i) => i.id)
    if (completedIds.length === 0) return
    if (isDemoMode) { onDemoUpdate(items.filter((i) => !i.is_complete)); return }
    try { await api.clearCompletedItems(householdId); await onRefresh() }
    catch (err) { onError((err as Error).message) }
  }

  const completedCount = items.filter((i) => i.is_complete).length

  return (
    <section className="card">
      <div className="row section-head">
        <h2>Shopping List</h2>
        <div className="row">
          {completedCount > 0 ? (
            <button type="button" className="ghost" onClick={clearCompleted}>Clear ticked ({completedCount})</button>
          ) : null}
          <button type="button" onClick={() => setShowAddModal(true)}>Add Item</button>
        </div>
      </div>
      <ul className="list">
        {items.map((item) => (
          <li key={item.id} className={item.is_complete ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={item.is_complete} onChange={() => toggle(item)} />
              {item.title}{item.quantity ? ` (${item.quantity})` : ''}
            </label>
            <button type="button" className="ghost" onClick={() => remove(item.id)}>Remove</button>
          </li>
        ))}
      </ul>

      {showAddModal ? (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add Shopping Item</h3>
            <form className="stack" onSubmit={addItem}>
              <input type="text" autoFocus placeholder="Add item" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <input type="text" placeholder="Qty (optional)" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <div className="row">
                <button type="submit">Add</button>
                <button type="button" className="ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function RecipesSection({
  householdId, recipes, isDemoMode, onDemoUpdate, onRefresh, onError,
}: {
  householdId: string; recipes: Recipe[]; isDemoMode: boolean
  onDemoUpdate: (recipes: Recipe[]) => void
  onRefresh: () => Promise<void>; onError: (v: string) => void
}) {
  const [title, setTitle] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [servings, setServings] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [method, setMethod] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})
  const [servingScales, setServingScales] = useState<Record<string, number>>({})
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSourceUrl, setEditSourceUrl] = useState('')
  const [editServings, setEditServings] = useState('')
  const [editIngredients, setEditIngredients] = useState('')
  const [editMethod, setEditMethod] = useState('')

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? recipes.filter((r) => r.title.toLowerCase().includes(q)) : recipes
  }, [recipes, search])

  const addRecipe = async (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) return
    const parsedServings = Number(servings)
    const srv = Number.isFinite(parsedServings) && parsedServings > 0 ? parsedServings : null
    if (isDemoMode) {
      onDemoUpdate([{ id: crypto.randomUUID(), household_id: householdId, title: title.trim(), source_url: sourceUrl.trim() || null, servings: srv, ingredients: ingredients.trim() || null, method: method.trim() || null, notes: null, created_at: '' }, ...recipes])
      setTitle(''); setSourceUrl(''); setServings(''); setIngredients(''); setMethod(''); setShowCreateModal(false); return
    }
    try {
      await api.addRecipe({ householdId, title: title.trim(), servings: srv, source_url: sourceUrl.trim() || null, ingredients: ingredients.trim() || null, method: method.trim() || null })
      setTitle(''); setSourceUrl(''); setServings(''); setIngredients(''); setMethod(''); setShowCreateModal(false)
      await onRefresh()
    } catch (err) { onError((err as Error).message) }
  }

  const remove = async (id: string) => {
    if (isDemoMode) { onDemoUpdate(recipes.filter((r) => r.id !== id)); return }
    try { await api.deleteRecipe(id); await onRefresh() } catch (err) { onError((err as Error).message) }
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = { ...current, [id]: !current[id] }
      if (next[id]) {
        const recipe = recipes.find((r) => r.id === id)
        if (recipe?.servings) setServingScales((s) => ({ ...s, [id]: s[id] ?? recipe.servings! }))
      }
      return next
    })
  }

  const adjustServings = (id: string, delta: number, base: number) => {
    setServingScales((s) => ({ ...s, [id]: Math.max(1, (s[id] ?? base) + delta) }))
  }

  const openEditModal = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setEditTitle(recipe.title)
    setEditSourceUrl(recipe.source_url ?? '')
    setEditServings(recipe.servings != null ? String(recipe.servings) : '')
    setEditIngredients(recipe.ingredients ?? '')
    setEditMethod(recipe.method ?? recipe.notes ?? '')
  }

  const updateRecipe = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingRecipe || !editTitle.trim()) return
    const parsedServings = Number(editServings)
    const srv = Number.isFinite(parsedServings) && parsedServings > 0 ? parsedServings : null
    if (isDemoMode) {
      onDemoUpdate(recipes.map((r) => r.id === editingRecipe.id ? { ...r, title: editTitle.trim(), source_url: editSourceUrl.trim() || null, servings: srv, ingredients: editIngredients.trim() || null, method: editMethod.trim() || null } : r))
      setEditingRecipe(null); return
    }
    try {
      await api.updateRecipe(editingRecipe.id, { title: editTitle.trim(), servings: srv, source_url: editSourceUrl.trim() || null, ingredients: editIngredients.trim() || null, method: editMethod.trim() || null })
      setEditingRecipe(null); await onRefresh()
    } catch (err) { onError((err as Error).message) }
  }

  return (
    <section className="card">
      <div className="row section-head">
        <h2>Recipes</h2>
        <button type="button" onClick={() => setShowCreateModal(true)}>Add Recipe</button>
      </div>
      <input type="text" placeholder="Search recipes by name" value={search} onChange={(e) => setSearch(e.target.value)} />
      <ul className="list">
        {filteredRecipes.map((recipe) => {
          const isExpanded = Boolean(expandedIds[recipe.id])
          return (
            <li key={recipe.id} className="recipe-item">
              <div className="recipe-main">
                <div className="recipe-title-row">
                  <strong>{recipe.title}</strong>
                  {recipe.servings ? <span>Serves {recipe.servings}</span> : null}
                </div>
                {isExpanded ? (
                  <div className="recipe-details">
                    {recipe.source_url ? <p><strong>Source:</strong> <a href={recipe.source_url}>Open Link</a></p> : null}
                    {recipe.servings ? (() => {
                      const current = servingScales[recipe.id] ?? recipe.servings
                      const factor = current / recipe.servings
                      return (
                        <div className="serving-scaler">
                          <span className="serving-scaler-label">Serves</span>
                          <button type="button" className="ghost serving-scaler-btn" onClick={() => adjustServings(recipe.id, -1, recipe.servings!)}>−</button>
                          <span className="serving-scaler-count">{current}</span>
                          <button type="button" className="ghost serving-scaler-btn" onClick={() => adjustServings(recipe.id, +1, recipe.servings!)}>+</button>
                          {factor !== 1 ? (
                            <button type="button" className="ghost serving-scaler-reset" onClick={() => setServingScales((s) => ({ ...s, [recipe.id]: recipe.servings! }))}>Reset</button>
                          ) : null}
                        </div>
                      )
                    })() : null}
                    {recipe.ingredients ? (() => {
                      const current = servingScales[recipe.id] ?? recipe.servings ?? 1
                      const factor = recipe.servings ? current / recipe.servings : 1
                      return <p><strong>Ingredients:</strong><br /><span className="recipe-preformatted">{scaleIngredients(recipe.ingredients, factor)}</span></p>
                    })() : null}
                    {recipe.method || recipe.notes ? <p><strong>Method:</strong><br /><span className="recipe-preformatted">{recipe.method ?? recipe.notes}</span></p> : null}
                  </div>
                ) : null}
              </div>
              <div className="recipe-actions">
                <button type="button" className="ghost" onClick={() => toggleExpanded(recipe.id)}>{isExpanded ? 'Collapse' : 'Expand'}</button>
                <button type="button" className="ghost" onClick={() => openEditModal(recipe)}>Edit</button>
                <button type="button" className="ghost" onClick={() => remove(recipe.id)}>Remove</button>
              </div>
            </li>
          )
        })}
        {filteredRecipes.length === 0 ? <li>No recipes found</li> : null}
      </ul>

      {showCreateModal ? (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add Recipe</h3>
            <form className="stack" onSubmit={addRecipe}>
              <div className="row">
                <input type="text" autoFocus placeholder="Recipe name" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <input type="number" min={1} placeholder="Servings" value={servings} onChange={(e) => setServings(e.target.value)} />
              </div>
              <input type="url" placeholder="Source URL" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              <textarea placeholder="Ingredients (one per line)" value={ingredients} onChange={(e) => setIngredients(e.target.value)} rows={4} />
              <textarea placeholder="Method" value={method} onChange={(e) => setMethod(e.target.value)} rows={3} />
              <div className="row">
                <button type="submit">Save Recipe</button>
                <button type="button" className="ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editingRecipe ? (
        <div className="modal-overlay" onClick={() => setEditingRecipe(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Recipe</h3>
            <form className="stack" onSubmit={updateRecipe}>
              <div className="row">
                <input type="text" autoFocus placeholder="Recipe name" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
                <input type="number" min={1} placeholder="Servings" value={editServings} onChange={(e) => setEditServings(e.target.value)} />
              </div>
              <input type="url" placeholder="Source URL" value={editSourceUrl} onChange={(e) => setEditSourceUrl(e.target.value)} />
              <textarea placeholder="Ingredients (one per line)" value={editIngredients} onChange={(e) => setEditIngredients(e.target.value)} rows={4} />
              <textarea placeholder="Method" value={editMethod} onChange={(e) => setEditMethod(e.target.value)} rows={3} />
              <div className="row">
                <button type="submit">Save Changes</button>
                <button type="button" className="ghost" onClick={() => setEditingRecipe(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function MealPlanSection({
  householdId, recipes, entries, isDemoMode, onDemoUpdate, onRefresh, onError,
}: {
  householdId: string; recipes: Recipe[]; entries: MealPlanEntry[]; isDemoMode: boolean
  onDemoUpdate: (entries: MealPlanEntry[]) => void
  onRefresh: () => Promise<void>; onError: (v: string) => void
}) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [editingSlot, setEditingSlot] = useState<{ mealDate: string; mealType: (typeof mealTypes)[number] } | null>(null)
  const [mealText, setMealText] = useState('')

  const weekStart = useMemo(() => dayjs().startOf('week').add(weekOffset, 'week'), [weekOffset])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day')), [weekStart])

  const addMeal = async (event: FormEvent) => {
    event.preventDefault()
    if (!editingSlot) return
    const title = mealText.trim()
    if (!title) return
    const selectedRecipe = recipes.find((r) => r.title.toLowerCase() === title.toLowerCase())
    if (isDemoMode) {
      const existing = entries.find((e) => e.meal_date === editingSlot.mealDate && e.meal_type === editingSlot.mealType)
      const updated: MealPlanEntry = { id: existing?.id ?? crypto.randomUUID(), household_id: householdId, meal_date: editingSlot.mealDate, meal_type: editingSlot.mealType, recipe_id: selectedRecipe?.id ?? null, recipe_title: selectedRecipe?.title ?? title, created_at: '' }
      onDemoUpdate(existing ? entries.map((e) => e.id === existing.id ? updated : e) : [...entries, updated])
      setMealText(''); setEditingSlot(null); return
    }
    try {
      await api.upsertMealEntry({ householdId, meal_date: editingSlot.mealDate, meal_type: editingSlot.mealType, recipe_id: selectedRecipe?.id ?? null, recipe_title: selectedRecipe?.title ?? title })
      setMealText(''); setEditingSlot(null); await onRefresh()
    } catch (err) { onError((err as Error).message) }
  }

  const remove = async (id: string) => {
    if (isDemoMode) { onDemoUpdate(entries.filter((e) => e.id !== id)); return }
    try { await api.deleteMealEntry(id); await onRefresh() } catch (err) { onError((err as Error).message) }
  }

  const openEditor = (slot: { mealDate: string; mealType: (typeof mealTypes)[number] }, text: string) => { setEditingSlot(slot); setMealText(text) }
  const closeEditor = () => { setEditingSlot(null); setMealText('') }

  return (
    <section className="card">
      <h2>Meal Plan</h2>
      <div className="row week-controls">
        <button type="button" className="ghost" onClick={() => setWeekOffset((v) => v - 1)}>Previous Week</button>
        <p>{weekStart.format('D MMM')} - {weekStart.add(6, 'day').format('D MMM')}</p>
        <button type="button" className="ghost" onClick={() => setWeekOffset(0)}>This Week</button>
        <button type="button" className="ghost" onClick={() => setWeekOffset((v) => v + 1)}>Next Week</button>
      </div>
      <div className="meal-week-grid">
        {weekDays.map((day) => {
          const dayKey = day.format('YYYY-MM-DD')
          return (
            <article key={dayKey} className="meal-day-block">
              <header><strong>{day.format('ddd')}</strong><span>{day.format('D MMM')}</span></header>
              {mealTypes.map((type) => {
                const entry = entries.find((e) => e.meal_date === dayKey && e.meal_type === type)
                return (
                  <div key={`${dayKey}-${type}`} className="meal-slot">
                    <p className="meal-slot-title">{type}</p>
                    {entry ? (
                      <div className="meal-slot-content">
                        <span>{entry.recipe_title ?? 'Unplanned meal'}</span>
                        <button type="button" className="ghost" onClick={() => openEditor({ mealDate: dayKey, mealType: type }, entry.recipe_title ?? '')}>Edit</button>
                        <button type="button" className="ghost" onClick={() => remove(entry.id)}>Remove</button>
                      </div>
                    ) : (
                      <div className="meal-slot-content">
                        <p className="meal-empty">Not planned</p>
                        <button type="button" className="ghost" onClick={() => openEditor({ mealDate: dayKey, mealType: type }, '')}>Add</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </article>
          )
        })}
      </div>
      {editingSlot ? (
        <div className="modal-overlay" onClick={closeEditor}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Edit {editingSlot.mealType} {dayjs(editingSlot.mealDate).format('D MMM')}</h3>
            <form className="stack" onSubmit={addMeal}>
              <input type="text" list="recipe-suggestions" autoFocus placeholder="Type meal or recipe" value={mealText} onChange={(e) => setMealText(e.target.value)} required />
              <datalist id="recipe-suggestions">{recipes.map((r) => <option key={r.id} value={r.title} />)}</datalist>
              <div className="row">
                <button type="submit">Add</button>
                <button type="button" className="ghost" onClick={closeEditor}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function TodoSection({
  householdId, todos, members, isDemoMode, onDemoUpdate, onRefresh, onError,
}: {
  householdId: string; todos: TodoItem[]; members: Member[]; isDemoMode: boolean
  onDemoUpdate: (todos: TodoItem[]) => void
  onRefresh: () => Promise<void>; onError: (v: string) => void
}) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [targetList, setTargetList] = useState<'weekly' | 'adhoc'>('adhoc')
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState<string>('')

  const weeklyTodos = todos.filter((t) => t.recurrence === 'weekly' || t.recurrence === 'chore')
  const adhocTodos = todos.filter((t) => t.recurrence === 'none')

  useEffect(() => {
    if (isDemoMode) return
    const maybeResetWeekly = async () => {
      const isSunday = dayjs().day() === 0
      const hasCompleted = weeklyTodos.some((t) => t.is_complete)
      const weekKey = dayjs().startOf('week').format('YYYY-MM-DD')
      const resetKey = `weekly-reset:${householdId}`
      if (!isSunday || !hasCompleted || localStorage.getItem(resetKey) === weekKey) return
      try {
        await api.resetWeeklyTodos(householdId)
        localStorage.setItem(resetKey, weekKey)
        await onRefresh()
      } catch (err) { onError((err as Error).message) }
    }
    void maybeResetWeekly()
  }, [householdId, weeklyTodos, onRefresh, onError, isDemoMode])

  const openAddModal = (list: 'weekly' | 'adhoc') => {
    setTargetList(list); setTitle(''); setAssignedTo(''); setShowAddModal(true)
  }

  const addTodo = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    const recurrence = targetList === 'weekly' ? 'weekly' : 'none'
    const assigned = targetList === 'weekly' ? (assignedTo || null) : null
    if (isDemoMode) {
      onDemoUpdate([...todos, { id: crypto.randomUUID(), household_id: householdId, title: trimmed, notes: null, due_date: null, recurrence, is_complete: false, assigned_to: assigned, assigned_email: members.find(m => m.user_id === assigned)?.member_email ?? null, created_at: '' }])
      setTitle(''); setShowAddModal(false); return
    }
    try {
      await api.addTodo({ householdId, title: trimmed, recurrence, assigned_to: assigned })
      setTitle(''); setShowAddModal(false); await onRefresh()
    } catch (err) { onError((err as Error).message) }
  }

  const reassign = async (todo: TodoItem, userId: string | null) => {
    if (isDemoMode) {
      const m = members.find(m => m.user_id === userId)
      onDemoUpdate(todos.map((t) => t.id === todo.id ? { ...t, assigned_to: userId, assigned_email: m?.member_email ?? null } : t))
      return
    }
    try { await api.assignTodo(todo.id, userId); await onRefresh() } catch (err) { onError((err as Error).message) }
  }

  const resetWeekly = async () => {
    const toReset = weeklyTodos.filter((t) => t.is_complete)
    if (toReset.length === 0) return
    if (isDemoMode) { onDemoUpdate(todos.map((t) => (t.recurrence === 'weekly' || t.recurrence === 'chore') ? { ...t, is_complete: false } : t)); return }
    try { await Promise.all(toReset.map((t) => api.toggleTodo(t.id, false))); await onRefresh() }
    catch (err) { onError((err as Error).message) }
  }

  const toggle = async (todo: TodoItem) => {
    if (isDemoMode) { onDemoUpdate(todos.map((t) => t.id === todo.id ? { ...t, is_complete: !t.is_complete } : t)); return }
    try { await api.toggleTodo(todo.id, !todo.is_complete); await onRefresh() } catch (err) { onError((err as Error).message) }
  }

  const clearAdhocOnCheck = async (todo: TodoItem) => {
    if (isDemoMode) { onDemoUpdate(todos.filter((t) => t.id !== todo.id)); return }
    try { await api.deleteTodo(todo.id); await onRefresh() } catch (err) { onError((err as Error).message) }
  }

  const remove = async (id: string) => {
    if (isDemoMode) { onDemoUpdate(todos.filter((t) => t.id !== id)); return }
    try { await api.deleteTodo(id); await onRefresh() } catch (err) { onError((err as Error).message) }
  }

  return (
    <section className="card">
      <h2>To-Do's</h2>
      <div className="todo-columns">
        <article className="todo-column">
          <div className="todo-column-header">
            <h3>Weekly</h3>
            <div className="row">
              {weeklyTodos.some((t) => t.is_complete) ? (
                <button type="button" className="ghost" onClick={resetWeekly}>Untick all</button>
              ) : null}
              <button type="button" onClick={() => openAddModal('weekly')}>Add</button>
            </div>
          </div>
          <ul className="list checklist-list">
            {weeklyTodos.map((todo) => (
              <li key={todo.id} className={todo.is_complete ? 'done' : ''} style={{ flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ flex: 1 }}><input type="checkbox" checked={todo.is_complete} onChange={() => toggle(todo)} />{todo.title}</label>
                <select
                  value={todo.assigned_to ?? ''}
                  onChange={(e) => reassign(todo, e.target.value || null)}
                  style={{ fontSize: '0.75rem', padding: '2px 4px', maxWidth: '120px' }}
                  aria-label="Assigned to"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.member_email.split('@')[0]}</option>
                  ))}
                </select>
                <button type="button" className="ghost" onClick={() => remove(todo.id)}>Delete</button>
              </li>
            ))}
            {weeklyTodos.length === 0 ? <li>No weekly tasks yet</li> : null}
          </ul>
        </article>
        <article className="todo-column">
          <div className="todo-column-header">
            <h3>Ad-hoc</h3>
            <button type="button" onClick={() => openAddModal('adhoc')}>Add</button>
          </div>
          <ul className="list checklist-list">
            {adhocTodos.map((todo) => (
              <li key={todo.id}>
                <label><input type="checkbox" checked={false} onChange={() => clearAdhocOnCheck(todo)} />{todo.title}</label>
                <button type="button" className="ghost" onClick={() => remove(todo.id)}>Delete</button>
              </li>
            ))}
            {adhocTodos.length === 0 ? <li>No ad-hoc tasks right now</li> : null}
          </ul>
        </article>
      </div>
      {showAddModal ? (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Add {targetList === 'weekly' ? 'Weekly' : 'Ad-hoc'} To-Do</h3>
            <form className="stack" onSubmit={addTodo}>
              <input type="text" autoFocus placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} required />
              {targetList === 'weekly' && members.length > 0 ? (
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} aria-label="Assign to member (optional)">
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>{m.member_email}</option>
                  ))}
                </select>
              ) : null}
              <div className="row">
                <button type="submit">Add</button>
                <button type="button" className="ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function GroupSection({ members }: { members: Member[] }) {
  return (
    <section className="card">
      <h2>Group</h2>
      <p>You can see your group name and all member emails in this household.</p>
      <ul className="list">
        {members.map((m) => <li key={m.id}><span>{m.member_email}</span></li>)}
      </ul>
    </section>
  )
}

function AdminSuite({
  households, selectedHouseholdId, selectedMembers, selectedInvites,
  onSelectHousehold, onRefreshHouseholds, onRefreshSelected, onError, onStatus,
}: {
  households: HouseholdSummary[]; selectedHouseholdId: string
  selectedMembers: Member[]; selectedInvites: Invite[]
  onSelectHousehold: (id: string) => void
  onRefreshHouseholds: () => Promise<void>
  onRefreshSelected: () => Promise<void>
  onError: (v: string) => void; onStatus: (v: string) => void
}) {
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [generatedInvite, setGeneratedInvite] = useState<Invite | null>(null)
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const selectedHousehold = useMemo(
    () => households.find((h) => h.id === selectedHouseholdId) ?? null,
    [households, selectedHouseholdId],
  )

  useEffect(() => { setShowDeleteConfirm(false); setDeleteConfirmName('') }, [selectedHouseholdId])

  const createHousehold = async (event: FormEvent) => {
    event.preventDefault()
    if (!newHouseholdName.trim()) return
    try {
      await api.createHousehold(newHouseholdName.trim())
      setNewHouseholdName(''); setShowHouseholdModal(false)
      onStatus('Household created.'); await onRefreshHouseholds()
    } catch (err) { onError((err as Error).message) }
  }

  const deleteHousehold = async (id: string) => {
    try {
      await api.deleteHousehold(id)
      onStatus('Household deleted.'); await onRefreshHouseholds()
      onSelectHousehold(''); setShowDeleteConfirm(false); setDeleteConfirmName('')
    } catch (err) { onError((err as Error).message) }
  }

  const createInvite = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedHouseholdId || !inviteEmail.trim()) return
    try {
      const invite = await api.createInvite(selectedHouseholdId, inviteEmail.trim())
      setGeneratedInvite(invite); await onRefreshSelected()
    } catch (err) { onError((err as Error).message) }
  }

  const copyInviteLink = async (token: string) => {
    const link = `${window.location.origin}${window.location.pathname}?invite=${token}`
    try { await navigator.clipboard.writeText(link); onStatus('Invite link copied to clipboard.') }
    catch { onError('Could not copy to clipboard.') }
  }

  const cancelInvite = async (id: string) => {
    try { await api.cancelInvite(id); await onRefreshSelected() } catch (err) { onError((err as Error).message) }
  }

  const removeMember = async (id: string) => {
    try { await api.removeMember(id); await onRefreshSelected() } catch (err) { onError((err as Error).message) }
  }

  return (
    <section className="card">
      <h2>Admin Suite</h2>
      <p>System admins can create households, invite members, and manage membership.</p>
      <button type="button" onClick={() => setShowHouseholdModal(true)}>Create Household</button>
      <div className="row">
        <select value={selectedHouseholdId} onChange={(e) => onSelectHousehold(e.target.value)}>
          <option value="">Choose household</option>
          {households.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        {selectedHouseholdId ? (
          <button type="button" className="ghost" onClick={() => setShowDeleteConfirm((v) => !v)}>
            {showDeleteConfirm ? 'Cancel Delete' : 'Delete Household'}
          </button>
        ) : null}
      </div>
      {selectedHouseholdId && showDeleteConfirm && selectedHousehold ? (
        <div className="card delete-guard">
          <p>Type <strong>{selectedHousehold.name}</strong> to confirm deletion.</p>
          <div className="row">
            <input type="text" placeholder="Confirm household name" value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.target.value)} />
            <button type="button" className="danger" disabled={deleteConfirmName.trim() !== selectedHousehold.name} onClick={() => deleteHousehold(selectedHouseholdId)}>Confirm Delete</button>
          </div>
        </div>
      ) : null}
      {selectedHouseholdId ? (
        <>
          <button type="button" onClick={() => setShowInviteModal(true)}>Create Invite</button>
          <h3>Members</h3>
          <ul className="list">
            {selectedMembers.map((m) => (
              <li key={m.id}><span>{m.member_email}</span><button type="button" className="ghost" onClick={() => removeMember(m.id)}>Remove</button></li>
            ))}
          </ul>
          <h3>Pending Invites</h3>
          <ul className="list">
            {selectedInvites.map((inv) => (
              <li key={inv.id}>
                <span>{inv.email}{inv.expires_at ? `  expires ${dayjs(inv.expires_at).format('YYYY-MM-DD')}` : ''}</span>
                <button type="button" className="ghost" onClick={() => copyInviteLink(inv.invite_token)}>Copy URL</button>
                <button type="button" className="ghost" onClick={() => cancelInvite(inv.id)}>Cancel</button>
              </li>
            ))}
            {selectedInvites.length === 0 ? <li>No pending invites</li> : null}
          </ul>
        </>
      ) : null}
      {showHouseholdModal ? (
        <div className="modal-overlay" onClick={() => setShowHouseholdModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create Household</h3>
            <form className="stack" onSubmit={createHousehold}>
              <input type="text" autoFocus placeholder="New household name" value={newHouseholdName} onChange={(e) => setNewHouseholdName(e.target.value)} required />
              <div className="row">
                <button type="submit">Create</button>
                <button type="button" className="ghost" onClick={() => setShowHouseholdModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {showInviteModal && selectedHouseholdId ? (
        <div className="modal-overlay" onClick={() => { setShowInviteModal(false); setGeneratedInvite(null); setInviteEmail('') }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Create Invite</h3>
            {generatedInvite ? (
              <div className="stack">
                <p>✓ An invite email has been sent to <strong>{inviteEmail}</strong>. You can also share the link below directly:</p>
                <input aria-label="Invite link" type="text" readOnly value={`${window.location.origin}${window.location.pathname}?invite=${generatedInvite.invite_token}`} onClick={(e) => (e.target as HTMLInputElement).select()} />
                <div className="row">
                  <button type="button" onClick={() => copyInviteLink(generatedInvite.invite_token)}>Copy Link</button>
                  <button type="button" className="ghost" onClick={() => { setShowInviteModal(false); setGeneratedInvite(null); setInviteEmail('') }}>Done</button>
                </div>
              </div>
            ) : (
              <form className="stack" onSubmit={createInvite}>
                <input type="email" autoFocus placeholder="Invite email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                <div className="row">
                  <button type="submit">Create Invite</button>
                  <button type="button" className="ghost" onClick={() => { setShowInviteModal(false); setInviteEmail('') }}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StatusBar({ status, error }: { status: string; error: string }) {
  if (!status && !error) return null
  return (
    <footer className="statusbar">
      {status ? <p className="status">{status}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </footer>
  )
}

export default App
