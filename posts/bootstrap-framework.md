---
title: Bootstrap 5 in a React App
excerpt: Bootstrap is the most popular CSS Framework for developing responsive and mobile-first websites. Here is a practical guide to using it with React.
image: bootstrap-main.png
isFeatured: true
date: '2022-06-07'
---

Bootstrap is the most popular CSS framework for building responsive, mobile-first websites. It gives you a battle-tested grid system, a library of ready-made components, and a huge set of utility classes so you spend less time writing repetitive CSS.

## Installation in a React App

Install Bootstrap 5 (stable) via npm:

```bash
npm install bootstrap
```

Then import the CSS in your `index.js` (or `_app.js` if you are using Next.js):

```js
import 'bootstrap/dist/css/bootstrap.min.css';
```

If you also need JavaScript-powered components (dropdowns, modals, tooltips), import the bundle too:

```js
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
```

## The 12-Column Grid System

Bootstrap's grid is built on flexbox. You wrap rows of columns inside a container:

```jsx
<div className="container">
  <div className="row">
    <div className="col-md-8">Main content</div>
    <div className="col-md-4">Sidebar</div>
  </div>
</div>
```

Columns stack vertically on small screens and sit side-by-side at the `md` breakpoint (768 px) and above. The six breakpoints are:

| Infix | Breakpoint | Min-width |
|-------|-----------|-----------|
| (none) | Extra small | < 576 px |
| `sm`  | Small      | ≥ 576 px |
| `md`  | Medium     | ≥ 768 px |
| `lg`  | Large      | ≥ 992 px |
| `xl`  | Extra large | ≥ 1200 px |
| `xxl` | Extra extra large | ≥ 1400 px |

A common pattern for a three-column layout that collapses to full-width on mobile:

```jsx
<div className="row row-cols-1 row-cols-md-3 g-4">
  <div className="col"><CardComponent /></div>
  <div className="col"><CardComponent /></div>
  <div className="col"><CardComponent /></div>
</div>
```

The `g-4` class adds a consistent gutter (spacing) between cards.

## Useful Utility Classes

Bootstrap ships with hundreds of utilities so you rarely need to write custom CSS for common patterns:

```jsx
{/* Spacing */}
<div className="mt-4 mb-2 px-3">...</div>

{/* Flexbox alignment */}
<div className="d-flex justify-content-between align-items-center">...</div>

{/* Text */}
<p className="text-muted fw-bold text-center">...</p>

{/* Display */}
<div className="d-none d-md-block">Hidden on mobile</div>
```

Spacing scale runs from `0` to `5` (and `auto`), and utilities accept breakpoint infixes like `mt-md-4`.

## Common Components

Bootstrap components map almost one-to-one to JSX class names:

```jsx
{/* Button variants */}
<button className="btn btn-primary">Save</button>
<button className="btn btn-outline-secondary">Cancel</button>

{/* Alert */}
<div className="alert alert-warning" role="alert">
  Something needs your attention.
</div>

{/* Badge */}
<span className="badge bg-success">New</span>

{/* Card */}
<div className="card shadow-sm">
  <div className="card-body">
    <h5 className="card-title">Hello</h5>
    <p className="card-text">Card content here.</p>
  </div>
</div>
```

## Bootstrap Icons

Bootstrap 5 ships 2,000+ free SVG icons as a separate package:

```bash
npm install bootstrap-icons
```

Import the CSS in `index.js`:

```js
import 'bootstrap-icons/font/bootstrap-icons.css';
```

Then use icons by class name:

```jsx
<i className="bi bi-github fs-4 me-2"></i>
<i className="bi bi-check-circle-fill text-success"></i>
```

The `fs-*` classes set font size and `me-*` / `ms-*` add margin end/start — the same spacing scale applies everywhere.

## Tips

- Use `container-fluid` for full-width layouts and `container` for a centered max-width layout.
- Prefer Bootstrap's utility classes over inline styles — it keeps markup consistent and makes responsive overrides straightforward.
- If you only need a subset of Bootstrap, install the `sass` package and import individual SCSS files to keep bundle size down.

For the full component reference, see the [Bootstrap 5 documentation](https://getbootstrap.com/docs/5.3/getting-started/introduction/) and the companion [Bootstrap Icons gallery](https://icons.getbootstrap.com/).
