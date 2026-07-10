# Project Rules

These rules describe how this project is structured and written. Follow them exactly when adding new features or starting a new project with this stack.

---

## Project Initialization — Do This First

When starting a new project from scratch, follow these steps in order before writing any feature code.

> **Before running any command, check the official docs for these libraries — their setup process changes between major versions:**
>
> | Library | Why it changes | Official docs |
> |---|---|---|
> | `shadcn/ui` | Init command and generated config format change between releases | https://ui.shadcn.com/docs/installation |
> | `tailwindcss` | v4 dropped `tailwind.config.ts` and changed the Vite plugin entirely | https://tailwindcss.com/docs/installation/vite |
> | `react-router` | v6 → v7 had breaking API and setup changes | https://reactrouter.com/start/library/installation |
>
> Everything else below (`zustand`, `axios`, `zod`, `react-hook-form`, `sonner`, `lucide-react`) is a plain `npm install` with no init step — those commands do not change.

```bash
# 1. Create the Vite + React + TypeScript project
npm create vite@latest my-app -- --template react-ts
cd my-app

# 2. Install all core dependencies (stable — no need to verify)
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand
npm install axios
npm install react-hook-form
npm install zod @hookform/resolvers
npm install react-router
npm install sonner
npm install lucide-react
npm install clsx tailwind-merge class-variance-authority

# 3. [VERIFY] Initialize shadcn/ui — check https://ui.shadcn.com/docs/installation first
npx shadcn@latest init

# 4. [VERIFY] Install Tailwind — check https://tailwindcss.com/docs/installation/vite first
# (shadcn may already handle this — confirm before running)
npm install tailwindcss @tailwindcss/vite
```

Then configure the `@/` path alias before writing any imports:

```ts
// vite.config.ts
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

```json
// tsconfig.app.json — add inside compilerOptions
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Then create the folder structure before writing any code:

```
src/
├── api/
├── components/
│   ├── custom/
│   ├── routes/
│   └── ui/
├── interfaces/
├── lib/
│   └── utils.ts       ← create this first (cn helper)
└── [feature]/
    ├── actions/
    ├── components/
    ├── hooks/
    ├── interfaces/
    ├── layouts/
    ├── pages/
    └── store/
```

Finally, create these files before anything else:
1. `src/lib/utils.ts` — the `cn()` helper
2. `src/api/[name]Api.ts` — the axios instance
3. `src/app.router.tsx` — the route tree
4. `src/main.tsx` — the entry point with `QueryClientProvider`
5. `PROJECT_MAP.md` — the project documentation file

---

## Tech Stack

| Need | Library | Never use instead |
|---|---|---|
| HTTP requests | `axios` (one instance) | `fetch` directly |
| Global state | `zustand` | Redux, Context for global state |
| Server state / data fetching | `@tanstack/react-query` | `useEffect` + `useState` for API calls |
| Forms | `react-hook-form` + `zod` | `useState` per field |
| Routing | `react-router` v7 | Next.js routing, `react-router-dom` v5/v6 |
| Styling | Tailwind CSS | CSS modules, styled-components, inline styles |
| UI primitives | `shadcn/ui` (Radix-based) | MUI, Chakra, Ant Design |
| Icons | `lucide-react` | FontAwesome, react-icons |
| Class merging | `cn()` from `lib/utils.ts` | string concatenation |
| Toasts | `sonner` | react-toastify, alert() |
| TypeScript | always strict | plain JS |

---

## File Structure

Every feature lives in its own folder. Each folder follows this exact structure:

```
feature/
├── actions/      ← pure async functions that call the API
├── components/   ← UI pieces used only in this feature
├── hooks/        ← TanStack Query wrappers around actions
├── interfaces/   ← TypeScript types specific to this feature
├── layouts/      ← page shells (header/footer/sidebar + <Outlet>)
├── pages/        ← route-level components
└── store/        ← Zustand stores (only when global state is needed)
```

