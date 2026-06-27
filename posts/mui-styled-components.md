---
title: 'MUI v5+: Styling with the sx Prop, styled(), and Custom Themes'
excerpt: Material UI v5 replaced JSS and makeStyles with the sx prop and a styled() API built on Emotion — here is how to use them effectively.
image: mui-main1.png
isFeatured: true
date: '2026-06-27'
---

Material UI (MUI) v5, released in late 2021, dropped JSS entirely in favor of [Emotion](https://emotion.sh/) as its default styling engine. If you're still reaching for `makeStyles` from `@material-ui/core`, you're on the deprecated v4 path. This guide covers how styling actually works in v5 and later.

## Installation

```bash
npm install @mui/material @emotion/react @emotion/styled
```

The old `@material-ui/core` package is v4 and unmaintained. The current package is `@mui/material`.

## The sx Prop — Your First Stop

The `sx` prop is a shorthand styling API available on every MUI component. It accepts standard CSS properties plus theme-aware shortcuts.

```jsx
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

function Hero() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.paper',
        p: 4,        // 4 * 8px = 32px on all sides
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        Hello, MUI v5
      </Typography>
      <Typography sx={{ mt: 1, color: 'text.secondary' }}>
        Styled with the sx prop.
      </Typography>
    </Box>
  );
}
```

Key `sx` shortcuts to know:

| Shorthand | CSS property | Example |
|-----------|-------------|---------|
| `p` / `m` | padding / margin | `p: 2` → `padding: 16px` |
| `px` / `py` | padding horizontal/vertical | `px: 3` |
| `bgcolor` | background-color | `bgcolor: 'grey.100'` |
| `color` | color (theme-aware) | `color: 'primary.main'` |

### Responsive Values

The `sx` prop understands breakpoints natively:

```jsx
<Box
  sx={{
    width: { xs: '100%', sm: '50%', md: '33%' },
    display: { xs: 'none', md: 'block' },
  }}
/>
```

## The styled() Function — Reusable Styled Components

When you need a reusable styled component rather than one-off `sx` props, use `styled()` from `@mui/material/styles`. It has full access to the active theme.

```jsx
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const PrimaryActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  padding: theme.spacing(1.5, 4),
  fontWeight: theme.typography.fontWeightBold,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

// Use it just like any other component
<PrimaryActionButton variant="contained">
  Get Started
</PrimaryActionButton>
```

You can also pass custom props through to the style function:

```jsx
const ColoredBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'highlight',
})(({ theme, highlight }) => ({
  backgroundColor: highlight ? theme.palette.warning.light : 'transparent',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
}));

<ColoredBox highlight>This box is highlighted.</ColoredBox>
```

`shouldForwardProp` prevents the custom prop from being forwarded to the DOM element (which would cause a React warning).

## Custom Theming

Override colors, typography, spacing, and more with `createTheme` and `ThemeProvider`.

```jsx
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const theme = createTheme({
  palette: {
    mode: 'dark',             // v5 syntax — v4 used palette.type
    primary: {
      main: '#6C63FF',
    },
    secondary: {
      main: '#FF6584',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />   {/* Normalizes browser styles */}
      <YourApp />
    </ThemeProvider>
  );
}
```

### Accessing the Theme in Components

```jsx
import { useTheme } from '@mui/material/styles';

function StatusBadge({ active }) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'inline-block',
        px: 1.5,
        py: 0.5,
        borderRadius: '999px',
        bgcolor: active
          ? theme.palette.success.light
          : theme.palette.grey[300],
        color: active
          ? theme.palette.success.contrastText
          : theme.palette.text.secondary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 600,
      }}
    >
      {active ? 'Active' : 'Inactive'}
    </Box>
  );
}
```

## What Happened to makeStyles?

`makeStyles` from `@material-ui/core/styles` is a MUI v4 API built on JSS. It still exists in `@mui/styles` for v4 migration support, but that package is not compatible with React Strict Mode and is not maintained. The MUI team recommends migrating to `sx` or `styled()` instead.

If you're on an older codebase with `makeStyles`, you don't have to rewrite everything at once — but new components should use the v5 APIs.

## When to Use Which

- **`sx` prop** — quick one-off styles on any MUI component. Great for responsive layout and theme tokens.
- **`styled()`** — reusable styled components, complex selectors, prop-driven styles.
- **`createTheme`** — global design tokens (colors, typography, spacing, shape). Set it once at the app root.

## Further Reading

- [MUI System — the sx prop](https://mui.com/system/getting-started/)
- [MUI Styled Components](https://mui.com/system/styled/)
- [Customizing MUI components](https://mui.com/material-ui/customization/how-to-customize/)
- [Migration from v4 to v5](https://mui.com/material-ui/migration/migration-v4/)
