# Zustand Architectural Decisions: Approach X vs Approach Y

This reference provides a deep-dive framework for choosing the right architecture, topology, and code organization patterns in Zustand (v5+).

---

## 1. Store Topology: Single Store vs Slices Pattern vs Multiple Independent Stores

### Decision Summary

| Pattern | Best Used When | Avoid When |
| :--- | :--- | :--- |
| **Multiple Independent Stores** | Domains are distinct, unrelated, or have distinct lifecycles (e.g. `authStore`, `themeStore`, `cartStore`). | Slices frequently depend on or react to each other's state synchronously. |
| **Slices Pattern (Bounded Store)** | Sub-features belong to the same domain and need cross-slice updates or combined middleware (e.g., `userSlice` + `permissionsSlice` in an `accountStore`). | Unrelated app features are dumped into a single mega-store, causing cognitive overload. |
| **Single Monolithic Store** | Small applications or isolated standalone widgets with a small state surface. | Medium to large applications where a single file exceeds 200–300 lines. |

---

### Deep Dive: Multiple Independent Stores

In Zustand, stores are lightweight. Creating multiple stores does **not** introduce performance penalties or Context provider nesting.

```ts
// auth-store.ts - Persisted to secure storage
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth-session' }
  )
)

// theme-store.ts - Persisted to standard local storage
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'theme-preference' }
  )
)
```

#### Why Choose Multiple Stores?
1. **Isolated Persistence**: Different stores can have different storage backends (e.g., `SecureStore` for auth, `MMKV`/`localStorage` for UI preferences) or distinct migration versioning.
2. **Better Code Splitting & Tree Shaking**: Routes that only need `themeStore` don't load `cartStore` code.
3. **Simpler Mental Model**: No complex generic types or mutators needed for cross-slice combining.

#### Cross-Store Updates with Independent Stores
When one store needs to read from or trigger an update in another store, do it inside the action using `getState()` or `setState()`:

```ts
// In cart-store.ts
export const useCartStore = create<CartState>()((set) => ({
  items: [],
  checkout: async () => {
    // Read auth token from the other store imperatively:
    const token = useAuthStore.getState().token
    if (!token) throw new Error('Unauthenticated')

    await api.post('/checkout', { items: get().items }, { token })
    set({ items: [] })
  },
}))
```

---

### Deep Dive: Slices Pattern (Combined Bounded Store)

The Slices pattern divides a single conceptual store into modular slices while maintaining a unified store instance.

```ts
// types.ts
export interface BearSlice {
  bears: number
  addBear: () => void
}

export interface FishSlice {
  fishes: number
  addFish: () => void
  eatFish: () => void
}

export type BoundStore = BearSlice & FishSlice
```

```ts
// slices/bear-slice.ts
import { StateCreator } from 'zustand'
import { BoundStore, BearSlice } from '../types'

export const createBearSlice: StateCreator<
  BoundStore,
  [['zustand/devtools', never]],
  [],
  BearSlice
> = (set) => ({
  bears: 0,
  addBear: () =>
    set((state) => ({ bears: state.bears + 1 }), undefined, 'bear/addBear'),
})
```

```ts
// slices/fish-slice.ts
import { StateCreator } from 'zustand'
import { BoundStore, FishSlice } from '../types'

export const createFishSlice: StateCreator<
  BoundStore,
  [['zustand/devtools', never]],
  [],
  FishSlice
> = (set, get) => ({
  fishes: 10,
  addFish: () =>
    set((state) => ({ fishes: state.fishes + 1 }), undefined, 'fish/addFish'),
  // Cross-slice action: modifying bears AND fishes in a single atomic set:
  eatFish: () => {
    if (get().fishes <= 0) return
    set(
      (state) => ({ fishes: state.fishes - 1, bears: state.bears + 1 }),
      undefined,
      'fish/eatFish'
    )
  },
})
```

```ts
// store.ts - Combine slices and apply middlewares ONCE
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { BoundStore } from './types'
import { createBearSlice } from './slices/bear-slice'
import { createFishSlice } from './slices/fish-slice'

export const useBoundStore = create<BoundStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createBearSlice(...a),
        ...createFishSlice(...a),
      }),
      { name: 'bound-storage' }
    )
  )
)
```

