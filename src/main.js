'use strict';

const database = window.database;

// ✅ 요소 정의
const coffeeRadios = document.querySelectorAll('.coffe-box input[type="radio"]');
const imgBoxes = document.querySelectorAll('.coffe-box .img-box');
const orderBtn = document.querySelector('.order-btn');
const orderResult = document.getElementById('orderResult');
const hotRadios = document.querySelectorAll('.hot-radio input');
const sizeRadios = document.querySelectorAll('.size-radio input');
const quantityInput = document.getElementById('coffeeQuantity');
const groupSelect = document.getElementById('group');
const nameBox = document.getElementById('nameBox');

// ✅ 날짜 처리
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const date = String(today.getDate()).padStart(2, '0');
const firebaseDate = `${year}_${month}_${date}`;
const displayDate = `${year}.${month}.${date}`;
document.getElementById('getdate').textContent = displayDate;

// ✅ 커피 강조
function updateCoffeeSelection() {
    coffeeRadios.forEach((radio, index) => {
        imgBoxes[index].style.boxShadow = radio.checked
            ? '0 0 15px var(--color-accent)'
            : '3px 3px 10px var(--color-text)';
    });
    updateHotRadioAvailability(); // 🔥 hot/cold 제어
}
//여름 계절 주문처리 라떼들 핫주문 안됨
function updateHotRadioAvailability() {
    const selectedCoffee = document.querySelector('.coffe-box input[type="radio"]:checked').value;
    const hotInput = document.querySelector('.hot-radio input[value="hot"]');
    const hotLabel = hotInput.nextElementSibling;
    const coldInput = document.querySelector('.hot-radio input[value="cold"]');
    const coldLabel = coldInput.nextElementSibling;

    if (selectedCoffee !== 'americano') {
        hotInput.style.display = 'none';
        hotLabel.style.display = 'none';
        coldInput.checked = true;
        updateHotColdSelection(); // 스타일 업데이트
    } else {
        hotInput.style.display = '';
        hotLabel.style.display = '';
    }
}

coffeeRadios.forEach(radio => radio.addEventListener('change', updateCoffeeSelection));
updateCoffeeSelection();

// ✅ 온도/사이즈 강조
function updateHotColdSelection() {
    document.querySelectorAll('.hot-radio label').forEach(label => label.classList.remove('active'));
    const selected = document.querySelector('.hot-radio input:checked');
    if (selected) selected.nextElementSibling.classList.add('active');
}
hotRadios.forEach(radio => radio.addEventListener('change', updateHotColdSelection));
updateHotColdSelection();

function updateSizeSelection() {
    document.querySelectorAll('.size-radio label').forEach(label => label.classList.remove('active'));
    const selected = document.querySelector('.size-radio input:checked');
    if (selected) selected.nextElementSibling.classList.add('active');
}
sizeRadios.forEach(radio => radio.addEventListener('change', updateSizeSelection));
updateSizeSelection();

// ✅ 이름 입력 or 선택
function getCustomerName() {
    const group = groupSelect.value;
    if (!group) return null;
    if (group === 'guest') {
        const input = document.querySelector('#nameBox input');
        return input?.value?.trim() || null;
    } else {
        const select = document.querySelector('#nameBox select');
        return select?.value || null;
    }
}

// ✅ 그룹 변경 시 이름 목록 업데이트
groupSelect.addEventListener('change', () => {
    const group = groupSelect.value;
    nameBox.innerHTML = '';
    if (!group) return;

    if (group === 'guest') {
        nameBox.innerHTML = `<input type="text" placeholder="名前を入力">`;
    } else {
        database.ref(`ledgerNames/${group}`).once('value').then(snapshot => {
            const data = snapshot.val();
            if (!data) return;
            const select = document.createElement('select');
            select.innerHTML = `<option value="">名前を選択</option>`;
            Object.keys(data).forEach(name => {
                select.innerHTML += `<option value="${name}">${name}</option>`;
            });
            nameBox.innerHTML = '';
            nameBox.appendChild(select);
        });
    }
});

// ✅ 주문 버튼 처리
orderBtn.addEventListener('click', () => {
    const selectedCoffee = document.querySelector('.coffe-box input[type="radio"]:checked');
    if (!selectedCoffee) {
        orderResult.innerHTML = '<div class="order-line">メニューを選択してください。</div>';
        return;
    }

    const coffeeBox = selectedCoffee.closest('.coffe-box');
    const coffeeLabel = coffeeBox.querySelector('h3')?.dataset.en;
    const coffeeLabelJp = coffeeBox.querySelector('h3')?.textContent.trim();
    const temperature = document.querySelector('.hot-radio input:checked')?.value;
    const size = document.querySelector('.size-radio input:checked')?.value?.toUpperCase();
    const quantity = parseInt(quantityInput.value, 10);
    const name = getCustomerName();
    const group = groupSelect.value;

    if (!name || !group) {
        orderResult.innerHTML = '<div class="order-line">注文者情報を入力してください。</div>';
        return;
    }

    const priceElement = coffeeBox.querySelector('.Price');
    const pricePerCup = parseInt(priceElement.dataset[`price${size.toLowerCase()}`], 10);
    const totalPrice = pricePerCup * quantity;

    const orderData = {
        today: firebaseDate,
        coffee: coffeeLabel,
        coffeeJp: coffeeLabelJp,
        size,
        temperature,
        quantity,
        price: totalPrice,
        name,
        group,
        timestamp: Date.now()
    };

    // ✅ Firebase 저장
    database.ref(`orders/${firebaseDate}`).push(orderData)
        .then(() => {
            // ✅ 버튼 텍스트 변경
            orderBtn.textContent = '注文追加';

            // ✅ 처음 주문일 경우 기존 안내 메시지 제거 + 타이틀 추가
            if (orderResult.textContent.includes('ご注文ください') ||
            orderResult.textContent.includes('選択してください') ||
            orderResult.textContent.includes('入力してください')) {
                
            orderResult.innerHTML = ''; // 초기화
                
              const title = document.createElement('div');
              title.className = 'order-title';
              title.textContent = '🧾 注文リスト';
              orderResult.appendChild(title);
            }

            // ✅ 주문 내용 누적 표시
            const orderLine = document.createElement('div');
            orderLine.className = 'order-line';
            orderLine.textContent = `✅ ${name}様（${coffeeLabelJp} ${size}, ${temperature}, ${quantity}杯）`;
            orderResult.appendChild(orderLine);
        })
        .catch(err => {
            console.error("注文送信エラー:", err);
            orderResult.innerHTML = '<div class="order-line">注文送信に失敗しました。もう一度お試しください。</div>';
        });
});
