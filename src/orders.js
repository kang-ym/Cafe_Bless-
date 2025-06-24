'use strict';

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();
let allOrderData = [];
let filterSetupDone = false; // ✅ setupFilterButtons가 한 번만 실행되도록 제어


onAuthStateChanged(auth, (user) => {
    if (!user) {
        alert("ログインが必要です。");
        window.location.href = "../index.html";
        return;
    }
    loadOrders();
});

function loadOrders() {
    const today = new Date();
    const dateKey = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
    const displayDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('orderDate').textContent = displayDate;

    const ordersRef = ref(db, `orders/${dateKey}`);
    get(ordersRef).then(snapshot => {
        const data = snapshot.val();
        if (!data) return;

        allOrderData = Object.entries(data);
        renderSummaryTable(allOrderData); // ✅ 항상 전체 화면으로 시작

        // ✅ 필터 버튼은 1번만 연결
        if (!filterSetupDone) {
            setupFilterButtons();
            filterSetupDone = true;
        }

        // ✅ 모든 버튼에서 active 제거
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));


        // ✅ 전체 버튼 active 설정
        const allBtn = document.querySelector('.filter-btn[data-filter="all"]');
        if (allBtn) allBtn.classList.add('active');
    }).catch(err => console.error('❌ 주문 불러오기 실패:', err));
}


function renderSummaryTable(orderArray) {
    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';

        // ✅ 표 위에 제목 추가
        const title = document.createElement('h3');
        title.className = 'order-title';
        title.textContent = '📋 今日の注文';
        orderList.appendChild(title);

    const orderPriority = ['ラテ', 'キャラメルラテ', 'バニララテ', 'アメリカーノ'];
    const grouped = new Map();

    // 커피 → { cold_L: 수량, hot_R: 수량 } 구조로 집계
    orderArray.forEach(([_, order]) => {
        const coffee = order.coffeeJp || order.coffee;
        const temp = order.temperature;
        const size = order.size;
        const quantity = order.quantity || 1;
        const key = `${temp}_${size}`;

        if (!grouped.has(coffee)) grouped.set(coffee, {});
        const target = grouped.get(coffee);
        target[key] = (target[key] || 0) + quantity;
    });

    const sortedCoffees = [...grouped.keys()].sort((a, b) => {
        const indexA = orderPriority.indexOf(a);
        const indexB = orderPriority.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const table = document.createElement('table');
    table.className = 'order-table';

    let html = '<thead><tr><th>コーヒー</th><th>温度</th><th>サイズ</th><th>数</th></tr></thead><tbody>';

    sortedCoffees.forEach(coffee => {
        const details = grouped.get(coffee);

        // 온도/사이즈 순 정렬: cold → hot, L → R
        const sortedDetails = Object.entries(details).sort((a, b) => {
            const [tempA, sizeA] = a[0].split('_');
            const [tempB, sizeB] = b[0].split('_');
            if (tempA !== tempB) return tempA === 'cold' ? -1 : 1;
            if (sizeA !== sizeB) return sizeA === 'L' ? -1 : 1;
            return 0;
        });

        sortedDetails.forEach(([key, count], idx) => {
            const [temp, size] = key.split('_');
            const tempText = temp === 'hot' ? '🔥' : '❄️';
            html += `
                <tr>
                    <td>${idx === 0 ? coffee : ''}</td>
                    <td>${tempText}</td>
                    <td>${size}</td>
                    <td>${count}</td>
                </tr>
            `;
        });
    });

    html += '</tbody>';
    table.innerHTML = html;
    orderList.appendChild(table);
}

function renderOrders(orderArray) {
    const orderPriority = ['ラテ', 'キャラメルラテ', 'バニララテ', 'アメリカーノ'];
    const sorted = orderArray.sort((a, b) => {
        const nameA = a[1].coffeeJp || a[1].coffee;
        const nameB = b[1].coffeeJp || b[1].coffee;
        const indexA = orderPriority.indexOf(nameA);
        const indexB = orderPriority.indexOf(nameB);
        if (indexA !== indexB) return indexA - indexB;

        const tempA = a[1].temperature;
        const tempB = b[1].temperature;
        if (tempA !== tempB) return tempA === 'cold' ? -1 : 1;

        const sizeA = a[1].size;
        const sizeB = b[1].size;
        if (sizeA !== sizeB) return sizeA === 'L' ? -1 : 1;

        return 0;
    });

    const orderList = document.getElementById('orderList');
    orderList.innerHTML = '';

    // ✅ 커피 이름 추출
    let coffeeTitle = '';
    if (orderArray.length > 0) {
        const firstOrder = orderArray[0][1];
        coffeeTitle = firstOrder.coffeeJp || firstOrder.coffee || '';
    } else {
        // ✅ orderArray가 비어 있을 경우 → 현재 active 버튼에서 이름 추출
        const activeBtn = document.querySelector('.filter-btn.active');
        coffeeTitle = activeBtn?.dataset.filter || '';
    }

    // ✅ 제목 추가 (주문 없어도 보여줌)
    const title = document.createElement('h3');
    title.className = 'order-title';
    title.textContent = `☕ ${coffeeTitle}`;
    orderList.appendChild(title);

    if (sorted.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = '注文はありません。';
        emptyMsg.style.textAlign = 'center';
        orderList.appendChild(emptyMsg);
        return;
    }

    // ✅ 주문 테이블 생성
    const table = document.createElement('table');
    table.className = 'order-table';

    let thead = `
        <thead>
            <tr><th>削除</th><th>温度</th><th>サイズ</th><th>名前</th><th>完了</th></tr>
        </thead><tbody>
    `;
    let tbody = '';

    sorted.forEach(([id, order]) => {
        const hotOrCold = order.temperature === 'hot' ? '🔥' : '❄️';
        const sent = order.sentToLedger === true;
        tbody += `
            <tr id="order-${id}">
                <td><button class="delete-btn" data-id="${id}">🗑</button></td>
                <td>${hotOrCold}</td>
                <td>${order.size}</td>
                <td class="wide-name">
                    ${order.name}${order.quantity > 1 ? ` (x${order.quantity})` : ''}
                </td>
                <td>
                    ${sent
                        ? '<span style="color: green; font-weight: bold;">送信完了</span>'
                        : `<input type="checkbox" class="send-checkbox" data-id="${id}">`}
                </td>
            </tr>
        `;
    });

    table.innerHTML = thead + tbody + '</tbody>';
    orderList.appendChild(table);

    setupDeleteButtons(); // 삭제 버튼 연결
}

function setupFilterButtons() {
    const buttons = document.querySelectorAll('.filter-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // 모든 버튼에서 active 제거 후 클릭한 버튼에 추가
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filtered = (filter === 'all')
                ? allOrderData
                : allOrderData.filter(([_, o]) => (o.coffeeJp || o.coffee) === filter);

            if (filter === 'all') {
                renderSummaryTable(filtered);
            } else {
                renderOrders(filtered); // ← 필요 시 renderOrders(filtered, filter)도 가능
            }
        });
    });
}


