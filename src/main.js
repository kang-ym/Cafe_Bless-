'use strict';

// ✅ GitHub Pages와 로컬 환경에 따라 이미지 경로 설정
const imgBase = window.location.hostname.includes("github.io")
  ? "/Cafe_Bless-/img/"
  : "./img/";

// ✅ 요소 선택
const coffeeRadios = document.querySelectorAll('.coffe-box input[type="radio"]');
const imgBoxes = document.querySelectorAll('.coffe-box .img-box');
const orderBtn = document.querySelector('.order-btn');
const orderResult = document.getElementById('orderResult');
const hotRadios = document.querySelectorAll('.hot-radio input');
const sizeRadios = document.querySelectorAll('.size-radio input');
const quantityInput = document.getElementById('coffeeQuantity');
const groupSelect = document.getElementById('group');
const nameBox = document.getElementById('nameBox');

// ✅ 오늘 날짜 설정 (Firebase-safe + 사용자 표시)
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const firebaseDate = `${year}_${month}_${date}`;
const displayDate = `${year}.${month}.${date}`;
document.getElementById('getdate').textContent = displayDate;

// ✅ 커피 이미지 선택 시 시각적 강조
function updateCoffeeSelection() {
  coffeeRadios.forEach((radio, index) => {
    imgBoxes[index].style.boxShadow = radio.checked
      ? '0 0 15px var(--color-accent)'
      : '3px 3px 10px var(--color-text)';
  });
}

// ✅ 온도 선택 스타일 갱신
function updateHotColdSelection() {
  document.querySelectorAll('.hot-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.hot-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

// ✅ 사이즈 선택 스타일 갱신
function updateSizeSelection() {
  document.querySelectorAll('.size-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.size-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

let isFirstOrder = true;

// ✅ 주문 버튼 클릭 시 동작
function handleOrder() {
  const selectedCoffee = document.querySelector('.coffe-box input[type="radio"]:checked');
  if (!selectedCoffee) {
    orderResult.textContent = 'メニューを選択してください。';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const coffeeBox = selectedCoffee.closest('.coffe-box');
  const coffeeLabel = coffeeBox.querySelector('h3')?.dataset.en;
  const coffeeLabelJp = coffeeBox.querySelector('h3')?.textContent.trim();
  const hotOrCold = document.querySelector('.hot-radio input:checked')?.value;
  const size = document.querySelector('.size-radio input:checked')?.value.toUpperCase();
  const name = getCustomerName();

  if (!name) {
    orderResult.textContent = '注文者の名前を入力してください。';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const quantity = parseInt(quantityInput.value, 10);
  if (!coffeeLabel || !hotOrCold || !size || isNaN(quantity) || quantity < 1) {
    orderResult.textContent = 'もう一度注文をお願いできますか？。';
    return;
  }

  const priceElement = coffeeBox.querySelector('.Price');
  const pricePerCup = parseInt(priceElement.dataset[`price${size.toLowerCase()}`], 10);
  const totalPrice = pricePerCup * quantity;

  const summary = `注文者: ${name}, ${coffeeLabel}, ${size}size, ${hotOrCold}, ${quantity}杯, 合計: ${totalPrice}円`;
  if (isFirstOrder) {
    orderResult.textContent = `\n- ${summary}`;
    orderBtn.textContent = '注文追加';
    isFirstOrder = false;
  } else {
    orderResult.innerHTML += `<br>- ${summary}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const orderData = {
    timestamp: new Date().toISOString(),
    today: firebaseDate,
    displayDate: displayDate,
    coffee: coffeeLabel,
    coffeeJp: coffeeLabelJp,
    size,
    temperature: hotOrCold,
    quantity,
    name,
    group: groupSelect.value,
    price: totalPrice
  };

  saveOrderToFirebase(orderData);
  deductLedger(orderData).then(() => {
    if (typeof renderLedger === 'function') {
      renderLedger(orderData.group);
    }
  });
}

// ✅ 고객 이름 가져오기
function getCustomerName() {
  const input = nameBox.querySelector('#customerName');
  return input ? input.value.trim() : '';
}

// ✅ 소속에 따른 이름 불러오기
function loadNamesByGroup(group) {
  nameBox.innerHTML = '';
  if (group === 'guest') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customerName';
    input.placeholder = '名前を入力してください';
    nameBox.appendChild(input);
    return;
  }
  const ref = database.ref(`ledger/${group}`);
  ref.once('value').then(snapshot => {
    const data = snapshot.val();
    if (!data) return;

    const select = document.createElement('select');
    select.id = 'customerName';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '名前を選んでください';
    select.appendChild(defaultOption);

    Object.keys(data).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    nameBox.appendChild(select);
  });
}

// ✅ 가계부 잔액 차감 처리
function deductLedger(orderData) {
  const { group, name, price, today } = orderData;
  const ledgerRef = database.ref(`ledger/${group}/${name}`);
  const balanceRef = ledgerRef.child('balance');
  const recordsRef = ledgerRef.child('records');

  return balanceRef.once('value').then(snapshot => {
    const current = snapshot.val() || 0;
    const newBalance = current - price;
    balanceRef.set(newBalance);

    return recordsRef.child(today).once('value').then(rs => {
      let list = rs.val();
      if (!Array.isArray(list)) list = [];
      list.push(-price);
      return recordsRef.child(today).set(list);
    });
  });
}

// ✅ 주문 정보 Firebase 저장
function saveOrderToFirebase(orderData) {
  const newRef = database.ref('orders').push();
  newRef.set(orderData)
    .then(() => console.log("✅ 주문 저장 완료"))
    .catch(err => console.error("❌ 주문 저장 실패:", err));
}

// ✅ 이벤트 리스너
coffeeRadios.forEach(radio => radio.addEventListener('change', updateCoffeeSelection));
hotRadios.forEach(radio => radio.addEventListener('change', updateHotColdSelection));
sizeRadios.forEach(radio => radio.addEventListener('change', updateSizeSelection));
orderBtn.addEventListener('click', handleOrder);
groupSelect.addEventListener('change', () => {
  const selectedGroup = groupSelect.value;
  loadNamesByGroup(selectedGroup);
});

// ✅ 초기 로드
window.addEventListener('DOMContentLoaded', () => {
  updateCoffeeSelection();
  updateHotColdSelection();
  updateSizeSelection();
  const selectedGroup = groupSelect.value;
  if (selectedGroup) loadNamesByGroup(selectedGroup);
});
