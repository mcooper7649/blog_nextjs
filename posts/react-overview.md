---
title: React Overview
excerpt: A JavaScript library for building user interfaces
image: react-main.png
isFeatured: true
date: '2022-06-07'
---

### What is React?
  - A JS library for building User Interfaces
  - A Single Page Application that utilizes the virtual DOM to greatly improve performance as the whole DOM is already downlaoded annd just what needs to be displayed is rendered.

## What are components in React?
  - Components make up the visual layer of our applicaiton and lets us create re-usable but seperate pieces of code
  - Components are class or functions that return JSX
  - Components can be nested as deep as you want



## What are Hooks?
  - Hooks are features within React that let you use functional components to interact with the state, lifecycle and more.
  - Hooks changed teh way most developers use React these days and class components aren't seen as much anymore.
  - Hookes are essential, and their name derives from their ability to "Hook the state"
    - Hooks include: 
      - useState
      - useEffect
      - useContext
      - useReducer
      - useCallback
      - useMemo
      - useRef
      - many more...

## What is JSX?
  - JSX is a hybrid of JavaScript and HTML code that React can read. 
  - Browsers don't know how to read JSX natively so the code will need to be compiled.

## What is React-Router?
  - React router lets us have multiple pages in our React
  - Using BrowserRouter, Router, Route, Routes to achieve this.

## What are Props?
  - Props are how we pass data down from one parent component to a child
  - Props are short for properties and can be passed down to multiple children
  - Use the "this" keyword when interacting with props from a class based component
  - Prop Drilling is the act of passing props down mulitple components.

props example
  ```
  import React from 'react';
  import ReactDOM from 'react-dom/client';

  function Car(props) {
    return <h2>I am a { props.brand }!</h2>;
  }

  function Garage() {
    return (
      <>
        <h1>Who lives in my garage?</h1>
        <Car brand="Ford" />
      </>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<Garage />);
  ```

## What is State?
  - State is a JS object that lets us store data about a particular component
  - We don't interact with the state directly and we don't create new variables in place of the state
  - setState is how we set the state in class components or functional components with the hooks.
  - Lifting the state is used to take data about a particular component and pass it back to a parent that may need that data


example State Hook
  ```
  import React, { useState } from 'react';

  function Example() {
    // Declare a new state variable, which we'll call "count"
    const [count, setCount] = useState(0);

    return (
      <div>
        <p>You clicked {count} times</p>
        <button onClick={() => setCount(count + 1)}>
          Click me
        </button>
      </div>
    );
  }
  ```

  

## What is the component Lifecycle?
  - Initialization
  - Mounting
  - Updating
  - Unmounting
  - Class based components use lifecycle methods suck as componentDidUpdate, componenentDidMount, etc
  - Function based components use the useEffect hook
    - If the component is in the original useEffect call it will load on component mount while if you put the component inside our useEffect dependency array it will update everytime the state changes.

  - No dependency passed
  ```
  useEffect(() => {
  //Runs on every render
  });
  ```

  - An Empty Array
  ```
  useEffect(() => {
  //Runs only on the first render
  }, []);
  ```

  - Props or state values
  ```
  useEffect(() => {
  //Runs on the first render
  //And any time any dependency value changes
  }, [prop, state]);
  ```

### Run only on initial render
  ```
  import { useState, useEffect } from "react";
  import ReactDOM from "react-dom/client";

  function Timer() {
    const [count, setCount] = useState(0);

    useEffect(() => {
      setTimeout(() => {
        setCount((count) => count + 1);
      }, 1000);
    }, []); // <- add empty brackets here

    return <h1>I've rendered {count} times!</h1>;
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<Timer />);
  ```

### Run only on variable update

  ```
  import { useState, useEffect } from "react";
  import ReactDOM from "react-dom/client";

  function Counter() {
    const [count, setCount] = useState(0);
    const [calculation, setCalculation] = useState(0);

    useEffect(() => {
      setCalculation(() => count * 2);
    }, [count]); // <- add the count variable here

    return (
      <>
        <p>Count: {count}</p>
        <button onClick={() => setCount((c) => c + 1)}>+</button>
        <p>Calculation: {calculation}</p>
      </>
    );
  }

  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<Counter />);
  ```

## What is React Global State Management?
  - Sometimes React needs a global state object to keep the app working
    - think of a logged in user profile
  - Prop drilling isn't practical once our application reaches a certain size
  - We can use the ContextAPI or Redux to solve this

### When to use Context?
- We designed the application in which used color props in the ParentClass and passed that props to all component (top to down) without checking that it is required by the child class or not and another issue also here that in case if GrandChildClass component was more deeply nested than it was very difficult to manage. This is the problem that Context solves. Context is designed the share values that can be considered "global" such as preferred language, current user, or theme.
- These types of data include:
  - Theme data (like dark or light mode)
  - User data (the currently authenticated user)
  - Location-specific data (like user language or locale)

    *When to use context*
  ```

  const App = () => {
    return(
      <ParentClass color= "blue"/>
    );
  }

  const ParentClass = (props) => (
    <ChildClass color= {props.color} />
  )

  const ChildClass = (props) => (
    <GrandChildClass color= {props.color} />
  )

  const GrandChildClass = (props) => (
    <p>Color: {props.color}</p>
  )
  ```
  ### 4 Steps to using React Context

  1. Create context using the createContext method.
  2. Take your created context and wrap the context provider around your component tree.
  3. Put any value you like on your context provider using the value prop.
  4. Read that value within any component by using the context consumer.

  ### There are two main components that make up Context
    - Provider of Context
    - Consumer of Context



## What is the Virtual DOM
  - This allows React to update only specific components in the tree without updating the whole DOM
  - Keys will need to be generated for each list item for the VDOM errors to go away


## Event Listeners
  - camelCase the eventName
  - Pass the function we want to execute

## Conditional Rendering
  - ``isAuthenticated === true`` //Display Profil;e
  - `` {isAuthenticated && operator}``
  - Using an inline if/else also known as *ternirary* is godo for additional logic

## Noteable Terminal Commands
  - ``npx create-react-app appname ``
  - ``npm start``
  - ``npm build``

  

React [here](https://reactjs.org/)
Check out this Comprehensive CheatSheet [devhints](https://devhints.io/react)
