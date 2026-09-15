"use strict";

/*
|--------------------------------------------------------------------------
| KIRANA STOREFRONT — APP.JS
|--------------------------------------------------------------------------
| Product data:
|   ./products.json
|
| JS does NOT contain any product data.
|
| Pricing:
|   - Packed / fixed items → price from products.json
|   - Loose / by-weight items → "Price at Counter"
|
| Orders:
|   - No database
|   - No customer storage
|   - Order assembled locally
|   - Sent to WhatsApp
|--------------------------------------------------------------------------
*/

const STORE = {
  name: "YOUR KIRANA STORE",
  address: "YOUR SHOP ADDRESS",

  // Replace with your actual WhatsApp number.
  // Country code + number, without + or spaces.
  whatsapp: "918053946066",

  pickupStartHour: 8,
  pickupEndHour: 22,
  pickupIntervalMinutes: 60
};

const state = {
  products: [],
  cart: [],
  activeCategory: "All",
  searchTerm: "",
  lastOrder: null
};

const elements = {};

document.addEventListener("DOMContentLoaded", init);


/* ==========================================================================
   INIT
   ========================================================================== */

async function init() {
  cacheElements();
  applyStoreInformation();
  createPickupSlots();
  bindEvents();

  try {
    await loadProducts();

    renderCategories();
    renderProducts();
    renderCart();

  } catch (error) {
    showProductLoadingError(error);
  }
}


/* ==========================================================================
   DOM CACHE
   ========================================================================== */

function cacheElements() {
  elements.shopName = document.getElementById("shopName");
  elements.footerShopName = document.getElementById("footerShopName");
  elements.footerAddress = document.getElementById("footerAddress");

  elements.productGrid = document.getElementById("productGrid");
  elements.productCount = document.getElementById("productCount");
  elements.categoryList = document.getElementById("categoryList");
  elements.emptyState = document.getElementById("emptyState");

  elements.searchInput = document.getElementById("searchInput");
  elements.clearSearch = document.getElementById("clearSearch");
  elements.resetFilters = document.getElementById("resetFilters");

  elements.headerCartButton =
    document.getElementById("headerCartButton");

  elements.cartCount =
    document.getElementById("cartCount");

  elements.cartOverlay =
    document.getElementById("cartOverlay");

  elements.cartDrawer =
    document.getElementById("cartDrawer");

  elements.closeCart =
    document.getElementById("closeCart");

  elements.cartItems =
    document.getElementById("cartItems");

  elements.cartEmpty =
    document.getElementById("cartEmpty");

  elements.cartSummary =
    document.getElementById("cartSummary");

  elements.summaryItems =
    document.getElementById("summaryItems");

  elements.summaryTotal =
    document.getElementById("summaryTotal");

  elements.checkoutButton =
    document.getElementById("checkoutButton");

  elements.checkoutModal =
    document.getElementById("checkoutModal");

  elements.closeCheckout =
    document.getElementById("closeCheckout");

  elements.checkoutForm =
    document.getElementById("checkoutForm");

  elements.pickupSlot =
    document.getElementById("pickupSlot");

  elements.checkoutTotal =
    document.getElementById("checkoutTotal");

  elements.nameError =
    document.getElementById("nameError");

  elements.phoneError =
    document.getElementById("phoneError");

  elements.slotError =
    document.getElementById("slotError");

  elements.confirmationModal =
    document.getElementById("confirmationModal");

  elements.confirmationOrderNumber =
    document.getElementById("confirmationOrderNumber");

  elements.confirmationDetails =
    document.getElementById("confirmationDetails");

  elements.qrCode =
    document.getElementById("qrCode");

  elements.sendAgainButton =
    document.getElementById("sendAgainButton");

  elements.finishButton =
    document.getElementById("finishButton");
}


/* ==========================================================================
   STORE INFORMATION
   ========================================================================== */

