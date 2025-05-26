'use strict';

window.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginInput = document.getElementById("passwordInput");
  const loginBox = document.querySelector(".login-container");
  const loginCloseBtn = document.querySelector(".login-close-btn");
  const managerBtn = document.querySelector(".manager-btn");

  // ✅ index.html 등에서 login 관련 요소가 없을 수 있으므로 조건 체크
  if (!loginBtn || !loginInput || !loginBox || !managerBtn) return;

  // ✅ 로그인 창 열기 / 로그아웃
  managerBtn.addEventListener("click", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn === "true") {
      // ✅ 로그아웃 처리
      localStorage.removeItem("isLoggedIn");
      alert("ログアウトしました。");
      window.location.href = "index.html";
      managerBtn.textContent = "Manager Login";
      loginInput.value = "";
      location.reload();
    } else {
      // ✅ 로그인 창 열기
      loginBox.style.display = "flex";
      loginInput.focus();
    }
  });

  // ✅ 로그인 창 닫기
  if (loginCloseBtn) {
    loginCloseBtn.addEventListener("click", () => {
      loginBox.style.display = "none";
      loginInput.value = "";
    });
  }

  // ✅ 로그인 버튼 클릭
  loginBtn.addEventListener("click", () => {
    const password = loginInput.value;
    if (password === "blesscafe") {
      // ✅ 로그인 성공 처리
      localStorage.setItem("isLoggedIn", "true");
      alert("ログイン成功！");
      window.location.href = "home/"; // 원하는 페이지 경로로 이동
    } else {
      alert("パスワードが違います。");
      loginInput.value = "";
    }
  });
});
