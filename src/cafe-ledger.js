'use strict';

// cafe-ledger.js (auto column for date records)

const ledgerGroupSelect = document.getElementById('ledger-select-group');
const ledgerTableBody = document.getElementById('ledger-table-body');
const ledgerTableHead = document.querySelector('.ledger-table thead tr');

const ledgerData = {
  "希望": [
    { name: "강영민", balance: 800, records: {} },
    { name: "강민", balance: 150, records: {} }
  ],
  "信仰": [],
  "愛": []
};

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
}

function collectAllDates(group) {
  const dateSet = new Set();
  group.forEach(p => {
    Object.keys(p.records).forEach(date => dateSet.add(date));
  });
  return Array.from(dateSet).sort();
}

function formatRecordEntries(entries = []) {
  return entries.map(e => `${e > 0 ? '+' : ''}${e}엔`).join('<br>');
}

function renderLedger(groupName) {
  const group = ledgerData[groupName] || [];
  const allDates = collectAllDates(group);

  // 헤더 재구성
  ledgerTableHead.innerHTML = `
    <th>이름</th>
    <th>현재 금액</th>
    <th>충전</th>
    ${allDates.map(date => `<th>${date}</th>`).join('')}
  `;

  ledgerTableBody.innerHTML = '';
  group.forEach(person => {
    const row = document.createElement('tr');
    const balanceClass = person.balance <= 200 ? 'ledger-balance-low' : '';
    let rowHtml = `
      <td>${person.name}</td>
      <td class="ledger-balance ${balanceClass}" data-balance="${person.balance}">${person.balance}엔</td>
      <td><button class="ledger-btn-charge">충전</button></td>
    `;

    allDates.forEach(date => {
      const entries = person.records[date] || [];
      rowHtml += `<td>${formatRecordEntries(entries) || '-'}</td>`;
    });

    row.innerHTML = rowHtml;
    ledgerTableBody.appendChild(row);

    const chargeBtn = row.querySelector('.ledger-btn-charge');
    chargeBtn.addEventListener('click', () => {
      const balanceCell = row.querySelector('[data-balance]');
      let current = parseInt(balanceCell.dataset.balance);
      const add = parseInt(prompt(`${person.name}님에게 충전할 금액을 입력하세요`, '500'));
      if (!isNaN(add)) {
        const newBalance = current + add;
        balanceCell.textContent = `${newBalance}엔`;
        balanceCell.dataset.balance = newBalance;
        if (newBalance > 200) balanceCell.classList.remove('ledger-balance-low');

        const todayKey = getTodayKey();
        if (!person.records[todayKey]) person.records[todayKey] = [];
        person.records[todayKey].push(add);

        renderLedger(groupName);
      }
    });
  });
}

ledgerGroupSelect.addEventListener('change', e => {
  renderLedger(e.target.value);
});

document.getElementById('ledger-btn-add-person').addEventListener('click', () => {
  const group = ledgerGroupSelect.value;
  if (!group) return alert('소속을 먼저 선택하세요.');

  const name = prompt('추가할 사람 이름을 입력하세요');
  if (!name) return;
  const balance = parseInt(prompt('초기 금액을 입력하세요', '0')) || 0;

  ledgerData[group].push({ name, balance, records: {} });
  renderLedger(group);
});

renderLedger(ledgerGroupSelect.value);