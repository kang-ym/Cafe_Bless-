'use strict';

import { auth } from "./firebase-init.js"; // ✅ 초기화된 Firebase 앱에서 auth 가져오기
import { signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault(); // 링크 이동 방지

    signOut(auth)
      .then(() => {
        // ✅ 로그아웃 성공 시
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("role");


        // ✅ 로그인 페이지나 메인으로 이동
        const basePath = window.location.hostname.includes("github.io")
          ? "./index.html"
          : "";

        window.location.href = `${basePath}/index.html`;
      })
      .catch((error) => {
        alert("ログアウト失敗: " + error.message);
      });
  });
}
