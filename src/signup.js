import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { auth, database } from "./firebase-init.js";

window.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");

  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idPart = document.getElementById("signupId").value.trim();
    const email = `${idPart}@cafebless.com`;
    const password = document.getElementById("signupPassword").value;
    const nickname = document.getElementById("nickname").value.trim();
    const registerCode = document.getElementById("registerCode").value.trim();
    
    let role = null;

    // 등록번호 확인
    if (registerCode === "admin1234") {
      role = "admin";
    } else if (registerCode === "manager5678") {
      role = "manager";
    } else {
      alert("登録番号が正しくありません。");
      return;
    }

    try {
      // 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 역할 정보 저장
      await set(ref(database, `users/${user.uid}`), {
        email: user.email,
        nickname,
        role
      });

      alert("登録完了しました！ログインしてください。");
      window.location.reload(); // 로그인 폼으로 전환
    } catch (error) {
      alert("登録失敗: " + error.message);
    }
  });

  // 폼 전환 버튼
  document.getElementById("showLogin").addEventListener("click", () => {
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
  });

  document.getElementById("showSignup").addEventListener("click", () => {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
  });
});
