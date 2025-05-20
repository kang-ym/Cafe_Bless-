"use strict";

// orders.js
'use strict';

// 📅 오늘 날짜 표시
const today = new Date();
const orderDate = document.getElementById('orderDate');
orderDate.textContent = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

// 📦 주문 데이터 예시
const orders = [
  { coffee: 'アメリカーノ', temp: 'ホット', size: 'R', name: '강영민', point: 250 },
  { coffee: 'カフェラテ', temp: 'アイス', size: 'L', name: '강영민', point: 180 },
  { coffee: 'バニララテ', temp: 'ホット', size: 'R', name: '하윤맘', point: -50 }
];

// 📋 주문 렌더링
const orderList = document.getElementById('orderList');
orders.forEach(order => {
  const li = document.createElement('li');
  li.classList.add('order-item');

  const isLow = order.point <= 200;
  const warning = isLow ? '!!' : '';
  const pointDisplay = isLow ? `<span style="color:red;">(${order.point}円)</span>` : `(${order.point}円)`;

  li.innerHTML = `
    <div><strong>${warning} ${order.coffee}</strong> ${order.temp} ${order.size} ${order.name}${warning} ${pointDisplay}</div>
    <label><input type="checkbox"> 完了</label>
  `;

  orderList.appendChild(li);
  sendToGoogleSheet(order);
});

// ✅ Google Sheets로 전송
function sendToGoogleSheet(orderData) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(orderData));
  
    fetch("https://script.google.com/macros/s/AKfycbxMX5UCAq6IrdCCxyWCXlZSFRy6ACAKDsPmo1Xl1Dt-IhSudtVZuQVBL3SvD98b7NJ3/exec", {
      method: "POST",
      body: formData,
    })
    .then(res => res.text())
    .then(msg => console.log("✅ 주문 전송 성공:", msg))
    .catch(err => console.error("❌ 주문 전송 실패:", err));
  }
  