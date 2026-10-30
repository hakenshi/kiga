# Zustand Middlewares: Complete Reference & Guide

This guide covers all official Zustand middlewares, their complete options, TypeScript mutators, composition ordering, and battle-tested recipes.

---

## Quick Middleware Overview & Mutators

| Middleware | Import Path | TypeScript Mutator | Purpose |
| :--- | :--- | :--- | :--- |
| `persist` | `zustand/middleware` | `['zustand/persist', PersistedState]` | Persist store to storage (`localStorage`, `AsyncStorage`, `MMKV`, `IndexedDB`, URL). |
| `devtools` | `zustand/middleware` | `['zustand/devtools', never]` | Connects to Redux DevTools extension for inspection & time-travel debugging. |
| `immer` | `zustand/middleware/immer` | `['zustand/immer', never]` | Enables draft-based mutable syntax (`state.a.b = c`) for nested state updates. |
| `subscribeWithSelector` | `zustand/middleware` | `['zustand/subscribeWithSelector', never]` | Enables granular subscriptions with selectors outside React (`store.subscribe(selector, listener)`). |
| `combine` | `zustand/middleware` | *(None — infers state)* | Merges initial state object with actions creator, auto-inferring types. |
| `redux` | `zustand/middleware` | `['zustand/redux', ActionType]` | Adds Redux-style reducer and `dispatch(action)` method to the store. |

---

## Middleware Composition: The Golden Ordering Rule

When stacking multiple middlewares, **ordering matters**.

> [!IMPORTANT]
> **Rule of Thumb**: Put `devtools` as the **outermost** middleware.
>
> `devtools(persist(immer(...)))` ✅
> `immer(devtools(...))` ❌
>
> **Why?** `devtools` modifies the signature of `set` to accept an action name (e.g., `set(updater, replace, 'actionName')`). If `immer` or another middleware is placed outside `devtools`, that middleware's wrapper around `set` will discard or mishandle the action name argument.

```ts
// Canonical middleware composition:
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // State and actions
        }))
      ),
      { name: 'app-storage' }
    ),
    { name: 'AppStore' }
  )
)
```

---

## 1. `persist` Middleware

Persists state across browser reloads, native app restarts, or user sessions.

### Signature & Basic Example

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SettingsState {
  theme: 'light' | 'dark'
  notificationsEnabled: boolean
  tempSessionId: string
  setTheme: (theme: 'light' | 'dark') => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      notificationsEnabled: true,
      tempSessionId: '',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage', // Required: Unique key in storage
      storage: createJSONStorage(() => localStorage), // Defaults to localStorage
    }
  )
)
```

### Complete Options Reference

```ts
interface PersistOptions<T, U = T> {
  name: string                          // Unique key name in storage engine
  storage?: PersistStorage<U>           // Storage backend (use createJSONStorage)
  partialize?: (state: T) => U          // Whitelist or blacklist properties
  onRehydrateStorage?: (state: T) => ((state?: T, error?: Error) => void) | void
  version?: number                      // Schema version (defaults to 0)
  migrate?: (persistedState: unknown, version: number) => T | Promise<T>
  merge?: (persistedState: unknown, currentState: T) => T
  skipHydration?: boolean               // Delay hydration for manual trigger (SSR safe)
}
```

### Deep Dive: `partialize` (Omit or Whitelist fields)
Never persist temporary UI states, auth tokens with short lifespans, or non-serializable objects (functions, WebSocket instances).

```ts
// Whitelisting only specific fields:
partialize: (state) => ({
  theme: state.theme,
  notificationsEnabled: state.notificationsEnabled,
}),

