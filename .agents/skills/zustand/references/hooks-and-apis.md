# Zustand Hooks & APIs: Complete Reference

This reference documents all APIs, React hooks, and vanilla utilities in Zustand (v5+), along with selector performance rules and re-render behavior.

---

## Complete API Surface Matrix

| API / Hook | Import Path | Scope | Purpose |
| :--- | :--- | :--- | :--- |
| `create` | `zustand` | React | Creates a reactive React hook bound to an underlying Zustand store. |
| `createStore` | `zustand/vanilla` | Vanilla JS / Node | Creates a headless, vanilla Zustand store without React dependencies. |
| `useStore` | `zustand` | React | React Hook that binds any vanilla `StoreApi` to React using `useSyncExternalStore`. |
| `useShallow` | `zustand/react/shallow` | React Hook | Memoizes multi-value selector results using shallow equality comparison. |
| `createWithEqualityFn` | `zustand/traditional` | React (Legacy/Compat) | v4 backward-compatible `create` supporting custom equality function as 2nd arg. |
| `useStoreWithEqualityFn` | `zustand/traditional` | React (Legacy/Compat) | v4 backward-compatible `useStore` supporting custom equality function. |
| `shallow` | `zustand/vanilla/shallow` | Utility | Shallow comparison function for objects, arrays, Maps, and Sets. |

---

## 1. `create` (Primary React Entrypoint)

Creates a custom hook that connects your React components to the store.

### Standard Signature (with TypeScript currying)
```ts
import { create } from 'zustand'

interface BearState {
  bears: number
  increase: (by: number) => void
}

export const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
}))
```

### Properties Attached to the Returned Hook
The returned hook (`useBearStore`) is also a complete `StoreApi` object:
```ts
// 1. Read state imperatively outside components or in event callbacks:
const currentBears = useBearStore.getState().bears

// 2. Mutate state imperatively:
useBearStore.setState({ bears: 10 })

// 3. Subscribe to state updates outside React:
const unsubscribe = useBearStore.subscribe((state, prevState) => {
  console.log('State changed:', state.bears)
})

// 4. Retrieve initial state (for resetting):
const initialState = useBearStore.getInitialState()
```

---

## 2. `createStore` (Vanilla Store)

Creates a standalone Zustand store without any React runtime dependencies. Ideal for server-side code, Node.js scripts, web workers, React Context stores, or vanilla JavaScript.

```ts
import { createStore } from 'zustand/vanilla'

interface CartState {
  items: string[]
  addItem: (item: string) => void
}

export const cartStore = createStore<CartState>()((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}))

// Read and mutate:
console.log(cartStore.getState().items)
cartStore.setState({ items: ['Apple'] })
```

---

## 3. `useStore` (Connecting Vanilla Stores to React)

`useStore` is the React Hook that turns any vanilla store into reactive React state. It powers React Context-scoped stores.

### Signature
```ts
useStore<T, U = T>(store: StoreApi<T>, selector?: (state: T) => U): U
```

### Scoped Store Recipe (React Context)
```tsx
import { createContext, useContext, useState, ReactNode } from 'react'
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

interface TabState {
  activeTab: number
  setActiveTab: (index: number) => void
}

const createTabStore = (initialTab = 0) =>
  createStore<TabState>()((set) => ({
    activeTab: initialTab,
    setActiveTab: (index) => set({ activeTab: index }),
  }))

type TabStoreApi = ReturnType<typeof createTabStore>
const TabContext = createContext<TabStoreApi | null>(null)

export const TabProvider = ({ initialTab = 0, children }: { initialTab?: number; children: ReactNode }) => {
  const [store] = useState(() => createTabStore(initialTab))
  return <TabContext.Provider value={store}>{children}</TabContext.Provider>
}

export const useTabStore = <T,>(selector: (state: TabState) => T): T => {
  const store = useContext(TabContext)
  if (!store) throw new Error('useTabStore must be inside TabProvider')
  return useStore(store, selector)
}
```

