'use strict';

// 👉 요소들 찾기
const coffeeRadios = document.querySelectorAll('.coffe-box input[type="radio"]');
const imgBoxes = document.querySelectorAll('.coffe-box .img-box');
const orderBtn = document.querySelector('.order-btn');
const orderResult = document.getElementById('orderResult');
const hotRadios = document.querySelectorAll('.hot-radio input');
const sizeRadios = document.querySelectorAll('.size-radio input');
const quantityInput = document.getElementById('coffeeQuantity');
const groupSelect = document.getElementById('group'); // ✅ [추가] 소속 select
const nameBox = document.getElementById('nameBox');     // ✅ [추가] 이름 입력 영역 div

// ✅ 날짜 정보
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2,'0');
const date = String(today.getDate()).padStart(2,'0');
const getDate = `${year}-${month}-${date}`;
document.getElementById('getdate').textContent = getDate;

// ✅ 커피 선택 시 그림자 업데이트
function updateCoffeeSelection() {
  coffeeRadios.forEach((radio, index) => {
    imgBoxes[index].style.boxShadow = radio.checked
      ? '0 0 15px var(--color-accent)'
      : '3px 3px 10px var(--color-text)';
  });
}

// ✅ HOT/COLD 선택 스타일 업데이트
function updateHotColdSelection() {
  document.querySelectorAll('.hot-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.hot-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

// ✅ 사이즈 선택 스타일 업데이트
function updateSizeSelection() {
  document.querySelectorAll('.size-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.size-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

// ✅ 주문 버튼 클릭 처리
let isFirstOrder = true;

function handleOrder() {
  const selectedCoffee = document.querySelector('.coffe-box input[type="radio"]:checked');
  if (!selectedCoffee) {
    orderResult.textContent = 'メニューを選択してください。';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const coffeeBox = selectedCoffee.closest('.coffe-box');
  const coffeeLabel = coffeeBox.querySelector('h3')?.dataset.en;

  const hotOrCold = document.querySelector('.hot-radio input:checked')?.value;
  const size = document.querySelector('.size-radio input:checked')?.value.toUpperCase();

  const name = getCustomerName(); // ✅ [수정] 이름 가져오는 방식 변경
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
    today: getDate,
    coffee: coffeeLabel,
    size,
    temperature: hotOrCold,
    quantity,
    name,
    price: totalPrice
  };

  saveOrderToFirebase(orderData);
}

// ✅ 이름 가져오기 (input 또는 select 구분)
function getCustomerName() { // ✅ [추가] 이름 가져오는 함수
  const input = nameBox.querySelector('#customerName');
  return input ? input.value.trim() : '';
}

// ✅ 소속에 따라 이름 입력/선택 생성
const memberData = { // ✅ [추가] 소속별 고정 이름 목록
  trust: ['하윤이 엄마', '지민 아빠', '김선생님'],
  desire: ['강선생님', '채영이 엄마'],
  love: ['서진이 아빠', '최선생님', '박집사님']
};

groupSelect.addEventListener('change', () => { // ✅ [추가] 소속 변경 시 이름 UI 변경
  const group = groupSelect.value;
  nameBox.innerHTML = '';

  if (group === 'guest') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'customerName';
    input.placeholder = '名前を入力してください';
    nameBox.appendChild(input);
  } else if (memberData[group]) {
    const select = document.createElement('select');
    select.id = 'customerName';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '名前を選んでください';
    select.appendChild(defaultOption);

    memberData[group].forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });

    nameBox.appendChild(select);
  }
});

function saveOrderToFirebase(orderData) {
  const newRef = database.ref('orders').push();
  newRef.set(orderData)
    .then(() => console.log("✅ 주문 저장 완료"))
    .catch(err => console.error("❌ 주문 저장 실패:", err));
}

// ✅ 이벤트 연결
coffeeRadios.forEach(radio => {
  radio.addEventListener('change', updateCoffeeSelection);
});

hotRadios.forEach(radio => {
  radio.addEventListener('change', updateHotColdSelection);
});

sizeRadios.forEach(radio => {
  radio.addEventListener('change', updateSizeSelection);
});

orderBtn.addEventListener('click', handleOrder);

// ✅ 초기 상태 반영
updateCoffeeSelection();
updateHotColdSelection();
updateSizeSelection();
