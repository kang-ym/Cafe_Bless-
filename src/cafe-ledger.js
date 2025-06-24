'use strict';

const database = window.database;

// ✅ 주요 요소 가져오기
const ledgerTableBody = document.getElementById('ledger-table-body');
const addPersonBtn = document.getElementById('ledger-btn-add-person');

// ✅ 선택 버튼 및 삭제 버튼 생성
const selectBtn = document.createElement('button');
selectBtn.textContent = '選択';
selectBtn.id = 'ledger-btn-select';
addPersonBtn.after(selectBtn);

const deleteSelectedBtn = document.createElement('button');
deleteSelectedBtn.textContent = '削除';
deleteSelectedBtn.id = 'ledger-btn-delete';
deleteSelectedBtn.style.display = 'none';
selectBtn.after(deleteSelectedBtn);

let selectionMode = false; // ✅ 선택 모드 여부 저장

// ✅ 날짜 키 함수
function getTodayKey() {
  const today = new Date();
  return `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
}

// ✅ 날짜 표시 형식 함수
function formatDisplayDate(dateKey) {
  return dateKey.replace(/_/g, '.');
}

// ✅ 하나의 셀에 여러 금액 표시
function formatRecordEntries(entries = []) {
  if (!Array.isArray(entries)) entries = [entries];
  return entries.map(e => `${e > 0 ? '+' : ''}${e}`).join('<br>');
}

// ✅ 해당 그룹 전체의 날짜 키 모으기
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

// ✅ 메인 렌더링 함수
async function renderLedger(groupName) {
  const [groupSnap, aliasSnap] = await Promise.all([
    database.ref(`ledger/${groupName}`).once('value'),
    database.ref('nameAlias').once('value')
  ]);

  const groupData = groupSnap.val() || {};
  const aliasData = aliasSnap.val() || {};

  // ✅ 그룹명에 대응되는 하위 멤버 구성 추출
  const groupToMembers = {};
  Object.entries(aliasData).forEach(([member, group]) => {
    if (!groupToMembers[group]) groupToMembers[group] = [];
    groupToMembers[group].push(member);
  });

  const allDates = collectAllDates(groupData);

  // ✅ 헤더 작성
  const ledgerTableHead = document.getElementById('ledger-table-head-row');
  ledgerTableHead.innerHTML = `
    ${selectionMode ? '<th></th>' : ''}
    <th>名前</th>
    <th>残高</th>
    <th>チャージ</th>
    ${allDates.map(date => `<th>${formatDisplayDate(date)}</th>`).join('')}
    ${groupName === 'guest' ? '<th>移動</th>' : ''}
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

    // ✅ 게스트 이동 기능
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

    // ✅ 그룹 멤버 보기 토글
    row.querySelector('.show-members-btn')?.addEventListener('click', () => {
      const box = document.getElementById(`members-${personName}`);
      box.classList.toggle('hidden');
    });

    // ✅ 충전 버튼
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

    // ✅ 이동 버튼 처리
    row.querySelector('.move-btn')?.addEventListener('click', async () => {
      const newGroup = row.querySelector('.move-group')?.value;
      const personRef = database.ref(`ledger/guest/${personName}`);
      const personData = (await personRef.once('value')).val();
      const todayKey = getTodayKey();

      const updates = {
        [`ledger/guest/${personName}`]: null,
        [`ledgerNames/guest/${personName}`]: null,
        [`ledger/${newGroup}/${personName}`]: personData,
        [`ledgerNames/${newGroup}/${personName}`]: true
      };

      await database.ref().update(updates);
      renderLedger('guest');
    });
  }
}

// ✅ 선택 버튼 → 체크박스 토글
selectBtn.addEventListener('click', () => {
  selectionMode = !selectionMode;
  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || '信仰';
  deleteSelectedBtn.style.display = selectionMode ? 'inline-block' : 'none';
  renderLedger(group);
  applyLedgerNameClass();
});

// ✅ 삭제 시 nameAlias 안도 같이 정리
deleteSelectedBtn.addEventListener('click', async () => {
  const checkboxes = document.querySelectorAll('.ledger-select-box:checked');
  if (!checkboxes.length) return alert('削除する人を選択してください');
  if (!confirm('本当に削除しますか？')) return;

  const aliasSnap = await database.ref('nameAlias').once('value');
  const aliasData = aliasSnap.val() || {};
  const updates = {};

  checkboxes.forEach(cb => {
    const name = cb.dataset.name;
    const group = cb.dataset.group;
    updates[`ledger/${group}/${name}`] = null;
    updates[`ledgerNames/${group}/${name}`] = null;

    // ✅ nameAlias에서 value가 삭제 대상인 경우 같이 제거
    Object.entries(aliasData).forEach(([aliasName, aliasGroup]) => {
      if (aliasGroup === name) {
        updates[`nameAlias/${aliasName}`] = null;
      }
    });
  });

  await database.ref().update(updates);
  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || '信仰';
  renderLedger(group);
});

// ✅ 탭 클릭 → 그룹 전환
document.querySelectorAll('.cafe-ledger-tab a').forEach(tab => {
  tab.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.cafe-ledger-tab a').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const group = tab.dataset.group;
    renderLedger(group);
  });
});

// ✅ 사람 추가 기능 (개인 / 그룹)
addPersonBtn.addEventListener('click', async () => {
  const group = document.querySelector('.cafe-ledger-tab a.active')?.dataset.group || '信仰';
  const mode = prompt("1：個人追加\n2：グループ追加\nどちらを行いますか？");
  if (!mode) return;

  const normalizedMode = mode.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 65248));

  if (normalizedMode === '1') {
    const name = prompt('名前を入力してください');
    if (!name) return;
    const balance = parseInt(prompt('初期残高は？', '0')) || 0;
    const todayKey = getTodayKey();
    const newPerson = { balance, records: { [todayKey]: [balance] } };
    await database.ref(`ledger/${group}/${name}`).set(newPerson);
    await database.ref(`ledgerNames/${group}/${name}`).set(true);
    renderLedger(group);
  } else if (normalizedMode === '2') {
    const groupName = prompt('グループ名を入力してください');
    const members = prompt('グループに含める名前をカンマで区切って入力 (例：민아,영민)');
    if (!groupName || !members) return;
    const balance = parseInt(prompt('初期残高は？', '0')) || 0;
    const todayKey = getTodayKey();
    const newPerson = { balance, records: { [todayKey]: [balance] } };
    const updates = {
      [`ledger/${group}/${groupName}`]: newPerson,
      [`ledgerNames/${group}/${groupName}`]: true
    };
    members.split(/[,、]/).map(n => n.trim()).forEach(name => {
      updates[`nameAlias/${name}`] = groupName;
    });
    await database.ref().update(updates);
    renderLedger(group);
  }
});

// ✅ 이름 칸 스타일 적용 보조 함수
function applyLedgerNameClass() {
  const rows = document.querySelectorAll('.ledger-table tbody tr');
  rows.forEach(row => {
    const tds = row.querySelectorAll('td');
    tds.forEach(td => td.classList.remove('ledger-name'));
    if (selectionMode) tds[1]?.classList.add('ledger-name');
    else tds[0]?.classList.add('ledger-name');
  });

  const ths = document.querySelectorAll('#ledger-table-head-row th');
  ths.forEach(th => th.classList.remove('ledger-name'));
  if (selectionMode) ths[1]?.classList.add('ledger-name');
  else ths[0]?.classList.add('ledger-name');
}

// ✅ 초기화 실행
document.addEventListener('DOMContentLoaded', () => {
  renderLedger("信仰");
  applyLedgerNameClass();
});
