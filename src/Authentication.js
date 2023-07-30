// src/Authentication.js

import React, { useState } from "react";
import firebase from "firebase/app";
import "firebase/auth";

const Authentication = ({ onLogin }) => {
  const [userId, setUserId] = useState("");

  const handleLogin = async () => {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      const { uid } = result.user;
      setUserId(uid);
      onLogin(uid);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Log in with Google</button>
      {userId && <p>User ID: {userId}</p>}
    </div>
  );
};

export default Authentication;
