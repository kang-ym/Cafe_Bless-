"use strict";

// 로그인 상태 확인
const isLoggedIn = localStorage.getItem("isLoggedIn");

if (isLoggedIn !== "true") {
    // 로그인 안 했으면 index.html로 이동
    window.location.href = "../index.html";
}

// ✅ 버튼 텍스트 변경
window.addEventListener("DOMContentLoaded", () => {
    const managerBtn = document.querySelector(".manager-btn");
    if (managerBtn && isLoggedIn === "true") {
        managerBtn.textContent = "Logout";

        managerBtn.addEventListener('click', ()=>{
            localStorage.removeItem('isLoggedIn');
            window.location.href = '../index.html';
        });
    }
});