// src/index.js

import React from "react";
import ReactDOM from "react-dom";
import firebase from "firebase/app";
import "firebase/auth";
import App from "./App";

const firebaseConfig = {
  apiKey: "AIzaSyCNJkZQAHnwfw5JwU2PE74rG3i8zxO9MBs",
  authDomain: "meet-clone-67e84.firebaseapp.com",
  projectId: "meet-clone-67e84",
  storageBucket: "meet-clone-67e84.appspot.com",
  messagingSenderId: "1003098772887",
  appId: "1:1003098772887:web:69aaacdc955d73a5d4a0d2",
  measurementId: "G-T7DN5V7FYB",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
