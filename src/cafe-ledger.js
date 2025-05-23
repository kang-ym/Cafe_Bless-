// cafe-ledger.js - 선택 삭제 기능 + 잠금 기능 통합

// ✅ 1. Ledger 잠금 처리
const cafeLedgerPassword = "trustonly"; // 원하는 비밀번호
const lockScreen = document.createElement("div");
lockScreen.className = "ledger-lock-screen";
lockScreen.id = "cafeLedgerLock";
lockScreen.innerHTML = `
  <div class="ledger-lock-box">
    <p>🔐 カフェガ計簿のパスワードを入力してください</p>
    <input type="password" id="cafeLedgerPwInput" placeholder="パスワード">
    <button id="cafeLedgerPwBtn">確認</button>
  </div>
`;
document.body.appendChild(lockScreen);

// ✅ 확인 버튼 클릭 시 잠금 해제 + 렌더링
const pwBtn = document.getElementById("cafeLedgerPwBtn");
pwBtn.addEventListener("click", () => {
  const pw = document.getElementById("cafeLedgerPwInput").value.trim();
  if (pw === cafeLedgerPassword) {
    lockScreen.style.display = "none";
    localStorage.setItem("cafeLedgerAccess", "true");

    // ✅ 잠금 해제 시 렌더링 실행
    const activeTab = document.querySelector('.cafe-ledger-tab a.active');
    const group = activeTab?.dataset.group || 'trust';
    renderLedger(group);
  } else {
    alert("パスワードが違います。");
    document.getElementById("cafeLedgerPwInput").value = "";
  }
});

// ✅ 페이지 로드시 잠금 확인
window.addEventListener("DOMContentLoaded", () => {
  const access = localStorage.getItem("cafeLedgerAccess");
  if (access === "true") {
    lockScreen.style.display = "none";
    const activeTab = document.querySelector('.cafe-ledger-tab a.active');
    const group = activeTab?.dataset.group || 'trust';
    renderLedger(group);
  }
});

// ✅ 선택 삭제 관련 요소
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

// ✅ 날짜 키 및 날짜 포맷 함수
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

// ✅ 가계부 렌더 함수
function renderLedger(groupName) {
  const groupRef = database.ref(`ledger/${groupName}`);
  groupRef.once('value').then(snapshot => {
    const groupData = snapshot.val() || {};
    const allDates = collectAllDates(groupData);

    const ledgerTableHead = document.getElementById('ledger-table-head-row');
    ledgerTableHead.innerHTML = `
      ${selectionMode ? '<th></th>' : ''}
      ${groupName === 'guest' ? '<th class="cafe-ledger-col">소속</th>' : ''}
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
      if (groupName === 'guest') {
        rowHtml += `<td class="cafe-ledger-col">ゲスト</td>`;
        rowHtml += `<td class="cafe-ledger-col"><input type="text" class="edit-name" value="${personName}" data-old="${personName}"></td>`;
      } else {
        rowHtml += `<td class="cafe-ledger-col">${personName}</td>`;
      }

      rowHtml += `
        <td class="ledger-balance ${balanceClass}" data-balance="${person.balance}">${person.balance}</td>
        <td><button class="ledger-btn-charge cafe-ledger-btn" data-name="${personName}">+</button></td>
      `;

      allDates.forEach(date => {
        const entries = person.records?.[date] || [];
        rowHtml += `<td class="cafe-ledger-cell">${formatRecordEntries(entries) || '-'}</td>`;
      });

      if (groupName === 'guest') {
        rowHtml += `
          <td class="cafe-ledger-col">
            <select class="move-group">
              <option value="信仰">信仰</option>
              <option value="希望">希望</option>
              <option value="愛">愛</option>
            </select>
            <button class="move-btn cafe-ledger-btn" data-name="${personName}">移動</button>
          </td>
        `;
      }

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
            renderLedger(groupName);
          });
        });
      }

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

            renderLedger('guest');
            renderLedger(newGroup);
          });
        });
      }
    }
  });
}

// ✅ 탭 클릭 시 그룹 변경
const cafeLedgerTabs = document.querySelectorAll('.cafe-ledger-tab a');
cafeLedgerTabs.forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    cafeLedgerTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const group = tab.dataset.group;
    renderLedger(group);
  });
});

// ✅ 사람 추가
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
  personRef.set(newPerson)
    .then(() => renderLedger(group))
    .catch(err => alert('❌ 저장 실패: ' + err));
});

// ✅ 선택 삭제 기능
selectBtn.addEventListener('click', () => {
  selectionMode = !selectionMode;
  const activeTab = document.querySelector('.cafe-ledger-tab a.active');
  const group = activeTab?.dataset.group || 'trust';
  deleteSelectedBtn.style.display = selectionMode ? 'inline-block' : 'none';
  renderLedger(group);
});

deleteSelectedBtn.addEventListener('click', () => {
  const checkboxes = document.querySelectorAll('.ledger-select-box:checked');
  if (checkboxes.length === 0) return alert('削除する人を選択してください');

  if (!confirm('選択したメンバーを全て削除しますか？')) return;

  checkboxes.forEach(cb => {
    const name = cb.dataset.name;
    const group = cb.dataset.group;
    database.ref(`ledger/${group}/${name}`).remove()
      .then(() => renderLedger(group))
      .catch(err => console.error("❌ 삭제 실패:", err));
  });
});