// Blacklisting specific fields:
partialize: (state) => {
  const { tempSessionId, ...rest } = state
  return rest
},
```

### Deep Dive: `version` & `migrate` (Schema Evolution)
When releasing an app update that renames or restructures a persisted property, use `version` and `migrate` so existing users' stored data isn't corrupted or wiped:

```ts
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: { fullName: '' }, // Version 1: fullName
    }),
    {
      name: 'profile-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Version 0 had firstName and lastName
          return {
            profile: {
              fullName: `${persistedState.firstName ?? ''} ${persistedState.lastName ?? ''}`.trim(),
            },
          }
        }
        return persistedState as ProfileState
      },
    }
  )
)
```

### Deep Dive: `merge` (Nested Objects)
By default, `persist` performs a **shallow merge** (`{ ...current, ...persisted }`). If you have nested objects, shallow merging will overwrite any newly introduced default properties in your store with the older stored snapshot.

```ts
import deepMerge from 'deepmerge' // or custom merge

merge: (persistedState, currentState) =>
  deepMerge(currentState, (persistedState as object) || {}, {
    arrayMerge: (_, source) => source, // Keep latest array or customize
  }),
```

### Deep Dive: Hydration Lifecycle & Methods
The `persist` middleware attaches a `.persist` API to your store:

```ts
// 1. Check if hydration has completed (synchronous, non-reactive)
const hasHydrated = useSettingsStore.persist.hasHydrated()

// 2. Trigger manual rehydration (useful when skipHydration: true)
await useSettingsStore.persist.rehydrate()

// 3. Clear storage item
useSettingsStore.persist.clearStorage()

// 4. Listen to hydration events
const unsubStart = useSettingsStore.persist.onHydrate((state) => {
  console.log('Hydration started')
})

const unsubEnd = useSettingsStore.persist.onFinishHydration((state) => {
  console.log('Hydration finished successfully')
})
```

#### Safe SSR Hydration Hook Recipe
In SSR frameworks (Next.js), reading from localStorage during initial render causes hydration mismatches. Use this hook:

```ts
import { useState, useEffect } from 'react'

export const useHydratedStore = <T, U>(
  store: (selector: (state: T) => U) => U,
  selector: (state: T) => U
): U | undefined => {
  const [hydrated, setHydrated] = useState(false)
  const result = store(selector)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated ? result : undefined
}
```

---

## 2. `devtools` Middleware

Connects the store to the Redux DevTools extension for action logging, state diffing, and time-travel debugging.

### Basic Setup & Action Naming
In standard Zustand, `set` updates are anonymous. With `devtools`, you can pass action names as the 3rd argument to `set`:

```ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface CounterState {
  count: number
  increment: () => void
  decrement: () => void
  resetTo: (value: number) => void
}

export const useCounterStore = create<CounterState>()(
  devtools(
    (set) => ({
      count: 0,
      // 1. Pass action name as 3rd parameter:
      increment: () =>
        set((state) => ({ count: state.count + 1 }), false, 'counter/increment'),

      decrement: () =>
        set((state) => ({ count: state.count - 1 }), false, 'counter/decrement'),

      // 2. Complete replacement with replace: true + action name:
      resetTo: (value) =>
        set({ count: value }, true, 'counter/resetTo'),
    }),
    {
      name: 'CounterStore', // Connection name in DevTools
      enabled: process.env.NODE_ENV !== 'production', // Auto-disabled in prod
      actionsDenylist: ['heartbeat/.*'], // Filter noisy actions
    }
  )
)
```

### DevTools Options Reference

- `name`: Identifier displayed in Redux DevTools store dropdown.
- `enabled`: Set to `false` in production to prevent memory leaks and security inspection.
- `anonymousActionType`: Fallback name when an action name is omitted (defaults to `'anonymous'`).
- `actionsDenylist`: String array of regexes to filter out high-frequency events (e.g. `['mouse/move', 'timer/tick']`).

---

## 3. `immer` Middleware

Allows direct mutations on state drafts, powered by Immer.

### When to Use
- Deeply nested objects (`state.users[id].preferences.notifications.email = true`).
- Complex array operations (`state.items.splice(index, 1)` or `state.todos.push(newTodo)`).

### When NOT to Use
- Flat state structures. Creating Proxy drafts has runtime overhead and increases bundle size.

### Example

```ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Todo {
  id: string
  text: string
  done: boolean
}

