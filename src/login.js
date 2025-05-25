
import { database } from './firebase-init.js';

// ✅ Firebase SDK 모듈 import (최상단에만 위치 가능)
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

// ✅ Firebase 프로젝트 설정 (자신의 firebaseConfig로 대체 가능)
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

// ✅ DOM이 완전히 로드된 후에 실행 (DOM 요소를 안전하게 다루기 위해)
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Firebase 앱 및 서비스 초기화
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const database = getDatabase(app);

  // ✅ 로그인 폼 및 입력 요소 가져오기
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");

  // ✅ 로그인 폼 제출 이벤트 처리
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault(); // 기본 제출 동작 방지

    const email = emailInput.value.trim();   // 입력한 이메일
    const password = passwordInput.value;    // 입력한 비밀번호

    // ✅ Firebase 이메일/비밀번호 로그인 시도
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // ✅ 로그인 성공 시, 로그인 기록을 DB에 저장
        const loginRef = ref(database, "logins/" + user.uid);
        set(loginRef, {
          email: user.email,
          timestamp: new Date().toISOString()  // 현재 시간 기록
        });

        // ✅ 로그인 성공 후 메인 페이지로 이동
        window.location.href = "/home/";
      })
      .catch((error) => {
        console.error("ログインエラー:", error);
        alert("로그イン失敗: " + error.message);  // 에러 메시지 표시
      });
  });
});
