'use strict';

// ✅ 오늘 날짜 설정
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const getDate = `${year}-${month}-${date}`;

const orderDate = document.getElementById('orderDate');
if (orderDate) {
  orderDate.textContent = getDate;
}

function fetchOrdersFromFirebase() {
  const ordersRef = database.ref('orders');
  ordersRef.once('value')
    .then(snapshot => {
      const data = snapshot.val();
      if (!data) {
        console.log("📭 주문 없음");
        return;
      }

      const orders = Object.values(data).filter(order => order.today === getDate);
      renderOrders(orders);
    })
    .catch(error => {
      console.error("❌ 주문 불러오기 실패:", error);
    });
}

function renderOrders(orders) {
  const listContainer = document.getElementById('orders-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  orders.forEach((order, index) => {
    const item = document.createElement('div');
    item.className = 'order-item';

    const pointDisplay = order.point !== undefined ? `(${order.point}P)` : '';
    const warning = order.point !== undefined && order.point <= 200 ? '‼️' : '';

    item.innerHTML = `
      <p>${order.today} / ${order.coffee} / ${order.temperature} / ${order.size} / ${order.name}${warning} ${pointDisplay}</p>
      <label>
        <input type="checkbox" data-index="${index}"> 완료
      </label>
    `;

    listContainer.appendChild(item);
  });

  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      if (e.target.checked) e.target.parentElement.parentElement.classList.add('checked');
      else e.target.parentElement.parentElement.classList.remove('checked');
    });
  });
}

fetchOrdersFromFirebase();