function applyStoreInformation() {
  if (elements.shopName) {
    elements.shopName.textContent = STORE.name;
  }

  if (elements.footerShopName) {
    elements.footerShopName.textContent = STORE.name;
  }

  if (elements.footerAddress) {
    elements.footerAddress.textContent = STORE.address;
  }
}


/* ==========================================================================
   PRODUCTS — ONLY FROM products.json
   ========================================================================== */

async function loadProducts() {
  const response = await fetch("./products.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not load products.json");
  }

  const data = await response.json();

  if (!data || !Array.isArray(data.products)) {
    throw new Error("products.json has an invalid format.");
  }

  state.products = data.products
    .filter(product => product && product.active === true)
    .map(normalizeProduct);
}


function normalizeProduct(product) {
  return {
    id: String(product.id),

    name: String(product.name),

    category: String(
      product.category || "Other"
    ),

    image: product.image
      ? String(product.image)
      : "",

    price:
      product.price === null ||
      product.price === undefined ||
      product.price === ""
        ? null
        : Number(product.price),

    unit: String(
      product.unit || "pack"
    ),

    pricingType:
      product.pricingType === "by-weight"
        ? "by-weight"
        : "fixed",

    weightOptions:
      Array.isArray(product.weightOptions)
        ? product.weightOptions
            .map(Number)
            .filter(Number.isFinite)
        : []
  };
}


