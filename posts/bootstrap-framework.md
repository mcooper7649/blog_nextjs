---
title: 'Bootstrap 5 in React: Grid, Components, and Customization'
date: '2026-06-14'
image: bootstrap-main.png
excerpt: Bootstrap 5 dropped jQuery, tightened its grid, and ships 1,800 icons. Here is how to install it correctly, work with the grid, and wire up the components you reach for most.
isFeatured: true
---

Bootstrap 5 is still one of the fastest ways to ship a polished, responsive UI without writing mountains of custom CSS. It dropped jQuery in v5, ships a first-party icon library, and integrates cleanly into any React project. Here is a practical rundown of everything you actually use.

## Installation

Install the stable release — not an alpha or beta:

```bash
npm install bootstrap
```

Then import the CSS once at the top of your entry file (`src/index.js` or `src/main.jsx`):

```js
import 'bootstrap/dist/css/bootstrap.min.css';
```

If you need JavaScript-powered components — dropdowns, modals, tooltips, popovers — import Bootstrap's JS bundle as well:

```js
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

> **React note:** Bootstrap's JS manipulates the real DOM, which can fight React's virtual DOM. For complex interactive components, use [react-bootstrap](https://react-bootstrap.github.io) instead — it wraps everything in proper React components with controlled state and still uses the same Bootstrap CSS under the hood.

## The 12-Column Grid

Bootstrap's grid is built on CSS flexbox. Every layout starts with `.container`, then `.row`, then one or more `.col-*` children.

```jsx
function TwoColumnLayout() {
  return (
    <div className="container">
      <div className="row">
        <div className="col-md-8">Main content</div>
        <div className="col-md-4">Sidebar</div>
      </div>
    </div>
  );
}
```

Note `className` rather than `class` — this is JSX, not HTML.

### Responsive Breakpoints

Bootstrap 5 ships six breakpoints:

| Breakpoint | Infix | Min width |
|-----------|-------|-----------|
| Extra small | *(none)* | < 576 px |
| Small | `sm` | ≥ 576 px |
| Medium | `md` | ≥ 768 px |
| Large | `lg` | ≥ 992 px |
| X-Large | `xl` | ≥ 1200 px |
| XX-Large | `xxl` | ≥ 1400 px |

A column like `col-12 col-sm-6 col-lg-4` stacks full-width on mobile, spans half at small screens, and one-third at large. You can map over data and let Bootstrap handle the responsive layout:

```jsx
function ProjectGrid({ projects }) {
  return (
    <div className="row g-4">
      {projects.map((p) => (
        <div key={p.id} className="col-12 col-sm-6 col-lg-4">
          <ProjectCard project={p} />
        </div>
      ))}
    </div>
  );
}
```

`g-4` sets a 1.5 rem gutter between all columns — both horizontal and vertical.

## Common Components

### Buttons

```jsx
<button className="btn btn-primary">Save</button>
<button className="btn btn-outline-secondary ms-2">Cancel</button>
<button className="btn btn-danger btn-sm">Delete</button>
```

Size variants: `btn-sm`, `btn-lg`. Make a button full-width with `w-100`. Disable it without disabling the element using `disabled` + `aria-disabled`:

```jsx
<button className="btn btn-primary" disabled={isLoading}>
  {isLoading ? 'Saving…' : 'Save'}
</button>
```

### Cards

Cards are the workhorse of any list or grid layout:

```jsx
function PostCard({ title, excerpt, date }) {
  return (
    <div className="card h-100 shadow-sm">
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{title}</h5>
        <p className="card-text text-muted flex-grow-1">{excerpt}</p>
        <small className="text-secondary">{date}</small>
      </div>
    </div>
  );
}
```

`h-100` inside a flex row keeps all cards the same height. `flex-grow-1` on the excerpt pushes the date to the bottom of every card.

### Navbar

A responsive, collapsing navbar using Bootstrap's JS toggler:

```jsx
function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <a className="navbar-brand" href="/">MyApp</a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto gap-2">
            <li className="nav-item"><a className="nav-link" href="/about">About</a></li>
            <li className="nav-item"><a className="nav-link" href="/blog">Blog</a></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
```

`ms-auto` on the `ul` pushes nav links to the right on desktop.

### Badges and Alerts

```jsx
// Inline badge next to text
<h5>Notifications <span className="badge bg-danger">3</span></h5>

// Status badges
<span className="badge bg-success">Active</span>
<span className="badge bg-warning text-dark">Pending</span>
```

```jsx
// Dismissible alert (requires Bootstrap JS bundle)
<div className="alert alert-warning alert-dismissible fade show" role="alert">
  <strong>Heads up!</strong> Your trial expires in 3 days.
  <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close" />
</div>
```

### Modals — Controlled in React

The cleanest way to drive a Bootstrap modal from React is to hold the open/closed state in React and tell Bootstrap's `Modal` class what to do via a ref:

```jsx
import { useEffect, useRef } from 'react';
import { Modal } from 'bootstrap';

