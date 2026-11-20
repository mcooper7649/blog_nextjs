---
title: 'TypeScript Template Literal Types: Type-Safe String Patterns'
date: '2026-11-20'
image: cover.jpg
excerpt: Template literal types let you encode string structure directly in the type system — catch invalid event names, route params, and CSS properties at compile time.
isFeatured: false
belt: green
---

TypeScript's type system handles numbers, booleans, objects, and unions. Template literal types extend it one step further: they let you describe string *shapes* at the type level, so invalid strings become compile-time errors rather than runtime surprises.

## The basic idea

A template literal type uses the same backtick syntax as a JavaScript template string, but inside a type position:

```ts
type Greeting = `Hello, ${string}`;

const a: Greeting = 'Hello, world'; // OK
const b: Greeting = 'Hi there';     // Error
```

Where JavaScript interpolates a *value*, TypeScript interpolates a *type*. The type `string` above matches any string, making `Greeting` match anything that starts with `"Hello, "`.

## Combining unions

The real power appears when you combine a template literal type with union types. TypeScript distributes over every member of the union and builds the cartesian product:

```ts
type Direction = 'top' | 'right' | 'bottom' | 'left';
type Padding = `padding-${Direction}`;
// "padding-top" | "padding-right" | "padding-bottom" | "padding-left"
```

That `Padding` type is now exactly the four valid CSS padding shorthand strings — typos like `"padding-lft"` won't pass the type checker.

A function that sets a CSS property on an element becomes self-documenting:

```ts
function setPadding(el: HTMLElement, side: Direction, px: number) {
  const prop = `padding-${side}` as Padding;
  el.style.setProperty(prop, `${px}px`);
}

setPadding(box, 'left', 16);  // OK
setPadding(box, 'center', 8); // Error: Argument of type '"center"' is not assignable
```

## Intrinsic string manipulation types

TypeScript ships four built-in utility types specifically for template literal types:

| Type | Effect |
|------|--------|
| `Uppercase<S>` | `"hello"` → `"HELLO"` |
| `Lowercase<S>` | `"HELLO"` → `"hello"` |
| `Capitalize<S>` | `"hello"` → `"Hello"` |
| `Uncapitalize<S>` | `"Hello"` → `"hello"` |

These compose naturally with template literals:

```ts
type EventName = 'click' | 'focus' | 'blur';
type Handler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"
```

You can build a typed event-handler map from this:

```ts
type HandlerMap = {
  [K in EventName as `on${Capitalize<K>}`]: (event: Event) => void;
};
// { onClick: ..., onFocus: ..., onBlur: ... }
```

The `as` clause inside a mapped type renames keys — combine it with template literals and you can reshape any object type's key names.

## Extracting parts with `infer`

Template literal types support `infer` inside conditional types, which lets you pull the interpolated portion back out:

```ts
type ExtractRoute<T extends string> =
  T extends `/${infer Segment}/${infer Rest}` ? Segment : never;

type A = ExtractRoute<'/users/profile'>;  // "users"
type B = ExtractRoute<'/settings'>;       // never
```

A more practical example: enforce that a named event string always starts with the channel prefix:

```ts
type Channel = 'auth' | 'cart' | 'payment';
type ChannelEvent<C extends Channel> = `${C}:${string}`;

function emit<C extends Channel>(channel: C, event: ChannelEvent<C>) {
  console.log(event);
}

emit('auth', 'auth:login');     // OK
emit('auth', 'cart:checkout');  // Error — wrong prefix
```

## Typed object key access

One common pattern is turning a flat record into a dot-path accessor type:

```ts
type Paths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? Paths<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

type Config = {
  db: { host: string; port: number };
  app: { port: number };
};

type ConfigPath = Paths<Config>;
// "db.host" | "db.port" | "app.port"
```

This is the technique libraries like `react-hook-form` use to give you autocomplete for deeply nested field names.

## When to reach for template literal types

Template literal types shine when:

- **A string must follow a strict pattern** — route params, event names, CSS custom properties, i18n keys.
- **You generate object keys from string unions** — `onClick`, `onFocus`, or column sort keys like `name_asc` / `name_desc`.
- **You parse structured strings** — log-level prefixes, feature-flag namespaces, action type constants.

They are not the right tool for truly dynamic strings where the structure is only known at runtime — use `z.string().regex(...)` from Zod there, not a type.

## Putting it together: a typed event bus

```ts
type EventMap = {
  'user:created': { id: string; email: string };
  'user:deleted': { id: string };
  'order:placed': { orderId: string; total: number };
};

type EventKey = keyof EventMap;

function on<K extends EventKey>(
  event: K,
  handler: (payload: EventMap[K]) => void
) {
  // attach listener...
}

function emit<K extends EventKey>(event: K, payload: EventMap[K]) {
  // dispatch...
}

on('user:created', ({ id, email }) => console.log(id, email)); // fully typed payload
emit('order:placed', { orderId: 'abc', total: 99.99 });
emit('order:placed', { orderId: 'abc' });                      // Error: missing 'total'
```

The event name and its payload type are linked — emit and on stay in sync at the type level, enforced by template literal string keys.

## Summary

Template literal types extend TypeScript's string handling into the type system. They let you:

- Describe string *shapes* rather than just string *values*.
- Build large string unions automatically from smaller ones.
- Rename mapped-type keys programmatically with `Capitalize`, `Uppercase`, and `as`.
- Extract sub-strings with `infer` inside conditional types.

Start small: replace one stringly-typed event name or CSS class string in your codebase with a template literal type, and the compiler starts doing work your tests used to do.
