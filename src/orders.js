'use strict';

// ✅ Firebase 인증 및 DB 모듈 가져오기 (v9 모듈 방식)
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// ✅ Firebase 초기화
const auth = getAuth();
const db = getDatabase();

// ✅ 로그인 상태 확인
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("ログインが必要です。");
    window.location.href = "../index.html";
    return;
  }

  // ✅ 로그인된 경우 주문 불러오기
  loadOrders();
});

function loadOrders() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  const todayDisplay = `${year}.${month}.${date}`;
  const firebaseDate = `${year}_${month}_${date}`;

  const orderList = document.getElementById('orderList');
  const orderDateTitle = document.getElementById('orderDate');
  orderDateTitle.textContent = todayDisplay;

  const ordersRef = ref(db, `orders/${firebaseDate}`);
  get(ordersRef).then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const orders = Object.entries(data).sort((a, b) => {
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

    orders.forEach(([id, order]) => {
      const hotOrCold = order.temperature === 'hot' ? 'hot🔥' : 'cold❄️';
      const coffeeName = order.coffeeJp || order.coffee;
      const isSameCoffee = coffeeName === currentCoffeeName;
      const alreadySent = order.sentToLedger === true;
      const rowId = `order-${id}`;

      tbody += `
        <tr id="${rowId}">
          <td>${isSameCoffee ? '' : coffeeName}</td>
          <td>${hotOrCold}</td>
          <td>${order.size}</td>
          <td class="wide-name">${order.name}</td>
          <td>
            ${alreadySent
              ? '<span style="color: green; font-weight: bold;">送信完了</span>'
              : `<input type="checkbox" class="send-checkbox" data-id="${id}">`}
          </td>
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
}

// ✅ Ledger 전송 버튼 기능
document.getElementById('sendToLedgerBtn').addEventListener('click', async () => {
  const today = new Date();
  const dateKey = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
  const ordersRef = ref(db, `orders/${dateKey}`);
  const snapshot = await get(ordersRef);
  if (!snapshot.exists()) return alert("📦 注文が存在しません");

  const orders = snapshot.val();
  const selectedCheckboxes = document.querySelectorAll('.send-checkbox:checked');
  if (selectedCheckboxes.length === 0) {
    return alert("☑ 完了チェックをした注文だけ送信できます。");
  }

  const ledgerNamesSnap = await get(ref(db, 'ledgerNames'));
  const ledgerNames = ledgerNamesSnap.val() || {};
  const updates = {};

  selectedCheckboxes.forEach(cb => {
    const id = cb.dataset.id;
    const order = orders[id];
    if (!order || order.sentToLedger === true) return;

    const group = order.group || 'guest';
    const name = order.name;
    const amount = -(order.price || 0);

    const base = `ledger/${group}/${name}`;
    const recordPath = `${base}/records/${dateKey}`;

    // ✅ 잔액 차감 및 기록 추가
    updates[`${base}/balance`] = increment(amount);
    updates[recordPath] = firebase.database.ServerValue.arrayUnion
      ? firebase.database.ServerValue.arrayUnion(amount)
      : amount; // 구버전 호환

    // ✅ 주문 정보에 sentToLedger 표시
    updates[`orders/${dateKey}/${id}/sentToLedger`] = true;

    // ✅ ledgerNames에도 등록
    if (!ledgerNames?.[group]?.[name]) {
      updates[`ledgerNames/${group}/${name}`] = true;
    }
  });

  // ✅ Firebase에 일괄 반영
  await window.database.ref().update(updates);

  // ✅ UI 업데이트: 체크박스 제거 + '送信完了' 표시
  selectedCheckboxes.forEach(cb => {
    const row = cb.closest('tr');
    if (row) {
      const td = row.querySelector('td:last-child');
      td.innerHTML = '<span style="color: green; font-weight: bold;">送信完了</span>';
    }
  });

  alert("✅ Ledger に送信しました！");
});
