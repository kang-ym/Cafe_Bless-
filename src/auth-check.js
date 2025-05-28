import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("ログインが必要です。");
    window.location.href = "./index.html";
    return;
  }

  const uid = user.uid;
  const path = window.location.pathname;
  const userEmailDisplay = document.getElementById("userEmail");

  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) throw new Error("권한 정보 없음");

    const data = snapshot.val();
    const role = data.role;
    const nickname = data.nickname;

    // 닉네임 표시
    if (userEmailDisplay) {
      userEmailDisplay.textContent = nickname ? `${nickname}様` : user.email;
    }

    // ✅ 네비게이션 메뉴 삽입도 여기에 위치
    const navBox = document.querySelector(".nav-box");
    if (navBox) {
      const commonItems = [
        { label: "Home", href: "../home/" },
        { label: "Today's Orders", href: "../orders/" }
      ];
      const adminItems = [
        { label: "Cafe Ledger", href: "../cafe-ledger/" },
        { label: "Lunch Ledger", href: "../lunch-ledger/" }
      ];

      commonItems.forEach(item => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
        navBox.appendChild(li);
      });

      if (role === "admin") {
        adminItems.forEach(item => {
          const li = document.createElement("li");
          li.innerHTML = `<a href="${item.href}">${item.label}</a>`;
          navBox.appendChild(li);
        });
      }
    }

    // ✅ 접근 제어 (현재 페이지 기준)
    if (role === "admin") return;

    if (role === "manager") {
      const isHomeOrOrdersPage = path.includes("/home") || path.includes("/orders");
      if (isHomeOrOrdersPage) return;

      alert("このページへのアクセス権限がありません。");
      window.location.href = "../home/";
      return;
    }

    // 알 수 없는 권한
    alert("アクセス権限がありません。");
    window.location.href = "./index.html";

  } catch (err) {
    console.error("권한 확인 실패:", err);
    alert("認証エラー: " + err.message);
    window.location.href = "./index.html";
  }
});
