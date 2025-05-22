'use strict';
// cafe-ledger.js (날짜 키는 _로 저장, 표시용은 .로 변환)

const ledgerTableBody = document.getElementById('ledger-table-body');
const ledgerGroupSelect = document.getElementById('ledger-select-group');
const addPersonBtn = document.getElementById('ledger-btn-add-person');

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0'); 
  return `${year}_${month}_${date}`; // ✅ Firebase-safe 날짜 키
}

function formatDisplayDate(dateKey) {
  return dateKey.replace(/_/g, '.'); // ✅ 사용자 표시용으로 .로 변환
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

    const ledgerTableHead = document.getElementById('ledger-table-head-row');
    ledgerTableHead.innerHTML = `
      <th>이름</th>
      <th>현재 금액</th>
      <th>충전</th>
      ${allDates.map(date => `<th>${formatDisplayDate(date)}</th>`).join('')}
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
        const amount = parseInt(prompt(`${personName}님에게 충전할 금액을 입력하세요`, '1000'));
        if (!isNaN(amount)) {
          const todayKey = getTodayKey();
          const personRef = database.ref(`ledger/${groupName}/${personName}`);

          personRef.once('value').then(snapshot => {
            const personData = snapshot.val() || {};
            const currentBalance = personData.balance || 0;
            const newBalance = currentBalance + amount;

            const updatedRecords = personData.records || {};
            const todayList = Array.isArray(updatedRecords[todayKey]) ? updatedRecords[todayKey] : [];
            todayList.push(amount);
            updatedRecords[todayKey] = todayList;

            const updatedData = {
              balance: newBalance,
              records: updatedRecords
            };

            personRef.set(updatedData)
              .then(() => renderLedger(groupName))
              .catch(err => alert('❌ 저장 실패: ' + err));
          });
        }
      });
    }
  });
}

ledgerGroupSelect.addEventListener('change', () => {
  const group = ledgerGroupSelect.value;
  if (group) renderLedger(group);
});

addPersonBtn.addEventListener('click', () => {
  const group = ledgerGroupSelect.value;
  if (!group) return alert('소속을 먼저 선택하세요.');

  const name = prompt('추가할 사람 이름을 입력하세요');
  if (!name) return;
  const balance = parseInt(prompt('초기 금액을 입력하세요', '0')) || 0;

  const todayKey = getTodayKey();
const newPerson = {
  balance,
  records: {
    [todayKey]: [balance]  // ✅ 최초 충전도 기록에 포함
  }
};

  const personRef = database.ref(`ledger/${group}/${name}`);
  personRef.set(newPerson)
    .then(() => renderLedger(group))
    .catch(err => alert('❌ 저장 실패: ' + err));
});

window.addEventListener('DOMContentLoaded', () => {
  const group = ledgerGroupSelect.value;
  if (group) renderLedger(group);
});
