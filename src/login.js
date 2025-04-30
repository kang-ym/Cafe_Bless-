"use strict";

// ✅ 로그인 기능
const loginBtn = document.getElementById("loginBtn");
const loginInput = document.getElementById("passwordInput");
const loginBox = document.querySelector(".login-container");
const loginCloseBtn = document.querySelector(".login-close-btn");
const managerBtn = document.querySelector(".manager-btn");

// 로그인 창 열기
managerBtn.addEventListener("click", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn === "true") {
    // ✅ 로그아웃 처리
    localStorage.removeItem("isLoggedIn");
    alert("ログアウトしました。");
    managerBtn.textContent = "Manager Login";
    loginInput.value = "";
    location.reload(); // 상태 반영을 위해 새로고침
  } else {
    // ✅ 로그인 창 열기
    loginBox.style.display = "flex";
    loginInput.focus();
  }
});

// 로그인 창 닫기
loginCloseBtn.addEventListener("click", () => {
  loginBox.style.display = "none";
  loginInput.value = "";
});

// 로그인 버튼 클릭
loginBtn.addEventListener("click", (e) => {
  e.preventDefault(); // 폼 제출 막기

  const password = loginInput.value.trim();
  const correctPassword = "bless123"; // ✔️ 원하는 비밀번호로 설정하세요

  if (password === correctPassword) {
    alert("로그인 성공!");
    // 이동하려면 다음 줄 주석 해제
    // window.location.href = 'manager.html';
    localStorage.setItem("isLoggedIn", "true"); // 상태 저장
    managerBtn.textContent = "Logout";

    loginBox.style.display = "none";
    loginInput.value = "";
  } else {
    alert("パスワードが間違っています。");
  }
  console.log("로그인 됨");
});

// ✅ Enter 키로 로그인
loginInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // form 제출 막기
    loginBtn.click(); // 로그인 버튼 클릭한 것처럼 처리
  }
});

// ✅ 페이지 열릴 때 로그인 상태 확인
window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (isLoggedIn === "true") {
    loginBox.style.display = "none";
    console.log("이미 로그인된 상태입니다.");
    managerBtn.textContent = "Logout";
  }
});
