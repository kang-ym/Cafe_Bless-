'use strict';

// 오늘 날짜 표시
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2,'0');
const date = String(today.getDate()).padStart(2,'0');
const getDate = `${year}-${month}-${date}`;
document.getElementById('orderDate').textContent = getDate;

// 주문 리스트 렌더링
function renderOrders() {
  const listContainer = document.getElementById('orders-list');
  listContainer.innerHTML = '';
  const orders = JSON.parse(localStorage.getItem('orders')) || [];

  orders.forEach((order, index) => {
    const item = document.createElement('div');
    item.className = 'order-item';

    const needCharge = order.point !== undefined && order.point <= 200;
    const pointDisplay = order.point !== undefined ? `(${order.point}P)` : '';
    const warning = needCharge ? '‼️' : '';

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

// Google Sheets에서 주문 불러오기
function fetchOrdersFromSheet() {
  fetch("https://script.google.com/macros/s/AKfycbx3IVLq5ZVF3zlUSyhGO4xn8aMSh0fam36GJbgEP5TszUE6x2pxABpfpogIK3SLSeDw/exec")
    .then(res => res.json())
    .then(data => {
      const todayOrders = data.filter(order => order.today === getDate);
      localStorage.setItem('orders', JSON.stringify(todayOrders));
      renderOrders();
    })
    .catch(err => console.error('❌ 주문 불러오기 실패:', err));
}

fetchOrdersFromSheet();