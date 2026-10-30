# Frameworks & Recipes: React Native, Next.js SSR, Testing & TanStack Query

This reference covers platform-specific integrations and production recipes for Zustand (v5+).

---

## 1. React Native & Expo Integration

In React Native and Expo, Zustand is the gold standard for global client state.

### Storage Engines for `persist`

| Storage Engine | Characteristics | Best For |
| :--- | :--- | :--- |
| **`react-native-mmkv`** | Synchronous, ultra-fast C++ storage. Zero async delay. | General app state, user preferences, cart, filters. |
| **`@react-native-async-storage/async-storage`** | Asynchronous, standard RN storage. | Apps where MMKV is not supported (e.g. Expo Go without dev clients). |
| **`expo-secure-store`** | Hardware-backed encrypted keychain/keystore. | Auth tokens, refresh tokens, biometric keys. |

---

### Recipe: Ultra-Fast Synchronous MMKV Storage

```ts
import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV()

const mmkvStorage: StateStorage = {
  setItem: (name, value) => storage.set(name, value),
  getItem: (name) => storage.getString(name) ?? null,
  removeItem: (name) => storage.delete(name),
}

export const useAppPreferencesStore = create<AppPreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'app-preferences',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
)
```

---

### Recipe: Handling Asynchronous Storage & Splash Screen (AsyncStorage)

With asynchronous storage like `AsyncStorage`, initial store state will load asynchronously. To prevent layout flickers or premature navigation before the auth state hydrates:

```ts
// stores/auth-store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface AuthState {
  user: User | null
  token: string | null
  hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setSession: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
```

In your root layout (`app/_layout.tsx`):
```tsx
import * as SplashScreen from 'expo-splash-screen'
import { useAuthStore } from '@/stores/auth-store'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  useEffect(() => {
    if (hasHydrated) {
      SplashScreen.hideAsync()
    }
  }, [hasHydrated])

  if (!hasHydrated) return null

  return <RootNavigation />
}
```

---

## 2. Next.js App Router & Server-Side Rendering (SSR)

### The Two Golden Rules of Zustand with Next.js

1. **Never use global singleton stores for user-specific data on the server**.
   A Next.js Node.js server handles concurrent requests from multiple users in the same process. A global module singleton (`export const useStore = create(...)`) will leak User A's session or data to User B!
2. **React Server Components (RSC) must not read from or write to Zustand stores**.
   RSCs cannot execute hooks and are stateless on the client. Zustand belongs in Client Components (`'use client'`).

---

### Recipe: Per-Request Scoped Store with React Context

```ts
// stores/cart-store.ts
import { createStore } from 'zustand/vanilla'

export interface CartItem {
  id: string
  name: string
  price: number
}

export interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  clearCart: () => void
}

export const createCartStore = (initialItems: CartItem[] = []) =>
  createStore<CartState>()((set) => ({
    items: initialItems,
    addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    clearCart: () => set({ items: [] }),
  }))
```

```tsx
// providers/cart-store-provider.tsx
'use client'

import { createContext, useContext, useRef, ReactNode } from 'react'
import { useStore } from 'zustand'
import { createCartStore, CartState, CartItem } from '@/stores/cart-store'

type CartStoreApi = ReturnType<typeof createCartStore>

const CartStoreContext = createContext<CartStoreApi | null>(null)

export const CartStoreProvider = ({
  initialItems = [],
  children,
}: {
  initialItems?: CartItem[]
  children: ReactNode
}) => {
  // Use ref to guarantee store is created ONCE per component instance:
  const storeRef = useRef<CartStoreApi | null>(null)
  if (!storeRef.current) {
    storeRef.current = createCartStore(initialItems)
  }

  return (
    <CartStoreContext.Provider value={storeRef.current}>
      {children}
    </CartStoreContext.Provider>
  )
}

export const useCart = <T,>(selector: (state: CartState) => T): T => {
  const store = useContext(CartStoreContext)
  if (!store) {
    throw new Error('useCart must be used within CartStoreProvider')
  }
  return useStore(store, selector)
}
```

---

## 3. Testing Zustand Stores & Components

Testing Zustand is straightforward because stores can be tested headlessly without mounting React components.

### Unit Testing a Store (Vitest / Jest / Bun)

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCounterStore } from './counter-store'

describe('CounterStore', () => {
  beforeEach(() => {
    // Reset store state to initial state before each test:
    useCounterStore.setState(useCounterStore.getInitialState(), true)
  })

  it('increments counter', () => {
    expect(useCounterStore.getState().count).toBe(0)
    useCounterStore.getState().increment()
    expect(useCounterStore.getState().count).toBe(1)
  })

  it('resets counter', () => {
    useCounterStore.getState().increment()
    useCounterStore.getState().reset()
    expect(useCounterStore.getState().count).toBe(0)
  })
})
```

---

### Component Testing with React Testing Library

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { CounterButton } from './CounterButton'
import { useCounterStore } from './counter-store'

describe('<CounterButton />', () => {
  beforeEach(() => {
    useCounterStore.setState(useCounterStore.getInitialState(), true)
  })

  it('displays count and responds to click', () => {
    render(<CounterButton />)

    const button = screen.getByRole('button', { name: /count: 0/i })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(screen.getByRole('button', { name: /count: 1/i })).toBeInTheDocument()
  })
})
```

---

## 4. TanStack Query + Zustand Coexistence

A frequent state management question: *"Should I put API data in Zustand or TanStack Query?"*

### The Separation of Concerns Matrix

| State Type | Examples | Tool | Reason |
| :--- | :--- | :--- | :--- |
| **Server State** | Users list, product details, orders, remote permissions. | **TanStack Query** | Handles caching, deduplication, background revalidation, stale-time, pagination, optimistic updates. |
| **Client / UI State** | Active modal, drawer open/close, table column visibility, dark mode, multi-step checkout form drafts. | **Zustand** | Synchronous, local to client, instant updates without network semantics. |

### The Anti-Pattern: Syncing Query Data into Zustand
```ts
// ❌ ANTI-PATTERN: Copying server query data into Zustand!
const { data } = useQuery({ queryKey: ['user'], queryFn: fetchUser })
useEffect(() => {
  if (data) useUserStore.setState({ user: data })
}, [data])
// Problems: Double renders, cache desynchronization, out-of-order race conditions!
```

### The Correct Pattern: Let Each Tool Own Its Domain
- **TanStack Query** owns fetching & caching the data.
- **Zustand** owns user actions, active filters, selected IDs, and UI toggles.

```tsx
function ProductList() {
  // 1. Client filter owned by Zustand:
  const category = useFilterStore((s) => s.category)
  const setCategory = useFilterStore((s) => s.setCategory)

  // 2. Server data fetched by Query based on Zustand filter:
  const { data: products } = useQuery({
    queryKey: ['products', category],
    queryFn: () => api.getProducts({ category }),
  })

  return (
    <div>
      <CategoryFilter value={category} onChange={setCategory} />
      <ProductGrid items={products} />
    </div>
  )
}
```
