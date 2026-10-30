---
name: zustand
description: >-
  Architect, implement, optimize, and debug state management using Zustand (v5+).
  Make sure to use this skill whenever the user mentions Zustand, global state in React,
  React Native, Expo, or Next.js, designing stores, choosing between state management
  approaches (e.g. single store vs slices pattern vs multiple stores, colocated actions vs
  external actions, global singleton vs Context-scoped stores, atomic selectors vs useShallow),
  configuring Zustand middlewares (persist, devtools, immer, subscribeWithSelector, combine, redux),
  resolving TypeScript errors with currying or slices, optimizing re-renders, or fixing SSR hydration issues.
---

# Zustand State Management & Architecture Guide

Zustand is a small, fast, unopinionated state management solution based on external stores and React's `useSyncExternalStore`. It eliminates boilerplate while providing complete flexibility across SPAs, SSR (Next.js), and mobile (React Native / Expo).

---

## 1. When to Use Zustand vs Alternatives

Before creating a store, verify the state boundary:

```
Is the state fetched from an API/backend?
 ├── YES ──> Use TanStack Query / RTK Query (Caching, stale-time, refetching).
 └── NO
      │
      Does only a single component or its direct children need it?
       ├── YES ──> Use useState / useReducer.
       └── NO
            │
            Is it low-velocity config/theme with zero rapid updates?
             ├── YES ──> React Context is acceptable.
             └── NO ──> USE ZUSTAND (Global, high-performance, selector-driven).
```

---

## 2. Approach X vs Approach Y: The 5 Core Architectural Decisions

### Matrix 1: Store Topology (Single Store vs Slices vs Multiple Stores)

| Approach | When to Choose | When to Avoid |
| :--- | :--- | :--- |
| **Multiple Stores** *(Recommended default)* | Distinct domains with independent lifecycles (e.g. `useAuthStore`, `useThemeStore`, `useCartStore`). Different storage engines. | Slices must tightly react to each other's state synchronously in real time. |
| **Slices Pattern** | Large, interconnected sub-domains (e.g. `userSlice` + `permissionsSlice` inside `useAccountStore`) sharing one storage key. | Dumping unrelated app features into one mega-store. |
| **Single Monolithic Store** | Small applications or self-contained widgets (< 200 lines of store code). | Scaling enterprise apps. |

