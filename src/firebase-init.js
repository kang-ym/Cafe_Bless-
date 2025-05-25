// firebase-init.js (v9 모듈 방식)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjosiHexyZJWx8YS9M6D2sMDhAUtoGuT8",
  authDomain: "cafe-bless.firebaseapp.com",
  databaseURL: "https://cafe-bless-default-rtdb.firebaseio.com",
  projectId: "cafe-bless",
  storageBucket: "cafe-bless.firebasestorage.app",
  messagingSenderId: "338610796982",
  appId: "1:338610796982:web:1c7697bf5d25a77ea6a917",
  measurementId: "G-NK8GRG23T9"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
