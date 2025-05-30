// ✅ Firebase 인증 및 DB 모듈 가져오기
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

const loadingScreen = document.getElementById("loadingScreen");

// ✅ 초기 로딩 화면 표시
if (loadingScreen) loadingScreen.style.display = "flex";

// ✅ 사용자 인증 상태 확인
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // ✅ alert 후 redirect 충돌 방지 위해 지연 처리
    alert("ログインが必要です。");
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 100); // 약간의 딜레이 후 리디렉션
    return;
  }

  const uid = user.uid;
  const path = window.location.pathname;
  const userEmailDisplay = document.getElementById("userEmail");

  try {
    // ✅ 사용자 권한 정보 조회
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) throw new Error("ユーザーの権限情報が見つかりません。管理者にお問い合わせください。");

    const data = snapshot.val();
    const role = data.role;
    const nickname = data.nickname;

    // ✅ 화면에 사용자 닉네임 또는 이메일 표시
    if (userEmailDisplay) {
      userEmailDisplay.textContent = nickname ? `こんにちは、${nickname}様` : user.email;
    }

    // ✅ 네비게이션 메뉴 생성
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

    // ✅ 페이지 접근 제한
    if (role === "admin") return;

    if (role === "manager") {
      const isAllowed = path.includes("/home") || path.includes("/orders");
      if (isAllowed) return;

      alert("このページへのアクセス権限がありません。");
      window.location.href = "../home/";
      return;
    }

    // ❌ 알 수 없는 권한
    alert("アクセス権限がありません。");
    window.location.href = "./index.html";

  } catch (err) {
    // ❌ 인증 에러 처리
    console.error("認証エラー:", err);
    alert("認証エラー: " + err.message);
    window.location.href = "./index.html";
  } finally {
    // ✅ 성공/실패 관계없이 로딩 화면 닫기
    if (loadingScreen) loadingScreen.style.display = "none";
  }
});
