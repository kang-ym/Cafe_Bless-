const auth = firebase.auth();
const db = firebase.database();

document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPw").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      const email = user.email;

      // ✅ 로그인 로그 기록
      saveLoginLog(email);

      // ✅ 역할 구분 후 이동
      if (email === "admin@cafe.com") {
        localStorage.setItem("role", "admin");
        window.location.href = "/Cafe_Bless-/home/index.html";
      } else {
        localStorage.setItem("role", "manager");
        window.location.href = "/Cafe_Bless-/orders/index.html";
      }
    })
    .catch(error => {
      alert("ログイン失敗: " + error.message);
    });
});

function saveLoginLog(email) {
  const now = new Date();
  const timestamp = now.toISOString();

  const logData = {
    email,
    time: timestamp
  };

  db.ref("logs").push(logData);
}
