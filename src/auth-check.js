import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("ログインが必要です。");
    window.location.href = "/Cafe_Bless-/login.html";
    return;
  }

  const uid = user.uid;
  const path = window.location.pathname;

// 로그인한 사용자 닉네임 화면에 표시
const userEmailDisplay = document.getElementById("userEmail");

try {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    throw new Error("권한 정보 없음");
  }

  const { role, nickname } = snapshot.val();

  if (userEmailDisplay) {
    userEmailDisplay.textContent = nickname ? `${nickname}님` : user.email;
  }

    // 🔐 권한 체크
    if (role === "admin") {
      // ✅ 관리자: 전체 허용
      return;
    }

    if (role === "manager") {
      const isHomeOrOrdersPage = path.includes("/home") || path.includes("/orders");
      if (isHomeOrOrdersPage) return;

      // ❌ 매니저지만 접근 불가
      alert("このページへのアクセス権限がありません。");
      window.location.href = "/Cafe_Bless-/home/";
      return;
    }

    // ❌ 정의되지 않은 사용자
    alert("アクセス権限がありません。");
    window.location.href = "./index.html";

  } catch (err) {
    console.error("권한 확인 실패:", err);
    alert("認証エラー: " + err.message);
    window.location.href = "./index.html";
  }
});
