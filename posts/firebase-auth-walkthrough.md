---
title: User Authorization with Firebase Walkthrough
excerpt: Steps Used to add Firebase to Crypto Tracking Application
image: firebaseAuth-main.png
isFeatured: true
date: '2022-06-16'
---

## What is firebase?

Firebase concept is simple. When you build a client-side app with JavaScript or any of its frameworks, for instance, Google Firebase can turn this into a serverless app in no time. It also removes the need to manage databases yourself, as it does that for you.

Firebase is a backend platform for building Web, Android and IOS applications. It offers real time database, different APIs, multiple authentication types and hosting platform.

![FireBase-Main](firebaseAuth-main.png)

## Adding Firebase

1. Go to [Firebase](console.firebase.google.com)
2. Login and Create New Project
3. Give your project a name
4. Accept terms and options SEO
5. From within your apps console
   1. Register your app
   2. Install firebase via NPM
      - _npm i firebase_
   3. Copy config file firebase provides
   4. add firebaseConfig.js inside config folder inside of src and paste our config
   5. export default firebaseConfig

## Choosing our Firebase BUILD

1. In this project we want to chhose Authentication
2. We want to add Email/Password for Native providers
3. Google for Additional Providers
   1. Confirm Project public-facing-name, typically default is fine.
   2. Add Project support email and Save

## Integrating Firebase to your project

## Cons of Google Firebase

1. If not properly managed, the cost of maintaining Firebase on a pay-as-you-go service accumulates as reads and writes increase. So maintenance costs can spike at some points.
2. It's hard to export data stored in Firestore into another database. Even if you eventually find a way, it often requires a high level of technicality. Plus, it can be quite costly, too.
3. It can be less platform-agnostic, as it delves more towards Android than iOS.
4. The larger the query result gets, the messier and slower things become.

## Noteables

- With Firebase, it's pretty simple to connect and use built-in third-party authentication providers, including Google, Facebook, Twitter, among others.

Learn more about it [here](https://v4.mui.com/styles/api/#makestyles-styles-options-hook)
