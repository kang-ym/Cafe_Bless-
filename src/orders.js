// orders.js - 주문 정보 오른쪽에 完了 버튼 위치 조정

'use strict';

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const todayDisplay = `${year}.${month}.${date}`;

const orderList = document.getElementById('orderList');
const orderDateTitle = document.getElementById('orderDate');
orderDateTitle.textContent = todayDisplay;

const ordersRef = database.ref('orders');
ordersRef.once('value').then(snapshot => {
  const data = snapshot.val();
  if (!data) return;

  const orders = Object.entries(data)
    .filter(([_, order]) => order.displayDate === todayDisplay)
    .sort((a, b) => {
      const aName = a[1].coffeeJp || a[1].coffee;
      const bName = b[1].coffeeJp || b[1].coffee;
      return aName.localeCompare(bName);
    });

  orders.forEach(([id, order]) => {
    const div = document.createElement('div');
    div.className = 'order-item';
    const hotOrCold = order.temperature === 'hot' ? 'hot🔥' : 'cold❄️';
    const coffeeName = order.coffeeJp || order.coffee;

    div.innerHTML = `
      <p class="order-line">
        <span>${coffeeName} / ${hotOrCold} / ${order.size} / ${order.group} / ${order.name} (${order.price}P)</span>
        <label><input type="checkbox"> 完了</label>
      </p>
    `;
    orderList.appendChild(div);
  });

}).catch(err => {
  console.error('❌ 주문 불러오기 실패:', err);
});
