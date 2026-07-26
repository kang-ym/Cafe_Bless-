"use strict";

const database = window.database;

// ✅ 요소 정의
const menuContainer = document.querySelector(".select-box");

let coffeeRadios = [];
let imgBoxes = [];
let menuMap = {};
const orderBtn = document.querySelector(".order-btn");
const orderResult = document.getElementById("orderResult");
const hotRadios = document.querySelectorAll(".hot-radio input");
const sizeRadios = document.querySelectorAll(".size-radio input");
const quantityInput = document.getElementById("coffeeQuantity");
const groupSelect = document.getElementById("group");
const nameBox = document.getElementById("nameBox");

// ✅ 날짜 처리
const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, "0");
const date = String(today.getDate()).padStart(2, "0");
const firebaseDate = `${year}_${month}_${date}`;
const displayDate = `${year}.${month}.${date}`;
document.getElementById("getdate").textContent = displayDate;

//✅ 주문완료 팝업
function showPopup(message) {
  const overlay = document.getElementById("popupOverlay");
  const popup = document.getElementById("popupMessage");

  popup.textContent = message;
  overlay.classList.add("show");
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
    overlay.classList.remove("show");
  }, 3000);
}

// ✅ 커피 선택 시 강조 효과 적용 및 hot/cold 조건 처리
function updateCoffeeSelection() {
  coffeeRadios.forEach((radio, index) => {
    if (!imgBoxes[index]) return;

    imgBoxes[index].style.boxShadow = radio.checked
      ? "0 0 15px var(--color-accent)"
      : "3px 3px 10px var(--color-text)";
  });

  updateHotRadioAvailability();
  updateSizeSelection();
}

// ✅ 선택한 메뉴의 Firebase 설정에 따라 HOT/COLD 및 사이즈 표시
function updateHotRadioAvailability() {
  const selectedCoffeeId = document.querySelector(
    '.coffe-box input[type="radio"]:checked'
  )?.value;

  const selectedMenu = menuMap[selectedCoffeeId];
  if (!selectedMenu) return;

  const hotInput = document.querySelector('.hot-radio input[value="hot"]');
  const coldInput = document.querySelector('.hot-radio input[value="cold"]');

  const hotBlock = document.querySelector(".hot-block");
  const coldBlock = document.querySelector(".cold-block");

  const regularOption = document.getElementById("regularOption");
  const largeOption = document.getElementById("largeOption");

  const regularBlock = document.querySelector(".R-block");
  const largeBlock = document.querySelector(".L-block");

  // Firebase boolean 값
  const hotEnabled = selectedMenu.hotEnabled === true;
  const coldEnabled = selectedMenu.coldEnabled === true;

  // HOT / COLD 활성화 여부
  hotInput.disabled = !hotEnabled;
  coldInput.disabled = !coldEnabled;

  // HOT / COLD 화면 표시 여부
  if (hotBlock) {
    hotBlock.style.display = hotEnabled ? "" : "none";
  }

  if (coldBlock) {
    coldBlock.style.display = coldEnabled ? "" : "none";
  }

  // 현재 선택된 온도가 사용할 수 없으면 가능한 온도로 자동 변경
  if (hotInput.checked && !hotEnabled && coldEnabled) {
    coldInput.checked = true;
  } else if (coldInput.checked && !coldEnabled && hotEnabled) {
    hotInput.checked = true;
  } else if (!hotInput.checked && !coldInput.checked) {
    if (hotEnabled) {
      hotInput.checked = true;
    } else if (coldEnabled) {
      coldInput.checked = true;
    }
  }

  const selectedTemperature = document.querySelector(
    ".hot-radio input:checked"
  )?.value;

  let regularEnabled = false;
  let largeEnabled = false;

  // 선택된 온도에 따라 R / L 사이즈 확인
  if (selectedTemperature === "hot") {
    regularEnabled = selectedMenu.hotSizeR === true;
    largeEnabled = selectedMenu.hotSizeL === true;
  } else if (selectedTemperature === "cold") {
    regularEnabled = selectedMenu.coldSizeR === true;
    largeEnabled = selectedMenu.coldSizeL === true;
  }

  regularOption.disabled = !regularEnabled;
  largeOption.disabled = !largeEnabled;

  // R / L 화면 표시 여부
  if (regularBlock) {
    regularBlock.style.display = regularEnabled ? "" : "none";
  }

  if (largeBlock) {
    largeBlock.style.display = largeEnabled ? "" : "none";
  }

  // 선택된 사이즈가 사용할 수 없으면 가능한 사이즈로 자동 변경
  if (regularOption.checked && !regularEnabled && largeEnabled) {
    largeOption.checked = true;
  } else if (largeOption.checked && !largeEnabled && regularEnabled) {
    regularOption.checked = true;
  } else if (!regularOption.checked && !largeOption.checked) {
    if (regularEnabled) {
      regularOption.checked = true;
    } else if (largeEnabled) {
      largeOption.checked = true;
    }
  }

  updateHotColdSelection();
  updateSizeSelection();
}

