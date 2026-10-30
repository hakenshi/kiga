# Zustand TypeScript Mastery Guide

This guide explains the mechanics of Zustand's TypeScript typing, why the curried `create<T>()(...)` pattern exists, how to type slices and middlewares, and how to resolve complex type errors.

---

## 1. Why `create<T>()(...)` Has Double Parentheses

In TypeScript, you write:

```ts
const useStore = create<State>()((set) => ({ ... }))
//                             ^^  ^^
```

### The Two TypeScript Constraints

1. **State generic `T` is Invariant**:
   In `create(set, get, store)`, the state generic `T` appears in both return positions (covariant: `get(): T`) and parameter positions (contravariant: `set(partial: Partial<T>)`). When a generic parameter is invariant, TypeScript's inference engine cannot infer `T` from the object literal and defaults to `unknown`. Therefore, `T` must be annotated explicitly.

2. **No Partial Generic Type Argument Inference (TS Issue #10571)**:
   In TypeScript, you cannot pass *some* generic arguments while allowing others to be inferred. `create` has multiple type parameters under the hood (State, Mutators, etc.). If you passed `create<State>(...)`, you would be forced to also manually supply all internal mutator tuples.

### The Currying Solution
Zustand provides a curried overload:
- The first call `create<State>()` fixes the state type `T`.
- The second call `(...)` receives the creator function and infers all middleware mutators automatically.

```ts
// Canonical TypeScript syntax:
export const useBearStore = create<BearState>()((set, get) => ({
  bears: 0,
  increase: (by: number) => set((s) => ({ bears: s.bears + by })),
}))
```

> [!NOTE]
> When using `combine` or `redux`, currying is **not** required because those middlewares create and infer the initial state directly:
> `export const useStore = create(combine({ count: 0 }, (set) => ({ ... })))`

---

## 2. Typing the Slices Pattern

When using the Slices pattern, each slice creator must be typed with `StateCreator`:

```ts
StateCreator<CombinedState, MiddlewareMutators, MiddlewareDependencies, SliceState>
```

### Parameters:
1. `CombinedState`: The complete intersection type of all slices (`BearSlice & FishSlice`).
2. `MiddlewareMutators`: Any mutators applied by middlewares on the combined store.
3. `MiddlewareDependencies`: Usually `[]`.
4. `SliceState`: The specific slice interface returned by this creator.

---

### Example A: Slices Without Middlewares

```ts
import { create, StateCreator } from 'zustand'

export interface UserSlice {
  name: string
  setName: (name: string) => void
}

export interface CartSlice {
  items: string[]
  addItem: (item: string) => void
}

export type StoreState = UserSlice & CartSlice

// User slice:
export const createUserSlice: StateCreator<
  StoreState,
  [],
  [],
  UserSlice
> = (set) => ({
  name: '',
  setName: (name) => set({ name }),
})

// Cart slice (reads name from UserSlice):
export const createCartSlice: StateCreator<
  StoreState,
  [],
  [],
  CartSlice
> = (set, get) => ({
  items: [],
  addItem: (item) => {
    console.log(`Adding item for user ${get().name}`)
    set((state) => ({ items: [...state.items, item] }))
  },
})

// Combined store:
export const useAppStore = create<StoreState>()((...a) => ({
  ...createUserSlice(...a),
  ...createCartSlice(...a),
}))
```

---

### Example B: Slices with `devtools` and `persist`

When the combined store uses middlewares, the slice creators must reflect the corresponding mutator tuples in parameter 2:

```ts
import { create, StateCreator } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export interface SettingsSlice {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}

export interface AuthSlice {
  token: string | null
  setToken: (token: string | null) => void
}

export type AppStore = SettingsSlice & AuthSlice

// Define the mutator tuple used across all slices:
type AppMutators = [
  ['zustand/devtools', never],
  ['zustand/persist', unknown]
]

export const createSettingsSlice: StateCreator<
  AppStore,
  AppMutators,
  [],
  SettingsSlice
> = (set) => ({
  theme: 'light',
  // set accepts action name because of devtools:
  setTheme: (theme) => set({ theme }, false, 'settings/setTheme'),
})

export const createAuthSlice: StateCreator<
  AppStore,
  AppMutators,
  [],
  AuthSlice
> = (set) => ({
  token: null,
  setToken: (token) => set({ token }, false, 'auth/setToken'),
})

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createSettingsSlice(...a),
        ...createAuthSlice(...a),
      }),
      { name: 'app-storage' }
    ),
    { name: 'AppStore' }
  )
)
```

---

## 3. Mutator Reference Table

When typing `StateCreator` with middlewares, use these mutator signatures:

| Middleware | Mutator Entry | Notes |
| :--- | :--- | :--- |
| `devtools` | `['zustand/devtools', never]` | Modifies `set` to accept `actionName` string |
| `persist` | `['zustand/persist', PersistedState]` | `PersistedState` is return type of `partialize` (or `unknown`) |
| `immer` | `['zustand/immer', never]` | Modifies `set` to accept mutable draft updater |
| `subscribeWithSelector` | `['zustand/subscribeWithSelector', never]` | Modifies `store.subscribe` with selector overload |
| `redux` | `['zustand/redux', ActionType]` | Adds `dispatch(action: ActionType)` to store |

---

## 4. Helper Types & Recipes

### `ExtractState`: Inferring Store State Type
If you have an existing store and need to derive its state type:

```ts
import { ExtractState } from 'zustand'
import { useAuthStore } from './auth-store'

export type AuthState = ExtractState<typeof useAuthStore>
```

---

### Dynamic `replace` Flag Workaround (Zustand v5)
In Zustand v5, `setState` has strictly overloaded types:
- `setState(partial, replace?: false)`
- `setState(completeState, replace: true)`

If your `replace` flag is a dynamic boolean variable at runtime, TypeScript will complain that `boolean` doesn't match `false | true` literal overloads. Resolve this using `as Parameters<...>`:

```ts
const shouldReplace = checkCondition()
const newState = { count: 10 }

const args = [newState, shouldReplace] as Parameters<typeof useStore.setState>
useStore.setState(...args)
```

---

### Typing Custom Middlewares (Higher-Kinded Mutators)

To write a reusable middleware that preserves store type inference:

```ts
import { StateCreator, StoreMutatorIdentifier } from 'zustand'

type LoggerMiddleware = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string
) => StateCreator<T, Mps, Mcs>

export const logger: LoggerMiddleware = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...a) => {
    set(...(a as Parameters<typeof set>))
    console.log(`[${name ?? 'store'} update]:`, get())
  }
  return f(loggedSet, get, store)
}
```