> [!IMPORTANT]
> **Middleware Golden Rule for Slices**: Middlewares must **only** be applied at the outer combined store level, **never** inside individual slice creators. Applying middlewares inside a slice creator causes nested wrappers, broken subscriptions, and corrupted types.

---

## 2. Action Placement: Colocated Store Actions vs External Module Actions

Zustand supports two distinct paradigms for writing actions:

### Approach A: Colocated Actions (Default & Recommended)

Actions live inside the store creator alongside the state:

```ts
export const useCounterStore = create<CounterStore>()((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))
```

**Pros:**
- Complete encapsulation: The store defines its own valid state transitions.
- Works seamlessly with React Context scoped stores (`createStore`).
- Discoverable via IDE autocomplete (`useCounterStore((s) => s.increment)`).

**Cons:**
- Requires selecting the action inside components via a hook selector (or selecting the whole store, which causes re-renders).

---

### Approach B: External Module Actions ("Practice with No Store Actions")

Actions are declared as standalone exported functions at module level:

```ts
export const useCounterStore = create<CounterState>(() => ({
  count: 0,
}))

// Standalone actions:
export const increment = () =>
  useCounterStore.setState((s) => ({ count: s.count + 1 }))

export const decrement = () =>
  useCounterStore.setState((s) => ({ count: s.count - 1 }))

export const reset = () =>
  useCounterStore.setState({ count: 0 })
```

**Pros:**
- **Zero Hook Calls**: Components import `increment` directly: `<button onClick={increment}>`. No `useCounterStore((s) => s.increment)` required!
- **Zero Re-renders from Action Identity**: Since `increment` is a module-level constant function, it never causes component re-renders.
- **Superior Code Splitting**: Actions used in rarely-visited dialogs or workflows can be dynamic-imported without shipping inside the primary store bundle.

**Cons:**
- Does **not** work with React Context scoped stores (since `setState` is attached to a global module singleton).
- Action implementation is separated from state definitions.

### Decision Verdict
- Use **Colocated Actions** if you use React Context scoped stores (SSR/Next.js), need dynamic stores, or prefer traditional OOP/encapsulated domain models.
- Use **External Module Actions** for client-side SPAs or React Native apps where you want the cleanest component code with zero action-selector boilerplate.

---

## 3. Store Scope: Global Module Singleton vs React Context Scoped Store

### Approach A: Global Module Singleton
```ts
// Exported directly at module level
export const useStore = create<StoreState>()((set) => ({ ... }))
```
- **When to use**: Client-only React SPAs, Vite, React Native (Expo), Electron apps.
- **Why**: Simple, zero boilerplate, accessible anywhere (inside components or non-React files).

### Approach B: React Context Scoped Store (`createStore` factory)
```ts
// 1. Factory using vanilla createStore
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

export const createCounterStore = (initialCount = 0) =>
  createStore<CounterStore>()((set) => ({
    count: initialCount,
    inc: () => set((s) => ({ count: s.count + 1 })),
  }))

// 2. React Context
type CounterStoreApi = ReturnType<typeof createCounterStore>
const CounterContext = createContext<CounterStoreApi | null>(null)

export const CounterProvider = ({ initialCount, children }) => {
  const [store] = useState(() => createCounterStore(initialCount))
  return <CounterContext.Provider value={store}>{children}</CounterContext.Provider>
}

// 3. Custom Consumer Hook
export const useCounter = <T>(selector: (state: CounterStore) => T): T => {
  const store = useContext(CounterContext)
  if (!store) throw new Error('Missing CounterProvider')
  return useStore(store, selector)
}
```

- **When to use**:
  1. **Next.js App Router / SSR**: Prevents cross-request state leakage between different users on the server.
  2. **Reusable Component Instances**: When you have multiple instances of a complex component on the same screen (e.g., multiple DataTables or AudioPlayers) and each instance needs its own isolated Zustand store initialized with props.
  3. **Testing**: Guarantees a fresh, unpolluted store for each test wrapper.

---

## 4. Re-render Optimization & Selector Strategies