function ConfirmDeleteModal({ show, onCancel, onConfirm, itemName }) {
  const dialogRef = useRef(null);
  const bsModal = useRef(null);

  useEffect(() => {
    bsModal.current = new Modal(dialogRef.current, { backdrop: 'static' });
    return () => bsModal.current.dispose();
  }, []);

  useEffect(() => {
    if (!bsModal.current) return;
    if (show) {
      bsModal.current.show();
    } else {
      bsModal.current.hide();
    }
  }, [show]);

  return (
    <div ref={dialogRef} className="modal fade" tabIndex={-1} role="dialog">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Delete "{itemName}"?</h5>
            <button type="button" className="btn-close" onClick={onCancel} aria-label="Close" />
          </div>
          <div className="modal-body">
            This action is permanent and cannot be undone.
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

This pattern keeps your application logic in React state and treats Bootstrap's Modal purely as a display driver.

## Bootstrap Icons

Bootstrap ships 1,800+ SVG icons as a separate package:

```bash
npm install bootstrap-icons
```

Import the CSS once in your entry file:

```js
import 'bootstrap-icons/font/bootstrap-icons.css';
```

Then use `<i className="bi bi-*">` anywhere in your JSX:

```jsx
<button className="btn btn-outline-primary d-flex align-items-center gap-2">
  <i className="bi bi-github" aria-hidden="true" />
  View on GitHub
</button>

<i className="bi bi-check-circle-fill text-success fs-4" />
<i className="bi bi-exclamation-triangle text-warning" />
```

Icons inherit `color` via `text-*` classes and size via `font-size` or `fs-*` utilities.

## Utility Classes Worth Knowing

Bootstrap's utility system is fast for common patterns without touching a CSS file:

```jsx
// Spacing: m/p + t/b/s/e/x/y + 0-5 (0 = 0, 5 = 3rem)
<div className="mt-4 mb-2 px-3 py-2">…</div>

// Flexbox
<div className="d-flex align-items-center justify-content-between gap-3">…</div>

// Text
<p className="text-muted small fw-semibold text-truncate">…</p>

// Visibility (show/hide at breakpoints)
<div className="d-none d-md-block">Desktop only</div>
<div className="d-md-none">Mobile only</div>

// Shadows and borders
<div className="shadow-sm rounded-3 border border-light">…</div>
```

## Customizing Bootstrap

The easiest way to override Bootstrap's look is via CSS custom properties (Bootstrap 5.2+). No SCSS build needed — import a small overrides file after Bootstrap:

```css
/* src/bootstrap-overrides.css */
:root {
  --bs-primary: #6610f2;
  --bs-primary-rgb: 102, 16, 242;
  --bs-border-radius: 0.5rem;
  --bs-font-sans-serif: 'Inter', system-ui, sans-serif;
}
```

```js
// src/index.js
import 'bootstrap/dist/css/bootstrap.min.css';
import './bootstrap-overrides.css';
```

The variables cascade through every component automatically.

For deeper customization — new component variants, a different grid column count, tree-shaking unused CSS — set up a SCSS build:

```bash
npm install --save-dev sass
```

```scss
/* src/styles/custom.scss */
$primary: #6610f2;
$border-radius: 0.5rem;
$grid-columns: 16;

/* Only import the modules you need */
@import 'bootstrap/scss/functions';
@import 'bootstrap/scss/variables';
@import 'bootstrap/scss/variables-dark';
@import 'bootstrap/scss/maps';
@import 'bootstrap/scss/mixins';
@import 'bootstrap/scss/utilities';
@import 'bootstrap/scss/root';
@import 'bootstrap/scss/grid';
@import 'bootstrap/scss/buttons';
@import 'bootstrap/scss/card';
@import 'bootstrap/scss/navbar';
```

This approach lets you include only the parts you use and cuts the final CSS bundle significantly.

## When to Use Bootstrap vs Alternatives

Bootstrap is a strong default when you want a complete, cohesive design system out of the box with minimal setup. It shines for content-driven sites, admin dashboards, and prototypes where you need coverage across many component types quickly.

Consider alternatives when:

- **You are using Tailwind CSS** — mixing Tailwind and Bootstrap creates class conflicts and bloat. Pick one.
- **You have a design system** — if your team already has custom tokens and components, Bootstrap's defaults fight more than they help.
- **You want fully React-controlled components** — [react-bootstrap](https://react-bootstrap.github.io) or [Reactstrap](https://reactstrap.github.io) wrap Bootstrap's CSS in proper React components, eliminating the `useRef`/`Modal` workarounds above.

For a React app with no existing design constraints and a need to ship fast, Bootstrap 5 remains a pragmatic, well-documented choice.

## Resources

- [Bootstrap 5 Docs](https://getbootstrap.com/docs/5.3/)
- [Bootstrap Icons](https://icons.getbootstrap.com)
- [Bootstrap Cheatsheet](https://bootstrap-cheatsheet.themeselection.com)
- [react-bootstrap](https://react-bootstrap.github.io)
