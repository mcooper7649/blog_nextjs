---
title: 'What is Webpack 5 and Module Bundling'
date: '2022-06-13'
image: webpack-main.png
excerpt: Webpack 5 and module bundlers are used with Frontend Frameworks, like React or CRA.
isFeatured: true
---

## What is Webpack?

Webpack lets you code using the different file types and dependencies that you're comfortable with and converts them into the static assets that your browser prefers.

When building an app we typically see two folders:
- **src** — working files you edit during development
- **dist** — static assets generated after the build process runs

### Other Types of Module Bundlers

- Snowpack
- Rollup
- Parcel

## Webpack Installation

When NOT using a tool like Create React App, you can manually install Webpack:

1. Initialize npm
   `npm init -y`
2. Install webpack
   `npm i -D webpack`
3. Install webpack-cli
   `npm i -D webpack-cli`
4. (Optional) Verify in `package.json` under `devDependencies`

## Setting Up the Build Script

Inside `package.json`, add a build script:

```json
"scripts": {
  "build": "webpack --mode production"
}
```

Running `npm run build` generates a `main.js` that is **minified** and **cross-browser compatible**. Make sure your `index.html` references this file.

## Webpack Config

### Webpack Config Setup

Create `webpack.config.js` in your project root. Use standard CommonJS syntax only:

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

Setting `mode` in the config means you no longer need the `--mode` flag in your npm script.

### Rebuild After New Config

Delete the old `main.js` from `dist`, then:

```sh
npm run build
```

`bundle.js` will now be generated in `dist`. Update `index.html` to reference `bundle.js`.

> **Code splitting:** When you need multiple entry points, make `entry` an object and use `[name].js` as the output filename so each bundle gets its own file.

## Adding Sass via Loaders

### Installation

```sh
npm i -D sass style-loader css-loader sass-loader
```

Create `src/styles/main.scss`, add some CSS, then import it in `src/index.js`:

```js
import './styles/main.scss'
```

Add the loader rule to your config:

```js
const path = require('path')

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

## Plugins

Plugins let you delete the `dist` folder entirely — `npm run build` will regenerate it including `index.html`, so you never have to edit `dist` files directly.

### HTML Webpack Plugin

```sh
npm i -D html-webpack-plugin
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
    filename: '[name].js',
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
      title: 'Webpack App',
      filename: 'index.html',
    }),
  ],
}
```

## Templates

Templates let you keep a base `index.html` that the build processes on each run. Copy your `index.html` to `template.html` in the project root, then reference it in the plugin:

```js
new HtmlWebpackPlugin({
  title: 'Webpack App',
  filename: 'index.html',
  template: 'template.html',
})
```

Inside `template.html` you can use `<%= htmlWebpackPlugin.options.title %>` to inject the title dynamically.

## Generating Hashes and Cache Busting

Add `[contenthash]` to your output filename so browsers know when content changes:

```js
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name][contenthash].js',
  clean: true,
},
```

> `clean: true` removes old bundles automatically on each build — no need to delete `dist` by hand.

## Development Server

Add a `dev` script to `package.json`:

```json
"scripts": {
  "build": "webpack --mode production",
  "dev": "webpack serve"
}
```

Install `webpack-dev-server` if prompted, then configure it in `webpack.config.js`:

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
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Webpack App',
      filename: 'index.html',
    }),
  ],
}
```

## Babel Loader

Make your JavaScript backwards-compatible with older browsers:

```sh
npm i -D babel-loader @babel/core @babel/preset-env
```

Add the rule inside `module.rules`:

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

## Asset (Image) Loader

```js
{
  test: /\.(png|svg|jpg|jpeg|gif)$/i,
  type: 'asset/resource',
},
```

Also add `assetModuleFilename` to your `output` so assets retain their original names:

```js
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: '[name][contenthash].js',
  assetModuleFilename: '[name][ext]',
  clean: true,
},
```

## Notable Tips

- Any npm module can be installed and bundled with Webpack.
- Add `devtool: 'source-map'` to generate source maps for easier debugging.
- Install `webpack-bundle-analyzer` to visualize what's in your bundle and spot bloat:
  ```sh
  npm i -D webpack-bundle-analyzer
  ```

---

Information sourced from: [Webpack 5 Crash Course](https://www.youtube.com/watch?v=IZGNcSuwBZs)
