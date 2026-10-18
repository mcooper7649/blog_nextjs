---
title: 'Webpack 5 and Module Bundling: A Practical Guide'
date: '2026-10-18'
image: webpack-main.png
excerpt: Webpack 5 takes your source files — JS, Sass, images, and more — and bundles them into optimized static assets your browser can actually load. Here's how to set it up from scratch.
isFeatured: true
---

## What is Webpack?

Webpack is a **module bundler**. You write your app using modern JavaScript, multiple files, Sass, and imported assets. Webpack reads all of that, resolves the dependency graph, and produces a compact set of static files — usually a few JS bundles and a CSS file — that work in every browser.

At a high level, every Webpack project has two directories:

- **`src/`** — everything you edit during development
- **`dist/`** — everything Webpack emits on build (never edit these by hand)

Other popular bundlers exist — Vite, Rollup, Parcel, esbuild — but Webpack 5 is still the bundler behind many Create React App and Next.js setups, and understanding it pays off when the defaults aren't enough.

---

## Basic Installation

If you're not using a tool like Create React App (which configures Webpack for you), here's how to set it up manually.

```bash
npm init -y
npm install -D webpack webpack-cli
```

Add a build script to `package.json`:

```json
"scripts": {
  "build": "webpack --mode production"
}
```

Running `npm run build` without any config file will look for `src/index.js` as the entry point and output `dist/main.js`. That's enough for a tiny project, but you'll want a config file quickly.

---

## Webpack Config

Create `webpack.config.js` in the project root. This file is plain CommonJS — no ES module syntax.

```js
const path = require('path')

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
}
```

A few things worth noting:

- `mode` can be `'development'` or `'production'`. Production minifies the output; development keeps it readable.
- `entry` is where Webpack starts building the dependency graph.
- `output.path` must be an absolute path — that's why `path.resolve` and `__dirname` are used.

Once this file exists, you can drop the `--mode` flag from your build script.

### Code Splitting with Multiple Entry Points

If your app has distinct pages that shouldn't share a bundle, you can use an object for `entry`. Using `[name]` in the output filename makes Webpack generate one file per entry:

```js
module.exports = {
  entry: {
    main: path.resolve(__dirname, 'src/index.js'),
    admin: path.resolve(__dirname, 'src/admin.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
}
```

---

## Adding Sass with Loaders

Webpack only understands JavaScript out of the box. **Loaders** teach it to process other file types. To import Sass into your JS:

```bash
npm install -D sass style-loader css-loader sass-loader
```

Add a `module.rules` array to your config:

```js
module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
}
```

The order of loaders in `use` matters — Webpack runs them **right to left**. So `sass-loader` compiles Sass → CSS, then `css-loader` resolves `@import` and `url()`, and finally `style-loader` injects the result into `<style>` tags at runtime.

Now you can import Sass directly from JS:

```js
import './styles/main.scss'
```

---

## The HTML Webpack Plugin

Without a plugin, you'd have to update `index.html` manually every time the output filename changes (especially once you add content hashes). `html-webpack-plugin` generates `index.html` for you, injecting the right `<script>` tags automatically.

```bash
npm install -D html-webpack-plugin
```

```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, 'src/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name][contenthash].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'My App',
      filename: 'index.html',
    }),
  ],
}
```

Two additions here:

- **`output.clean: true`** deletes old bundles before each build so `dist/` never accumulates stale files.
- **`[contenthash]`** in the filename appends a unique hash based on file content. The hash only changes when the content changes, so browsers can cache the bundle aggressively and only re-fetch when something actually differs.

### Using an HTML Template

By default, `html-webpack-plugin` generates a minimal HTML document. If you need a custom `<meta>`, favicons, or a CDN link, point it at a template:

```js
new HtmlWebpackPlugin({
  title: 'My App',
  filename: 'index.html',
  template: 'template.html',
})
```

Inside `template.html`, you can interpolate plugin options with EJS syntax:

```html
<title><%= htmlWebpackPlugin.options.title %></title>
```

---

## The Dev Server

Rebuilding manually after every change gets old fast. `webpack-dev-server` watches your source files and serves the bundle from memory, live-reloading the browser on every save.

```bash
npm install -D webpack-dev-server
```

Add a `dev` script:

```json
"scripts": {
  "dev": "webpack serve",
  "build": "webpack --mode production"
}
```

And a `devServer` section in your config:

```js
devServer: {
  static: {
    directory: path.resolve(__dirname, 'dist'),
  },
  port: 3000,
  open: true,
  hot: true,
  compress: true,
  historyApiFallback: true,
},
```

- `hot: true` enables Hot Module Replacement — component state is preserved across updates where possible.
- `historyApiFallback: true` makes single-page apps work correctly: all 404s fall back to `index.html` instead of breaking client-side routes.

---

## Babel Loader for Older Browsers

Modern JS syntax (optional chaining, nullish coalescing, async/await) needs to be transpiled down for older browsers. `babel-loader` wires Babel into Webpack:

```bash
npm install -D babel-loader @babel/core @babel/preset-env
```

Add the rule after the Sass rule:

```js
{
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env'],
    },
  },
},
```

---

## Asset Modules (Images, Fonts)

Webpack 5 has **asset modules** built in — no extra loader needed for images and fonts. Add an `assetModuleFilename` to `output` and a rule:

```js
output: {
  // ...
  assetModuleFilename: '[name][ext]',
},
module: {
  rules: [
    // ...
    {
      test: /\.(png|svg|jpg|jpeg|gif)$/i,
      type: 'asset/resource',
    },
  ],
},
```

After that, importing an image returns its final URL:

```js
import logo from './assets/logo.png'
// logo === '/logo.png' (or a hashed path in production)
```

---

## A Complete Config

Here's a full `webpack.config.js` with everything above wired together:

```js
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, 'src/index.js'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name][contenthash].js',
    assetModuleFilename: '[name][ext]',
    clean: true,
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 3000,
    open: true,
    hot: true,
    compress: true,
    historyApiFallback: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'My App',
      filename: 'index.html',
      template: 'template.html',
    }),
  ],
}
```

---

## A Few Useful Extras

- **`devtool: 'source-map'`** — generates a source map so browser DevTools show your original source instead of the minified bundle.
- **`webpack-bundle-analyzer`** — install it and add it to `plugins` to get an interactive treemap of every module in your bundle. Indispensable for tracking down why a bundle is larger than expected.

```bash
npm install -D webpack-bundle-analyzer
```

```js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

plugins: [
  new BundleAnalyzerPlugin(),
]
```

---

Webpack's configuration surface is large, but you rarely need all of it at once. Start minimal — entry, output, one or two loaders — and add pieces as the project demands them. The config file is just JavaScript, so you can pull values from environment variables, compute paths dynamically, or even import separate partial configs and merge them with `webpack-merge`.