// ✅ 온도 및 사이즈 버튼 활성화 스타일 처리 (🔥 슬라이드 + 간격제어 포함)
function updateHotColdSelection() {
  const hotBlock = document.querySelector(".hot-block");
  const coldBlock = document.querySelector(".cold-block");

  // 모두 초기화
  hotBlock.classList.remove("active");
  coldBlock.classList.remove("active");

  const selected = document.querySelector(".hot-radio input:checked");
  if (selected) {
    if (selected.value === "hot") {
      hotBlock.classList.add("active");
    } else {
      coldBlock.classList.add("active");
    }
  }
}
hotRadios.forEach((radio) =>
  radio.addEventListener("change", () => {
    updateHotColdSelection();
    updateHotRadioAvailability(); // 🔁 온도 변경 시 사이즈 제한/복구 동기화
  })
);
updateHotColdSelection();

// ✅ 사이즈 버튼 스타일 처리
function updateSizeSelection() {
  document
    .querySelectorAll(".size-radio label")
    .forEach((label) => label.classList.remove("active"));
  const selected = document.querySelector(".size-radio input:checked");
  if (selected) selected.nextElementSibling.classList.add("active");
}
sizeRadios.forEach((radio) =>
  radio.addEventListener("change", updateSizeSelection)
);
updateSizeSelection();

// ✅ 현재 선택된 고객 이름 가져오기 (게스트는 input, 일반 그룹은 select)
function getCustomerName() {
  const group = groupSelect.value;
  if (!group) return null;
  if (group === "guest") {
    const input = document.querySelector("#nameBox input");
    return input?.value?.trim() || null;
  } else {
    const select = document.querySelector("#nameBox select");
    return select?.value || null;
  }
}

// ✅ 그룹 선택 시 이름 목록 업데이트
// 1. ledgerNames/{group} 에 있는 일반 이름은 그대로 표시
// 2. nameAlias 안에서 해당 그룹 대표이름이 ledgerNames 안에 존재하면 해당 별칭 키도 포함
// 3. 단, ledgerNames에 등록된 그룹 대표이름(예: 민아영민, 테스트가족)은 표시하지 않음

