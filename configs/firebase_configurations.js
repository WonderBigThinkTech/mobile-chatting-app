import { initializeApp } from 'firebase/app';
import {
  getReactNativePersistence,
  initializeAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, collection, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBI0Itk7IpOKLbqHeMhKsJf7IBrxVyT4rA",
  authDomain: "whatsupnonumber.firebaseapp.com",
  projectId: "whatsupnonumber",
  storageBucket: "whatsupnonumber.appspot.com",
  messagingSenderId: "387489523122",
  appId: "1:387489523122:web:bc12a0a6e03fcc962eb0ab",
  measurementId: "G-P8YHQPJWQC"
};

// Initialize Firebase
const firebase = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with AsyncStorage persistence
const auth = initializeAuth(firebase, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firebase Storage
const storage = getStorage(firebase);

// Initialize Firestore
const db = getFirestore(firebase);

export { firebase, auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, db, storage };
