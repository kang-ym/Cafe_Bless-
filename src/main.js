'use strict';

// 👉 요소들 찾기
const coffeeRadios = document.querySelectorAll('.coffe-box input[type="radio"]');
const imgBoxes = document.querySelectorAll('.coffe-box .img-box');
const orderBtn = document.querySelector('.order-btn');
const orderResult = document.getElementById('orderResult');
const hotRadios = document.querySelectorAll('.hot-radio input');
const sizeRadios = document.querySelectorAll('.size-radio input');
const nameInput = document.getElementById('customerName');
const quantityInput = document.getElementById('coffeeQuantity');

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

  const name = nameInput.value.trim();
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

  // ✅ 가격 정보 가져오기
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
    today: getDate,
    coffee: coffeeLabel,
    size,
    temperature: hotOrCold,
    quantity,
    name,
    price: totalPrice
  };

  // ✅ 여러 주문 저장 (배열에)
  const savedOrders = JSON.parse(localStorage.getItem('orders')) || [];
  savedOrders.push(orderData);
  localStorage.setItem('orders', JSON.stringify(savedOrders));

  // ✅ Google Sheets로 전송
  sendToGoogleSheet(orderData);
}

function sendToGoogleSheet(orderData) {
  const formData = new FormData();
  formData.append("data", JSON.stringify(orderData));

  fetch("https://script.google.com/macros/s/AKfycbzx3VmWEmsr_bJTR-Zclur1_lumQoSJ0cIt6fSDUpOFiaaZux5bfCZd8jBUhG9-YJFW/exec", {
    method: "POST",
    body: formData
  })
    .then(res => res.text())
    .then(msg => console.log("✅ 주문 전송 성공:", msg))
    .catch(err => console.error("❌ 주문 전송 실패:", err));
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