Shared across features goes in:
```
src/
├── api/           ← the single axios instance
├── components/
│   ├── custom/    ← custom reusable components
│   ├── routes/    ← route guard components
│   └── ui/        ← shadcn/ui primitives (auto-generated, do not edit manually)
├── interfaces/    ← types shared by multiple features
└── lib/           ← pure utility functions (no React, no API)
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Actions | `kebab-case.action.ts` | `get-products.action.ts` |
| Hooks | `camelCase.tsx` prefixed with `use` | `useProducts.tsx` |
| Stores | `kebab-case.store.ts` | `auth.store.ts` |
| Interfaces | `kebab-case.interface.ts` | `product.interface.ts` |
| Components | `PascalCase.tsx` | `ProductCard.tsx` |
| Pages | `PascalCase` ending in `Page` | `AdminProductPage.tsx` |
| Layouts | `PascalCase` ending in `Layout` | `ShopLayout.tsx` |

---

## Rule 1 — One Axios Instance

Create a single axios instance in `src/api/[name]Api.ts`. Never call `axios.get()` directly in components or hooks. Only action files may import this instance — it is the boundary that isolates the HTTP client from the rest of the app (see Rule 34).

```ts
// src/api/tesloApi.ts
const tesloApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// add auth token to every request via interceptor
tesloApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

## Rule 2 — Actions Are Pure Async Functions

Actions only do three things: call the API, transform the response, and return typed data. No state, no hooks, no side effects.

```ts
// src/shop/actions/get-products.action.ts
export const getProductsAction = async (options: Options): Promise<ProductsResponse> => {
  const { data } = await tesloApi.get<ProductsResponse>('/products', { params: options });
  return data;
};
```

- One action per file
- File name matches the action: `get-products.action.ts` → `getProductsAction`
- Always return a typed value — never `any`
- Always use the shared axios instance

---

## Rule 3 — Hooks Wrap Actions with TanStack Query

Hooks are the bridge between actions and components. They handle caching, loading states, and re-fetching automatically.

```ts
// useQuery for reading data
export const useProducts = () => {
  return useQuery({
    queryKey: ['products', { ...params }],  // include all params so each combo is cached
    queryFn: () => getProductsAction(params),
    staleTime: 1000 * 60 * 5,              // cache for 5 minutes
  });
};

// useMutation for creating/updating/deleting
const mutation = useMutation({
  mutationFn: createUpdateProductAction,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] }); // clear cache
  },
});
```

Rules:
- Always set `staleTime` — never leave it at 0 unless data changes every second
- The `queryKey` must include every variable the query depends on
- Mutations invalidate affected queries on success
- Never call actions directly from components — always go through a hook

---

## Rule 4 — Global State Only in Zustand

Only use Zustand for state that multiple unrelated components need (auth, cart, theme). Everything else is either local `useState` or URL state.

```ts
// src/auth/store/auth.store.ts
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  authStatus: 'checking',

  login: async (email, password) => {
    const data = await loginAction(email, password);
    localStorage.setItem('token', data.token);
    set({ user: data.user, token: data.token, authStatus: 'authenticated' });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, authStatus: 'not-authenticated' });
  },
}));
```

Rules:
- Define types for state and actions at the top of the store file
- Call actions from within the store methods — not in components
- Persist tokens in `localStorage`, inject them via the axios interceptor
- Use `get()` inside the store to read other state values

---

## Rule 5 — URL as State for Filters and Pagination

Never store filters, search queries, or pagination in `useState`. Write them to the URL with `useSearchParams`. This makes the back button work and URLs shareable.

```ts
// reading
const [searchParams] = useSearchParams();
const page = searchParams.get('page') || 1;
const sizes = searchParams.get('sizes')?.split(',') || [];

// writing
searchParams.set('page', newPage.toString());
setSearchParams(searchParams);

// converting arrays to/from URL strings
sizes.join(',')    // array → "M,L,XL"  for the URL
"M,L,XL".split(',') // "M,L,XL" → array  from the URL
```

