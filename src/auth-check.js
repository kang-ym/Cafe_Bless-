import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
const auth = getAuth();

onAuthStateChanged(auth, user => {
  if (!user) {
    // 🔒 로그인되지 않은 사용자
    alert("ログインが必要です。");
    window.location.href = "/Cafe_Bless-/login.html";
    return;
  }

  const email = user.email;
  const path = window.location.pathname;

  // 🔐 관리자 계정
  const isAdmin = email === "admin@cafebless.com";
  // 🔐 매니저 계정
  const isManager = email === "manager1@cafebless.com";

  // ✅ 관리자 허용: 전체 경로
  if (isAdmin) return;

  // ✅ 매니저 허용: /home/, /orders/
  const isHomeOrOrdersPage = path.includes("/home") || path.includes("/orders");
  if (isManager && isHomeOrOrdersPage) return;

  // ❌ 그 외는 접근 차단
  alert("このページへのアクセス権限がありません。");
  window.location.href = "/Cafe_Bless-/home/";
});
