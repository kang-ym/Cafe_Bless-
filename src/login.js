"use strict";

// ✅ 로그인 기능
const loginBtn = document.getElementById("loginBtn");
const loginInput = document.getElementById("passwordInput");
const loginBox = document.querySelector(".login-container");
const loginCloseBtn = document.querySelector(".login-close-btn");
const managerBtn = document.querySelector(".manager-btn");

// 로그인 창 열기
managerBtn.addEventListener("click", () => {
    loginBox.style.display = "flex";
    loginInput.focus();
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
  const correctPassword = "bless123"; // ✔️ 원하는 비밀번호

  if (password === correctPassword) {
    // ✅ GitHub Pages 환경 대응 경로 처리
    const basePath = window.location.hostname.includes("github.io")
      ? "/Cafe_Bless-"
      : "";

    window.location.href = `${basePath}/home/index.html`;
    localStorage.setItem("isLoggedIn", "true"); // 상태 저장

    loginBox.style.display = "none";
    loginInput.value = "";
  } else {
    alert("パスワードが間違っています。");
  }
});

// ✅ Enter 키로 로그인
loginInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    loginBtn.click();
  }
});

// ✅ 페이지 열릴 때 로그인 상태 확인
window.addEventListener("DOMContentLoaded", () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (isLoggedIn === "true") {
    loginBox.style.display = "none";
    console.log("이미 로그인된状態입니다。");
  }
});