interface TodoState {
  todos: Record<string, Todo>
  toggleTodo: (id: string) => void
  addTodo: (todo: Todo) => void
}

export const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: {},
    // Direct mutation inside the draft:
    toggleTodo: (id) =>
      set((draft) => {
        if (draft.todos[id]) {
          draft.todos[id].done = !draft.todos[id].done
        }
      }),
    addTodo: (todo) =>
      set((draft) => {
        draft.todos[todo.id] = todo
      }),
  }))
)
```

---

## 4. `subscribeWithSelector` Middleware

By default, `store.subscribe(listener)` triggers on **any** state update in the store. `subscribeWithSelector` enhances `subscribe` to accept a selector, firing the listener **only when that selected value changes**.

### Signature

```ts
store.subscribe(
  selector: (state: T) => U,
  listener: (selectedState: U, previousSelectedState: U) => void,
  options?: {
    equalityFn?: (a: U, b: U) => boolean
    fireImmediately?: boolean
  }
): () => void // Returns unsubscribe function
```

### Ideal Use Cases: Outside React Effects
- Audio playback triggers (e.g., play sound when health drops to 0).
- Analytics tracking (e.g., track user level-up).
- Route redirection or deep linking.
- WebSocket message dispatching.

### Example

```ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface GameState {
  score: number
  health: number
  isGameOver: boolean
  damage: (amount: number) => void
}

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    score: 0,
    health: 100,
    isGameOver: false,
    damage: (amount) =>
      set((state) => {
        const nextHealth = Math.max(0, state.health - amount)
        return {
          health: nextHealth,
          isGameOver: nextHealth === 0,
        }
      }),
  }))
)

// Subscribing outside React to play sound effect only when health changes:
useGameStore.subscribe(
  (state) => state.health,
  (health, prevHealth) => {
    if (health < prevHealth) {
      soundEffects.play('ouch.mp3')
    }
  }
)

// Subscribing with fireImmediately:
useGameStore.subscribe(
  (state) => state.isGameOver,
  (isGameOver) => {
    if (isGameOver) analytics.logEvent('game_over')
  },
  { fireImmediately: true }
)
```

---

## 5. `combine` Middleware

Merges an initial state with an actions creator. It automatically infers the state types, so you don't need `create<MyState>()(...)` currying.

```ts
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

export const usePositionStore = create(
  combine(
    { x: 0, y: 0 }, // 1. Initial state (types inferred automatically)
    (set) => ({
      setPosition: (x: number, y: number) => set({ x, y }),
    })
  )
)
```

### Trade-offs of `combine`
- **Pros**: Fast to write for simple stores; zero TypeScript type parameter boilerplate.
- **Cons**: Inside actions, `get()` is typed only as the first object (`{ x: number, y: number }`), not including the actions. Replacing state via `set({ x: 0 }, true)` will compile but will delete the actions. Use `create<T>()(...)` for complex or enterprise stores.

---

## 6. `redux` Middleware

Enables traditional Redux-style action dispatching and reducer pattern.

### When to Use
- Porting an existing Redux or useReducer application to Zustand without rewriting reducers.
- Strict action-driven event sourcing requirements.

### Example

```ts
import { create } from 'zustand'
import { redux } from 'zustand/middleware'

interface State {
  count: number
}

type Action =
  | { type: 'INCREMENT'; by: number }
  | { type: 'DECREMENT'; by: number }

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + action.by }
    case 'DECREMENT':
      return { count: state.count - action.by }
    default:
      return state
  }
}

export const useReduxStore = create(
  redux(reducer, { count: 0 })
)

// Usage:
// const count = useReduxStore((s) => s.count)
// const dispatch = useReduxStore((s) => s.dispatch)
// dispatch({ type: 'INCREMENT', by: 5 })
```
