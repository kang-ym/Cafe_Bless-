'use strict';

// ✅ 요소들 찾기
const coffeeRadios = document.querySelectorAll('.coffe-box input[type="radio"]'); // 커피 선택 라디오 버튼
const imgBoxes = document.querySelectorAll('.coffe-box .img-box'); // 커피 이미지 박스
const orderBtn = document.querySelector('.order-btn'); // 주문 버튼
const orderResult = document.getElementById('orderResult'); // 주문 결과 표시 영역
const hotRadios = document.querySelectorAll('.hot-radio input'); // 온도 선택 라디오
const sizeRadios = document.querySelectorAll('.size-radio input'); // 사이즈 선택 라디오
const quantityInput = document.getElementById('coffeeQuantity'); // 수량 입력 필드
const groupSelect = document.getElementById('group'); // 소속 선택
const nameBox = document.getElementById('nameBox'); // 이름 입력/선택 영역

// ✅ 오늘 날짜 표시
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2,'0');
const date = String(today.getDate()).padStart(2,'0');
const getDate = `${year}-${month}-${date}`;
document.getElementById('getdate').textContent = getDate;

// ✅ 커피 선택 시 시각적 효과 주기
function updateCoffeeSelection() {
  coffeeRadios.forEach((radio, index) => {
    imgBoxes[index].style.boxShadow = radio.checked
      ? '0 0 15px var(--color-accent)'
      : '3px 3px 10px var(--color-text)';
  });
}

// ✅ 온도 선택에 따라 스타일 변경
function updateHotColdSelection() {
  document.querySelectorAll('.hot-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.hot-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

// ✅ 사이즈 선택에 따라 스타일 변경
function updateSizeSelection() {
  document.querySelectorAll('.size-radio label').forEach(label => label.classList.remove('active'));
  const selected = document.querySelector('.size-radio input:checked');
  if (selected) selected.nextElementSibling.classList.add('active');
}

let isFirstOrder = true; // 주문 첫 번째 여부

// ✅ 주문 처리 함수
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

  // ✅ 주문 내용 요약 출력
  const summary = `注文者: ${name}, ${coffeeLabel}, ${size}size, ${hotOrCold}, ${quantity}杯, 合計: ${totalPrice}円`;
  if (isFirstOrder) {
    orderResult.textContent = `\n- ${summary}`;
    orderBtn.textContent = '注文追加';
    isFirstOrder = false;
  } else {
    orderResult.innerHTML += `<br>- ${summary}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // ✅ Firebase에 저장할 주문 데이터
  const orderData = {
    timestamp: new Date().toISOString(),
    today: getDate,
    coffee: coffeeLabel,
    size,
    temperature: hotOrCold,
    quantity,
    name,
    group: groupSelect.value,
    price: totalPrice
  };

  saveOrderToFirebase(orderData);
}

// ✅ 이름 가져오기 (input 또는 select 둘 중 하나에서 가져옴)
function getCustomerName() {
  const input = nameBox.querySelector('#customerName');
  return input ? input.value.trim() : '';
}

// ✅ Firebase에서 소속별 사람 이름 불러오기
function loadNamesByGroup(group) {
  nameBox.innerHTML = '';

  if (group === 'guest') {
    // 게스트는 이름을 직접 입력
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

    // 이름 선택 셀렉트 박스 생성
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

// ✅ 소속 선택 시 이름 목록 로드
groupSelect.addEventListener('change', () => {
  const selectedGroup = groupSelect.value;
  loadNamesByGroup(selectedGroup);
});

// ✅ 초기 렌더링 시 상태 반영
window.addEventListener('DOMContentLoaded', () => {
  updateCoffeeSelection();
  updateHotColdSelection();
  updateSizeSelection();

  const selectedGroup = groupSelect.value;
  if (selectedGroup) loadNamesByGroup(selectedGroup);
});

// ✅ Firebase로 주문 데이터 저장
function saveOrderToFirebase(orderData) {
  const newRef = database.ref('orders').push();
  newRef.set(orderData)
    .then(() => console.log("✅ 주문 저장 완료"))
    .catch(err => console.error("❌ 주문 저장 실패:", err));
}

// ✅ 각 요소에 이벤트 바인딩
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
