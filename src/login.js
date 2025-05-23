// ✅ Firebase 인증 및 DB 불러오기
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// ✅ Firebase 설정 (firebase-init.js의 내용을 직접 포함하거나 import 가능)
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

// ✅ Firebase 앱 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// ✅ DOM 요소
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// ✅ 로그인 이벤트
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // ✅ 로그인 정보 기록
      const loginRef = ref(database, "logins/" + user.uid);
      set(loginRef, {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // ✅ 로그인 성공 → 이동
      window.location.href = "/Cafe_Bless-/home/";
    })
    .catch((error) => {
      console.error("ログインエラー:", error);
      alert("ログイン失敗: " + error.message);
    });
});
