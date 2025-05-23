import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth-compat.js";

const auth = getAuth();

// a태그 클릭 시 기본 이동 막고 로그아웃 처리
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault(); // 링크 이동 방지
    signOut(auth)
      .then(() => {
        localStorage.removeItem("role");
        alert("ログアウトしました。");
        window.location.href = "/Cafe_Bless-/index.html"; // 또는 login.html
      })
      .catch((error) => {
        alert("ログアウト失敗: " + error.message);
      });
  });
}
