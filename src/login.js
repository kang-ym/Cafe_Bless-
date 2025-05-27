'use strict';

// Firebase Auth 모듈 가져오기
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { auth } from "./firebase-init.js"; // ✅ 이미 초기화된 auth 사용

// ✅ 페이지 로딩 후 실행
window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById("loginForm");
  const loginBtn = document.getElementById("loginBtn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("passwordInput");
  const saveEmailCheckbox = document.getElementById("saveEmailCheckbox");

  // ✅ 저장된 이메일이 있다면 자동 채움
  const savedEmail = localStorage.getItem("savedEmail");
  if (savedEmail) {
    emailInput.value = savedEmail;
    if (saveEmailCheckbox) saveEmailCheckbox.checked = true;
  }

  if (!loginForm || !emailInput || !passwordInput) return;

  // ✅ 로그인 처리: 버튼 클릭 + 엔터 키 제출 모두 대응
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // ✅ 이메일 저장 여부 처리
    if (saveEmailCheckbox?.checked) {
      localStorage.setItem("savedEmail", email);
    } else {
      localStorage.removeItem("savedEmail");
    }

    // ✅ Firebase 인증
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userEmail = user.email;

        if (userEmail === "admin@cafebless.com") {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", "admin");
          window.location.href = "./home/";
        } else if (userEmail === "manager1@cafebless.com") {
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("role", "manager");
          window.location.href = "./home/";
        } else {
          alert("권한이 없는 사용자입니다。");
        }
      })
      .catch((error) => {
        alert("ログイン失敗: " + error.message);
      });
  });
});
