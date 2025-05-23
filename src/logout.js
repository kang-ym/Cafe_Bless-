// logout.js
// compat 버전에 맞게 firebase.auth() 사용
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault(); // 링크 이동 방지

    firebase.auth().signOut()
      .then(() => {
        localStorage.removeItem("role");
        alert("ログアウトしました。");
        window.location.href = "/Cafe_Bless-/index.html"; // 홈 또는 로그인으로 이동
      })
      .catch((error) => {
        alert("ログアウト失敗: " + error.message);
      });
  });
}
