import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { auth, database } from "./firebase-init.js";

window.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById("loginForm");
  const idInput = document.getElementById("loginId");
  const passwordInput = document.getElementById("passwordInput");
  const saveEmailCheckbox = document.getElementById("saveEmailCheckbox");

  const savedEmail = localStorage.getItem("savedEmail");
  if (savedEmail) {
    idInput.value = savedEmail.split("@")[0];
    if (saveEmailCheckbox) saveEmailCheckbox.checked = true;
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const idPart = idInput.value.trim();
    const email = `${idPart}@cafebless.com`; // ✅ 여기서 초기화
    const password = passwordInput.value;

    if (saveEmailCheckbox?.checked) {
      localStorage.setItem("savedEmail", email);
    } else {
      localStorage.removeItem("savedEmail");
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(database, `users/${user.uid}`);
      const snapshot = await get(userRef);

      if (!snapshot.exists()) {
        throw new Error("사용자 역할 정보가 없습니다。");
      }

      const { role, nickname } = snapshot.val();
      const authEmail = user.email;

      if (role === "admin" || role === "manager") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("role", role);
        localStorage.setItem("nickname", nickname || "");
        localStorage.setItem("email", authEmail); // ✅ 확실한 값으로 저장
        window.location.href = "./home/";
      } else {
        alert("권한이 없는 사용자입니다。");
      }

    } catch (error) {
      alert("ログイン失敗: " + error.message);
    }
  });
});
