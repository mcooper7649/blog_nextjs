---
title: 'Testing React Components with Vitest and React Testing Library'
date: '2026-09-25'
image: cover.jpg
excerpt: A practical guide to setting up Vitest with React Testing Library, writing your first component tests, mocking API calls, and running code coverage — without the Jest config pain.
isFeatured: false
---

I put off writing tests for my React projects longer than I should have. The setup felt like a chore — wrestling with Jest config, Babel transforms, and `jest.config.js` files that broke every other week. When I switched to Vite-based projects and discovered **Vitest**, that friction mostly disappeared. It's Jest-compatible, runs in a Vite context, and needs almost no configuration.

This post walks through everything I actually use in day-to-day React development: setup, component tests, user interaction, API mocking, and coverage.

## Why Vitest Instead of Jest?

Vitest uses Vite's transform pipeline, so it speaks the same module format your app does — no separate Babel config, no hoisting surprises. It's also fast: it runs tests in parallel worker threads and only retransforms files that changed. For most medium-sized React apps, the test suite runs in under two seconds.

The API is nearly identical to Jest, so if you already know `describe`, `it`, `expect`, and `vi.mock`, you're immediately at home.

## Setup

Start from a Vite + React project. Install the test stack:

```bash
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

Add a `vitest.config.ts` (or update `vite.config.ts`):

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

Create the setup file that imports the custom jest-dom matchers:

```ts
// src/test/setup.ts
import '@testing-library/jest-dom';
```

Finally, add a test script in `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

That's it. No Babel config, no transform rules, no module name mapper dance.

## Your First Component Test

Say you have a simple `Badge` component:

```tsx
// src/components/Badge.tsx
interface BadgeProps {
  label: string;
  count: number;
}

export function Badge({ label, count }: BadgeProps) {
  return (
    <span className="badge">
      {label}
      {count > 0 && <span className="badge__count">{count}</span>}
    </span>
  );
}
```

A test for it looks like this:

```tsx
// src/components/Badge.test.tsx
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders the label', () => {
    render(<Badge label="Notifications" count={0} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('shows the count when greater than zero', () => {
    render(<Badge label="Notifications" count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides the count when zero', () => {
    render(<Badge label="Notifications" count={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
```

The key habit here: query by what the user sees (`getByText`, `getByRole`, `getByLabelText`) rather than by CSS class or test ID. Tests that match user-visible semantics survive refactors much better.

## Testing User Interactions

`@testing-library/user-event` simulates real browser input events — focus, keydown, input, change — rather than synthetic React events. Use it over `fireEvent` for anything the user actually types or clicks.

```tsx
// src/components/SearchBox.tsx
import { useState } from 'react';

export function SearchBox({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSearch(value); }}>
      <input
        placeholder="Search…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit">Go</button>
    </form>
  );
}
```

```tsx
// src/components/SearchBox.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBox } from './SearchBox';

it('calls onSearch with the typed value when submitted', async () => {
  const user = userEvent.setup();
  const handleSearch = vi.fn();

  render(<SearchBox onSearch={handleSearch} />);

  await user.type(screen.getByPlaceholderText('Search…'), 'vitest');
  await user.click(screen.getByRole('button', { name: 'Go' }));

  expect(handleSearch).toHaveBeenCalledWith('vitest');
});
```

The `await` calls matter: `userEvent.setup()` returns an API where every action is asynchronous, matching real browser timing.

## Mocking API Calls

My approach: mock the module that does the fetching, not the global `fetch`. It's more targeted and less brittle.

Say you have a `useUser` hook that calls an API:

```ts
// src/api/users.ts
export async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Not found');
  return res.json();
}
```

In the test, mock the module:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserCard } from './UserCard';
import * as usersApi from '../api/users';

vi.mock('../api/users');

it('displays the user name after loading', async () => {
  vi.mocked(usersApi.fetchUser).mockResolvedValue({ id: '1', name: 'Alice' });

  render(<UserCard userId="1" />);

  await waitFor(() => {
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
```

`vi.mocked()` gives you full TypeScript autocomplete on the mock, which is one of my favourite small Vitest improvements over Jest.

## Code Coverage

```bash
npm run test:coverage
```

The first time you run this, Vitest will prompt you to install `@vitest/coverage-v8`. Say yes. It outputs an HTML report in `coverage/` and a terminal summary. I aim for coverage on the logic-heavy parts — hooks, utils, reducers — rather than chasing 100% on presentational components.

## A Few Rules I Follow

- **Test behaviour, not implementation.** If you're asserting on a CSS class name, you've tested implementation. Assert on what the user would see or experience.
- **One `it` per logical case.** It's fine to have many small tests; it makes failures easy to scan.
- **Don't mock what you don't own.** Mock your own API layer, not `fetch` itself. If a library breaks, you want the tests to tell you.
- **Keep tests next to the code.** `Badge.test.tsx` lives beside `Badge.tsx`. It's easier to find and encourages you to write them while the component is fresh.

## Wrapping Up

Vitest removed the last excuse I had for skipping tests on Vite-based React projects. The config is minimal, the API is familiar, and the speed is genuinely good. Start with a few `getByRole` queries and a `vi.fn()` for the callbacks you care about, and you'll have a meaningful safety net in less time than you'd think.

The full test setup shown here — `vitest.config.ts`, `setup.ts`, `@testing-library/user-event` — covers the vast majority of what I write day to day.
