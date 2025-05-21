'use strict';

// ✅ 오늘 날짜 설정
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const getDate = `${year}-${month}-${date}`;

// ✅ 화면 상단 날짜 표시
const orderDate = document.getElementById('orderDate');
if (orderDate) {
  orderDate.textContent = getDate;
}

// ✅ 주문 데이터 불러오기
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

// ✅ 주문 목록 출력 (잔액도 함께)
function renderOrders(orders) {
  const listContainer = document.getElementById('orderList');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  orders.forEach((order, index) => {
    const item = document.createElement('li');
    item.className = 'order-item';

    const name = order.name;
    const group = order.group;

    if (!name || !group) return; // 이름과 그룹 필수

    const ledgerRef = database.ref(`ledger/${group}/${name}/balance`);
    ledgerRef.once('value').then(snapshot => {
      const balance = snapshot.val();
      const warning = balance !== null && balance <= 200 ? '‼️' : '';
      const pointDisplay = balance !== null ? `(${balance}P)` : '';

      item.innerHTML = `
        <p>${order.coffee} / ${order.temperature} / ${order.size} / ${name} ${warning} ${pointDisplay}</p>
        <label>
          <input type="checkbox" data-index="${index}"> 完了
        </label>
      `;

      listContainer.appendChild(item);
    });
  });

  // ✅ 완료 체크 처리
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', e => {
      const parent = e.target.closest('.order-item');
      if (e.target.checked) {
        parent.classList.add('checked');
      } else {
        parent.classList.remove('checked');
      }
    });
  });
}

// ✅ 실행
fetchOrdersFromFirebase();
