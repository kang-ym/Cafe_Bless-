'use strict';

// ✅ compat 방식에서 설정된 database 사용
const database = window.database;
const lunchLedgerRef = database.ref('lunchLedger');

// ✅ 인증 완료 후 실행을 보장
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    alert("ログインが必要です。");
    window.location.href = "../index.html";
    return;
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initLunchLedger);
  } else {
    initLunchLedger();
  }
});

function initLunchLedger() {
  const tabs = document.querySelectorAll(".lunch-ledger-tab a");
  const addBtn = document.getElementById("lunch-ledger-btn-add-person");
  const selectBtn = document.getElementById("lunch-ledger-btn-select");
  const deleteBtn = document.getElementById("lunch-ledger-btn-delete");

  let currentGroup = document.querySelector(".lunch-ledger-tab a.active")?.dataset.group || '信仰';
  renderLunchLedger(currentGroup);

  tabs.forEach(tab => {
    tab.addEventListener("click", e => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentGroup = tab.dataset.group;
      renderLunchLedger(currentGroup);
    });
  });

  addBtn.addEventListener("click", () => {
    const name = prompt("名前を入力してください:");
    if (!name) return;
    const amount = parseInt(prompt("初期金額を入力してください:", "0"));
    if (isNaN(amount)) return;

    lunchLedgerRef.child(currentGroup).child(name).set({
      balance: amount,
      records: {}
    }).then(() => renderLunchLedger(currentGroup));
  });

  selectBtn.addEventListener("click", () => {
    const headRow = document.getElementById("lunch-ledger-table-head-row");
    if (!document.querySelector(".checkbox-head")) {
      headRow.innerHTML = `<th class="checkbox-head"></th>` + headRow.innerHTML;
    }

    document.querySelectorAll("#lunch-ledger-table-body tr").forEach(row => {
      const checkboxCell = document.createElement("td");
      checkboxCell.className = "checkbox-col";
      checkboxCell.innerHTML = `<input type="checkbox" class="lunch-ledger-select-box">`;
      row.prepend(checkboxCell);
    });

    deleteBtn.style.display = "inline-block";
  });

  deleteBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll(".lunch-ledger-select-box:checked");
    checkboxes.forEach(box => {
      const name = box.closest("tr").dataset.name;
      lunchLedgerRef.child(currentGroup).child(name).remove();
    });

    deleteBtn.style.display = "none";
    renderLunchLedger(currentGroup);
  });
}

function renderLunchLedger(group) {
  const tbody = document.getElementById("lunch-ledger-table-body");
  const thead = document.getElementById("lunch-ledger-table-head-row");

  tbody.innerHTML = '';
  thead.innerHTML = '';

  lunchLedgerRef.child(group).once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const dateSet = new Set();
    Object.values(data).forEach(person => {
      if (person.records) {
        Object.keys(person.records).forEach(date => dateSet.add(date));
      }
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
    const displayDates = sortedDates.map(d => d.replace(/_/g, '.'));

    thead.innerHTML = `
      <th>名前</th>
      <th>残高</th>
      <th>チャージ</th>
      ${displayDates.map(date => `<th>${date}</th>`).join('')}
    `;

    Object.entries(data).forEach(([name, info]) => {
      const row = document.createElement("tr");
      row.dataset.name = name;

      const balance = info.balance || 0;
      const balanceClass = balance <= 200 ? "low" : "";
      const records = info.records || {};

      const cells = sortedDates.map(date => {
        const entry = records[date];
        if (!entry) return `<td></td>`;
        if (Array.isArray(entry)) {
          return `<td>${entry.map(n => `${n > 0 ? '+' : ''}${n}`).join('<br>')}</td>`;
        } else if (typeof entry === 'object') {
          return `<td>${Object.values(entry).map(n => `${n > 0 ? '+' : ''}${n}`).join('<br>')}</td>`;
        } else {
          return `<td>${entry > 0 ? '+' : ''}${entry}</td>`;
        }
      }).join('');

      row.innerHTML = `
        <td>${name}</td>
        <td class="lunch-ledger-balance ${balanceClass}">${balance}</td>
        <td>
          <input type="number" class="charge-input" placeholder="金額">
          <button class="charge-btn">確認</button>
          <button class="pay-btn">−200</button>
        </td>
        ${cells}
      `;

      tbody.appendChild(row);
    });

    // ✅ 차감 버튼 기능
    document.querySelectorAll(".pay-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        const name = row.dataset.name;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
        const userRef = lunchLedgerRef.child(group).child(name);

        userRef.child("balance").transaction(b => (b || 0) - 200);
        userRef.child("records").child(today).once("value").then(snap => {
          const current = snap.val();
          const next = !current ? [-200]
            : Array.isArray(current) ? [...current, -200]
            : [...Object.values(current), -200];

          userRef.child("records").child(today).set(next);
          renderLunchLedger(group);
        });
      });
    });

    // ✅ 충전 버튼 기능
    document.querySelectorAll(".charge-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        const name = row.dataset.name;
        const input = row.querySelector(".charge-input");
        const amount = parseInt(input.value);
        if (isNaN(amount) || amount <= 0) return;

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
        const userRef = lunchLedgerRef.child(group).child(name);

        userRef.child("balance").transaction(b => (b || 0) + amount);
        userRef.child("records").child(today).once("value").then(snap => {
          const current = snap.val();
          const next = !current ? [amount]
            : Array.isArray(current) ? [...current, amount]
            : [...Object.values(current), amount];

          userRef.child("records").child(today).set(next);
          renderLunchLedger(group);
        });
      });
    });
  });
}
