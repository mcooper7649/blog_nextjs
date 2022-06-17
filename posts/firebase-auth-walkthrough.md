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

1. Create a new file called firebase.js in your src folder
2. Inside lets create the const firebaseApp and initialize with our firebaseConfig file

   1. Don't forget to import initialize from firebase/app

3. Create const auth = getAuth(firebaseApp)
4. Import the auth library from 'firebase/auth'
5. Create const db = getFirestore(firebaseApp)
6. Import firestore library from 'firebase/firestore'
7. Export auth and db to be utilized outside of this file.

### Completed Example of 'firebase.js'

```js
import firebaseConfig from './config/firebaseConfig';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export { auth, db };
```

## Adding to our Context State

- In our Crypto Demo application we utilize Context API so we can tap into our state object without prop drilling.
- Since we want to add this to Login and have our user status accessible throughout the application this is an ideal location to configure

1. Add user state to our crypto context.

### CryptoContext Example

```js
const CryptoContext = ({ children }) => {
  const [currency, setCurrency] = useState('INR');
  const [symbol, setSymbol] = useState('₹');
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null)
```

2. Add Material UI Modal Component for Login Button

   1. Inside of Components folder lets make Authentication folder
   2. Lets add AuthModal.js to the Authentication folder
      1. Copy Modal of Choice from MUI website and paste into AuthModal.js and rename the modal export to AuthModal
      2. Inside of Header.js Lets add _<AuthModal/>_ after Select but inside of Toolbar. Remember to Import.
      3. Lets Remove the default button and add our own next in AuthModal.js

3. Add <Button> from Material-UI

   1. Login will be the content of the button
   2. variant will be 'contained'
   3. style get from example below
   4. Add onClick={handleOpen}

New MUI Button

```js
<Button
  variant="contained"
  style={{
    width: 85,
    height: 40,
    marginLeft: 15,
    backgroundColor: '#EEBC1D',
  }}
>
  Login
</Button>
```

4. Update Fade Component inside our AuthModal

   1. Remove all default tags inside our <div> inside of <Fade>
   2. Add MUI TABS component to our Auth Modal
      1. Import Tabs
      2. Add <AppBar> inside our div
      3. Notice that tabs needs 'value' and 'handleChange'
      4. Lets copy that from our TABS code from MUI documentation

5. Add styles to paper for useStyles inside our modal on AuthModal.js

```css

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 400,
    backgroundColor: theme.palette.background.paper,
    color: 'white',
    borderRadius: 10,
  }
}));
```

## Updating the TAB logic

1. Add {value===0 && <Login/>} inside our AuthMOdal After </AppBar>
2. Add {value ===1 && <SignUp/>} inside our AuthMOdal After </AppBar>
3. Create Login and SignUp Components Inside our Authentication Folder

## Configuring Login & Signup

1. Import Login and SignUp to AuthModal.js
2. We want to use handleClose method inside our Login and SignUp Componenents
   1. Lets pass handleClose down as a prop
   2. Add props inside our Login And SignUp Components so we can use them.

### Example of HandleClose

```js
{
  value === 0 && <Login handleClose={handleClose} />;
}
{
  value === 1 && <SignUp handleClose={handleClose} />;
}
```

3. Inside of our Signup.js
   1. Configure useState hook for email, password and confirmPassword, set default state to ""
   2. In our Return we will use the Box Component from MUI core
   3. Import Box and add the following attributes
   4. Import TextField and put inside of our Box with the following attributes
   ```js
   return (
     <Box
       p={3}
       style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
     >
       <TextField
         variant="outlined"
         type="email"
         label="Enter Email"
         value={email}
         onChange={() => setEmail(e.target.value)}
         fullWidth
       ></TextField>
     </Box>
   );
   ```

## Cons of Google Firebase

1. If not properly managed, the cost of maintaining Firebase on a pay-as-you-go service accumulates as reads and writes increase. So maintenance costs can spike at some points.
2. It's hard to export data stored in Firestore into another database. Even if you eventually find a way, it often requires a high level of technicality. Plus, it can be quite costly, too.
3. It can be less platform-agnostic, as it delves more towards Android than iOS.
4. The larger the query result gets, the messier and slower things become.

## Noteables

- With Firebase, it's pretty simple to connect and use built-in third-party authentication providers, including Google, Facebook, Twitter, among others.

Learn more about it [here](https://v4.mui.com/styles/api/#makestyles-styles-options-hook)
