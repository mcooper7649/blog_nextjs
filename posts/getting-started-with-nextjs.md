---
title: 'Getting Started with NextJS'
date: '2022-03-01'
image: getting-started-nextjs.png
excerpt: NextJS is a the React framework for production - it makes building fullstack React apps and sites a breeze and ships with built-in SSR.
isFeatured: true
---

NextJS is a **framework for ReactJS**.

Wait a second ... a "framework" for React? Isn't React itself already a framework for JavaScript?

Well ... first of all, React is a "library" for JavaScript. That seems to be important for some people.

Not for me, but still, there is a valid point: React already is a framework / library for JavaScript. So it's already an extra layer on top of JS.

## Why would we then need NextJS?

Because NextJS makes building React apps easier - especially React apps that should have server-side rendering (though it does way more than just take care of that).

In this article, we'll dive into the core concepts and features NextJS has to offer:

- File-based Routing
- Built-in Page Pre-rendering
- Rich Data Fetching Capabilities
- Image Optimization
- Much More

## File-based Routing

![Create routes via your file + folder structure](nextjs-file-based-routing.png)

## Built-in Page Pre-rendering

![Pre-rendering Example](Pre-rendering.png)

By default, Next.js pre-renders every page. This means that Next.js generates HTML for each page in advance, instead of having it all done by client-side JavaScript. Pre-rendering can result in better performance and SEO.
Each generated HTML is associated with minimal JavaScript code necessary for that page. When a page is loaded by the browser, its JavaScript code runs and makes the page fully interactive. (This process is called hydration.)

## Rich Data Fetching Capabilities

## Image Optimization