function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            const confirmed = confirm("この注文を1つ削除しますか？");
            if (!confirmed) return;

            const today = new Date();
            const dateKey = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
            const orderRef = ref(db, `orders/${dateKey}/${id}`);
            const snapshot = await get(orderRef);

            if (!snapshot.exists()) {
                alert("⚠️ 注文が存在しません");
                return;
            }

            const order = snapshot.val();
            const updates = {};

            if (order.quantity && order.quantity > 1) {
                updates[`orders/${dateKey}/${id}/quantity`] = order.quantity - 1;
            } else {
                updates[`orders/${dateKey}/${id}`] = null; // 완전 삭제
            }

            await update(ref(db), updates);

            alert("✅ 注文を1つ削除しました");
            loadOrders(); // 삭제 후 화면 갱신
        });
    });
}




// ✅ Ledger 전송 처리
document.getElementById('sendToLedgerBtn')?.addEventListener('click', async () => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
    const ordersRef = ref(db, `orders/${dateKey}`);
    const ordersSnap = await get(ordersRef);
    if (!ordersSnap.exists()) return alert("📦 注文が存在しません");

    const orders = ordersSnap.val();
    const checked = document.querySelectorAll('.send-checkbox:checked');
    if (checked.length === 0) return alert("☑ 完了チェックをした注文だけ送信できます。");

    const [ledgerSnap, aliasSnap] = await Promise.all([
        get(ref(db, 'ledgerNames')),
        get(ref(db, 'nameAlias'))
    ]);
    const ledgerNames = ledgerSnap.val() || {};
    const aliasMap = aliasSnap.val() || {};
    const updates = {};

    checked.forEach(cb => {
        const id = cb.dataset.id;
        const order = orders[id];
        if (!order || order.sentToLedger === true) return;

        const group = order.group || 'guest';
        const originalName = order.name;
        const realName = aliasMap[originalName] || originalName;
        const amount = -(order.price || 0);

        const base = `ledger/${group}/${realName}`;
        const recordPath = `${base}/records/${dateKey}`;

        updates[`${base}/balance`] = increment(amount);
        updates[recordPath] = amount;
        updates[`orders/${dateKey}/${id}/sentToLedger`] = true;

        if (!ledgerNames?.[group]?.[realName]) {
            updates[`ledgerNames/${group}/${realName}`] = true;
        }
    });

    await update(ref(db), updates);

    checked.forEach(cb => {
        const row = cb.closest('tr');
        if (row) {
            const td = row.querySelector('td:last-child');
            td.innerHTML = '<span style="color: green; font-weight: bold;">送信完了</span>';
        }
    });

    alert("✅ Ledger に送信しました！");
});
