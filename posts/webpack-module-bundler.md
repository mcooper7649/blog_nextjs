---
title: 'What is Webpack 5 and Module Bundling'
date: '2022-06-13'
image: webpack-main.jpeg
excerpt: Webpack 5 and module bundlers are used with Frontend Frameworks, like React or CRA.
isFeatured: true
---

## What is an Webpack? 

- Webpack lets you code using the different filetypes and dependencies that your compfortable with and converts them to into the static assets that your browser prefers.
- When building an APP we typically will see two folders 
  - SRC
    - This folder has all the working files that we will edit during the development process
  - DIST
    - This folder holds all the static assets after the BUILD process has been ran
    - ``npm build`` is a good example of the dist folder being generated


### Other Types of Module Bundlers

- Snowpack
- Rollup
- Parcel


## Webpack Installation

- When NOT using a tool, such a Create React App, we can manually install webpack into our workspace by add these two commands.
  - Initialize npm ``npm init -y``
  - Install webpack developer dependency ``npm i -D webpack``
  - Install webpack-cli developer dependency ``npm i -D webpack-cli``
  - Verify installation went well, check package.json devDependencies


## How to setup the run script
- Inside our our package.json we can setup our scripts next to run our app
  - Add "build": "webpack --mode production"
  - Now this will generate a new file main.js that takes our application and MINIFYS it and makes it CROSS-BROWSER-COMPATIBLE
  - Confirm your index.html is referencing our new file, main.js
  - We can now view the page and our app should be running
  - *Production will generate less code than development*


## Webpack Config

### Webpack Config Setup
  - Create ``webpack.config.js`` in your root folder
  - Uses standard JS code only
  - If we add mode "development" to our config file, we can remove that flag from our build script in our package.json
  - Add ``const path = require('path')`` to allow us to use __dirname
  - Add ``src/indexjs`` as our entry
  - Add ``bundle.js`` as our filename


### Rebuild AFTER new Webpack Config
  - Now we can delete our main.js file from our dist folder, our old build file
  - Re-run ``npm run build`` and bundle.js will be generated now in the dist folder
  - Lastly update index.html to have bundle.js instead of main
  - Sometimes you will see the entry as an OBJECT
    - You can see multiple entries and this is called code splitting
      - In this instance it is best to change the output file name to by dynamic so instead of ``bundle.js`` you might see ``[name].js``

Webpack Config Example
```
const path = require('path')

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, 'src/index.js')
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
}
```
## Adding Sass to be compiled by Webpack

### Installation and Setup of Loaders
  
  -``npm i -D sass style-loader css-loader sass-loader``
  - In src folder lets create a styles folder
  - Add main.scss file and some css to test
  - Now we can import to our ``index.js`` file by adding ``import './styles/main.scss'``
  - We CANNOT run the build yet as we don't have loaders setup
  - Inside our webpack config file, after our output we can add a modules object
    - Inside we will add a rules array
    - Inside that array we will add an object
    - with ``test: /\.scss$/,``
    - add ``use:['style-loader', 'css-loader', 'sass-loader',]

Updated Example
```
module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, 'src/index.js')
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  modules: {
    rules: [
      {
        test: /\.scss$/,
        use:['style-loader', 'css-loader', 'sass-loader'
      }
    ]
  }
}
```

### Plugins are great

- Plugins are great in that they allow us to just delete our *dist* folder and ``npm run build`` without having to go in and modify our index.html file manually

### HTML Webpack Plug-in Setup

- Install the devDependency first ``npm i -D html-webpack-plugin``
- Import to your webpack config file ``const HtmlWebpackPlugin = require('html-webpack-plugin')``
- Add underneath the module object next a *plugins* array
  - add ``newHtmlWebpackPlugin()``
    - title: 'webpack a filename'
    - filename: 'index.html'

- Now we can DELETE our dist folder completely
- Whenever we run ``npm run build`` we will generate a new dist folder
- This mean we can never modify the DIST files directly moving forward as they will be overridden,

