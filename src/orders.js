// orders.js - 오늘의 주문 화면 표시용 (displayDate 기준 비교)

'use strict';

// ✅ 오늘 날짜 구하기 (화면 표시용 형식과 일치)
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const todayDisplay = `${year}.${month}.${date}`;  // 예: 2025.05.22

const orderList = document.getElementById('orderList');

// ✅ Firebase에서 orders 불러오기
const ordersRef = database.ref('orders');
ordersRef.once('value').then(snapshot => {
  const data = snapshot.val();
  if (!data) return;

  // ✅ displayDate로 오늘 주문 필터링
  const orders = Object.entries(data).filter(([_, order]) => order.displayDate === todayDisplay);

  // ✅ 날짜 표시
  const orderDateTitle = document.getElementById('orderDate');
  orderDateTitle.textContent = todayDisplay;

  // ✅ 주문 렌더링
  orders.reverse().forEach(([id, order]) => {
    const div = document.createElement('div');
    div.className = 'order-item';
    const hotOrCold = order.temperature === 'hot' ? 'hot🔥' : 'cold❄️';
    div.innerHTML = `
      <p>${order.coffee} / ${hotOrCold} / ${order.size} / ${order.name} (${order.price}P)</p>
      <label><input type="checkbox"> 完了</label>
    `;
    orderList.appendChild(div);
  });
}).catch(err => {
  console.error('❌ 주문 불러오기 실패:', err);
});