---

## Rule 6 — Use react-hook-form + Zod for Complex Forms

Never manage form fields with individual `useState` calls. Use `react-hook-form` with `zod` for validation.

Zod defines the shape and validation rules. react-hook-form connects it to the UI. They work together via `@hookform/resolvers/zod`.

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. define the schema — this is the single source of truth for validation
const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.number().min(0, 'Price must be positive'),
  stock: z.number().int().min(0),
  gender: z.enum(['men', 'women', 'kid', 'unisex']),
});

// 2. infer the TypeScript type from the schema — no duplication
type ProductFormInputs = z.infer<typeof productSchema>;

// 3. wire them together
const { register, handleSubmit, formState: { errors } } = useForm<ProductFormInputs>({
  resolver: zodResolver(productSchema),
  defaultValues: product,
});

// 4. error messages come from the schema
{errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
```

- Use `register` for simple inputs
- Use `setValue` / `getValues` for programmatic changes (e.g. tag/size arrays)
- Use `watch` only when the UI needs to react to a field value changing
- The Zod schema is also reusable for validating API responses in actions

> **Exception — simple forms:** For forms with only 1–2 fields and no complex validation (login, search), use native `FormData` instead. See Rule 25.

---

## Rule 7 — Layouts Use `<Outlet>`

Layouts render the shared chrome (header, footer, sidebar) and a single `<Outlet>` where the current page renders. Never import pages into layouts.

```tsx
export const ShopLayout = () => (
  <div>
    <CustomHeader />
    <Outlet />        {/* current route's page renders here */}
    <CustomFooter />
  </div>
);
```

---

## Rule 8 — Route Guards Are Wrapper Components

Protect routes by wrapping layouts in guard components. Guards read from the Zustand auth store and redirect if the condition is not met.

```tsx
export const AdminRoute = ({ children }: PropsWithChildren) => {
  const { authStatus, isAdmin } = useAuthStore();
  if (authStatus === 'checking') return null;           // wait
  if (authStatus === 'not-authenticated') return <Navigate to="/auth/login" />;
  if (!isAdmin()) return <Navigate to="/" />;
  return children;
};

// in app.router.tsx
{
  path: '/admin',
  element: <AdminRoute><AdminLayout /></AdminRoute>,
}
```

---

## Rule 9 — Styling with Tailwind + cn()

All styling is done with Tailwind utility classes. Use the `cn()` helper whenever classes need to be conditionally applied or merged.

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-styles here',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed',
)}>
```

Never write inline `style={{}}` unless Tailwind cannot do it (e.g. dynamic pixel values from JS variables).

---

## Rule 10 — shadcn/ui for UI Primitives

Use shadcn/ui components for buttons, inputs, checkboxes, labels, etc. These live in `src/components/ui/` and are owned by the project (not a black-box npm package).

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
```

Add new shadcn components with: `npx shadcn@latest add <component>`

---

## Rule 11 — Toasts with Sonner

Show success and error feedback with `sonner`. Never use `alert()` or `window.confirm()`.

```ts
import { toast } from 'sonner';

toast.success('Producto guardado', { position: 'top-right' });
toast.error('Error al guardar el producto');
```

The `<Toaster />` component must be mounted once at the root level (`TesloShopApp.tsx`).

---

## Rule 12 — Lazy Load Heavy Layouts

Lazy-load layouts that are not needed on first render (auth, admin) to reduce initial bundle size. `lazy()` requires a `<Suspense>` boundary — without it the app crashes.

```tsx
// app.router.tsx
import { lazy, Suspense } from 'react';
import { CustomFullScreenLoading } from '@/components/custom/CustomFullScreenLoading';

const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));

