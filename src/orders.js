'use strict';

// ✅ Firebase 인증 및 DB 모듈 가져오기
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, get, update, increment } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const auth = getAuth();
const db = getDatabase();

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

        const orders = Object.entries(data).sort((a, b) =>
            (a[1].coffeeJp || a[1].coffee).localeCompare(b[1].coffeeJp || b[1].coffee)
        );

        let currentCoffee = '';
        let table = document.createElement('table');
        table.className = 'order-table';
        let thead = `
            <thead>
                <tr><th>コーヒー</th><th>温度</th><th>size</th><th>名前</th><th>完了</th></tr>
            </thead><tbody>
        `;
        let tbody = '';

        orders.forEach(([id, order]) => {
            const hotOrCold = order.temperature === 'hot' ? 'hot🔥' : 'cold❄️';
            const coffeeName = order.coffeeJp || order.coffee;
            const isSame = coffeeName === currentCoffee;
            const sent = order.sentToLedger === true;

            tbody += `
                <tr id="order-${id}">
                    <td>${isSame ? '' : coffeeName}</td>
                    <td>${hotOrCold}</td>
                    <td>${order.size}</td>
                    <td class="wide-name">${order.name}</td>
                    <td>
                        ${sent
                            ? '<span style="color: green; font-weight: bold;">送信完了</span>'
                            : `<input type="checkbox" class="send-checkbox" data-id="${id}">`}
                    </td>
                </tr>
            `;
            currentCoffee = coffeeName;
        });

        table.innerHTML = thead + tbody + '</tbody>';
        const orderList = document.getElementById('orderList');
        orderList.innerHTML = '';
        orderList.appendChild(table);
    }).catch(err => console.error('❌ 주문 불러오기 실패:', err));
}

// ✅ Ledger 전송 처리
document.getElementById('sendToLedgerBtn').addEventListener('click', async () => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
    const ordersRef = ref(db, `orders/${dateKey}`);
    const ordersSnap = await get(ordersRef);
    if (!ordersSnap.exists()) return alert("📦 注文が存在しません");

    const orders = ordersSnap.val();
    const checked = document.querySelectorAll('.send-checkbox:checked');
    if (checked.length === 0) return alert("☑ 完了チェックをした注文だけ送信できます。");

    // ✅ alias, ledger 이름 목록 가져오기
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
        updates[recordPath] = amount;  // 여러 개 기록을 따로 배열로 저장하지 않음
        updates[`orders/${dateKey}/${id}/sentToLedger`] = true;

        // ledgerNames에도 등록
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
