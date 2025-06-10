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

// ✅ 커피 선택 시 강조 효과 적용 및 hot/cold 조건 처리
function updateCoffeeSelection() {
    coffeeRadios.forEach((radio, index) => {
        imgBoxes[index].style.boxShadow = radio.checked
            ? '0 0 15px var(--color-accent)'
            : '3px 3px 10px var(--color-text)';
    });
    updateHotRadioAvailability();
}

// ✅ 여름 계절용 제한: 아메리카노 외에는 hot 선택 불가
function updateHotRadioAvailability() {
    const selectedCoffee = document.querySelector('.coffe-box input[type="radio"]:checked')?.value;
    const hotInput = document.querySelector('.hot-radio input[value="hot"]');
    const hotLabel = hotInput.nextElementSibling;
    const coldInput = document.querySelector('.hot-radio input[value="cold"]');
    const coldLabel = coldInput.nextElementSibling;

    if (selectedCoffee && selectedCoffee !== 'americano') {
        hotInput.style.display = 'none';
        hotLabel.style.display = 'none';
        coldInput.checked = true;
        updateHotColdSelection();
    } else {
        hotInput.style.display = '';
        hotLabel.style.display = '';
    }
}

coffeeRadios.forEach(radio => radio.addEventListener('change', updateCoffeeSelection));
updateCoffeeSelection();

// ✅ 온도 및 사이즈 버튼 활성화 스타일 처리
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

// ✅ 현재 선택된 고객 이름 가져오기 (게스트는 input, 일반 그룹은 select)
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

// ✅ 그룹 선택 시 이름 목록 업데이트
// 1. ledgerNames/{group} 에 있는 일반 이름은 그대로 표시
// 2. nameAlias 안에서 해당 그룹 대표이름이 ledgerNames 안에 존재하면 해당 별칭 키도 포함
// 3. 단, ledgerNames에 등록된 그룹 대표이름(예: 민아영민, 테스트가족)은 표시하지 않음

groupSelect.addEventListener('change', () => {
    const group = groupSelect.value;
    nameBox.innerHTML = '';
    const nameBoxWrapper = nameBox.parentElement; // .name-box

    // 그룹이 선택되지 않았을 때 → 가운데 정렬 유지
    if (!group) {
        nameBoxWrapper.classList.remove('has-name');
        return;
    }

    // 게스트 그룹 → input
    if (group === 'guest') {
        nameBox.innerHTML = `<input type="text" placeholder="名前を入力">`;
        nameBoxWrapper.classList.add('has-name'); // ✅ 클래스 추가
        return;
    }

    // 일반 그룹 → select 생성
    Promise.all([
        database.ref(`ledgerNames/${group}`).once('value'),
        database.ref(`nameAlias`).once('value')
    ]).then(([ledgerSnap, aliasSnap]) => {
        const ledgerData = ledgerSnap.val() || {};
        const aliasData = aliasSnap.val() || {};

        const aliasGroupNames = new Set(Object.values(aliasData));
        const select = document.createElement('select');
        select.innerHTML = `<option value="">名前を選択</option>`;

        // 1. 일반 이름 표시 (그룹 대표이름 제외)
        Object.keys(ledgerData).forEach(name => {
            if (!aliasGroupNames.has(name)) {
                select.innerHTML += `<option value="${name}">${name}</option>`;
            }
        });

        // 2. alias 이름도 추가
        Object.entries(aliasData).forEach(([aliasName, aliasGroupName]) => {
            if (ledgerData[aliasGroupName]) {
                select.innerHTML += `<option value="${aliasName}">${aliasName}</option>`;
            }
        });

        nameBox.appendChild(select);

        // ✅ 클래스 추가 (이름 선택창이 생겼으므로)
        nameBoxWrapper.classList.add('has-name');
    });
});


// ✅ 주문 버튼 클릭 처리 → Firebase에 orders 저장
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
        name,  // 선택된 실제 이름 그대로 저장 (예: 트다, 김예희 등)
        group,
        timestamp: Date.now()
    };

    database.ref(`orders/${firebaseDate}`).push(orderData)
        .then(() => {
            orderBtn.textContent = '注文追加';

            if (orderResult.textContent.includes('ご注文ください') ||
                orderResult.textContent.includes('選択してください') ||
                orderResult.textContent.includes('入力してください')) {
                orderResult.innerHTML = '';
                const title = document.createElement('div');
                title.className = 'order-title';
                title.textContent = '🧾 注文リスト';
                orderResult.appendChild(title);
            }

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