// wrap lazy routes in Suspense
{
  path: '/admin',
  element: (
    <AdminRoute>
      <Suspense fallback={<CustomFullScreenLoading />}>
        <AdminLayout />
      </Suspense>
    </AdminRoute>
  ),
}
```

Only lazy-load layouts and heavy pages — not small components. The public shop layout loads immediately since it's the default route.

---

## Rule 13 — Always Use Named Exports

Always use named exports for components, hooks, actions, and utilities. Never use default exports except for lazy-loaded layouts (which React's `lazy()` requires to be default exports).

```tsx
// bad — default export
export default function ProductCard() { ... }

// good — named export
export const ProductCard = () => { ... }
```

Named exports are explicit — the import name always matches the exported name, which makes refactoring and searching the codebase reliable.

```tsx
// the one exception — lazy-loaded layouts use default export
// AdminLayout.tsx
const AdminLayout = () => { ... };
export default AdminLayout;  // required by React.lazy()

// app.router.tsx
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));
```

---

## Rule 14 — TypeScript Interfaces for Everything

Every API response, store state, and component prop must have a TypeScript interface or type. Never use `any`.

```ts
// interfaces/product.interface.ts
export interface Product {
  id: string;
  title: string;
  price: number;
  sizes: Size[];
  gender: Gender;
}

export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type Gender = 'kid' | 'men' | 'women' | 'unisex';
```

Rules:
- Shared types go in `src/interfaces/`
- Feature-specific types go in `feature/interfaces/`
- Use `Partial<T>` when only some fields are required (e.g. form submit before saving)
- Use union types (`'a' | 'b' | 'c'`) for fields with a fixed set of values

---

## Rule 15 — Use useState and useEffect Only When Necessary

Every `useState` causes a re-render when it changes, and every `useEffect` adds complexity. Before reaching for them, check if something else already handles the problem.

**Prefer these over useState:**
| Need | Use instead |
|---|---|
| Data from the API | `useQuery` from TanStack Query |
| Filter / search / pagination | URL params (`useSearchParams`) |
| Form field values | `react-hook-form` |
| Global shared state | Zustand store |
| Value computed from other state | plain variable or `useMemo` |

**When useState IS appropriate:**
- Local UI toggles (modal open/close, sidebar collapsed, drag active)
- Local list state not tied to the API (e.g. preview files before upload)
- Input values that are purely local and never need to be shared

**Before adding a useEffect, ask:**
- Can TanStack Query handle this re-fetch automatically? (usually yes)
- Is this just derived data I can compute inline instead?
- Am I syncing two pieces of state that should just be one?

```tsx
// bad — syncing state with useEffect
const [fullName, setFullName] = useState('');
useEffect(() => {
  setFullName(`${firstName} ${lastName}`);
}, [firstName, lastName]);

// good — just compute it
const fullName = `${firstName} ${lastName}`;
```

---

## Rule 16 — Replace Multiple useState with useReducer

When a component has **3 or more related `useState` calls**, group them into a single `useReducer`. This prevents inconsistent state (e.g. setting `isLoading` but forgetting to set `isError`) and makes state transitions explicit.

```tsx
// bad — 4 separate states that always change together
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [data, setData] = useState(null);
const [errorMessage, setErrorMessage] = useState('');

// good — one reducer with explicit actions
type State = {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: Product | null;
  errorMessage: string;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Product }
  | { type: 'FETCH_ERROR'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':   return { ...state, status: 'loading', errorMessage: '' };
    case 'FETCH_SUCCESS': return { status: 'success', data: action.payload, errorMessage: '' };
    case 'FETCH_ERROR':   return { ...state, status: 'error', errorMessage: action.payload };
  }
};

const [state, dispatch] = useReducer(reducer, { status: 'idle', data: null, errorMessage: '' });
```

**The rule of thumb:**
- 1–2 unrelated states → `useState`
- 3+ states that change together → `useReducer`
- State needed in multiple components → Zustand store

---

## Rule 17 — Environment Variables via Vite

All environment variables are prefixed with `VITE_` and accessed via `import.meta.env.VITE_*`. Never hardcode URLs or secrets.

```ts
baseURL: import.meta.env.VITE_API_URL
```

---

## Rule 18 — Always Use `@/` Path Aliases

Never use relative paths that climb directories (`../../`). Always import using the `@/` alias which maps to `src/`.

```ts
// bad
import { useAuthStore } from '../../../auth/store/auth.store';

