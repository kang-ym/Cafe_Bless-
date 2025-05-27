'use strict';

import { database } from './firebase-init.js';
import {
  ref,
  get,
  set,
  push
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// ✅ 오늘 날짜
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const firebaseDate = `${year}_${month}_${date}`;
const displayDate = `${year}.${month}.${date}`;
document.getElementById('getdate').textContent = displayDate;

// ✅ 커피 선택 시 강조
function updateCoffeeSelection() {
  coffeeRadios.forEach((radio, index) => {
    imgBoxes[index].style.boxShadow = radio.checked
      ? '0 0 15px var(--color-accent)'
      : '3px 3px 10px var(--color-text)';
  });
}

// ✅ 온도/사이즈 스타일 갱신
function updateHotColdSelection() {
  document.querySelectorAll('.hot-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.hot-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}
function updateSizeSelection() {
  document.querySelectorAll('.size-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.size-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

let isFirstOrder = true;

// ✅ 주문 버튼 클릭 처리
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

  const summary = `${name}, ${coffeeLabel}, ${size}size, ${hotOrCold}, ${quantity}杯, ${totalPrice}円`;
  if (isFirstOrder) {
    orderResult.textContent = `\n- ${summary}`;
    orderBtn.textContent = '注文追加';
    isFirstOrder = false;
  } else {
    orderResult.innerHTML += `<br>- ${summary}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  const group = groupSelect.value; // ✅ 일본어 그대로 사용

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
    group, // ✅ 일본어 그대로 저장
    price: totalPrice
  };

  saveOrderToFirebase(orderData);
  deductLedger(orderData).then(() => {
    if (typeof renderLedger === 'function') {
      renderLedger(orderData.group);
    }
  });
}

// ✅ 이름 가져오기
function getCustomerName() {
  const input = nameBox.querySelector('#customerName');
  return input ? input.value.trim() : '';
}

// ✅ 그룹에 따라 이름 목록 불러오기
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

  const groupRef = ref(database, `ledger/${group}`);
  get(groupRef).then(snapshot => {
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

// ✅ 잔액 차감 처리
function deductLedger(orderData) {
  const { group, name, price, today } = orderData;

  const balanceRef = ref(database, `ledger/${group}/${name}/balance`);
  const recordsRef = ref(database, `ledger/${group}/${name}/records/${today}`);

  return get(balanceRef).then(snapshot => {
    const current = snapshot.val() || 0;
    const newBalance = current - price;

    return set(balanceRef, newBalance).then(() => {
      return get(recordsRef).then(rs => {
        let list = rs.val();
        if (!Array.isArray(list)) list = [];
        list.push(-price);
        return set(recordsRef, list);
      });
    });
  });
}

// ✅ 주문 정보 저장
function saveOrderToFirebase(orderData) {
  const newOrderRef = push(ref(database, 'orders'));
  set(newOrderRef, orderData)
    .then(() => console.log("✅ 주문 저장 완료"))
    .catch(err => console.error("❌ 주문 저장 실패:", err));
}

// ✅ 리스너 등록
coffeeRadios.forEach(radio => radio.addEventListener('change', updateCoffeeSelection));
hotRadios.forEach(radio => radio.addEventListener('change', updateHotColdSelection));
sizeRadios.forEach(radio => radio.addEventListener('change', updateSizeSelection));

groupSelect.addEventListener('change', () => {
  const group = groupSelect.value;
  loadNamesByGroup(group); // ✅ 일본어 그대로
});

window.addEventListener('DOMContentLoaded', () => {
  orderBtn.addEventListener('click', handleOrder);
  updateCoffeeSelection();
  updateHotColdSelection();
  updateSizeSelection();
  const group = groupSelect.value;
  if (group) loadNamesByGroup(group);
});
