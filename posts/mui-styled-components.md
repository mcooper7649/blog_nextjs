---
title: Material-UI Styled Components Implementation with JSS
excerpt: Material-UI, a popular React UI framework and using the makeStyle option hook for styled components.
image: mui-main1.png
isFeatured: true
date: '2022-06-10'
---

## What is Material-UI?

![Material-UI](mui-main.png)

Material-UI | React components for faster and easier web development. Build your own design system, or start with Material Design.

## Documentation.

- NPM Package [here](https://www.npmjs.com/package/@material-ui/core)
- Documentation Referenced [here](https://v4.mui.com/styles/api/#makestyles-styles-options-hook)

Sometimes we want to to make our own unique styles, Material-UI styled components is a popular method to create your own components styles.

Material-UI lets you create styled compononents with their makeStyle() method.

1.  Import makeStyles
2.  Create useStyles object before main function
3.  Inside our function we can bind useStyles to a variable
4.  Then we can tap into that variable like the example below with ``className={classes.title}``

## NPM Installation

``npm install @material-ui/core``


```
import {makesStyles} from '@material-ui/core'

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
- This is a a VERY basic implementation.
- There are other ways to implement or pass props, please refer to documentation below

Learn more about it [here](https://v4.mui.com/styles/api/#makestyles-styles-options-hook)