// good
import { useAuthStore } from '@/auth/store/auth.store';
```

This makes imports stable — if a file moves, only its own imports break, not every file that imported from it.

---

## Rule 19 — Define the Props Interface Above Every Component

Every component that receives props must have an explicit `interface Props` defined directly above the component function. Never inline prop types or use `any`.

```tsx
// bad
export const ProductCard = ({ name, price }: { name: string; price: number }) => { ... }

// good
interface Props {
  name: string;
  price: number;
  image: string;
}

export const ProductCard = ({ name, price, image }: Props) => { ... }
```

For components shared across features, name it after the component: `interface ProductCardProps`. For internal/local components, `interface Props` is enough.

---

## Rule 20 — `key` Prop Must Always Be a Stable Unique ID

Every `.map()` that renders JSX must have a `key` prop. Always use a unique ID from the data — never the array index.

```tsx
// bad — index changes on reorder/filter, causes bugs
{products.map((p, index) => <ProductCard key={index} ... />)}

// good
{products.map((product) => <ProductCard key={product.id} ... />)}
```

If the data has no `id`, use a truly unique property (slug, name+category, etc.).

---

## Rule 21 — Static Data Goes Outside the Component

Arrays, objects, and constants that don't depend on props or state should be defined at **module level**, not inside the component. Defining them inside creates a new reference on every render.

```tsx
// bad — recreated on every render
export const ProductForm = () => {
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  ...
}

// good — defined once at module level
const availableSizes: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const ProductForm = () => { ... }
```

---

## Rule 22 — `<Link>` for Internal Navigation, `<a>` Only for External

Never use `<a href="/some-route">` for navigation inside the app — it causes a full page reload. Use React Router's `<Link>` instead.

```tsx
// bad — full page reload
<a href="/admin/products">Back</a>

// good — client-side navigation
<Link to="/admin/products">Back</Link>

// ok — external URL
<a href="https://external.com" target="_blank">External</a>
```

For programmatic navigation (after form submit, etc.) use `useNavigate()`:
```ts
const navigate = useNavigate();
navigate(`/admin/products/${data.id}`);
```

---

## Rule 23 — Page Guard Order: Error → Loading → Missing → Render

When a page fetches data, always check in this exact order before rendering. This prevents crashes from trying to render with undefined data.

```tsx
export const AdminProductPage = () => {
  const { isLoading, isError, data } = useProduct(id);

  if (isError)   return <Navigate to="/admin/products" />;  // 1. API error
  if (isLoading) return <CustomFullScreenLoading />;         // 2. still fetching
  if (!data)     return <Navigate to="/admin/products" />;  // 3. no data

  return <ProductForm product={data} />;                    // 4. safe to render
};
```

After this pattern, you can use `data` safely without `data?.` optional chaining.

---

## Rule 24 — Reset Page to 1 When Any Filter Changes

Whenever a filter (sizes, price, gender, search query) changes, also reset the page to `1`. Without this, the user could be on page 5 with a filter that only has 2 pages.

```ts
const handleSizeChanged = (size: string) => {
  searchParams.set('page', '1');   // ← always reset page
  searchParams.set('sizes', newSizes.join(','));
  setSearchParams(searchParams);
};
```

---

## Rule 25 — Use `Promise.all` for Independent Async Operations

When you need to run multiple async operations that don't depend on each other, run them in parallel with `Promise.all`. Never `await` them one by one.

```ts
// bad — sequential, takes 3x longer
const a = await uploadFile(file1);
const b = await uploadFile(file2);
const c = await uploadFile(file3);

