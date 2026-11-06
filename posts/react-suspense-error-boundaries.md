---
title: 'React Suspense and Error Boundaries: Declarative Loading and Error States'
date: '2026-11-06'
image: cover.jpg
excerpt: Replace scattered isLoading and error checks with Suspense and Error Boundaries — a cleaner model for async UI in React.
isFeatured: false
belt: green
---

Handling loading and error states in React usually means peppering every component with `if (isLoading) return <Spinner />` and `if (error) return <p>{error.message}</p>`. It works, but it scatters UI concerns through your data-fetching logic. React Suspense and Error Boundaries offer a different model: declare fallbacks once at the boundary, and let child components stay focused on the happy path.

## What Suspense Does

Suspense lets a component "suspend" — pause rendering — while it waits for something asynchronous. The closest parent `<Suspense>` boundary shows a fallback UI until the component is ready.

The most common use today is **code splitting** with `React.lazy()`:

```jsx
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<p>Loading chart…</p>}>
      <HeavyChart />
    </Suspense>
  );
}
```

Before this, you had to manage the loading state yourself or reach for a third-party split library. With `lazy()` + `Suspense`, the bundle for `HeavyChart` is fetched only when `Dashboard` renders, and the fallback appears automatically in the meantime.

## Suspense With Data Fetching

`React.lazy` is the built-in entry point, but Suspense is designed to work with any async primitive. TanStack Query v5 ships `useSuspenseQuery` exactly for this:

```jsx
import { useSuspenseQuery } from '@tanstack/react-query';

function UserProfile({ userId }) {
  // No isLoading check needed — this component only renders when data is ready
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  });

  return <h1>{user.name}</h1>;
}

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <UserProfile userId={42} />
    </Suspense>
  );
}
```

`useSuspenseQuery` suspends `UserProfile` until the fetch resolves. The parent `<Suspense>` renders the skeleton. When the data arrives, React swaps in the real component. The component itself contains zero loading-state logic — it just reads the data.

## Error Boundaries

Network requests fail. `Suspense` does not catch errors — it only handles the pending state. Error Boundaries handle the error state.

An Error Boundary is a **class component** that implements `static getDerivedStateFromError` or `componentDidCatch`. When any descendant throws during rendering, React walks up to the nearest boundary and renders its error UI:

```jsx
import { Component } from 'react';

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <p>Something went wrong: {this.state.error.message}</p>;
    }
    return this.props.children;
  }
}
```

Writing that boilerplate every time gets old. The `react-error-boundary` package replaces it with a function-component API:

```bash
npm install react-error-boundary
```

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function FallbackComponent({ error, resetErrorBoundary }) {
  return (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <UserProfile userId={42} />
    </ErrorBoundary>
  );
}
```

The `resetErrorBoundary` callback clears the error state so the component tree re-mounts — useful for a "retry" button that re-triggers the query.

## Combining Both

In practice, you nest them together. Suspense handles pending, ErrorBoundary handles failure:

```jsx
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

function AsyncSection({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<Spinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Use it anywhere
function Page() {
  return (
    <AsyncSection>
      <UserProfile userId={42} />
    </AsyncSection>
  );
}
```

`AsyncSection` is a reusable wrapper you drop around any subtree that fetches data. The components inside stay clean.

## Granularity Matters

Place boundaries strategically. A single top-level boundary that blanks the whole page on a sidebar fetch failure is a bad user experience. Wrapping each independent section independently means partial failures stay contained:

```jsx
function Dashboard() {
  return (
    <div className="grid">
      <AsyncSection><UserCard /></AsyncSection>
      <AsyncSection><RecentOrders /></AsyncSection>
      <AsyncSection><StatsChart /></AsyncSection>
    </div>
  );
}
```

Each section loads and fails independently. A broken stats endpoint does not take down the order list.

## When Not To Use Suspense

Suspense is not always the right tool:

- **Mutations** — `useMutation` doesn't suspend; handle optimistic updates and error states in the mutation callbacks instead.
- **Conditional fetches** — if a query depends on user input that might not arrive, `enabled: false` in TanStack Query is cleaner than trying to defer with Suspense.
- **Legacy class components** — they cannot suspend, so `useSuspenseQuery` only works in function components.

For straightforward cases where a spinner lives right next to the fetch, the classic `isLoading` pattern is fine. Suspense pays off most when you have a component that is *only* responsible for rendering data, with the loading and error concerns genuinely owned by an ancestor.

## Key Takeaways

- `React.lazy()` + `<Suspense>` is the standard pattern for code splitting.
- `useSuspenseQuery` from TanStack Query suspends a component until data is ready.
- Error Boundaries catch render-time throws from descendants — use `react-error-boundary` to avoid the class component boilerplate.
- Nest `<ErrorBoundary>` outside `<Suspense>` so errors are caught after suspense resolves.
- Match boundary granularity to the user experience you want — section-level boundaries keep partial failures contained.
