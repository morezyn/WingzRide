import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore: getReactNativePersistence is often missing from TypeScript definitions 
// but is available in the React Native bundle at runtime.
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCHK98TYsCUM8p5uYIuIe6UfFWZhMv5iTY",
  authDomain: "wingz-d064c.firebaseapp.com",
  projectId: "wingz-d064c",
  storageBucket: "wingz-d064c.firebasestorage.app",
  messagingSenderId: "114550671816",
  appId: "1:114550671816:web:18e84f1c5e1e9f733358fd",
  measurementId: "G-80Q9840PVW"
};

const app = initializeApp(firebaseConfig);

// This ensures Margaret Collins and your other riders stay logged in for your demo
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app);

export { auth, db };