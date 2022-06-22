---
title: User Authorization with Firebase Walkthrough
excerpt: Steps Used to add Firebase to Crypto Tracking Application
image: firebaseAuth-main.png
isFeatured: true
date: '2022-06-16'
---

## Useful Links

- Starting [Github-Repo](https://github.com/piyush-eon/react-crypto-tracker)

- Final [Github-Repo](https://github.com/mcooper7649/react-crypto-hunter) of Crypto Hunter
- [Live](https://legendary-zuccutto-146af3.netlify.app/)
- Referenced [Tutorial-RoadsideCoder](https://www.youtube.com/watch?v=8NMJxyDwP6A&t=2585s)
- Original Crypto Tracker [Tutorial](https://www.youtube.com/watch?v=QA6oTpMZp84&t=0s)
-

## What is Firebase?

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

1. In this project we want to choose Authentication
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
   5. Copy TextField and Paste 2 times and edit for setPassowrd and confirmPassword
   6. Add a MUI Button next, import and add the Handle Submit onClick
   7. Check your Modal > SignUP and confirm our UI looks good
   8.

### MUI MODAL with SIGNUP Code

```js
return (
  <Box p={3} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <TextField
      variant="outlined"
      type="email"
      label="Enter Email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      fullWidth
    ></TextField>
    <TextField
      variant="outlined"
      type="password"
      label="Enter Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      fullWidth
    ></TextField>
    <TextField
      variant="outlined"
      type="password"
      label="Confirm Password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      fullWidth
    ></TextField>
    <Button
      variant="contained"
      size="large"
      style={{ backgroundColor: '#EEBC1D' }}
      onClick={handleSubmit}
    >
      Sign Up
    </Button>
  </Box>
);
```

4. Setup Our Login.js

1. Copy our return Code and state from SignUp.js
1. Remove useState and TextField with ConfirmPassword References, we won't need it
1. Create handleSubmit const
1. confirm handleClose is a prop in Login

### Login.js

```js
import React, { useState } from 'react';
import { Box, Button, TextField } from '@material-ui/core';

const Login = ({ handleClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {};

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
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      ></TextField>
      <TextField
        variant="outlined"
        type="password"
        label="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
      ></TextField>

      <Button
        variant="contained"
        size="large"
        style={{ backgroundColor: '#EEBC1D' }}
        onClick={handleSubmit}
      >
        Sign Up
      </Button>
    </Box>
  );
};

export default Login;
```

## HandleSubmit PW Logic on SignUp

1. Inside of HandleSugbmit lets add pw logic
   if (password !== confirmPassword)

2. Next we want to add a SnackBar alert from MUI to prompt
   1. Before we can implement we want to create a Context for our Alerting
   2. Inside CryptoContext alert/setAlert state with {open: false, message: '', type: 'success'}
   3. Remember to add the value into our provider to be passed down to our children.

### Updated Context with Alerting

```js
const [alert, setAlert] = useState({
  open: false,
  message: '',
  type: 'success',
});

return (
  <Crypto.Provider
    value={{ currency, setCurrency, symbol, coins, loading, alert, setAlert }}
  >
    {children}
  </Crypto.Provider>
);
```

3. New Alert.js Component Setup
   1. Create the component named Alert.js inside Components folder
   2. Import alert, setAlert from our CryptoState()
   3. Inside our return lets add the Snackbar from MUI
   4. Copy the JS example Snackbar code and paste inside of Alert.js
      - Just copy the logic, no styles or return code needed
   5. Remove open/setOpen state, it already inside our alert state.
   6. Remove default handleClick also
   7. Change setOpen(false) to setAlert({open: false}) to match our logic in cryptoState
   8. copy props from example code too, open, autoHideDuration, onClose
   9. Import MuiAlert and put inside our snackbar
   10. Add props (see example below)
   11. Finally add {alert.message} as the content for our MuiAlert Component

### Completed Alert.js Example

```js
import { Snackbar } from '@material-ui/core';
import React from 'react';
import { CryptoState } from '../CryptoContext';
import MuiAlert from '@material-ui/lab/Alert'

const Alert = () => {
  const { alert, setAlert } = CryptoState();


  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setAlert({open: false});
  return (
        <Snackbar
          open={alert.open}
          autoHideDuration={3000}
          onClose={handleClose}
        >
          <MuiAlert
            onClose={handleClose}
            elevation={10}
            variant="filled"
            severity={alert.type}
            >
          {alert.message}
          </MuiAlert>
        </Snackbar>
  )
};

export default Alert;

```

## Adding our Alerts to SignUp.js

1. import {CryptoState} from '../../CryptoContext.js'
2. Lets destructure setAlert from CryptoState();
3. Now we can add setAlert inside our password if block
4. we will pass the type of alert we want when our PWs don't match
5. Followed by an empty return
6. Also we need to import our Alert into our APP.js
7. Test your PW logic now on SignUp and see if your Alert pops

SignUp.js HandleSubmit

```js
const handleSubmit = () => {
  if (password !== confirmPassword) {
    setAlert({
      open: true,
      message: 'Passwords do not match',
      type: 'error',
    });
    return;
  }
};
```

## Adding Try Catch Block

1.  After our if/password check we want to add a try/catch but still iside our handleSubmit function
2.  Insided of our try {} lets add

    1.  const result = await createuserWithEmailAndPassword()
    2.  Add async to our handleSubmit before our argument ()
    3.  Pass auth as the first arg and make sure to import
    4.  Pass email and password as the last two arguments
    5.  setAlert with a confirmation and welcome of the user with their email
    6.  Pass handleClose() so it will timeout our alert last
    7.  add error to your catch block arg
    8.  setAlert inside our catch and pass the error message (see example below)
    9.  Test SignUp and you should get Alerting
    10. Also lets console.log(result) at the bottom of our try block
    11. You can now see the information that result has access too, and how we are able to provide that information to the message of our Alert

## Try/Catch Error Handling with Firebase

```js
import { auth } from '../../firebase';

try {
  const result = await createUserWithEmailAndPassword(auth);
  setAlert({
    open: true,
    message: `Sign Up Successful. Welcome ${result.user.email}`,
    type: 'success',
  });
  handleClose();
} catch (error) {
  setAlert({
    open: true,
    message: error.message,
    type: 'error',
  });
  return;
}
```

### Configuring our Login.js HandleSubmit

1. Destructure setAlert from our CryptoState()
2. add if no email/password logic and set alert with return
3. Now we can copy our SignUp catch logic as that will be the same
4. we can create const result = await signInWithEmailAndPassword
5. make sure to add async to the handleSubmit
6. pass auth, email, password _remember to import auth from firebase_
7. add console.log(result)to see our result object data on login
8. Test with Login

## Is User Logged In?

1. We need to be able to tell if our user is now logged in or not or it will get confusing for your user experience
2. Lets open CryptoContext again as we will need to be able to tap into this data throughout our App
3. First lets import and add another useEffect
4. lets call onAuthStateChanged(auth), this is a firebase method and pass auth and then a callback
5. that callback will be passed user,
6. if user setUser to user else set to null

   useEffect

```js
useEffect(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) setUser(user);
    else setUser(null);
  });
}, []);
```

### Creating our User in Header

1. Add user to our CryptoState destructure
2. Now we have the user Object lets Wrap our AuthModal in jsx logic
   `{user ? 'Logout' : <AuthModal />}`
3. Now we can test to confirm Logout display on login

### Removing Logout String and Adding UserSideBar

1. Replace 'logout' with <UserSideBar>
2. Create <UserSideBar> Component inside of our Authentication folder
3. We should see the sidebar text inside our our button for now.
4. Lets grab the Drawer code from MUIv4
5. Copy the Source and add to our UserSideBar
6. Now we need to remove the unneeded default code
   1. Remove all the list references
   2. Add hello inside of our Drawer for now
   3. Remove all options that aren't 'right'
   4. Delete all imports that we no longer need, should be yellow lines underneath your imports in your IDE
   5. it should show right on your button now and a small side bar

### Configuring our SideBar

1. Lets first replace the Button with an Avatar in our UserSideBar.js
   1. We will need the user from the context to get the users avatar photo
   2. we will import this Component form MUIv4
   3. Now lets replace <Button> with <Avatar> and pass the onClick with toggleDrawer and the default args, anchor & true
   4. Add src prop to avatar and pass our user object with the photoURL (See Example Below)
   5. Add alt prop and pass the userobject with displayName OR email

### Example Avatar

```js
          <Avatar
            onClick={toggleDrawer(anchor, true)}
            style={{
              height: 38,
              width: 38,
              marginLeft: 15,
              cursor: 'pointer',
              backgroundColor: '#EEBC1D',
            }}
            src={user.photoURL}
            alt={user.displayName || user.email}
          />
          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
          >
            Hello
          </Drawer>
```

2. Styling the UserSideBar and Avatar
   1. Remove all the styles we copied inside our UserSideBar.js useStyles object
      1. Copy Container Snippet (see below for code)
   2. Lets add the profile style for the profile class (see below for code)
   3. Lets add the picture style for the picture class (see below for code)
   4. Lets add the logout style for the logout button class (see below for code)
   5. Lets add the watchlist style for the watchlist class (see below for code)

### Styling Example Code

```js
const useStyles = makeStyles({
  container: {
    width: 350,
    padding: 25,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'monospace',
  },
  profile: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    height: '92%',
  },
  picture: {
    width: 200,
    height: 200,
    cursor: 'pointer',
    backgroundColor: '#EEBC1D',
    objectFit: 'contain',
  },
  logout: {
    height: '8%',
    width: '100%',
    backgroundColor: '#EEBC1D',
    marginTop: 20,
  },
  watchlist: {
    flex: 1,
    width: '100%',
    backgroundColor: 'grey',
    borderRadius: 10,
    padding: 15,
    paddingTop: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    overflowY: 'scroll',
  },
});
```

2.  Lets add classes.container to the first <div>inside of <Drawer>
3.  Lets add classes.profile to the second <div> inside of <Drawer>
4.  Copy our Avatar Tag and Paste inside our 2nd <div>.
    1.  Remove the styles object and onClick
5.  After our 2nd Avatar tag, lets add a span (see example below for styles) that displays user.displayName or user.email

### UserSideBar with Span

```js
<React.Fragment key={anchor}>
  <Avatar
    className={classes.picture}
    onClick={toggleDrawer(anchor, true)}
    style={{
      height: 38,
      width: 38,
      cursor: 'pointer',
      backgroundColor: '#EEBC1D',
    }}
    src={user.photoURL}
    alt={user.displayName || user.email}
  />
  <Drawer
    anchor={anchor}
    open={state[anchor]}
    onClose={toggleDrawer(anchor, false)}
  >
    <div className={classes.container}>
      <div className={classes.profile}>
        <Avatar
          className={classes.picture}
          src={user.photoURL}
          alt={user.displayName || user.email}
        />
        <span
          style={{
            width: '100%',
            fontSize: 25,
            textAlign: 'center',
            fontWeight: 'bolder',
            wordWrap: 'break-word',
          }}
        >
          {user.displayName || user.email}
        </span>
      </div>
    </div>
  </Drawer>
</React.Fragment>
```

## Adding our Logout Button

1. Lets add Button after our 1st <div> after <span> on our UserSideBar.js
2. Next we need to create our logOut Function
3. inside logout lets add the firebase function signOut()
   1. this should auto import the signout method from firebase/auth
   2. Lets import {auth} from '../../firebase' and pass it into the signOut fucntion
4. Add setAlert to our destructured objects from CryptoState so we can use it during logout
5. Now we can add the setAlert fucntion and pass the example code below.
6. Don't forget to toggleDrawer() so our drawer closes upon logout.

### LogOut Button and LogOut Function for UserSideBar.js

```js
const logOut = () => {
  signOut(auth);
  setAlert({
    open: true,
    type: 'success',
    message: 'Logout Successfull!',
  });
  toggleDrawer();
};

<Button variant="contained" className={classes.logout} onClick={logOut}>
  Log Out
</Button>;
```

## Adding Google Authentication

1. Inside of our AuthModal.js inside authentication folder
2. Lets add a Box with the className of classes.google and import from MUI
3. Add a span inside that box with OR
4. Following our <span> lets add <GoogleButton>
5. Import GoogleButton from 'react-google-button'
6. lets create an empty function after our handleChange named signInWithGoogle
7. Test and going to login prompt, confirm our Sign In with google Button Exists
8. Now lets add the google styles to our AuthModal.js

```css
  google: {
    padding: 24,
    paddingTop: 0,
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    gap: 20,
    fontSize: 20,
  },
```

9. Adding Google Auth Provider

   1. const googleProvider = new GoogleAuthProvider()
      1. import googleAuthProvder from 'firebase/auth'
   2. create const signInWithPopup (this is a firebase function)
      1. import signInWithPopup from 'firebase/auth'
      2. pass auth as the first arg, don't forget to import
      3. pass googleProvider as our 2nd arg
   3. add .then()
      1. const setAlert from CryptoState()
         1. import CrpytoState
      2. Add handleClose() to shut the login prompt
   4. add .catch() for our error handling

      1. pass setAlert(see example for props)
      2. return

   5. Test the Google Auth Login now, it should work!

Google Provider Code

```.js

  const { setAlert } = CryptoState();

  const googleProvider = new GoogleAuthProvider();

  const signInWithGoogle = () => {
    signInWithPopup(auth, googleProvider)
      .then((res) => {
        setAlert({
          open: true,
          message: `Sign Up Successful. Welcome ${res.user.email}`,
          type: 'success',
        });
        handleClose();
      })
      .catch((error) => {
        setAlert({
          open: true,
          message: error.message,
          type: 'error',
        });
        return;
      });
```

## Adding FIRESTORE for our WATCHLIST storage

1. Go to Firebase Dashboard, under BUILD find FIRESTORE DATABASE. Click
2. Swith radio start in test
3. Test mode allows you more than 30 days of development for free
4. Select a Server, default works
5. Click Rule tab
   1. We want only logged in users to be able to add coins to their watchlist
   2. first remove the line that turns off the DB after 30 days.
   3. Next lets remove the code inside the first match block

## Adding Endpoints to your Firstore DB

1. add api endpoints you want to be asssociated with this data
2. match /watchlist/{userId}
3. We can create a function for our read and pass our userId to create a cleaner code

### FireStore Endpoint Logic for Watchlist

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /watchlist/{userId}{
    	allow read: if isLoggedIn(userId)
      allow write: if request.auth.uid == userId
    }
  }
    function isLoggedIn(userId){
  return request.auth.uid == userId
  }
}
```

## Add to Watchlist Button and Frontend Logic

1. First open CoinPage.js inside Pages
2. Lets add user to our CryptoState Destructure
3. We only want to display the button IF the user is loggedIn
4. Go underneath our <span> tag and add {}

### Add to Watchlist Button

```js
{
  user && (
    <Button
      variant="outlined"
      style={{ width: '100%', height: 40, backgroundColor: '#EEBC1D' }}
    >
      Add to Watchlist
    </Button>
  );
}
```

### Adding Add to Watchlist Firebase Logic

1. Inside our CoinPage.js lets create a const addToWatchList
2. Inside addToWatchList we create another const coinRef
   1. add const coinRef = doc(db, 'watchlist', user.uid);
   2. doc is imported form our firestore
   3. db is imported from firebase
3. Add a try catch block next
4. add setDoc and import from firestore
   1. Pass our coinRef as the first arg that has all the doc data
   2. Pass an object with coins and ternirary logic for if a watchlist currently exists or needs to be created (see example below)
5. Add watchlist and setWatchList to our cryptoContext useState
6. pass it down via the Provider too
7. now we can add watchlist to our destructure on coinpage
8. after our setSoc lets add a setAlert to notify our user
9. Lets add a variable inWatchList that checks if the coin are viewing is currently on the watchlist.
10. Now we can Test and see if our firebase DB has the coin we added!

### FireBase Watchlist Endpoint Code

```js
const addToWatchlist = async () => {
  const coinRef = doc(db, 'watchlist', user.uid);

  try {
    await setDoc(coinRef, {
      coins: watchlist ? [...watchlist, coin.id] : [coin?.id],
    });
    setAlert({
      open: true,
      message: `${coin.name} Added to the Watchlist !`,
      type: 'success',
    });
  } catch (error) {
    setAlert({
      open: true,
      message: error.message,
      type: 'error',
    });
  }
};
```

### Watchlist Logic on CoinPage.js

```js
{
  user && (
    <Button
      variant="outlined"
      style={{ width: '100%', height: 40, backgroundColor: '#EEBC1D' }}
      onClick={addToWatchlist}
    >
      {inWatchList ? 'Remove from Watchlist' : 'Add to Watchlist'}
    </Button>
  );
}
```

## Adding Watchlist Logic for If User Is Logged In

1. On CryptoContext we want to create a useEffect

   1. if (user){} // If user is logged in
   2. add user to useEffect depedency array
   3. add our const coinRef = doc() //import doc

      1. pass db //import too
      2. pass endpoint // watchlist
      3. pass user id // user.uid

   4. Now we can add onSnapshot() and check the db for changes to our reference
      1. Add coinRef as first arg
      2. (coin) as our second arg
      3. add if coin.exists() setWatchlist
         1. pass coin.data().coins
      4. else log "no items in Watchlist"
   5. lets add var unsubscribe to our onSnapshot
   6. Last add a return anonymous function and call unsubscribe()

### Watchlist Example

```js
useEffect(() => {
  if (user) {
    const coinRef = doc(db, 'watchlist', user.uid);

    var unsubscribe = onSnapshot(coinRef, (coin) => {
      if (coin.exists()) {
        setWatchlist(coin.data().coins);
      } else {
        console.Console('No Items in Watchlist');
      }
    });
    return () => {
      unsubscribe();
    };
  }
}, [user]);
```

## Remove from Watchlist

1. Now we need to implement removeFromWatchlist

   1. On our CoinPage lets add const removeFromWatchList function
   2. copy our logic from addToWatchList as it will be similiar

2. Updating setDoc in our Try Block
   1. add coins: watchlist.filter((watch) => watch !== coin?.id)
   2. this takes our watchlist and updates the watchlist to have all coins but the coin we reference
   3. Add {merge: 'true'} to update hte doc with the new watchlist filtered data
   4. Update setALert to say "removed from watchlist instead of added"

### Updated Remove From Watchlist Code

```js
const removeFromWatchList = async () => {
  const coinRef = doc(db, 'watchlist', user.uid);

  try {
    await setDoc(
      coinRef,
      {
        coins: watchlist.filter((watch) => watch !== coin?.id),
      },
      { merge: true }
    );
    setAlert({
      open: true,
      message: `${coin.name} Removed the Watchlist !`,
      type: 'success',
    });
  } catch (error) {
    setAlert({
      open: true,
      mesage: error.message,
      type: 'error',
    });
  }
};
```

## Displaying our Watchlist items in sidebar

1. Go to UserSideBar.js
2. Lets add our watchlist from CryptoState so we can tap into our watchlist coins
3. under our Watchlist span
   1. add {coins.map(coin => {})}
   2. add if watchlist includes (coin.id)
   3. return a <div> with classes.coin
   4. inside that div, put a span with {coin.name}
   5. add another span after with style (see example code)
   6. inside that span put {symbol} from our Context API and import
   7. After symbol Paste our numberWithCommas function we cretaed earlier and pass coin.current_price.toFixed(2) and import.
   8. We need an ICON now to Delete a Coin from the Watchlist
   9. npm i react-icons --force
   10. import {AiFillDelete} from 'react-icons/ai'
   11. Add coin styles (see github) to UserSideBar

### Remove Watchlist Coin from UserSideBar Code

```js
<div className={classes.watchlist}>
  <span style={{ fontSize: 15, textShadow: '0 0 5px black' }}>Watchlist</span>
  {coins.map((coin) => {
    if (watchlist.includes(coin.id))
      return (
        <div className={classes.coin}>
          <span>{coin.name}</span>
          <span style={{ display: 'flex', gap: 8 }}>
            {symbol} {numberWithCommas(coin.current_price.toFixed(2))}
            <AiFillDelete
              style={{ cursor: 'pointer' }}
              fontSize="16"
              onClick={() => removeFromWatchlist(coin)}
            />
          </span>
        </div>
      );
    else return <></>;
  })}
</div>
```

## Remove from watchlist

1. Lets Copy our RemoveFromWatchlist code from CoinPage.js
2. We want to add coin as the arg1 for our pasted function
3. import doc, db, and setdoc
4. add removeFromWatchlist function to onClick for our AiFillDelete and pass coin as the arg

## Cons of Google Firebase

1. If not properly managed, the cost of maintaining Firebase on a pay-as-you-go service accumulates as reads and writes increase. So maintenance costs can spike at some points.
2. It's hard to export data stored in Firestore into another database. Even if you eventually find a way, it often requires a high level of technicality. Plus, it can be quite costly, too.
3. It can be less platform-agnostic, as it delves more towards Android than iOS.
4. The larger the query result gets, the messier and slower things become.

## Noteables

- With Firebase, it's pretty simple to connect and use built-in third-party authentication providers, including Google, Facebook, Twitter, among others.

Learn more about it [here](https://v4.mui.com/styles/api/#makestyles-styles-options-hook)