---

## 4. `useShallow` (Re-render Optimization Hook)

In Zustand v5, `create` uses React's `useSyncExternalStore` which defaults to `Object.is` reference equality. If your selector returns a newly computed object or array, React sees a new reference on **every store update**, triggering unnecessary component re-renders (and in some cases, infinite loops).

`useShallow` wraps your selector and memoizes its result with a shallow equality check.

### When You MUST Use `useShallow`

#### Case 1: Selecting Multiple Values into an Object
```tsx
import { useShallow } from 'zustand/react/shallow'

// ❌ BAD: Returns a new object literal every render. Re-renders whenever ANY store state changes.
const { name, email } = useUserStore((s) => ({ name: s.name, email: s.email }))

// ✅ GOOD: Only re-renders if name OR email has changed.
const { name, email } = useUserStore(
  useShallow((s) => ({ name: s.name, email: s.email }))
)
```

#### Case 2: Selecting Multiple Values into an Array
```tsx
// ❌ BAD: Returns a new array literal every time.
const [firstName, lastName] = useUserStore((s) => [s.firstName, s.lastName])

// ✅ GOOD: Shallowly checks array elements.
const [firstName, lastName] = useUserStore(
  useShallow((s) => [s.firstName, s.lastName])
)
```

#### Case 3: Computing Derived Slices
```tsx
// ❌ BAD: Object.keys() returns a brand new array reference every call.
const userIds = useUserStore((s) => Object.keys(s.usersById))

// ✅ GOOD: Returns stable reference unless keys actually change.
const userIds = useUserStore(
  useShallow((s) => Object.keys(s.usersById))
)
```

### When NOT to Use `useShallow`
- When selecting a single primitive value (`useStore((s) => s.count)`).
- When selecting an existing object that is already stored in state by reference (`useStore((s) => s.user)`).

---

## 5. `createWithEqualityFn` & `useStoreWithEqualityFn` (Traditional Compat)

In Zustand v4, `create` allowed passing a custom equality function as the second parameter:
`useStore(selector, shallow)`.

In Zustand v5, `create` removed this parameter to align with `useSyncExternalStore`. To support legacy codebases without rewriting all selectors to `useShallow`, pmndrs provides `zustand/traditional`:

```ts
// Requires: npm install use-sync-external-store
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

export const useStore = createWithEqualityFn<State>()((set) => ({ ... }))

// Legacy v4 syntax works:
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }), shallow)
```

> [!TIP]
> **Recommendation**: For modern codebases (Zustand v5+), migrate away from `zustand/traditional` and use standard `create` with `useShallow`.

---

## 6. StoreApi Methods Deep Dive

Every store created with `create` or `createStore` implements `StoreApi<T>`:

### `getState(): T`
Synchronously returns the current state snapshot.
- Safe to call inside event handlers, timeouts, network callbacks, or background jobs.
- **Rule**: Never call `getState()` synchronously during React component rendering to populate JSX without subscribing, as it won't trigger re-renders when data changes.

### `setState(partial | updater, replace?: boolean): void`
Mutates store state.

- **Partial Update (`replace: false` or omitted)**:
  Shallowly merges the provided object with the current state.
  ```ts
  useStore.setState({ count: 5 })
  // or with updater:
  useStore.setState((state) => ({ count: state.count + 1 }))
  ```

- **Complete Replacement (`replace: true`)**:
  Replaces the **entire** state object with the provided value.
  ```ts
  // Zustand v5 strictly requires providing the FULL state when replace is true:
  useStore.setState(initialState, true)
  ```

### `subscribe(listener: (state: T, prevState: T) => void): () => void`
Registers a listener called whenever the store updates. Returns an `unsubscribe` function.

### `getInitialState(): T`
Returns the state as it was when the store was created.
- Essential for state reset routines:
  ```ts
  useStore.setState(useStore.getInitialState(), true)
  ```
