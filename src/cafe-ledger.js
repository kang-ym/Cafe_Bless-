'use strict';

const DEDUCT_100 = 100;           // 차감 금액(円)
const DEDUCT_50 = 50;           // 차감 금액(円)


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
  return entries.map(e => {
    if (typeof e === 'string' && /^-?\d+G$/.test(e)) {
      return `${e}`; // G가 붙은 문자열은 그대로 표시
    }
    const value = typeof e === 'number' ? e : parseInt(e);
    return `${value > 0 ? '+' : ''}${value}`;
  }).join('<br>');
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
      <td>
        <div class="ledger-btn-box">
          <button class="ledger-btn-charge" data-name="${personName}">+チャージ</button>
          <button class="ledger-btn-confirm" data-name="${personName}" data-amount="-100">-${DEDUCT_100}</button>
          <button class="ledger-btn-confirm" data-name="${personName}" data-amount="-50">-${DEDUCT_50}</button>
        </div>
      </td>
    `;

    allDates.forEach(date => {
      const entries = person.records?.[date] || [];
      const isToday = date === getTodayKey();
      
      let cellContent = formatRecordEntries(entries) || '-';
  
      if (groupName === 'guest' && isToday && entries.some(e => typeof e === 'number' && e < 0)) {
          cellContent += `
            <div class="move-charge-box">
              <select class="inviter-select" data-person="${personName}">
                <option value="">名前選択</option>
              </select>
              <button class="btn-move-charge" data-person="${personName}">移動</button>
            </div>
          `;
      }
  
      rowHtml += `<td>${cellContent}</td>`;
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

    // ✅ 이동 버튼 클릭 처리
ledgerTableBody.querySelectorAll('.btn-move-charge').forEach(btn => {
  btn.addEventListener('click', async () => {
    const personName = btn.dataset.person;
    const select = btn.previousElementSibling;
    const inviterName = select?.value;
    if (!inviterName) return alert('名前を選択してください');

    const inviterGroupSnap = await database.ref('ledgerNames').once('value');
    const inviterGroups = inviterGroupSnap.val() || {};
    let targetGroup = null;
    for (const group in inviterGroups) {
      if (inviterGroups[group][inviterName]) {
        targetGroup = group;
        break;
      }
    }
    if (!targetGroup) return alert("該当する人が見つかりません");

    const todayKey = getTodayKey();
    const guestRef = database.ref(`ledger/guest/${personName}`);
    const guestSnap = await guestRef.once('value');
    const guestData = guestSnap.val() || {};
    const guestRecords = guestData.records || {};
    const amountList = guestRecords[todayKey];
    const originalAmount = amountList.find(v => typeof v === 'number' && v < 0);
    if (!originalAmount) return alert("今日の差し引かれた金額が見つかりません");

    guestRecords[todayKey] = [0];
    await guestRef.update({ 
      records: guestRecords,
      balance: 0
    });

    const inviterRef = database.ref(`ledger/${targetGroup}/${inviterName}`);
    const inviterSnap = await inviterRef.once('value');
    const inviterData = inviterSnap.val() || {};
    const inviterBalance = inviterData.balance || 0;
    const inviterRecords = inviterData.records || {};
    const inviterToday = inviterRecords[todayKey] || [];
    inviterToday.push(`${originalAmount}G`);
    inviterRecords[todayKey] = inviterToday;

    await inviterRef.set({
      balance: inviterBalance + originalAmount,
      records: inviterRecords
    });

    alert(`${personName}さんのコーヒー代が ${inviterName} さんに移動されました。`);
    await renderLedger('guest');
  });
});

// ✅ 드롭다운에 이름 채워 넣기
const inviterSelects = ledgerTableBody.querySelectorAll('.inviter-select');
const nameSnap = await database.ref('ledgerNames').once('value');
const nameData = nameSnap.val() || {};

inviterSelects.forEach(select => {
  for (const group in nameData) {
    for (const name in nameData[group]) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = `${name}（${group}）`;
      select.appendChild(opt);
    }
  }
});


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
          personRef.set({ balance, records }).then(() => {
            // ✅ 부분 갱신: 잔액 + 오늘 셀만 업데이트
            const balanceCell = row.querySelector('.ledger-balance');
            if (balanceCell) balanceCell.textContent = balance;

            const header = document.querySelector('#ledger-table-head-row');
            if (header) {
              const todayDisplay = formatDisplayDate(todayKey);
              let todayColIndex = -1;
              header.querySelectorAll('th').forEach((th, i) => {
                if ((th.textContent || '').trim() === todayDisplay) todayColIndex = i;
              });

              if (todayColIndex >= 0) {
                const tds = row.querySelectorAll('td');
                const todayCell = tds[todayColIndex];
                if (todayCell) {
                  todayCell.innerHTML = formatRecordEntries(newRecords) || '-';
                }
              }
            }
          });
        });
      }
    });

    // ✅ 차감 버튼
    // ✅ 차감 버튼: 이벤트 위임으로 한 번만 부착 (renderLedger 안에서 row마다 리스너 붙이지 않기)
    row.addEventListener('click', async (e) => {
      const btn = e.target.closest('.ledger-btn-confirm');
      if (!btn) return;
    
      const name = btn.dataset.name;
      if (!name) return;
    
      // 버튼 텍스트에서 금액 파싱: "-100" 또는 "-50"
      const raw = (btn.textContent || '').trim();
      const amount = parseInt(btn.dataset.amount, 10);
      if (Number.isNaN(amount)) return;
    
      const todayKey = getTodayKey();
      const personRef = database.ref(`ledger/${groupName}/${name}`);
    
      const snap = await personRef.once('value');
      const data = snap.val() || {};
      const newBalance = (data.balance || 0) + amount;
    
      const records = data.records || {};
      const current = records[todayKey];
      const newList = Array.isArray(current)
        ? [...current, amount]
        : (typeof current === 'number' ? [current, amount] : [amount]);
    
      records[todayKey] = newList;
    
      await personRef.set({ balance: newBalance, records });
    
      // ✅ 부분 갱신: 잔액 + 오늘 셀만 업데이트
      const balanceCell = row.querySelector('.ledger-balance');
      if (balanceCell) balanceCell.textContent = newBalance;
        
      // 헤더에서 '오늘' 열 index 찾기 → 행의 동일 index 셀 갱신
      const ths = document.querySelectorAll('#lunch-ledger-table-head-row, #ledger-table-head-row');
      // 위 줄은 점심/카페 공용 대응용. 실제로는 '#ledger-table-head-row'만 써도 됨.
      const header = document.querySelector('#ledger-table-head-row');
      if (header) {
        const todayDisplay = formatDisplayDate(todayKey);
        let todayColIndex = -1;
        header.querySelectorAll('th').forEach((th, i) => {
          if ((th.textContent || '').trim() === todayDisplay) todayColIndex = i;
        });
      
        if (todayColIndex >= 0) {
          const tds = row.querySelectorAll('td');
          const todayCell = tds[todayColIndex];
          if (todayCell) {
            todayCell.innerHTML = formatRecordEntries(newList) || '-';
          }
        }
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
window.onload = () => {
    // ✅ 첫 탭을 명시적으로 active로
    const firstTab = document.querySelector('.cafe-ledger-tab a[data-group="信仰"]');
    firstTab?.classList.add('active');

  renderLedger("信仰");
  applyLedgerNameClass();
};