function showProductLoadingError(error) {
  console.error(error);

  elements.productGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⚠️</div>

      <h3>Products could not be loaded</h3>

      <p>
        Please make sure
        <strong>products.json</strong>
        is available in the same folder as this page.
      </p>
    </div>
  `;
}


/* ==========================================================================
   EVENTS
   ========================================================================== */

function bindEvents() {
  elements.headerCartButton.addEventListener(
    "click",
    openCart
  );

  elements.closeCart.addEventListener(
    "click",
    closeCart
  );

  elements.cartOverlay.addEventListener(
    "click",
    closeCart
  );


  /* Search */

  elements.searchInput.addEventListener(
    "input",
    event => {
      state.searchTerm =
        event.target.value
          .trim()
          .toLowerCase();

      elements.clearSearch.style.display =
        state.searchTerm
          ? "grid"
          : "none";

      renderProducts();
    }
  );


  /* Clear search */

  elements.clearSearch.addEventListener(
    "click",
    () => {
      state.searchTerm = "";

      elements.searchInput.value = "";

      elements.clearSearch.style.display =
        "none";

      renderProducts();
    }
  );


  /* Reset filters */

  elements.resetFilters.addEventListener(
    "click",
    () => {
      state.searchTerm = "";
      state.activeCategory = "All";

      elements.searchInput.value = "";

      elements.clearSearch.style.display =
        "none";

      renderCategories();
      renderProducts();
    }
  );


  /* Checkout */

  elements.checkoutButton.addEventListener(
    "click",
    openCheckout
  );

  elements.closeCheckout.addEventListener(
    "click",
    closeCheckout
  );


  document
    .querySelectorAll("[data-close-checkout]")
    .forEach(backdrop => {
      backdrop.addEventListener(
        "click",
        closeCheckout
      );
    });


  elements.checkoutForm.addEventListener(
    "submit",
    handleCheckout
  );


  /* Send again */

  elements.sendAgainButton.addEventListener(
    "click",
    () => {
      if (state.lastOrder) {
        sendWhatsAppOrder(
          state.lastOrder
        );
      }
    }
  );


  /* Finish */

  elements.finishButton.addEventListener(
    "click",
    finishOrder
  );


  /* Escape */

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeCheckout();
        closeCart();
      }
    }
  );
}


/* ==========================================================================
   CATEGORIES
   ========================================================================== */

function renderCategories() {
  const categories = [
    "All",
    ...new Set(
      state.products.map(
        product => product.category
      )
    )
  ];

  elements.categoryList.innerHTML =
    categories
      .map(category => `
        <button
          type="button"
          class="category-button ${
            category === state.activeCategory
              ? "active"
              : ""
          }"
          data-category="${escapeHtml(category)}"
        >
          ${escapeHtml(category)}
        </button>
      `)
      .join("");


  elements.categoryList
    .querySelectorAll("[data-category]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          state.activeCategory =
            button.dataset.category;

          renderCategories();
          renderProducts();
        }
      );

    });
}


/* ==========================================================================
   FILTERING
   ========================================================================== */

function getFilteredProducts() {
  return state.products.filter(product => {

    const categoryMatches =
      state.activeCategory === "All" ||
      product.category ===
        state.activeCategory;


    const searchMatches =
      !state.searchTerm ||

      product.name
        .toLowerCase()
        .includes(state.searchTerm) ||

      product.category
        .toLowerCase()
        .includes(state.searchTerm);


    return (
      categoryMatches &&
      searchMatches
    );
  });
}


/* ==========================================================================
   PRODUCTS UI
   ========================================================================== */

function renderProducts() {
  const products =
    getFilteredProducts();


  elements.productCount.textContent =
    `${products.length} ${
      products.length === 1
        ? "product"
        : "products"
    }`;


  if (!products.length) {

    elements.productGrid.innerHTML = "";

    elements.emptyState
      .classList
      .remove("hidden");

    return;
  }


  elements.emptyState
    .classList
    .add("hidden");


  elements.productGrid.innerHTML =
    products
      .map(renderProductCard)
      .join("");


  /* Packed products */

  elements.productGrid
    .querySelectorAll(
      "[data-add-fixed]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          addFixedProduct(
            button.dataset.addFixed,
            button
          );
        }
      );

    });


  /* Loose products */

  elements.productGrid
    .querySelectorAll(
      "[data-weight-product]"
    )
    .forEach(select => {

      select.addEventListener(
        "change",
        event => {

          const productId =
            event.target
              .dataset
              .weightProduct;

          const weight =
            Number(
              event.target.value
            );


          if (weight > 0) {

            addWeightedProduct(
              productId,
              weight,
              event.target
            );

            event.target.value = "";
          }

        }
      );

    });
}


/* ==========================================================================
   PRODUCT CARD
   ========================================================================== */

function renderProductCard(product) {

  const visualContent =
    product.image
      ? `
        <img
          src="${escapeHtml(product.image)}"
          alt="${escapeHtml(product.name)}"
          class="product-image"
          loading="lazy"
        />
      `
      : getCategoryIcon(
          product.category
        );


  /*
   * Loose / weight products
   *
   * IMPORTANT:
   * No price is shown online.
   */

  if (
    product.pricingType === "by-weight"
  ) {

    return `
      <article class="product-card">

        <div class="product-visual">
          ${visualContent}
        </div>

        <div class="product-category">
          ${escapeHtml(product.category)}
        </div>

        <h3 class="product-name">
          ${escapeHtml(product.name)}
        </h3>

        <div class="product-unit">
          Sold by weight
        </div>

        <div class="product-price">
          Price at Counter
        </div>

        <div class="product-actions weight-controls">

          <select
            class="weight-select"
            data-weight-product="${escapeHtml(product.id)}"
            aria-label="Choose quantity for ${escapeHtml(product.name)}"
          >

            <option value="">
              Choose quantity
            </option>

            ${
              product.weightOptions.length
                ? product.weightOptions
                    .map(weight => `
                      <option value="${weight}">
                        ${formatWeight(weight)}
                      </option>
                    `)
                    .join("")
                : `
                  <option value="" disabled>
                    Ask at counter
                  </option>
                `
            }

          </select>

          <div class="added-feedback"></div>

        </div>

      </article>
    `;
  }


  /*
   * Product without price
   *
   * This is also treated as counter-priced.
   */

  if (
    product.price === null ||
    !Number.isFinite(product.price)
  ) {

    return `
      <article class="product-card">

        <div class="product-visual">
          ${visualContent}
        </div>

        <div class="product-category">
          ${escapeHtml(product.category)}
        </div>

        <h3 class="product-name">
          ${escapeHtml(product.name)}
        </h3>

        <div class="product-unit">
          ${escapeHtml(product.unit)}
        </div>

        <div class="product-price">
          Price at Counter
        </div>

        <div class="product-actions">

          <div class="price-warning">
            Final price will be confirmed
            at the counter.
          </div>

        </div>

      </article>
    `;
  }


  /*
   * Packed / fixed-price product
   */

  return `
    <article class="product-card">

      <div class="product-visual">
        ${visualContent}
      </div>

      <div class="product-category">
        ${escapeHtml(product.category)}
      </div>

      <h3 class="product-name">
        ${escapeHtml(product.name)}
      </h3>

      <div class="product-unit">
        ${escapeHtml(product.unit)}
      </div>

      <div class="product-price">
        ₹${formatMoney(product.price)}
      </div>

      <div class="product-actions">

        <button
          class="add-button"
          type="button"
          data-add-fixed="${escapeHtml(product.id)}"
        >
          Add to cart
        </button>

      </div>

    </article>
  `;
}


/* ==========================================================================
   ADD PACKED PRODUCT
   ========================================================================== */

function addFixedProduct(
  productId,
  buttonElement
) {

  const product =
    findProduct(productId);


  if (
    !product ||
    product.price === null ||
    !Number.isFinite(product.price)
  ) {
    return;
  }


  const existing =
    state.cart.find(
      item =>
        item.productId === productId &&
        item.pricingType === "fixed"
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    state.cart.push({

      cartId: cryptoRandomId(),

      productId: product.id,

      name: product.name,

      category: product.category,

      pricingType: "fixed",

      quantity: 1,

      unit: product.unit,

      weightGrams: null,

      unitPrice:
        roundMoney(product.price)

    });

  }


  renderCart();


  if (buttonElement) {

    const originalText =
      buttonElement.textContent;

    buttonElement.textContent =
      "Added ✓";

    buttonElement.classList.add(
      "added-success"
    );

    buttonElement.disabled = true;


    setTimeout(() => {

      buttonElement.textContent =
        originalText;

      buttonElement.classList.remove(
        "added-success"
      );

      buttonElement.disabled = false;

    }, 1200);
  }
}


/* ==========================================================================
   ADD LOOSE / WEIGHT PRODUCT
   ========================================================================== */

function addWeightedProduct(
  productId,
  weightGrams,
  selectElement
) {

  const product =
    findProduct(productId);


  if (
    !product ||
    product.pricingType !== "by-weight"
  ) {
    return;
  }


  /*
   * IMPORTANT:
   * Loose items do NOT have an online price.
   */

  const existing =
    state.cart.find(
      item =>
        item.productId === productId &&
        item.pricingType === "by-weight" &&
        item.weightGrams === weightGrams
    );


  if (existing) {

    existing.quantity += 1;

  } else {

    state.cart.push({

      cartId: cryptoRandomId(),

      productId: product.id,

      name: product.name,

      category: product.category,

      pricingType: "by-weight",

      quantity: 1,

      unit: "weight",

      weightGrams,

      unitPrice: null

    });

  }


  renderCart();


  if (selectElement) {

    const parent =
      selectElement.parentElement;

    const feedback =
      parent.querySelector(
        ".added-feedback"
      );


    if (feedback) {

      feedback.textContent =
        "Added ✓";

      setTimeout(() => {

        feedback.textContent = "";

      }, 1400);
    }
  }
}


/* ==========================================================================
   FIND PRODUCT
   ========================================================================== */

function findProduct(productId) {
  return state.products.find(
    product =>
      product.id === productId
  );
}


/* ==========================================================================
   CART
   ========================================================================== */

function renderCart() {

  const totalItems =
    state.cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  elements.cartCount.textContent =
    totalItems;


  if (!state.cart.length) {

    elements.cartItems.innerHTML = "";

    elements.cartEmpty
      .classList
      .remove("hidden");

    elements.cartSummary
      .classList
      .add("hidden");

    return;
  }


  elements.cartEmpty
    .classList
    .add("hidden");

  elements.cartSummary
    .classList
    .remove("hidden");


  elements.cartItems.innerHTML =
    state.cart
      .map(renderCartItem)
      .join("");


  elements.cartItems
    .querySelectorAll(
      "[data-cart-action]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          updateCartItem(
            button.dataset.cartId,
            button.dataset.cartAction
          );

        }
      );

    });


  elements.summaryItems.textContent =
    totalItems;


  updateCartSummary();
}


/* ==========================================================================
   CART ITEM
   ========================================================================== */

function renderCartItem(item) {

  const isLoose =
    item.pricingType === "by-weight";


  const detail =
    isLoose
      ? `${formatWeight(item.weightGrams)} × ${item.quantity}`
      : `${item.unit} × ${item.quantity}`;


  const priceHTML =
    isLoose
      ? `
        <div class="cart-item-price counter-price">
          Price at Counter
        </div>
      `
      : `
        <div class="cart-item-price">
          ₹${formatMoney(
            item.unitPrice *
            item.quantity
          )}
        </div>
      `;


  return `
    <div class="cart-item">

      <div class="cart-item-icon">
        ${getCategoryIcon(item.category)}
      </div>

      <div>

        <div class="cart-item-name">
          ${escapeHtml(item.name)}
        </div>

        <div class="cart-item-detail">
          ${escapeHtml(detail)}
        </div>

        ${priceHTML}

        <div class="cart-qty">

          <button
            type="button"
            class="qty-button"
            data-cart-action="decrease"
            data-cart-id="${escapeHtml(item.cartId)}"
          >
            −
          </button>

          <span class="qty-value">
            ${item.quantity}
          </span>

          <button
            type="button"
            class="qty-button"
            data-cart-action="increase"
            data-cart-id="${escapeHtml(item.cartId)}"
          >
            +
          </button>

        </div>

      </div>

      <button
        type="button"
        class="remove-button"
        data-cart-action="remove"
        data-cart-id="${escapeHtml(item.cartId)}"
      >
        Remove
      </button>

    </div>
  `;
}


/* ==========================================================================
   CART ACTIONS
   ========================================================================== */

function updateCartItem(
  cartId,
  action
) {

  const index =
    state.cart.findIndex(
      item =>
        item.cartId === cartId
    );


  if (index === -1) {
    return;
  }


  const item =
    state.cart[index];


  if (action === "increase") {
    item.quantity += 1;
  }


  if (action === "decrease") {

    item.quantity -= 1;

    if (item.quantity <= 0) {
      state.cart.splice(index, 1);
    }
  }


  if (action === "remove") {
    state.cart.splice(index, 1);
  }


  renderCart();
}


/* ==========================================================================
   CART SUMMARY
   ========================================================================== */

function updateCartSummary() {

  const packedTotal =
    getPackedItemsTotal();

  const hasLooseItems =
    hasCounterPricedItems();


  if (hasLooseItems) {

    elements.summaryTotal.innerHTML = `
      ₹${formatMoney(packedTotal)}
      <small class="summary-counter-label">
        + loose items at counter
      </small>
    `;

  } else {

    elements.summaryTotal.textContent =
      `₹${formatMoney(packedTotal)}`;
  }
}


/*
 * Only packed / fixed items are included
 * in the online estimated amount.
 */

function getPackedItemsTotal() {

  return roundMoney(
    state.cart.reduce(
      (total, item) => {

        if (
          item.pricingType !== "fixed" ||
          !Number.isFinite(item.unitPrice)
        ) {
          return total;
        }

        return (
          total +
          item.unitPrice *
          item.quantity
        );

      },
      0
    )
  );
}


function hasCounterPricedItems() {
  return state.cart.some(
    item =>
      item.pricingType ===
      "by-weight"
  );
}


/* ==========================================================================
   CART TOTAL
   ========================================================================== */

function getCartTotal() {
  return getPackedItemsTotal();
}


/* ==========================================================================
   CART OPEN / CLOSE
   ========================================================================== */

function openCart() {

  elements.cartOverlay
    .classList
    .remove("hidden");

  elements.cartDrawer
    .classList
    .add("open");

  document.body.style.overflow =
    "hidden";
}


function closeCart() {

  elements.cartOverlay
    .classList
    .add("hidden");

  elements.cartDrawer
    .classList
    .remove("open");


  if (
    elements.checkoutModal
      .classList
      .contains("hidden")
  ) {
    document.body.style.overflow = "";
  }
}


/* ==========================================================================
   CHECKOUT
   ========================================================================== */

function openCheckout() {

  if (!state.cart.length) {
    return;
  }


  closeCart();


  elements.checkoutTotal.innerHTML =
    buildCheckoutTotal();


  elements.checkoutModal
    .classList
    .remove("hidden");


  document.body.style.overflow =
    "hidden";
}


function buildCheckoutTotal() {

  const packedTotal =
    getPackedItemsTotal();


  if (hasCounterPricedItems()) {

    return `
      <span>
        Estimated packed items
      </span>

      <strong>
        ₹${formatMoney(packedTotal)}
        <small>
          + loose items at counter
        </small>
      </strong>
    `;
  }


  return `
    <span>
      Estimated order total
    </span>

    <strong>
      ₹${formatMoney(packedTotal)}
    </strong>
  `;
}


function closeCheckout() {

  elements.checkoutModal
    .classList
    .add("hidden");


  if (
    !elements.cartDrawer
      .classList
      .contains("open")
  ) {
    document.body.style.overflow =
      "";
  }
}


/* ==========================================================================
   PICKUP SLOTS
   ========================================================================== */

function createPickupSlots() {

  const options = [];


  for (
    let minutes =
      STORE.pickupStartHour * 60;

    minutes <
      STORE.pickupEndHour * 60;

    minutes +=
      STORE.pickupIntervalMinutes
  ) {

    const next =
      minutes +
      STORE.pickupIntervalMinutes;


    options.push({
      start: minutes,
      end: next
    });
  }


  elements.pickupSlot.innerHTML = `
    <option value="">
      Choose a pickup time
    </option>

    ${options
      .map(slot => `
        <option value="${formatSlot(slot.start)}">
          ${formatSlot(slot.start)}
          –
          ${formatSlot(slot.end)}
        </option>
      `)
      .join("")}
  `;
}


/* ==========================================================================
   CHECKOUT SUBMIT
   ========================================================================== */

function handleCheckout(event) {

  event.preventDefault();

  clearValidation();


  const formData =
    new FormData(
      elements.checkoutForm
    );


  const name =
    String(
      formData.get(
        "customerName"
      ) || ""
    ).trim();


  const phone =
    String(
      formData.get(
        "customerPhone"
      ) || ""
    ).trim();


  const pickupSlot =
    String(
      formData.get(
        "pickupSlot"
      ) || ""
    ).trim();


  const note =
    String(
      formData.get(
        "customerNote"
      ) || ""
    ).trim();


  let valid = true;


  if (name.length < 2) {

    elements.nameError.textContent =
      "Please enter your name.";

    valid = false;
  }


  if (!isValidPhone(phone)) {

    elements.phoneError.textContent =
      "Please enter a valid WhatsApp number.";

    valid = false;
  }


  if (!pickupSlot) {

    elements.slotError.textContent =
      "Please choose a pickup time.";

    valid = false;
  }


  if (!valid) {
    return;
  }


  const order = {

    orderNumber:
      createOrderNumber(),

    name,

    phone,

    pickupSlot,

    note,

    items:
      state.cart.map(item => ({
        ...item
      })),

    estimatedPackedTotal:
      getPackedItemsTotal(),

    hasLooseItems:
      hasCounterPricedItems(),

    createdAt:
      new Date().toISOString()
  };


  state.lastOrder =
    order;


  showConfirmation(order);

  sendWhatsAppOrder(order);
}


/* ==========================================================================
   VALIDATION
   ========================================================================== */

function clearValidation() {

  elements.nameError.textContent = "";

  elements.phoneError.textContent = "";

  elements.slotError.textContent = "";
}


function isValidPhone(phone) {

  const digits =
    phone.replace(/\D/g, "");


  return (
    digits.length >= 10 &&
    digits.length <= 15
  );
}


/* ==========================================================================
   ORDER NUMBER
   ========================================================================== */

function createOrderNumber() {

  const now =
    new Date();


  const datePart =
    String(
      now.getFullYear()
    ).slice(-2) +

    String(
      now.getMonth() + 1
    ).padStart(2, "0") +

    String(
      now.getDate()
    ).padStart(2, "0");


  const randomPart =
    Math.floor(
      1000 +
      Math.random() * 9000
    );


  return `KIR-${datePart}-${randomPart}`;
}


/* ==========================================================================
   WHATSAPP
   ========================================================================== */

function sendWhatsAppOrder(order) {

  const message =
    buildWhatsAppMessage(order);


  const whatsappNumber =
    STORE.whatsapp.replace(
      /\D/g,
      ""
    );


  if (!whatsappNumber) {

    alert(
      "Please add your real WhatsApp number in js/app.js first."
    );

    return;
  }


  const url =
    `https://wa.me/${whatsappNumber}?text=` +
    encodeURIComponent(message);


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* ==========================================================================
   WHATSAPP MESSAGE
   ========================================================================== */

