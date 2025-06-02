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

function renderLedger(groupName) {
  const groupRef = database.ref(`ledger/${groupName}`);
  groupRef.once('value').then(snapshot => {
    const groupData = snapshot.val() || {};
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
      const balanceClass = person.balance <= 200 ? 'ledger-balance-low' : '';
      const row = document.createElement('tr');
      row.className = 'cafe-ledger-row';

      let rowHtml = '';
      if (selectionMode) {
        rowHtml += `<td><input type="checkbox" class="ledger-select-box" data-name="${personName}" data-group="${groupName}"></td>`;
      }

      rowHtml += groupName === 'guest'
        ? `<td><input type="text" class="edit-name" value="${personName}" data-old="${personName}"></td>`
        : `<td>${personName}</td>`;

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

      // 충전 버튼
      row.querySelector('.ledger-btn-charge').addEventListener('click', () => {
        const amount = parseInt(prompt(`${personName}님에게 충전할 금액을 입력하세요`, '1000'));
        if (!isNaN(amount)) {
          const todayKey = getTodayKey();
          const personRef = database.ref(`ledger/${groupName}/${personName}`);
          personRef.once('value').then(snapshot => {
            const personData = snapshot.val() || {};
            const balance = (personData.balance || 0) + amount;
            const records = personData.records || {};
            records[todayKey] = [...(records[todayKey] || []), amount];
            personRef.set({ balance, records });
          });
        }
      });

      // 이름 변경
      const nameInput = row.querySelector('.edit-name');
      if (nameInput) {
        nameInput.addEventListener('change', () => {
          const oldName = nameInput.dataset.old;
          const newName = nameInput.value.trim();
          if (!newName || oldName === newName) return;

          const ref = database.ref(`ledger/${groupName}`);
          ref.child(oldName).once('value').then(snapshot => {
            const data = snapshot.val();
            if (!data) return;
            ref.child(newName).set(data);
            ref.child(oldName).remove();

            // ledgerNames도 수정
            const nameRef = database.ref(`ledgerNames/${groupName}`);
            nameRef.child(newName).set(true);
            nameRef.child(oldName).remove();
            renderLedger(groupName);
          });
        });
      }

      // 이동
      const moveBtn = row.querySelector('.move-btn');
      if (moveBtn) {
        moveBtn.addEventListener('click', () => {
          const newGroup = row.querySelector('.move-group').value;
          const ref = database.ref(`ledger`);
          ref.child('guest').child(personName).once('value').then(snapshot => {
            const data = snapshot.val();
            if (!data) return;
            ref.child(newGroup).child(personName).set(data);
            ref.child('guest').child(personName).remove();
            database.ref(`ledgerNames/${newGroup}/${personName}`).set(true);
            database.ref(`ledgerNames/guest/${personName}`).remove();
            renderLedger('guest');
            renderLedger(newGroup);
          });
        });
      }
    }
  });
}

// ✅ 이름 열 스타일링 (선택 모드에 따라)
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

// ✅ 탭 클릭 시 그룹 렌더링
document.querySelectorAll('.cafe-ledger-tab a').forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.cafe-ledger-tab a').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const group = tab.dataset.group;
    renderLedger(group);
  });
});

// ✅ 사람 추가 시 ledgerNames도 등록
addPersonBtn.addEventListener('click', () => {
  const activeTab = document.querySelector('.cafe-ledger-tab a.active');
  const group = activeTab?.dataset.group || 'trust';
  const name = prompt('추가할 사람 이름을 입력하세요');
  if (!name) return;
  const balance = parseInt(prompt('초기 금액을 입력하세요', '0')) || 0;
  const todayKey = getTodayKey();

  const newPerson = {
    balance,
    records: {
      [todayKey]: [balance]
    }
  };

  const personRef = database.ref(`ledger/${group}/${name}`);
  const nameRef = database.ref(`ledgerNames/${group}/${name}`);

  personRef.set(newPerson)
    .then(() => nameRef.set(true))
    .then(() => renderLedger(group))
    .catch(err => alert('❌ 저장 실패: ' + err));
});

// ✅ 선택 삭제
selectBtn.addEventListener('click', () => {
  selectionMode = !selectionMode;
  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || 'trust';
  deleteSelectedBtn.style.display = selectionMode ? 'inline-block' : 'none';
  renderLedger(group);
  applyLedgerNameClass();
});

deleteSelectedBtn.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.ledger-select-box:checked');
  if (!checkboxes.length) return alert('削除する人を選択してください');
  if (!confirm('選択したメンバー를 삭제할까요？')) return;

  checkboxes.forEach(cb => {
    const name = cb.dataset.name;
    const group = cb.dataset.group;
    database.ref(`ledger/${group}/${name}`).remove();
    database.ref(`ledgerNames/${group}/${name}`).remove();
  });

  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || 'trust';
  renderLedger(group);
});

// ✅ 초기 로딩
document.addEventListener('DOMContentLoaded', () => {
  renderLedger("信仰");
  applyLedgerNameClass();
});
