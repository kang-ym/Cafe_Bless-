'use strict';

import { ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { database as db } from './firebase-init.js';

const tableHead = document.getElementById('lunch-ledger-table-head-row');
const tableBody = document.getElementById('lunch-ledger-table-body');
const tabLinks = document.querySelectorAll('.lunch-ledger-tab a');
const addPersonBtn = document.getElementById('lunch-ledger-btn-add-person');
const selectBtn = document.getElementById('lunch-ledger-btn-select');
const deleteBtn = document.getElementById('lunch-ledger-btn-delete');

let currentGroup = '信仰';
let selectionMode = false;

function getTodayKey() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}_${mm}_${dd}`;
}

function formatDisplayDate(dateKey) {
  return dateKey.replace(/_/g, '.');
}

function renderLunchLedger(group) {
  const groupRef = ref(db, `lunchLedger/${group}`);
  onValue(groupRef, (snapshot) => {
    const data = snapshot.val() || {};
    const allDates = collectAllDates(data);

    renderHead(allDates);
    renderBody(data, allDates, group);
    applyLunchLedgerNameClass();
  });
}

function renderHead(allDates) {
  tableHead.innerHTML = `
    ${selectionMode ? '<th></th>' : ''}
    <th class="lunch-ledger-name">名前</th>
    <th>残高</th>
    <th>チャージ</th>
    ${allDates.map(date => `<th>${formatDisplayDate(date)}</th>`).join('')}
  `;
}

function renderBody(data, allDates, group) {
  tableBody.innerHTML = '';

  Object.entries(data).forEach(([name, info]) => {
    const tr = document.createElement('tr');
    tr.className = 'lunch-ledger-row';

    const balance = info.balance || 0;
    const balanceClass = balance <= 200 ? 'lunch-ledger-balance low' : 'lunch-ledger-balance';

    const cells = [];

    if (selectionMode) {
      cells.push(`<td><input type="checkbox" class="lunch-ledger-select-box" data-name="${name}"></td>`);
    }

    cells.push(`<td>${name}</td>`);
    cells.push(`<td class="${balanceClass}">${balance}</td>`);
    cells.push(`
      <td>
        <input type="number" class="lunch-ledger-input charge-input" placeholder="金額">
        <button class="lunch-ledger-charge" data-name="${name}" data-group="${group}">チャージ</button>
        <button class="lunch-ledger-confirm" data-name="${name}" data-group="${group}">-200</button>
      </td>
    `);

    allDates.forEach(date => {
      const entries = (info.records?.[date]) || [];
      const display = entries.map(v => `${v > 0 ? '+' : ''}${v}`).join('<br>');
      cells.push(`<td>${display}</td>`);
    });

    tr.innerHTML = cells.join('');
    tableBody.appendChild(tr);
  });

  attachEventHandlers(group);
}

function collectAllDates(data) {
  const dateSet = new Set();
  Object.values(data).forEach(info => {
    Object.keys(info.records || {}).forEach(date => {
      dateSet.add(date);
    });
  });

  return [...dateSet].sort((a, b) => b.localeCompare(a));
}

function attachEventHandlers(group) {
  document.querySelectorAll('.lunch-ledger-charge').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const input = btn.previousElementSibling;
      const amount = parseInt(input.value);
      if (!amount) {
        alert('金額を入力してください。');
        return;
      }

      const today = getTodayKey();
      const userRef = ref(db, `lunchLedger/${group}/${name}`);

      get(userRef).then(snapshot => {
        const data = snapshot.val() || {};
        const newBalance = (data.balance || 0) + amount;
        const records = data.records || {};
        records[today] = [...(records[today] || []), amount];
        set(userRef, { balance: newBalance, records });
        input.value = '';
      });
    });
  });

  document.querySelectorAll('.lunch-ledger-confirm').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const amount = -200;
      const today = getTodayKey();
      const userRef = ref(db, `lunchLedger/${group}/${name}`);

      get(userRef).then(snapshot => {
        const data = snapshot.val() || {};
        const newBalance = (data.balance || 0) + amount;
        const records = data.records || {};
        records[today] = [...(records[today] || []), amount];
        set(userRef, { balance: newBalance, records });
      });
    });
  });
}

function applyLunchLedgerNameClass() {
  const rows = document.querySelectorAll('.lunch-ledger-table tbody tr');
  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    tds.forEach(td => td.classList.remove('lunch-ledger-name'));
    const index = selectionMode ? 1 : 0;
    tds[index]?.classList.add('lunch-ledger-name');
  });

  const ths = document.querySelectorAll('#lunch-ledger-table-head-row th');
  ths.forEach(th => th.classList.remove('lunch-ledger-name'));
  const index = selectionMode ? 1 : 0;
  ths[index]?.classList.add('lunch-ledger-name');
}

// 이벤트 등록
selectBtn.addEventListener('click', () => {
  selectionMode = !selectionMode;
  deleteBtn.style.display = selectionMode ? 'inline-block' : 'none';
  renderLunchLedger(currentGroup);
});

deleteBtn.addEventListener('click', () => {
  const checked = document.querySelectorAll('.lunch-ledger-select-box:checked');
  checked.forEach(box => {
    const name = box.dataset.name;
    set(ref(db, `lunchLedger/${currentGroup}/${name}`), null);
  });
});

addPersonBtn.addEventListener('click', () => {
  const name = prompt('名前を入力してください：');
  if (!name) return;
  const today = getTodayKey();
  set(ref(db, `lunchLedger/${currentGroup}/${name}`), {
    balance: 0,
    records: { [today]: [0] }
  });
});

tabLinks.forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    tabLinks.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentGroup = tab.dataset.group;
    renderLunchLedger(currentGroup);
  });
});

// ✅ 초기 표시
renderLunchLedger(currentGroup);
