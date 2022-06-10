---
title: Material-UI Styled Components Implementation
excerpt: Material-UI, a popular React UI framework, implementation of styled components.
image: mui-main.png
isFeatured: true
date: '2022-06-10'
---

## What is Material-UI?

![Material-UI](mui-main.png)

Material-UI | React components for faster and easier web development. Build your own design system, or start with Material Design.
## Documentation

- NPM Package [here](https://www.npmjs.com/package/postgres)
- PostgreSQL Favorite YouTube Tutorial [here](https://www.youtube.com/watch?v=zw4s3Ey8ayo)


## NPM Installation

``npm install @material-ui/core``

## Usage

Material-UI components work without any additional setup, and don't pollute the global scope.

basic-usage.js
```
import React from 'react';
import { Button } from '@material-ui/core';

function App() {
  return <Button color="primary">Hello World</Button>;
}
```

Material-UI lets you create styled compononents with their makeStyle() method.

1. ``import {makesStyles} from '@material-ui/core'``
2.  Create useStyles object before main function
3.  Inside our function we can bind useStyles to a variable
4.  Then we can tap into that variable like the example below with ``className={classes.title}``

Header.js
```
const useStyles = makeStyles(() => ({
  title: {
    flex: 1,
    color: 'gold',
    fontFamily: 'Montserrat',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
}));

const Header = () => {
  const classes = useStyles();
  const navigate = useNavigate();

  const { currency, setCurrency } = CryptoState();

  const darkTheme = createTheme({
    palette: {
      primary: {
        main: '#fff',
      },
      type: 'dark',
    },
  });
  return (
    <ThemeProvider theme={darkTheme}>
      <AppBar color="transparent" position="static">
        <Container>
          <Toolbar>
            <Typography
              variant="h6"
              onClick={() => {
                navigate('/');
              }}
              className={classes.title}
            >
              Crypto Hunter
            </Typography>
            {/* <Button color="inherit">Login</Button> */}
            <Select
              variant="outlined"
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={currency}
              style={{ width: 100, height: 40, marginLeft: 15 }}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <MenuItem value={'USD'}>USD</MenuItem>
              <MenuItem value={'INR'}>INR</MenuItem>
            </Select>
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
};

export default Header;
```


## Noteables

- There are other ways to implement or pass props, please refer to documentation below.

Learn more about it [here](https://v4.mui.com/guides/interoperability/#styled-components)