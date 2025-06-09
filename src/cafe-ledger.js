// cafe-ledger.js 전체 수정본 - 이름 열 위치 안정화 포함 (selectionMode 대응)

'use strict';

const database = window.database;

const ledgerTableBody = document.getElementById('ledger-table-body');
const addPersonBtn = document.getElementById('ledger-btn-add-person');

const selectBtn = document.createElement('button');
selectBtn.textContent = '選択';
selectBtn.id = 'ledger-btn-select';
addPersonBtn.after(selectBtn);

const deleteSelectedBtn = document.createElement('button');
deleteSelectedBtn.textContent = '削除';
deleteSelectedBtn.id = 'ledger-btn-delete';
deleteSelectedBtn.style.display = 'none';
selectBtn.after(deleteSelectedBtn);

let selectionMode = false;

function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateKey) {
  return dateKey.replace(/_/g, '.');
}

function formatRecordEntries(entries = []) {
  if (!Array.isArray(entries)) entries = [entries];
  return entries.map(e => `${e > 0 ? '+' : ''}${e}`).join('<br>');
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

async function renderLedger(groupName) {
  const [groupSnap, aliasSnap] = await Promise.all([
    database.ref(`ledger/${groupName}`).once('value'),
    database.ref('nameAlias').once('value')
  ]);

  const groupData = groupSnap.val() || {};
  const aliasData = aliasSnap.val() || {};

  const groupToMembers = {};
  Object.entries(aliasData).forEach(([member, group]) => {
    if (!groupToMembers[group]) groupToMembers[group] = [];
    groupToMembers[group].push(member);
  });

  const allDates = collectAllDates(groupData);

  const ledgerTableHead = document.getElementById('ledger-table-head-row');
  ledgerTableHead.innerHTML = `
    ${selectionMode ? '<th></th>' : ''}
    <th class="cafe-ledger-col">名前</th>
    <th class="cafe-ledger-col">残高</th>
    <th class="cafe-ledger-col">チャージ</th>
    ${allDates.map(date => `<th class="cafe-ledger-date">${formatDisplayDate(date)}</th>`).join('')}
    ${groupName === 'guest' ? '<th class="cafe-ledger-col">移動</th>' : ''}
  `;

  ledgerTableBody.innerHTML = '';

  for (const personName in groupData) {
    const person = groupData[personName];
    const isGroup = groupToMembers[personName];
    const balanceClass = person.balance <= 200 ? 'ledger-balance-low' : '';
    const row = document.createElement('tr');
    row.className = 'cafe-ledger-row';

    let rowHtml = '';
    if (selectionMode) {
      rowHtml += `<td><input type="checkbox" class="ledger-select-box" data-name="${personName}" data-group="${groupName}"></td>`;
    }

    rowHtml += `<td>${personName}`;
    if (isGroup) {
      rowHtml += ` <button class="show-members-btn" data-name="${personName}">👪</button>`;
      rowHtml += `<div class="member-list hidden" id="members-${personName}"><ul>${isGroup.map(m => `<li>${m}</li>`).join('')}</ul></div>`;
    }
    rowHtml += `</td>`;

    rowHtml += `
      <td class="ledger-balance ${balanceClass}">${person.balance}</td>
      <td><button class="ledger-btn-charge" data-name="${personName}">+</button></td>
    `;

    allDates.forEach(date => {
      const entries = person.records?.[date] || [];
      rowHtml += `<td>${formatRecordEntries(entries) || '-'}</td>`;
    });

    if (groupName === 'guest') {
      rowHtml += `
        <td>
          <select class="move-group">
            <option value="信仰">信仰</option>
            <option value="希望">希望</option>
            <option value="愛">愛</option>
          </select>
          <button class="move-btn" data-name="${personName}">移動</button>
        </td>
      `;
    }

    row.innerHTML = rowHtml;
    ledgerTableBody.appendChild(row);

    row.querySelector('.show-members-btn')?.addEventListener('click', () => {
      const box = document.getElementById(`members-${personName}`);
      box.classList.toggle('hidden');
    });

    row.querySelector('.ledger-btn-charge')?.addEventListener('click', () => {
      const amount = parseInt(prompt(`${personName}様にチャージする金額を入力してください`, '1000'));
      if (!isNaN(amount)) {
        const todayKey = getTodayKey();
        const personRef = database.ref(`ledger/${groupName}/${personName}`);
        personRef.once('value').then(snapshot => {
          const personData = snapshot.val() || {};
          const balance = (personData.balance || 0) + amount;
          const records = personData.records || {};
          const current = records[todayKey];
          const newRecords = Array.isArray(current) ? [...current, amount] : (typeof current === 'number' ? [current, amount] : [amount]);
          records[todayKey] = newRecords;
          personRef.set({ balance, records }).then(() => renderLedger(groupName));
        });
      }
    });
  }
}

function applyLedgerNameClass() {
  const rows = document.querySelectorAll('.ledger-table tbody tr');
  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    tds.forEach(td => td.classList.remove('ledger-name'));
    if (selectionMode) {
      tds[1]?.classList.add('ledger-name');
    } else {
      tds[0]?.classList.add('ledger-name');
    }
  });

  const ths = document.querySelectorAll('#ledger-table-head-row th');
  ths.forEach(th => th.classList.remove('ledger-name'));
  if (selectionMode) {
    ths[1]?.classList.add('ledger-name');
  } else {
    ths[0]?.classList.add('ledger-name');
  }
}

