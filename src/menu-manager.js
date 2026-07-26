"use strict";

document.addEventListener("DOMContentLoaded", function () {
  const database = window.database;
  const menusRef = database.ref("menus");

  const form = document.getElementById("menuForm");
  const menuId = document.getElementById("menuId");

  const menuName = document.getElementById("menuName");
  const menuNameEn = document.getElementById("menuNameEn");
  const menuPriceR = document.getElementById("menuPriceR");
  const menuPriceL = document.getElementById("menuPriceL");

  const menuHot = document.getElementById("menuHot");
  const menuCold = document.getElementById("menuCold");

  const menuHotSizeR = document.getElementById("menuHotSizeR");
  const menuHotSizeL = document.getElementById("menuHotSizeL");

  const menuColdSizeR = document.getElementById("menuColdSizeR");
  const menuColdSizeL = document.getElementById("menuColdSizeL");

  const menuActive = document.getElementById("menuActive");

  const menuSaveBtn = document.getElementById("menuSaveBtn");
  const menuCancelBtn = document.getElementById("menuCancelBtn");

  const menuMessage = document.getElementById("menuMessage");
  const menuList = document.getElementById("menuList");

  // 입력창 초기화
  function resetForm() {
    form.reset();

    menuId.value = "";

    menuHot.checked = true;
    menuCold.checked = true;

    menuHotSizeR.checked = true;
    menuHotSizeL.checked = true;

    menuColdSizeR.checked = true;
    menuColdSizeL.checked = true;

    menuActive.checked = true;

    menuSaveBtn.textContent = "登録";
    menuCancelBtn.hidden = true;
  }

  // 메뉴 등록 또는 수정
  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!menuHot.checked && !menuCold.checked) {
      menuMessage.textContent = "HOT または COLD を選択してください。";

      return;
    }

    if (menuHot.checked && !menuHotSizeR.checked && !menuHotSizeL.checked) {
      menuMessage.textContent = "HOTのサイズを選択してください。";
      return;
    }

    if (menuCold.checked && !menuColdSizeR.checked && !menuColdSizeL.checked) {
      menuMessage.textContent = "COLDのサイズを選択してください。";
      return;
    }

    const menuData = {
      nameJp: menuName.value.trim(),
      nameEn: menuNameEn.value.trim(),

      priceR: Number(menuPriceR.value),
      priceL: Number(menuPriceL.value),

      hotEnabled: menuHot.checked,
      coldEnabled: menuCold.checked,

      hotSizeR: menuHot.checked && menuHotSizeR.checked,
      hotSizeL: menuHot.checked && menuHotSizeL.checked,

      coldSizeR: menuCold.checked && menuColdSizeR.checked,
      coldSizeL: menuCold.checked && menuColdSizeL.checked,

      active: menuActive.checked,

      updatedAt: Date.now(),
    };

    const id = menuId.value;

    let saveRequest;

    if (id) {
      saveRequest = menusRef.child(id).update(menuData);
    } else {
      saveRequest = menusRef.push(menuData);
    }

    saveRequest
      .then(function () {
        if (id) {
          menuMessage.textContent = "メニューを修正しました。";
        } else {
          menuMessage.textContent = "メニューを登録しました。";
        }

        resetForm();
      })
      .catch(function (error) {
        console.error("メニュー保存エラー:", error);

        menuMessage.textContent = "保存に失敗しました。";
      });
  });

  // 수정 취소
  menuCancelBtn.addEventListener("click", function () {
    resetForm();
    menuMessage.textContent = "";
  });

  // 수정 또는 삭제 버튼
  menuList.addEventListener("click", function (event) {
    const button = event.target.closest("button[data-id]");

    if (!button) {
      return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    // 수정
    if (action === "edit") {
      menusRef
        .child(id)
        .once("value")
        .then(function (snapshot) {
          const menu = snapshot.val();

          if (!menu) {
            return;
          }

          menuId.value = id;

          menuName.value = menu.nameJp || "";
          menuNameEn.value = menu.nameEn || "";

          menuPriceR.value = menu.priceR || 0;
          menuPriceL.value = menu.priceL || 0;

          menuHot.checked = menu.hotEnabled === true;

          menuCold.checked = menu.coldEnabled === true;

          menuHotSizeR.checked =
            menu.hotSizeR !== undefined
              ? menu.hotSizeR === true
              : menu.sizeR === true;

          menuHotSizeL.checked =
            menu.hotSizeL !== undefined
              ? menu.hotSizeL === true
              : menu.sizeL === true;

          menuColdSizeR.checked =
            menu.coldSizeR !== undefined
              ? menu.coldSizeR === true
              : menu.sizeR === true;

          menuColdSizeL.checked =
            menu.coldSizeL !== undefined
              ? menu.coldSizeL === true
              : menu.sizeL === true;

          menuActive.checked = menu.active !== false;

          menuSaveBtn.textContent = "修正";
          menuCancelBtn.hidden = false;

          menuMessage.textContent = "修正する内容を入力してください。";

          form.scrollIntoView({
            behavior: "smooth",
          });
        });
    }

    // 삭제
    if (action === "delete") {
      const ok = window.confirm("このメニューを削除しますか？");

      if (!ok) {
        return;
      }

      menusRef
        .child(id)
        .remove()
        .catch(function (error) {
          console.error("メニュー削除エラー:", error);

          menuMessage.textContent = "削除に失敗しました。";
        });
    }
  });

  // Firebase 메뉴 목록 표시
  menusRef.on(
    "value",
    function (snapshot) {
      const menus = snapshot.val() || {};
      const entries = Object.entries(menus);

      if (entries.length === 0) {
        menuList.innerHTML = "<p>登録されたメニューはありません。</p>";

        return;
      }

      menuList.innerHTML = entries
        .map(function ([id, menu]) {
          const optionList = [];

          const hotSizeR =
            menu.hotSizeR !== undefined ? menu.hotSizeR : menu.sizeR;

          const hotSizeL =
            menu.hotSizeL !== undefined ? menu.hotSizeL : menu.sizeL;

          const coldSizeR =
            menu.coldSizeR !== undefined ? menu.coldSizeR : menu.sizeR;

          const coldSizeL =
            menu.coldSizeL !== undefined ? menu.coldSizeL : menu.sizeL;

          if (menu.hotEnabled) {
            const hotSizes = [];

            if (hotSizeR) {
              hotSizes.push(
                "R " + Number(menu.priceR || 0).toLocaleString() + "円"
              );
            }

            if (hotSizeL) {
              hotSizes.push(
                "L " + Number(menu.priceL || 0).toLocaleString() + "円"
              );
            }

            optionList.push("HOT：" + hotSizes.join(" / "));
          }

          if (menu.coldEnabled) {
            const coldSizes = [];

            if (coldSizeR) {
              coldSizes.push(
                "R " + Number(menu.priceR || 0).toLocaleString() + "円"
              );
            }

            if (coldSizeL) {
              coldSizes.push(
                "L " + Number(menu.priceL || 0).toLocaleString() + "円"
              );
            }

            optionList.push("COLD：" + coldSizes.join(" / "));
          }

          return `
                    <div class="menu-list-item
                        ${menu.active === false ? "menu-stop" : ""}">

                        <div class="menu-list-info">

                            <h3>
                              ${menu.nameJp || ""}
                              <small>${menu.nameEn || ""}</small>
                            </h3>

                            <p>
                                ${optionList.join("<br>")}
                            </p>

                            <span>
                                ${menu.active === false ? "販売停止" : "販売中"}
                            </span>

                        </div>

                        <div class="menu-list-buttons">

                            <button
                                type="button"
                                data-action="edit"
                                data-id="${id}"
                            >
                                修正
                            </button>

                            <button
                                type="button"
                                data-action="delete"
                                data-id="${id}"
                            >
                                削除
                            </button>

                        </div>
                    </div>
                `;
        })
        .join("");
    },
    function (error) {
      console.error("メニュー読込エラー:", error);

      menuList.innerHTML = "<p>メニューの読み込みに失敗しました。</p>";
    }
  );
});