Updated Example with Plugin.js
```
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: "development",
  entry: path.resolve(__dirname, 'src/index.js')
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  modules: {
    rules: [
      {
        test: /\.scss$/,
        use:['style-loader', 'css-loader', 'sass-loader'
      }
    ]
  }
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Webpack A Title',
      filename: 'index.html'
    })
  ]
}
```


## What are Templates?
  
  - Templates allow us to have a base index.html file that our build file will process each time its ran so you can have code that isn't removed
  - Normally we copy our index.html file and paste into our template.html file inside our root
  - Add templates underneat our filename inside our 'html-webpack-plugin' plugin in our config
      ``template: template.html``
  - Now we can add <%= htmlWebpackPlugin.options.title %>
  - Now this file dynamic data is being imported form our config file and generated on build!


## Generating Hashes and Caching

  - If we want to utilizing caching or add hash IDs to our generated filename so our browsers no when the content is update its quite easy.
    - Simply add contenthash to your output filename in the config file
    - Delete dist folder again and ``npm run build``
      - Now we will see our bundle with an appended hash
  
  ```
  module.exports = {
  mode: "development",
      entry: {
        bundle: path.resolve(__dirname, 'src/index.js')
      },
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name][contenthash].js',
  },
  ```
  

## Adding Development Script

  - Lets add different flags for our development or production builds
  - Development allows you to build after each change and is quicker for development
  - Inside our scripts object in our package.json, lets add:
    - ``''dev': 'webpack serve'``
  - Now if we go to terminal and ``npm run dev``
    - We may get a prompt to install webpack-dev-server, install it
    - go to localhost:8080  to see our dev server running


## Adding devServer to config and options
  - After output add devServer
  - port specifies port
  - open auto opens browser upon run of script
  - hot will auto reload upon save
  - compress will use g-zip compression
  - historyApiFallback allows history from previous runs for testing
  - localhost:3000 is the new address


  ```
    module.exports = {
      mode: "development",
      entry: {
        bundle: path.resolve(__dirname, 'src/index.js')
      },
      output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name][contenthash].js',
        clean: 'true',
      },
      devServer: {
        static: {
          directory: path.resolve(__dirname, 'dist')
        },
        port: 3000,
        open: true,
        hot: true,
        compress: true,
        historyApiFallback: true,
      },
        modules: {
          rules: [
            {
              test: /\.scss$/,
              use:['style-loader', 'css-loader', 'sass-loader'
            }
          ]
        }
        plugins: [
          new HtmlWebpackPlugin({
            title: 'Webpack A Title',
            filename: 'index.html'
          })
        ]
      }
      
  ```

  ### Removing old builds
    - With each new build a new bundle file is generated and can easily make your app bloated in filesize
    - We can add ``clean: true`` to our output in the webpack config file
    - Now when we ``npm run build`` our bundle file is replaced now instead of creating another each time and keeping the old.

  
  ### Adding Babbel loader to make your code backwards compatible with older browsers
    - Installation ``npm i -D babel-laoder @babel/core @babel/preset-env``
    - Verify success in our package.json
    - Add to webpack config next
      - inside module, inside rules after the first object with our .scss entry
      - Add the code below and exclude our node modules folder


Add babel to webpack
```
test: /\.js$/,
exclude: /node_modules/,
use: {
  loader: 'babel-loader',
  options: {
    presets: ['@babel/preset-env']
  }
}
```

## Adding assets loader

- First put an asset in our assets folder inside src folder
- Add to webpack config next
  - inside module, inside rule normally after the babel loader
  - add ``assetModuleFilename: '[name][ext]'`` inside our output of our webpack config
  - now if we add npm run build our asset will be generated inside our dist folder!

Asset loader example
```
test: /\.(png|svg|jpeg|jpg|gif)$/i,
type: 'asset/resource'
```

## Notable Information

- Any NPM module can be installed and used with Webpack bundling
- Add ``devtool: source-map`` to generate source bundle for debugging
- install npm i -D webpack-bundle-analyzer and add to config file to get a complete overview if the WHOLE bundle if your app
  - Add to webpack config file



Information Sourced from: [Webpack-5-Crash-Course](https://www.youtube.com/watch?v=IZGNcSuwBZs)