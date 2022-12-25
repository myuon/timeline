import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC436Zpl9G8aLBodMuqg9Ij8NfQKqbTnEw",
  authDomain: "default-364617.firebaseapp.com",
  projectId: "default-364617",
  storageBucket: "default-364617.appspot.com",
  messagingSenderId: "230906399487",
  appId: "1:230906399487:web:7d9bb236c20ef911fcdaca",
  measurementId: "G-KCK6NEQYQE",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