// good — parallel, takes the same time as 1
const [a, b, c] = await Promise.all([
  uploadFile(file1),
  uploadFile(file2),
  uploadFile(file3),
]);

// or with .map()
const results = await Promise.all(files.map(file => uploadFile(file)));
```

---

## Rule 26 — `FormData` for Simple Forms Only

This is the **exception to Rule 6**. For forms with only 1–2 fields and no complex validation (login, search), use native `FormData` to read values on submit — it's simpler and avoids react-hook-form + Zod overhead.

```tsx
// simple form (login) — FormData is enough
const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const data = new FormData(e.target as HTMLFormElement);
  const email = data.get('email') as string;
  const password = data.get('password') as string;
};
```

The threshold: if the form has **more than 2 fields**, **custom validation**, or needs to be **reset programmatically** → use Rule 6 (react-hook-form + Zod).

---

## Rule 27 — Actions Normalize API Responses

Actions are responsible for transforming raw API responses into the exact shape the UI expects. Components should never parse, construct, or format data from the API directly.

```ts
// bad — component builds the URL
<img src={`${import.meta.env.VITE_API_URL}/files/product/${product.image}`} />

// good — action already returned the full URL
<img src={product.image} />
```

Common transformations done in actions:
- Converting bare filenames to full URLs
- Stripping full URLs back to filenames before saving
- Mapping nested objects to flat structures the UI needs
- Converting number strings to actual numbers

```ts
// action normalizes before returning
const { data } = await tesloApi.get<Product>(`/products/${id}`);
return {
  ...data,
  images: data.images.map(img =>
    img.includes('http') ? img : `${import.meta.env.VITE_API_URL}/files/product/${img}`
  ),
};
```

This keeps components clean and makes the API contract a concern of the action layer only.

---

## Rule 28 — Add Error Boundaries Around Route Sections

TanStack Query's `isError` only catches API/network failures. If a component crashes during rendering (bad data shape, undefined property, component bug), there is nothing to catch it — the whole page goes blank with no feedback to the user.

Wrap each layout or major section in an `ErrorBoundary` so crashes are contained and the user sees a helpful message instead of a white screen.

Install the library: `npm install react-error-boundary`

```tsx
// app.router.tsx
import { ErrorBoundary } from 'react-error-boundary';

{
  path: '/admin',
  element: (
    <AdminRoute>
      <ErrorBoundary fallbackRender={({ resetErrorBoundary }) => (
        <div>
          <p>Something went wrong in the admin panel.</p>
          <button onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}>
        <AdminLayout />
      </ErrorBoundary>
    </AdminRoute>
  ),
}
```

**What error boundaries catch vs. don't catch:**

| Catches | Does NOT catch |
|---|---|
| Render crashes (undefined access, bad data) | Errors inside event handlers → use try/catch |
| Child component bugs | Async errors (`await`) → use TanStack Query's `isError` |
| Errors in lifecycle methods | Errors in the boundary itself |

Use both together — `isError` for API failures, `ErrorBoundary` for render crashes. They cover different failure modes.

---

## Rule 29 — Use Skeletons Instead of Full-Screen Loading for Page Content

`<CustomFullScreenLoading />` blocks the entire page and removes all context. Use skeleton placeholders instead — they render in the exact place where content will appear, keeping the layout visible while data loads.

**When to use each:**

| Situation | Use |
|---|---|
| App initial boot (auth check) | Full-screen loading — nothing exists yet |
| Page navigating to a new route | Skeleton — layout is already visible |
| Table reloading after a filter change | Skeleton rows |
| Button submitting a form | `isPending` to disable the button |
| Modal content loading | Skeleton inside the modal |

Add the shadcn/ui skeleton: `npx shadcn@latest add skeleton`

Create a skeleton that mirrors the real component's layout:

```tsx
// src/admin/pages/product/ui/ProductFormSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export const ProductFormSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />       {/* title */}
    <Skeleton className="h-12 w-full" />     {/* input */}
    <Skeleton className="h-12 w-full" />     {/* input */}
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-12" />          {/* price */}
      <Skeleton className="h-12" />          {/* stock */}
    </div>
    <Skeleton className="h-32 w-full" />     {/* image area */}
  </div>
);
```

Then in the page — the layout (header, sidebar) stays visible, only the content area pulses:

```tsx
// AdminProductPage.tsx
if (isLoading) return <ProductFormSkeleton />;  // not <CustomFullScreenLoading />
```

> **Rule of thumb:** if the layout is already on screen, use a skeleton. If nothing is on screen yet, use full-screen loading.

---

## Rule 30 — Add Section Comments in Large or Non-Obvious Files

Do not comment every function or line. Only add a comment when the **why** is not obvious from reading the code, or when a file is long enough that section headers help navigation.

**When to comment:**
- A block of logic that would confuse a new reader
- A workaround for a known bug or external constraint
- A non-obvious business rule (e.g. why `id === 'new'` is a special case)
- Section dividers in files with 5+ distinct blocks

**When NOT to comment:**
- Simple functions where the name already explains everything
- Every prop in an interface
- Code that is straightforward to read line by line

```tsx
// bad — comment adds no value
// Get the product by id
const { data } = useProduct(id);

