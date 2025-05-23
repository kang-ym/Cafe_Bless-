const auth = firebase.auth();

document.getElementById("loginBtn").addEventListener("click", () => {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPw").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      const user = userCredential.user;
      const email = user.email;

      // ✅ 역할 구분
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

//  login.js에 로그 저장 함수 추가
function saveLoginLog(email) {
  const db = firebase.database(); // compat 버전 사용 중
  const now = new Date();
  const timestamp = now.toISOString(); // 예: 2024-07-10T12:00:00.123Z

  const logData = {
    email,
    time: timestamp
  };

  // Firebase에 저장
  db.ref("logs").push(logData);
}

//로그인 성공 시 로그 함수 호출
auth.signInWithEmailAndPassword(email, password)
  .then(userCredential => {
    const user = userCredential.user;
    const email = user.email;

    // ✅ 로그 저장
    saveLoginLog(email);

    // ✅ 역할에 따라 이동
    if (email === "admin@cafe.com") {
      localStorage.setItem("role", "admin");
      window.location.href = "/Cafe_Bless-/home/index.html";
    } else {
      localStorage.setItem("role", "manager");
      window.location.href = "/Cafe_Bless-/orders/index.html";
    }
  })
