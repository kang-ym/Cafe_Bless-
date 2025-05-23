import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js";

const auth = getAuth();

onAuthStateChanged(auth, user => {
  if (!user) {
    // 로그인 안된 상태
    alert("ログインが必要です。");
    window.location.href = "/Cafe_Bless-/login.html";
    return;
  }

  const email = user.email;

  const currentPath = window.location.pathname;

  // Ledger 페이지일 경우 admin만 허용
  if (currentPath.includes("ledger") && email !== "admin@cafe.com") {
    alert("このページへのアクセス権限がありません。");
    window.location.href = "/Cafe_Bless-/orders/index.html";
  }

  // Orders 페이지는 로그인된 사람은 모두 허용
  // Index.html은 별도 제어 X
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = user.email;
    const userEmailEl = document.getElementById("userEmail");
    if (userEmailEl) {
      if (email === "admin@cafe.com") {
        userEmailEl.textContent = `👑 管理者: ${email}`;
      } else {
        userEmailEl.textContent = `👤 ${email}`;
      }
    }
  }
});