👉 *For detailed patterns and code: [references/architectural-decisions.md](references/architectural-decisions.md#1-store-topology)*

---

### Matrix 2: Action Placement (Colocated Store Actions vs External Module Actions)

```ts
// Approach A: Colocated in Store (Default)
export const useCounter = create<Counter>()((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}))

// Approach B: External Module Actions ("No Store Actions")
export const useCounter = create<CounterState>(() => ({ count: 0 }))
export const inc = () => useCounter.setState((s) => ({ count: s.count + 1 }))
```

- **Choose Colocated Actions** if: You use Context-scoped stores (`createStore` for Next.js SSR), need dynamic stores, or prefer self-encapsulated models.
- **Choose External Actions** if: You are on React Native or client SPA and want zero selector boilerplate in components (`<button onClick={inc}>`) and superior code splitting.

👉 *Read trade-offs: [references/architectural-decisions.md](references/architectural-decisions.md#2-action-placement)*

---

### Matrix 3: Store Scope (Global Singleton vs React Context Scoped Store)

- **Global Singleton (`create(...)`)**: Use for client-only SPAs, Vite, React Native (Expo). Stores are imported directly into components or vanilla TS files.
- **Context-Scoped Store (`createStore(...)` + `createContext`)**: **Mandatory for Next.js App Router / SSR** to prevent cross-request state leakage between server requests. Also ideal for reusable component libraries where multiple instances of the same widget exist on one screen with independent state.

👉 *Read setup and recipes: [references/architectural-decisions.md](references/architectural-decisions.md#3-store-scope)*

---

### Matrix 4: Re-render Optimization & Selector Strategies

In Zustand v5, returning a new object or array from a selector **triggers a re-render** and can cause infinite update loops.

```tsx
// ❌ WRONG (v5 Anti-Pattern): Returns a new object reference every render
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }))

// ✅ OPTION 1: Atomic primitive selectors (Best for 1-2 values)
const a = useStore((s) => s.a)
const b = useStore((s) => s.b)

// ✅ OPTION 2: useShallow (Mandatory for multi-property objects / arrays)
import { useShallow } from 'zustand/react/shallow'

const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })))
const [first, second] = useStore(useShallow((s) => [s.first, s.second]))
```

👉 *Read selector rules: [references/hooks-and-apis.md](references/hooks-and-apis.md#4-useshallow)*

---

### Matrix 5: State Mutation Style (Immutable Spread vs `immer`)

- **Standard Spread (`...state`)**: Best for flat or shallow state (1–2 levels). Zero dependencies, best performance.
- **`immer` Middleware**: Best for deeply nested trees, normalized dictionaries, or complex array mutations (splice/push).

👉 *Read Immer usage: [references/middlewares.md](references/middlewares.md#3-immer-middleware)*

---

## 3. Middleware Catalog & Composition Order

### The Golden Rule of Middleware Ordering
Always place `devtools` as the **outermost** wrapper:

```ts
// ✅ Correct order:
devtools(persist(subscribeWithSelector(immer((set, get) => ({ ... })))))
```
*Why? `devtools` extends `set` with action name arguments (`set(fn, false, 'actionName')`). Placing other middlewares outside `devtools` strips these names.*

### Middlewares Quick Reference

1. **`persist`** (`zustand/middleware`):
   - Storage backends: `localStorage`, `AsyncStorage`, `MMKV`, `sessionStorage`, URL search params.
   - Always wrap storage with `createJSONStorage(() => storage)`.
   - Use `partialize` to omit temporary UI states or sensitive functions.
   - Use `version` and `migrate` for breaking schema evolutions.
   - In SSR / Next.js, use `skipHydration: true` or hydration status checks to avoid hydration mismatches.
2. **`devtools`** (`zustand/middleware`):
   - Connects to Redux DevTools extension. Pass action names: `set({ count }, false, 'count/set')`.
   - Auto-disable in production: `enabled: process.env.NODE_ENV !== 'production'`.
3. **`immer`** (`zustand/middleware/immer`):
   - Mutative draft syntax for deep nested updates: `set((draft) => { draft.user.address.city = 'NY' })`.
4. **`subscribeWithSelector`** (`zustand/middleware`):
   - Granular subscriptions outside React: `store.subscribe(selector, listener, { fireImmediately, equalityFn })`.
   - Perfect for audio triggers, analytics, native device APIs, and web sockets.
5. **`combine`** (`zustand/middleware`):
   - Merges initial state with actions creator and auto-infers state types.
6. **`redux`** (`zustand/middleware`):
   - Redux reducer `(state, action) => newState` + `store.dispatch(action)`. Useful for migrating legacy Redux code.

👉 *Exhaustive options, mutator types, and examples: [references/middlewares.md](references/middlewares.md)*

---

## 4. Hooks & APIs Reference

- **`create<T>()(...)`**: Primary hook creator for React. Currying `()(...)` is required in TypeScript to annotate state while allowing middleware mutators to be inferred.
- **`createStore<T>()(...)`**: Vanilla headless store (no React). Used for Context-scoped stores, SSR factories, node services, and testing.
- **`useStore(store, selector)`**: React hook connecting any vanilla `createStore` to React using `useSyncExternalStore`.
- **`useShallow(selector)`**: Memoizes multi-value selector results with shallow equality.
- **`createWithEqualityFn` / `useStoreWithEqualityFn`** (`zustand/traditional`): Legacy v4 backward compatibility. Prefer `create` + `useShallow` for modern code.
- **Imperative Methods**:
  - `store.getState()`: Synchronous non-reactive read (use in event handlers, API interceptors, outside React).
  - `store.setState(partial, replace?)`: Synchronous update. In v5, `replace: true` requires full state object.
  - `store.getInitialState()`: Returns starting state (use for resets).
  - `store.subscribe(listener)`: Subscribes to changes.

👉 *Full details: [references/hooks-and-apis.md](references/hooks-and-apis.md)*

---

## 5. TypeScript Mastery Cheatsheet

### Currying Requirement Explained
Generic `T` is invariant in `create`. Passing `create<T>(...)` breaks middleware inference (Microsoft TS#10571). The double-paren currying `create<T>()(...)` fixes `T` in step 1 and infers mutators in step 2.

### Slices Pattern Mutators
When typing slices that use middlewares:
```ts
// With devtools:
StateCreator<CombinedStore, [['zustand/devtools', never]], [], MySlice>

// With devtools and persist:
StateCreator<CombinedStore, [['zustand/devtools', never], ['zustand/persist', unknown]], [], MySlice>
```

### Inferring Store Type
```ts
import { ExtractState } from 'zustand'
type MyState = ExtractState<typeof useMyStore>
```

👉 *Deep dive & custom middleware typing: [references/typescript-mastery.md](references/typescript-mastery.md)*

---

## 6. Framework Recipes

- **React Native / Expo**: Use `MMKV` via `createJSONStorage(() => mmkvStorage)` for instant sync storage. With `AsyncStorage`, handle hydration status to prevent layout flicker.
- **Next.js App Router (SSR)**: Create stores per-request via `createStore` + `createContext` + `useRef` provider. Never use global singletons for user data on the server. Never use Zustand inside React Server Components.
- **Testing**: Test stores headlessly with `store.getState()` and `store.setState()`. Reset state before each test using `store.setState(store.getInitialState(), true)`.
- **TanStack Query Coexistence**: Server data belongs in TanStack Query. Client/UI toggles, filters, and drafts belong in Zustand. Never copy query data into Zustand.

👉 *Production templates & code: [references/frameworks-and-recipes.md](references/frameworks-and-recipes.md)*
