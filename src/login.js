'use strict';

// Firebase Auth 모듈 가져오기
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { auth } from "./firebase-init.js"; // 이미 초기화된 auth 사용

// 페이지 로딩 후 이벤트 연결
window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("passwordInput");

  // 버튼이나 input 요소가 없는 경우 종료
  if (!loginBtn || !emailInput || !passwordInput) return;

  // 로그인 버튼 클릭 시 동작
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault(); // 폼 기본 제출 방지

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Firebase 인증 시도
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userEmail = user.email;

        // ✅ 권한 분기
        if (userEmail === "admin@cafebless.com") {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", "admin");
          window.location.href = "./home/"; // 관리자 → 홈
        } else if (userEmail === "manager1@cafebless.com") {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", "manager");
          window.location.href = "./home/"; // 매니저도 홈
        } else {
          alert("권한이 없는 사용자입니다。");
        }
      })
      .catch((error) => {
        // 로그인 실패
        alert("ログイン失敗: " + error.message);
      });
  });
});
