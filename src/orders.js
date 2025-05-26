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

  let currentCoffeeName = '';
  let table = document.createElement('table');
  table.className = 'order-table';

  let thead = `
    <thead>
      <tr>
        <th>コーヒー</th>
        <th>温度</th>
        <th>size</th>
        <th>名前</th>
        <th>完了</th>
      </tr>
    </thead>
    <tbody>
  `;
  let tbody = '';

  orders.forEach(([id, order], index) => {
    const hotOrCold = order.temperature === 'hot' ? 'hot🔥' : 'cold❄️';
    const coffeeName = order.coffeeJp || order.coffee;
    const isSameCoffee = coffeeName === currentCoffeeName;

    tbody += `
      <tr>
        <td>${isSameCoffee ? '' : coffeeName}</td>
        <td>${hotOrCold}</td>
        <td>${order.size}</td>
        <td class="wide-name">${order.name}</td>
        <td><input type="checkbox"></td>
      </tr>
    `;

    currentCoffeeName = coffeeName;
  });

  table.innerHTML = thead + tbody + '</tbody>';
  orderList.innerHTML = '';
  orderList.appendChild(table);
}).catch(err => {
  console.error('❌ 주문 불러오기 실패:', err);
});
