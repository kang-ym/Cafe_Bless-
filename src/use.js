'use strict';

const usePage = document.querySelector('.use-container');
const closeBtn = document.querySelector('.close-btn');
const openBtn = document.querySelector('.use-btn');
const hideTodayCheckbox = document.getElementById('hideToday');

// 오늘 날짜 문자열
const today = new Date().toISOString().split('T')[0];

// ✅ 저장된 날짜 확인해서 표시 여부 결정
if (localStorage.getItem('hideUseGuide') === today) {
  usePage.style.display = 'none';
} else {
  usePage.style.display = 'flex';
}

// 닫기 버튼 클릭 시 안내 숨김 + 체크된 경우 저장
closeBtn.addEventListener('click', () => {
  usePage.style.display = 'none';
  if (hideTodayCheckbox.checked) {
    localStorage.setItem('hideUseGuide', today);
  }
});

// "사용 방법" 버튼 클릭 시 안내 표시
openBtn.addEventListener('click', () => {
  usePage.style.display = 'flex';
});