function buildWhatsAppMessage(order) {

  const lines = [];


  lines.push(
    "*NEW PICKUP ORDER*"
  );

  lines.push(
    `Order: *${order.orderNumber}*`
  );

  lines.push("");


  lines.push(
    `Customer: ${order.name}`
  );

  lines.push(
    `WhatsApp: ${order.phone}`
  );

  lines.push(
    `Pickup: ${order.pickupSlot}`
  );

  lines.push("");


  lines.push("*ITEMS*");


  order.items.forEach(
    (item, index) => {

      const quantity =
        item.quantity;


      if (
        item.pricingType ===
        "by-weight"
      ) {

        lines.push(
          `${index + 1}. ${item.name} — ` +
          `${formatWeight(item.weightGrams)} × ${quantity} ` +
          `— *Price at Counter*`
        );

      } else {

        lines.push(
          `${index + 1}. ${item.name} — ` +
          `${item.unit} × ${quantity} = ` +
          `₹${formatMoney(
            item.unitPrice *
            quantity
          )}`
        );
      }

    }
  );


  lines.push("");


  if (
    order.estimatedPackedTotal > 0
  ) {

    lines.push(
      `Estimated packed items: *₹${formatMoney(
        order.estimatedPackedTotal
      )}*`
    );
  }


  if (order.hasLooseItems) {

    lines.push(
      "Loose items: *Price to be confirmed at counter*"
    );
  }


  lines.push("");


  if (order.note) {

    lines.push(
      `Note: ${order.note}`
    );

    lines.push("");
  }


  lines.push(
    "Please pack this ready-stock order for the selected pickup time."
  );

  lines.push("");


  lines.push(
    "*Final bill will be prepared at the counter.*"
  );

  lines.push(
    "All bills are finalized at the counter. Prices for loose items are confirmed at the time of billing."
  );


  return lines.join("\n");
}


