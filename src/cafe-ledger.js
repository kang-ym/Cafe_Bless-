'use strict';

// cafe-ledger.js (Firebase 연동 포함)

const ledgerGroupSelect = document.getElementById('ledger-select-group');
const ledgerTableBody = document.getElementById('ledger-table-body');
const ledgerTableHead = document.querySelector('.ledger-table thead tr');

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
}

function formatRecordEntries(entries = []) {
  return entries.map(e => `${e > 0 ? '+' : ''}${e}엔`).join('<br>');
}

function collectAllDates(groupData) {
  const dateSet = new Set();
  for (const personName in groupData) {
    const person = groupData[personName];
    if (person.records) {
      Object.keys(person.records).forEach(date => dateSet.add(date));
    }
  }
  return Array.from(dateSet).sort();
}

function renderLedger(groupName) {
  const groupRef = database.ref(`ledger/${groupName}`);
  groupRef.once('value').then(snapshot => {
    const groupData = snapshot.val() || {};
    const allDates = collectAllDates(groupData);

    ledgerTableHead.innerHTML = `
      <th>이름</th>
      <th>현재 금액</th>
      <th>충전</th>
      ${allDates.map(date => `<th>${date}</th>`).join('')}
    `;
    ledgerTableBody.innerHTML = '';

    for (const personName in groupData) {
      const person = groupData[personName];
      const balanceClass = person.balance <= 200 ? 'ledger-balance-low' : '';
      let rowHtml = `
        <td>${personName}</td>
        <td class="ledger-balance ${balanceClass}" data-balance="${person.balance}">${person.balance}엔</td>
        <td><button class="ledger-btn-charge" data-name="${personName}">충전</button></td>
      `;

      allDates.forEach(date => {
        const entries = person.records?.[date] || [];
        rowHtml += `<td>${formatRecordEntries(entries) || '-'}</td>`;
      });

      const row = document.createElement('tr');
      row.innerHTML = rowHtml;
      ledgerTableBody.appendChild(row);

      const chargeBtn = row.querySelector('.ledger-btn-charge');
      chargeBtn.addEventListener('click', () => {
        const add = parseInt(prompt(`${personName}님에게 충전할 금액을 입력하세요`, '500'));
        if (!isNaN(add)) {
          const newBalance = person.balance + add;
          const todayKey = getTodayKey();

          // 업데이트
          person.balance = newBalance;
          if (!person.records) person.records = {};
          if (!person.records[todayKey]) person.records[todayKey] = [];
          person.records[todayKey].push(add);

          // 저장
          groupRef.child(personName).set(person)
            .then(() => renderLedger(groupName))
            .catch(err => alert('❌ 저장 실패: ' + err));
        }
      });
    }
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

  const newPerson = { balance, records: {} };
  const personRef = database.ref(`ledger/${group}/${name}`);
  personRef.set(newPerson)
    .then(() => renderLedger(group))
    .catch(err => alert('❌ 저장 실패: ' + err));
});

renderLedger(ledgerGroupSelect.value);
