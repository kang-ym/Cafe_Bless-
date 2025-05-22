// orders.js - 커피 이름 일본어 표시 + 그룹 정보 추가 + 정렬

'use strict';

// ✅ 오늘 날짜 생성 (displayDate 형식)
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const todayDisplay = `${year}.${month}.${date}`;

const orderList = document.getElementById('orderList');
const orderDateTitle = document.getElementById('orderDate');
orderDateTitle.textContent = todayDisplay;

// ✅ Firebase에서 orders 데이터 로드
const ordersRef = database.ref('orders');
ordersRef.once('value').then(snapshot => {
  const data = snapshot.val();
  if (!data) return;

  // ✅ 오늘 날짜 기준 필터 + 커피 이름 기준 정렬
  const orders = Object.entries(data)
    .filter(([_, order]) => order.displayDate === todayDisplay)
    .sort((a, b) => {
      const aName = a[1].coffeeJp || a[1].coffee;
      const bName = b[1].coffeeJp || b[1].coffee;
      return aName.localeCompare(bName);
    });

  // ✅ 주문 목록 렌더링
  orders.forEach(([id, order]) => {
    const div = document.createElement('div');
    div.className = 'order-item';
    const hotOrCold = order.temperature === 'hot' ? 'hot🔥' : 'cold❄️';
    const coffeeName = order.coffeeJp || order.coffee;

    div.innerHTML = `
      <p>${coffeeName} / ${hotOrCold} / ${order.size} / ${order.group} / ${order.name} (${order.price}P)</p>
      <label><input type="checkbox"> 完了</label>
    `;
    orderList.appendChild(div);
  });

}).catch(err => {
  console.error('❌ 주문 불러오기 실패:', err);
});
