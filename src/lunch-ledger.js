// lunch-ledger.js - 점심 가계부 시스템 (+200円 이하 빨간색 표시)

const lunchTableBody = document.getElementById('lunch-ledger-table-body');
const addLunchPersonBtn = document.getElementById('lunch-ledger-btn-add-person');

// ✅ 선택/삭제 관련 요소 추가
const selectBtn = document.createElement('button');
selectBtn.textContent = '選択';
selectBtn.id = 'lunch-ledger-btn-select';
addLunchPersonBtn.after(selectBtn);

const deleteSelectedBtn = document.createElement('button');
deleteSelectedBtn.textContent = '削除';
deleteSelectedBtn.id = 'lunch-ledger-btn-delete';
deleteSelectedBtn.style.display = 'none';
selectBtn.after(deleteSelectedBtn);

let selectionMode = false;

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  return `${year}_${month}_${date}`;
}

function formatDisplayDate(dateKey) {
  return dateKey.replace(/_/g, '.');
}

function formatRecordEntries(entries = []) {
  return entries.map(e => `${e > 0 ? '+' : ''}${e}円`).join('<br>');
}

function collectAllDates(groupData) {
  const dateSet = new Set();
  for (const personName in groupData) {
    const person = groupData[personName];
    if (person.records) {
      Object.keys(person.records).forEach(date => dateSet.add(date));
    }
  }
  return Array.from(dateSet).sort().reverse();
}

function renderLunchLedger(groupName) {
  const groupRef = database.ref(`lunchLedger/${groupName}`);
  groupRef.once('value').then(snapshot => {
    const groupData = snapshot.val() || {};
    const allDates = collectAllDates(groupData);

    const headRow = document.getElementById('lunch-ledger-table-head-row');
    headRow.innerHTML = `
      ${selectionMode ? '<th></th>' : ''}
      <th>名前</th>
      <th>現在金額</th>
      <th>決済</th>
      <th>充電</th>
      ${allDates.map(date => `<th>${formatDisplayDate(date)}</th>`).join('')}
      ${groupName === 'guest' ? '<th>操作</th>' : ''}
    `;

    lunchTableBody.innerHTML = '';

    for (const personName in groupData) {
      const person = groupData[personName];
      const todayKey = getTodayKey();
      const row = document.createElement('tr');
      row.className = 'lunch-ledger-row';

      let rowHtml = '';

      if (selectionMode) {
        rowHtml += `<td><input type="checkbox" class="lunch-ledger-select-box" data-name="${personName}" data-group="${groupName}"></td>`;
      }

      const balanceClass = person.balance <= 200 ? 'low' : '';
      rowHtml += `<td>${personName}</td>`;
      rowHtml += `
        <td class="lunch-ledger-balance ${balanceClass}" data-balance="${person.balance}">${person.balance}円</td>
        <td><button class="lunch-ledger-charge" data-name="${personName}">決済</button></td>
        <td>
          <input type="number" class="lunch-ledger-input" placeholder="金額">
          <button class="lunch-ledger-confirm" data-name="${personName}">確認</button>
        </td>
      `;

      allDates.forEach(date => {
        const entries = person.records?.[date] || [];
        rowHtml += `<td>${formatRecordEntries(entries) || '-'}</td>`;
      });

      if (groupName === 'guest') {
        rowHtml += `
          <td>
            <button class="delete-guest" data-name="${personName}">削除</button>
          </td>
        `;
      }

      row.innerHTML = rowHtml;
      lunchTableBody.appendChild(row);

      const payBtn = row.querySelector('.lunch-ledger-charge');
      payBtn.addEventListener('click', () => {
        updateLunchLedger(groupName, personName, -200);
      });

      const confirmBtn = row.querySelector('.lunch-ledger-confirm');
      confirmBtn.addEventListener('click', () => {
        const input = row.querySelector('.lunch-ledger-input');
        const amount = parseInt(input.value);
        if (!isNaN(amount) && amount > 0) {
          updateLunchLedger(groupName, personName, amount);
        }
      });

      const deleteBtn = row.querySelector('.delete-guest');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          if (confirm(`${personName}さんを削除しますか？`)) {
            database.ref(`lunchLedger/guest/${personName}`).remove().then(() => renderLunchLedger('guest'));
          }
        });
      }
    }
  });
}

function updateLunchLedger(group, name, change) {
  const ref = database.ref(`lunchLedger/${group}/${name}`);
  const todayKey = getTodayKey();

  ref.once('value').then(snapshot => {
    const data = snapshot.val() || { balance: 0, records: {} };
    const newBalance = (data.balance || 0) + change;
    const todayRecords = Array.isArray(data.records[todayKey]) ? data.records[todayKey] : [];
    todayRecords.push(change);
    data.records[todayKey] = todayRecords;
    data.balance = newBalance;
    ref.set(data).then(() => renderLunchLedger(group));
  });
}

const lunchTabs = document.querySelectorAll('.lunch-ledger-tab a');
lunchTabs.forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    lunchTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderLunchLedger(tab.dataset.group);
  });
});

addLunchPersonBtn.addEventListener('click', () => {
  const activeTab = document.querySelector('.lunch-ledger-tab a.active');
  const group = activeTab?.dataset.group || '信仰';
  const name = prompt('名前を入力してください');
  const balance = parseInt(prompt('初期金額を入力してください', '0')) || 0;
  const todayKey = getTodayKey();
  const personRef = database.ref(`lunchLedger/${group}/${name}`);
  const data = {
    balance,
    records: {
      [todayKey]: [balance]
    }
  };
  personRef.set(data).then(() => renderLunchLedger(group));
});

selectBtn.addEventListener('click', () => {
  selectionMode = !selectionMode;
  const activeTab = document.querySelector('.lunch-ledger-tab a.active');
  const group = activeTab?.dataset.group || '信仰';
  deleteSelectedBtn.style.display = selectionMode ? 'inline-block' : 'none';
  renderLunchLedger(group);
});

deleteSelectedBtn.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.select-box:checked');
  if (checkboxes.length === 0) return alert('削除する人を選択してください');

  if (!confirm('選択したメンバーを全て削除しますか？')) return;

  checkboxes.forEach(cb => {
    const name = cb.dataset.name;
    const group = cb.dataset.group;
    database.ref(`lunchLedger/${group}/${name}`).remove();
  });

  const activeTab = document.querySelector('.lunch-ledger-tab a.active');
  const group = activeTab?.dataset.group || '信仰';
  renderLunchLedger(group);
});

window.addEventListener('DOMContentLoaded', () => {
  const activeTab = document.querySelector('.lunch-ledger-tab a.active');
  const group = activeTab?.dataset.group || '信仰';
  renderLunchLedger(group);
});