// good — explains a non-obvious constraint
// 'new' is a sentinel value — the API does not have a product with this id.
// getProductByIdAction returns an empty template instead of calling the API.
if (id === 'new') return emptyProduct;
```

For large components, use short section headers to break the file into readable blocks:

```tsx
export const ProductForm = () => {

  // --- Form setup ---
  const { register, handleSubmit } = useForm<FormInputs>({ defaultValues: product });
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  // --- Tag management ---
  const addTag = () => { ... };
  const removeTag = () => { ... };

  // --- Size management ---
  const addSize = () => { ... };
  const removeSize = () => { ... };

  // --- File upload ---
  const handleDrag = () => { ... };
  const handleDrop = () => { ... };

  // --- Render ---
  return ( ... );
};
```

---

## Rule 31 — Create a PROJECT_MAP.md at the Start of Every Project

When starting a new project, create a `PROJECT_MAP.md` at the root. This file gives any developer (or AI) an instant understanding of the project without having to read every file.

**What it must include:**

1. **One-line description** — what the app does and who uses it
2. **Architecture diagram** — the zones of the app (public, auth, admin) and how they connect
3. **Full directory tree** — every folder and file with a one-line description of its role
4. **File-by-file reference** — for each file: what it does, what it depends on, what uses it
5. **External libraries table** — every dependency and what it does in this project
6. **Key patterns section** — the architectural decisions that aren't obvious from the code

**Keep it updated** as the project grows. When a new file is added, add it to the map. When a file is deleted, remove it. An outdated map is worse than no map.

```
PROJECT_MAP.md         ← lives at the root, next to package.json
RULES.md               ← coding conventions (this file)
src/
  ...
```

> Think of `PROJECT_MAP.md` as the manual for the codebase. A new developer should be able to read it and know exactly where to look for anything before opening a single source file.

---

## Rule 32 — Split Components That Are Too Large or Do Too Much

A component should do one thing. If it does more, split it. Use these signals to decide when to split:

- The component exceeds **~150 lines**
- It has **more than one clear responsibility** (e.g. handles both a table and a form)
- A section of its JSX could be reused elsewhere
- It has so many props that the interface is hard to read

```tsx
// bad — one component doing everything
export const AdminProductPage = () => {
  // 50 lines of form logic
  // 50 lines of image upload logic
  // 50 lines of tag management
  // 100 lines of JSX
};

// good — split by responsibility
export const AdminProductPage = () => {
  return <ProductForm ... />;   // form logic lives here
};

// ProductForm renders:
// <ProductBasicFields />
// <ProductSizeSelector />
// <ProductImageUpload />
// <ProductTagInput />
```

Put sub-components used only by one page inside a `/ui` subfolder next to that page:

```
pages/
└── product/
    ├── AdminProductPage.tsx   ← the page
    └── ui/
        ├── ProductForm.tsx    ← used only here
        ├── ProductFormSkeleton.tsx
        └── ProductTagInput.tsx