// 그룹 탭 전환
document.querySelectorAll('.cafe-ledger-tab a').forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.cafe-ledger-tab a').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const group = tab.dataset.group;
    renderLedger(group);
  });
});

addPersonBtn.addEventListener('click', async () => {
  const activeTab = document.querySelector('.cafe-ledger-tab a.active');
  const group = activeTab?.dataset.group || '信仰';
  const mode = prompt("1：個人追加\n2：グループ追加\nどちらを行いますか？");

  if (mode === '1') {
    const name = prompt('名前を入力してください');
    if (!name) return;
    const balance = parseInt(prompt('初期残高は？', '0')) || 0;
    const todayKey = getTodayKey();
    const newPerson = { balance, records: { [todayKey]: [balance] } };
    await database.ref(`ledger/${group}/${name}`).set(newPerson);
    await database.ref(`ledgerNames/${group}/${name}`).set(true);
    renderLedger(group);
  } else if (mode === '2') {
    const groupName = prompt('グループ名を入力してください');
    const members = prompt('グループに含める名前をカンマで区切って入力 (例：ミナ,ヨンミン)');
    if (!groupName || !members) return;
    const balance = parseInt(prompt('初期残高は？', '0')) || 0;
    const todayKey = getTodayKey();
    const newPerson = { balance, records: { [todayKey]: [balance] } };

    const updates = {
      [`ledger/${group}/${groupName}`]: newPerson,
      [`ledgerNames/${group}/${groupName}`]: true
    };

    members.split(',').map(m => m.trim()).forEach(name => {
      updates[`nameAlias/${name}`] = groupName;
    });

    await database.ref().update(updates);
    renderLedger(group);
  }
});

selectBtn.addEventListener('click', () => {
  selectionMode = !selectionMode;
  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || '信仰';
  deleteSelectedBtn.style.display = selectionMode ? 'inline-block' : 'none';
  renderLedger(group);
  applyLedgerNameClass();
});

deleteSelectedBtn.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.ledger-select-box:checked');
  if (!checkboxes.length) return alert('削除する人を選択してください');
  if (!confirm('本当に削除しますか？')) return;

  checkboxes.forEach(cb => {
    const name = cb.dataset.name;
    const group = cb.dataset.group;
    database.ref(`ledger/${group}/${name}`).remove();
    database.ref(`ledgerNames/${group}/${name}`).remove();
  });

  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || '信仰';
  renderLedger(group);
});

document.addEventListener('DOMContentLoaded', () => {
  renderLedger("信仰");
  applyLedgerNameClass();
});