groupSelect.addEventListener("change", () => {
  const group = groupSelect.value;
  nameBox.innerHTML = "";
  const nameBoxWrapper = nameBox.parentElement; // .name-box

  // 그룹이 선택되지 않았을 때 → 가운데 정렬 유지
  if (!group) {
    nameBoxWrapper.classList.remove("has-name");
    return;
  }

  // 게스트 그룹 → input
  if (group === "guest") {
    nameBox.innerHTML = `<input type="text" placeholder="名前を入力">`;
    nameBoxWrapper.classList.add("has-name"); // ✅ 클래스 추가
    return;
  }

  // 일반 그룹 → select 생성
  Promise.all([
    database.ref(`ledgerNames/${group}`).once("value"),
    database.ref(`nameAlias`).once("value"),
  ]).then(([ledgerSnap, aliasSnap]) => {
    const ledgerData = ledgerSnap.val() || {};
    const aliasData = aliasSnap.val() || {};

    const aliasGroupNames = new Set(Object.values(aliasData));
    const select = document.createElement("select");
    select.innerHTML = `<option value="">名前を選択</option>`;

    // 1. 일반 이름 표시 (그룹 대표이름 제외)
    Object.keys(ledgerData).forEach((name) => {
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
    nameBoxWrapper.classList.add("has-name");
  });
});

// ✅ 주문 버튼 클릭 처리 → Firebase에 orders 저장
orderBtn.addEventListener("click", () => {
  const selectedCoffee = document.querySelector(
    '.coffe-box input[type="radio"]:checked'
  );
  if (!selectedCoffee) {
    orderResult.innerHTML =
      '<div class="order-line">メニューを選択してください。</div>';
    return;
  }

  const selectedMenu = menuMap[selectedCoffee.value];

  const coffeeLabel = selectedMenu.nameEn;
  const coffeeLabelJp = selectedMenu.nameJp;
  const temperature = document.querySelector(".hot-radio input:checked")?.value;
  const size = document
    .querySelector(".size-radio input:checked")
    ?.value?.toUpperCase();
  const quantity = parseInt(quantityInput.value, 10);
  const name = getCustomerName();
  const group = groupSelect.value;

  if (!name || !group) {
    orderResult.innerHTML =
      '<div class="order-line">注文者情報を入力してください。</div>';
    return;
  }

  const pricePerCup = size === "L" ? selectedMenu.priceL : selectedMenu.priceR;
  const totalPrice = pricePerCup * quantity;

  const orderData = {
    today: firebaseDate,
    menuId: selectedCoffee.value,
    coffee: coffeeLabel,
    coffeeJp: coffeeLabelJp,
    size,
    temperature,
    quantity,
    price: totalPrice,
    name, // 선택된 실제 이름 그대로 저장 (예: 트다, 김예희 등)
    group,
    timestamp: Date.now(),
  };

  database
    .ref(`orders/${firebaseDate}`)
    .push(orderData)
    .then(() => {
      orderBtn.textContent = "注文追加";

      // ✅ 팝업 표시
      showPopup("注文が正常に処理されました。");

      if (
        orderResult.textContent.includes("ご注文ください") ||
        orderResult.textContent.includes("選択してください") ||
        orderResult.textContent.includes("入力してください")
      ) {
        orderResult.innerHTML = "";
        const title = document.createElement("div");
        title.className = "order-title";
        title.textContent = "🧾 注文リスト";
        orderResult.appendChild(title);
      }

      const orderLine = document.createElement("div");
      orderLine.className = "order-line";
      orderLine.textContent = `✅ ${name}様（${coffeeLabelJp} ${size}, ${temperature}, ${quantity}杯）`;
      orderResult.appendChild(orderLine);
    })
    .catch((err) => {
      console.error("注文送信エラー:", err);
      orderResult.innerHTML =
        '<div class="order-line">注文送信に失敗しました。もう一度お試しください。</div>';
    });
});

function getMenuImage(menu) {
  if (menu.imageUrl) {
    return menu.imageUrl;
  }

  const imageMap = {
    Americano: "./img/1.webp",
    Latte: "./img/2.webp",
    "Vanilla Latte": "./img/3.webp",
    "Caramel Latte": "./img/4.webp",
    Cocoa: "./img/4.webp",
  };

  return imageMap[menu.nameEn] || "./img/1.webp";
}

function renderMenus(menuData) {
  menuContainer.innerHTML = "";
  menuMap = {};

  const entries = Object.entries(menuData || {}).filter(function ([, menu]) {
    return menu && menu.active !== false;
  });

  if (entries.length === 0) {
    menuContainer.innerHTML =
      '<p class="menu-loading">現在注文できるメニューがありません。</p>';
    return;
  }

  entries.forEach(function ([id, menu], index) {
    menuMap[id] = menu;

    const menuBox = document.createElement("div");
    menuBox.className = "coffe-box";

    menuBox.innerHTML = `
        <input
          type="radio"
          name="coffee"
          value="${id}"
          id="menu-${id}"
          ${index === 0 ? "checked" : ""}
        >
  
        <label for="menu-${id}">
          <div class="img-box">
            <h3 data-en="${menu.nameEn || ""}">
              <span class="custom-check"></span>
              ${menu.nameJp || ""}
            </h3>
  
            <img
              src="${getMenuImage(menu)}"
              alt="${menu.nameJp || ""}"
            >
          </div>
        </label>
  
        <p class="Price">
          L : ${Number(menu.priceL || 0).toLocaleString()}円
          R : ${Number(menu.priceR || 0).toLocaleString()}円
        </p>
      `;

    menuContainer.appendChild(menuBox);
  });

  coffeeRadios = Array.from(
    document.querySelectorAll('.coffe-box input[type="radio"]')
  );

  imgBoxes = Array.from(document.querySelectorAll(".coffe-box .img-box"));

  coffeeRadios.forEach(function (radio) {
    radio.addEventListener("change", updateCoffeeSelection);
  });

  updateCoffeeSelection();
}

function loadMenus() {
  // Firebase에서 메뉴를 가져오는 동안 표시
  menuContainer.innerHTML =
    '<p class="menu-loading">メニューを読み込んでいます。</p>';

  database
    .ref("menus")
    .once("value")
    .then((snapshot) => {
      renderMenus(snapshot.val());
    })
    .catch((error) => {
      console.error("メニュー取得エラー:", error);

      // 실제로 불러오기에 실패했을 때만 표시
      menuContainer.innerHTML =
        '<p class="menu-loading">メニューの読み込みに失敗しました。</p>';
    });
}

loadMenus();