### The Re-render Pitfall in Zustand v5

In Zustand v5, selectors are evaluated via `useSyncExternalStore`. If a selector returns a **new object or array reference on each call**, React detects a reference change and triggers a re-render. If done carelessly, this can trigger an infinite re-render loop!

```tsx
// ❌ WRONG (v5 Anti-Pattern): Returns a new object reference every time!
const { count, text } = useStore((state) => ({
  count: state.count,
  text: state.text,
}))
// Result: Component re-renders whenever ANY property in the store changes!

// ❌ WRONG: Returns a new array reference every time!
const [bears, fishes] = useStore((state) => [state.bears, state.fishes])
```

---

### Strategy A: Atomic Selectors (Preferred for 1–2 properties)
Select single primitive values directly.

```tsx
// ✅ FAST & CLEAN: Returns primitive values (number, string, boolean)
const count = useStore((state) => state.count)
const text = useStore((state) => state.text)
```
- No shallow comparison overhead.
- React only re-renders when the exact value changes (`Object.is`).

---

### Strategy B: `useShallow` for Multi-Property Selections
When you need to select multiple properties into an object or array, wrap the selector in `useShallow` from `zustand/react/shallow`:

```tsx
import { useShallow } from 'zustand/react/shallow'

// ✅ FAST: useShallow performs shallow equality check on { count, text }
const { count, text } = useStore(
  useShallow((state) => ({
    count: state.count,
    text: state.text,
  }))
)

// ✅ Array destructuring with useShallow:
const [bears, fishes] = useStore(
  useShallow((state) => [state.bears, state.fishes])
)
```

---

### Strategy C: Auto-Generating Selectors
If a codebase has extensive stores and developers dislike repeating `(state) => state.foo`, you can generate selector wrappers automatically:

```ts
import { StoreApi, UseBoundStore } from 'zustand'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }
  return store
}

// Usage:
const useBaseBearStore = create<BearStore>()((set) => ({ bears: 0, fishes: 0 }))
export const useBearStore = createSelectors(useBaseBearStore)

// In component:
const bears = useBearStore.use.bears()
const fishes = useBearStore.use.fishes()
```

---

## 5. State Mutation Style: Standard Immutable Spread vs Immer

### Approach A: Standard Immutable Spread
```ts
set((state) => ({
  user: {
    ...state.user,
    profile: {
      ...state.user.profile,
      bio: newBio,
    },
  },
}))
```
- **When to use**: Flat or shallow state (1–2 levels deep).
- **Why**: Zero external dependencies, smallest bundle size, fastest execution speed.

### Approach B: `immer` Middleware
```ts
import { immer } from 'zustand/middleware/immer'

export const useStore = create<Store>()(
  immer((set) => ({
    usersById: {},
    updateUserCity: (id, city) =>
      set((state) => {
        state.usersById[id].address.city = city
      }),
  }))
)
```
- **When to use**: Deeply nested trees, normalized dictionaries, complex array mutations (splice, push, filter in place).
- **Trade-off**: Requires `immer` package, slight runtime Proxy overhead.

---

## 6. State Reset Strategies

### Pattern A: Store-Level `reset()` Action
```ts
export const useFilterStore = create<FilterState & FilterActions>()((set, get, store) => ({
  search: '',
  category: 'all',
  page: 1,
  setSearch: (search) => set({ search }),
  reset: () => set(store.getInitialState()), // Zustand built-in getInitialState()
}))
```

### Pattern B: Global Multi-Store Reset Registry (For User Logout)
When the user logs out, all authenticated stores must be cleared:

```ts
// lib/store-registry.ts
export const storeResetFns = new Set<() => void>()

export const resetAllStores = () => {
  storeResetFns.forEach((resetFn) => resetFn())
}

// Helper wrapper:
export const createResettableStore = <T>(
  stateCreator: StateCreator<T>
) => {
  const store = create(stateCreator)
  storeResetFns.add(() => store.setState(store.getInitialState(), true))
  return store
}
```
In your logout handler:
```ts
const handleLogout = async () => {
  await api.logout()
  resetAllStores() // Resets every registered store back to its initial state
}
```