/* ==========================================================================
   CONFIRMATION
   ========================================================================== */

function showConfirmation(order) {

  closeCheckout();


  elements.confirmationOrderNumber
    .textContent =
    order.orderNumber;


  elements.confirmationDetails.innerHTML = `

    <strong>
      ${escapeHtml(order.name)}
    </strong>

    <br />

    Pickup:
    <strong>
      ${escapeHtml(order.pickupSlot)}
    </strong>

    <br />

    ${
      order.estimatedPackedTotal > 0
        ? `
          Estimated packed items:
          <strong>
            ₹${formatMoney(
              order.estimatedPackedTotal
            )}
          </strong>
        `
        : ""
    }

    ${
      order.hasLooseItems
        ? `
          <br />
          Loose items:
          <strong>
            Price at Counter
          </strong>
        `
        : ""
    }

  `;


  createOrderQr(order);


  elements.confirmationModal
    .classList
    .remove("hidden");


  document.body.style.overflow =
    "hidden";
}


/* ==========================================================================
   QR CODE
   ========================================================================== */

function createOrderQr(order) {

  const qrData = [
    `Order: ${order.orderNumber}`,
    `Name: ${order.name}`,
    `Pickup: ${order.pickupSlot}`,
    `Packed: ₹${formatMoney(
      order.estimatedPackedTotal
    )}`,
    order.hasLooseItems
      ? "Loose: Price at Counter"
      : ""
  ]
    .filter(Boolean)
    .join("\n");


  const encoded =
    encodeURIComponent(qrData);


  elements.qrCode.innerHTML = `
    <img
      src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}"
      alt="QR code for ${escapeHtml(order.orderNumber)}"
      loading="lazy"
    />
  `;
}


