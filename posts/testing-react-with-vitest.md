---
title: 'Testing React with Vitest and React Testing Library'
date: '2026-10-14'
image: cover.jpg
excerpt: Set up a fast, modern test suite for your React app using Vitest and React Testing Library — from first render to async interactions and mocks.
isFeatured: false
---

Testing React used to mean fighting Jest config. Vitest changes that — it shares your Vite config, runs in the same ESM environment as your app, and starts in milliseconds. Combined with React Testing Library (RTL), you get a stack that tests your components the way users actually experience them.

Here's how to go from zero to a real test suite.

## Installation

```bash
npm install -D vitest @vitest/ui jsdom \
  @testing-library/react @testing-library/user-event \
  @testing-library/jest-dom
```

Add a setup file so every test file gets the RTL matchers automatically:

```ts
// src/test/setup.ts
import '@testing-library/jest-dom';
```

Then configure Vitest. If you have a `vite.config.ts`, add a `test` block:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
});
```

Setting `globals: true` means you can call `describe`, `it`, `expect`, and `vi` without importing them — same ergonomics as Jest. Add `"types": ["vitest/globals"]` to your `tsconfig.json` if you use TypeScript.

Add a script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

## Your First Component Test

Suppose you have a simple button counter:

```tsx
// src/components/Counter.tsx
import { useState } from 'react';

export function Counter({ label = 'Count' }: { label?: string }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>{label}: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}
```

The test renders the component and makes assertions through the DOM — not through internal state:

```tsx
// src/components/Counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

describe('Counter', () => {
  it('renders with the default label', () => {
    render(<Counter />);
    expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
  });

  it('increments when the button is clicked', async () => {
    const user = userEvent.setup();
    render(<Counter />);

    await user.click(screen.getByRole('button', { name: /increment/i }));
    expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
  });

  it('accepts a custom label', () => {
    render(<Counter label="Score" />);
    expect(screen.getByText(/score: 0/i)).toBeInTheDocument();
  });
});
```

`userEvent.setup()` simulates real browser events including focus, pointer, and keyboard — more realistic than `fireEvent`. Always `await` user interactions.

## Testing Async Behavior

Most real components fetch data. Here's a component that loads a user:

```tsx
// src/components/UserCard.tsx
import { useEffect, useState } from 'react';

type User = { name: string; email: string };

export function UserCard({ userId }: { userId: number }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
  }, [userId]);

  if (!user) return <p>Loading…</p>;
  return <p>{user.name} — {user.email}</p>;
}
```

Vitest has a built-in `vi` object for mocks. Mock `fetch` in the test:

```tsx
// src/components/UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    json: async () => ({ name: 'Alice', email: 'alice@example.com' }),
  } as Response);
});

afterEach(() => vi.restoreAllMocks());

it('displays user data after loading', async () => {
  render(<UserCard userId={1} />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // waitFor keeps polling until the assertion passes or times out
  expect(await screen.findByText(/alice/i)).toBeInTheDocument();
  expect(screen.getByText(/alice@example\.com/i)).toBeInTheDocument();
});
```

`screen.findBy*` queries return promises — they wait for the element to appear in the DOM. Use them for anything that involves async state updates.

## Mocking Modules

Sometimes you need to swap out a whole module — a date utility, an analytics call, a custom hook:

```ts
// mock a named export
vi.mock('../lib/analytics', () => ({
  track: vi.fn(),
}));

// assert it was called
import { track } from '../lib/analytics';

it('fires a page view event on mount', () => {
  render(<HomePage />);
  expect(track).toHaveBeenCalledWith('page_view', { path: '/' });
});
```

## Running Tests

```bash
npm test          # watch mode — re-runs on file save
npm test -- --run # single pass (for CI)
npm run test:ui   # browser-based UI with test graph
```

Vitest also ships coverage via `@vitest/coverage-v8`:

```bash
npm install -D @vitest/coverage-v8
npx vitest run --coverage
```

## What to Test (and What Not To)

Test **behavior**, not implementation:

- Does the button appear and fire the right action?
- Does the loading state show before data arrives?
- Does an error message appear on a failed fetch?

Skip snapshot tests for large component trees — they break on every style change and tell you nothing meaningful. Skip testing third-party library internals. Focus on the paths your users actually walk.

With Vitest spinning up in under a second and RTL keeping tests close to real usage, there's no excuse not to have a test suite anymore. Start with one test per component and grow from there.