```

---

## Rule 33 — `<Navigate>` in JSX, `navigate()` in Event Handlers

These two serve the same purpose but are used in different contexts. Never mix them.

```tsx
// in JSX / return statement — use <Navigate>
if (authStatus === 'not-authenticated') return <Navigate to="/auth/login" />;

// in event handlers / async functions — use navigate()
const navigate = useNavigate();
const handleSubmit = async () => {
  await save();
  navigate('/admin/products');
};
```

---

## Rule 34 — The Action Layer Is the Data Source Boundary

Actions are the **only layer that knows where data comes from**. Components, hooks, and stores must never reach past an action to call `tesloApi` directly. This is what makes it possible to swap the data source (REST → GraphQL, mock server, local SQLite, etc.) without touching anything outside of `actions/`.

```
Component  →  Hook  →  Action  →  tesloApi  →  REST API
                          ↑
                    only this layer changes
                    when the data source changes
```

The action layer is the project's **repository pattern**. Its public contract is the return type — as long as an action returns the same typed shape, nothing upstream cares where the data came from.

**Rules:**
- Only action files may import `tesloApi` (or any future API client)
- Hooks call actions — never `tesloApi` directly
- Stores call actions — never `tesloApi` directly
- Components call hooks — never actions or `tesloApi` directly

---

## Rule 35 — Library Migration: What Changes and What Doesn't

When a library needs to be replaced, only the layer that owns it changes. Everything above stays untouched.

| Library to swap | What changes | What stays the same |
|---|---|---|
| `axios` → `fetch` | `src/api/tesloApi.ts` + action imports | Hooks, components, stores |
| `@tanstack/react-query` → SWR | All files in `hooks/` | Actions, components, pages |
| `zustand` → Jotai | All files in `store/` | Everything that calls the store |
| `react-hook-form` → other | Form components only | Actions, hooks, stores |
| `react-router` → TanStack Router | `app.router.tsx`, layouts, guards | Pages, components, actions |
| REST API → GraphQL | `src/api/` + `actions/` | Hooks, components, stores, interfaces |

**To replace `axios` with `fetch`:**
1. Rewrite `src/api/tesloApi.ts` as a plain wrapper function with the same signature
2. Update action files to call the new wrapper instead of `tesloApi`
3. Nothing else changes

**To replace the REST API with GraphQL:**
1. Rewrite `src/api/` with a GraphQL client (e.g. `graphql-request`)
2. Rewrite `actions/` to use GraphQL queries instead of REST endpoints
3. Keep the return types identical — hooks and components never notice

---

## Data Flow Summary

```
Component
  ↓ calls
Hook (useQuery / useMutation)
  ↓ calls
Action (pure async function)
  ↓ calls
tesloApi (axios instance)
  ↓ hits
REST API
```

Going the other direction:

```
REST API response
  → Action transforms + types the data
  → TanStack Query caches it
  → Hook returns { data, isLoading, isError }
  → Component renders
```

---

## What Each Layer Is Responsible For

| Layer | Responsible for | NOT responsible for |
|---|---|---|
| `lib/` | Pure utility functions | React, API calls, state |
| `interfaces/` | TypeScript types | Any logic |
| `api/` | Axios config, interceptors | Business logic |
| `actions/` | API calls + response transformation | State, UI, side effects |
| `store/` | Global client state | API calls (delegates to actions) |
| `hooks/` | Caching, loading/error states | UI rendering |
| `components/` | Reusable UI pieces | Business logic, API calls |
| `pages/` | Assembling components into screens | Reusable UI logic |
| `layouts/` | Shared page chrome + `<Outlet>` | Page-specific content |
| `app.router.tsx` | Route definitions + guards | Any UI rendering |