/* ==========================================================================
   FINISH ORDER
   ========================================================================== */

function finishOrder() {

  elements.confirmationModal
    .classList
    .add("hidden");


  document.body.style.overflow =
    "";


  state.cart = [];

  state.lastOrder = null;


  elements.checkoutForm.reset();


  renderCart();
}


/* ==========================================================================
   HELPERS
   ========================================================================== */

function roundMoney(value) {

  return Math.round(
    (Number(value) +
      Number.EPSILON) *
      100
  ) / 100;
}


function formatMoney(value) {

  return roundMoney(value)
    .toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    );
}


function formatWeight(grams) {

  const value =
    Number(grams);


  if (value < 1000) {

    return `${value} g`;
  }


  const kg =
    value / 1000;


  return Number.isInteger(kg)

    ? `${kg} kg`

    : `${kg
        .toFixed(2)
        .replace(/0+$/, "")
        .replace(/\.$/, "")} kg`;
}


/* ==========================================================================
   TIME FORMAT
   ========================================================================== */

function formatSlot(minutes) {

  const hour24 =
    Math.floor(
      minutes / 60
    );

  const minute =
    minutes % 60;


  const suffix =
    hour24 >= 12
      ? "PM"
      : "AM";


  const hour12 =
    hour24 % 12 === 0
      ? 12
      : hour24 % 12;


  return `${hour12}:${String(
    minute
  ).padStart(2, "0")} ${suffix}`;
}


/* ==========================================================================
   CATEGORY ICON
   ========================================================================== */

function getCategoryIcon(category) {

  const value =
    category.toLowerCase();


  if (value.includes("rice"))
    return "🌾";

  if (
    value.includes("atta") ||
    value.includes("flour")
  )
    return "🌾";

  if (value.includes("spice"))
    return "🌶️";

  if (value.includes("oil"))
    return "🛢️";

  if (value.includes("tea"))
    return "☕";

  if (value.includes("biscuit"))
    return "🍪";

  if (
    value.includes("pasta") ||
    value.includes("noodle")
  )
    return "🍜";

  if (value.includes("staple"))
    return "🧂";


  return "🛒";
}


/* ==========================================================================
   RANDOM ID
   ========================================================================== */

function cryptoRandomId() {

  if (
    window.crypto &&
    typeof window.crypto.randomUUID ===
      "function"
  ) {

    return window.crypto.randomUUID();
  }


  return (
    Date.now().toString(36) +
    Math.random()
      .toString(36)
      .slice(2)
  );
}


/* ==========================================================================
   HTML ESCAPE
   ========================================================================== */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );
}
