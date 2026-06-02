const API = "https://fakestoreapi.com/products";

// Application State
let state = {
  allProducts: [],
  cart: [],
  currentCategory: "all",
  searchQuery: "",
  currentSort: "default",
  selectedProduct: null,
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadCartFromStorage();
  initEventListeners();
  fetchProducts();
});

// Fetch data & manage skeleton UI
function fetchProducts() {
  const container = document.getElementById("products");
  renderSkeletons(container, 8);

  fetch(API)
    .then((res) => {
      if (!res.ok) throw new Error("Network response was not ok");
      return res.json();
    })
    .then((data) => {
      state.allProducts = data;
      filterAndRenderProducts();
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      container.innerHTML = `
        <div class="error-container">
          <p>Failed to load products. Please check your connection.</p>
          <button class="cta-button" id="retry-btn">Retry Process</button>
        </div>
      `;
      document.getElementById("retry-btn")?.addEventListener("click", fetchProducts);
    });
}

// Render Beautiful Layout Loading Skeletons
function renderSkeletons(container, count) {
  container.innerHTML = Array(count).fill().map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img animate-pulse"></div>
      <div class="skeleton-line animate-pulse" style="width: 80%"></div>
      <div class="skeleton-line animate-pulse" style="width: 50%"></div>
      <div class="skeleton-line animate-pulse" style="width: 30%"></div>
      <div class="skeleton-btn animate-pulse"></div>
    </div>
  `).join("");
}

// Handle Centralized Filter & Sort Engine
function filterAndRenderProducts() {
  let products = [...state.allProducts];

  // 1. Filter Category
  if (state.currentCategory !== "all") {
    products = products.filter(p => p.category === state.currentCategory);
  }

  // 2. Filter Search Queries
  if (state.searchQuery.trim() !== "") {
    const query = state.searchQuery.toLowerCase();
    products = products.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  }

  // 3. Sort Execution
  if (state.currentSort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (state.currentSort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (state.currentSort === "rating") {
    products.sort((a, b) => b.rating.rate - a.rating.rate);
  }

  renderProductGrid(products);
}

// Render Grid Products with custom elements
function renderProductGrid(products) {
  const container = document.getElementById("products");
  if (products.length === 0) {
    container.innerHTML = `<div class="empty-state">No products found matching your criteria.</div>`;
    return;
  }

  container.innerHTML = products.map((p) => {
    const stars = "★".repeat(Math.round(p.rating.rate)) + "☆".repeat(5 - Math.round(p.rating.rate));
    return `
      <article class="product-card" data-id="${p.id}">
        <div class="product-img-container">
          <span class="card-badge">${p.category}</span>
          <button class="wishlist-btn" aria-label="Add to wishlist">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
          <img src="${p.image}" alt="${p.title}" loading="lazy">
        </div>
        <div class="product-info">
          <h4 class="product-title">${p.title}</h4>
          <div class="product-meta">
            <span class="product-rating-stars">${stars}</span>
            <span class="product-rating-count">(${p.rating.count})</span>
          </div>
          <p class="product-price">$${p.price.toFixed(2)}</p>
          <div class="product-card-actions">
            <button class="btn-secondary view-details-btn">View Details</button>
            <button class="btn-primary add-to-cart-quick">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Event Listeners Orchestration
function initEventListeners() {
  // Search Bar input filter
  document.getElementById("search-input").addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    filterAndRenderProducts();
  });

  // Sort Dropdown changes
  document.getElementById("sort-select").addEventListener("change", (e) => {
    state.currentSort = e.target.value;
    filterAndRenderProducts();
  });

  // Dynamic Category Pill Button clicks
  document.getElementById("category-nav").addEventListener("click", (e) => {
    if (e.target.classList.contains("cat-btn")) {
      document.querySelectorAll(".cat-btn").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
      state.currentCategory = e.target.dataset.category;
      filterAndRenderProducts();
    }
  });

  // Product Grid Event Delegation (Prevents dynamic breaking layout bugs)
  document.getElementById("products").addEventListener("click", (e) => {
    const card = e.target.closest(".product-card");
    if (!card) return;
    const productId = parseInt(card.dataset.id);
    const product = state.allProducts.find(p => p.id === productId);

    if (e.target.classList.contains("view-details-btn")) {
      openModal(product);
    } else if (e.target.classList.contains("add-to-cart-quick")) {
      addItemToCart(product, 1);
      showToast(`${product.title.substring(0, 20)}... added to cart!`);
    } else if (e.target.closest(".wishlist-btn")) {
      const heart = card.querySelector(".wishlist-btn svg");
      heart.setAttribute("fill", heart.getAttribute("fill") === "none" ? "currentColor" : "none");
    }
  });

  // Cart Panel View Handling
  document.getElementById("cart-toggle-btn").addEventListener("click", toggleCartPanel);
  document.getElementById("close-cart").addEventListener("click", toggleCartPanel);
  document.getElementById("cart-overlay").addEventListener("click", toggleCartPanel);

  // Modal Panel View Handling
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("modal-overlay").addEventListener("click", closeModal);

  // Modal Counter Actions
  document.getElementById("modal-qty-minus").addEventListener("click", () => handleModalQtyChange(-1));
  document.getElementById("modal-qty-plus").addEventListener("click", () => handleModalQtyChange(1));
  document.getElementById("modal-add-btn").addEventListener("click", () => {
    const qty = parseInt(document.getElementById("modal-qty").value);
    addItemToCart(state.selectedProduct, qty);
    showToast(`Added ${qty} item(s) to your cart.`);
    closeModal();
  });

  // Cart Management Interaction Actions
  document.getElementById("cart-items").addEventListener("click", (e) => {
    const itemId = parseInt(e.target.dataset.id);
    if (e.target.classList.contains("qty-minus")) {
      updateCartItemQty(itemId, -1);
    } else if (e.target.classList.contains("qty-plus")) {
      updateCartItemQty(itemId, 1);
    } else if (e.target.classList.contains("remove-item-btn")) {
      removeCartItemCompletely(itemId);
    }
  });

  // Checkout handling execution
  document.getElementById("checkout-btn").addEventListener("click", () => {
    if (state.cart.length === 0) return;
    showToast("Processing Secure Checkout Flow...", "success");
    state.cart = [];
    saveCartAndSyncUI();
    toggleCartPanel();
  });
}

/* ==========================================================================
   CART ENGINE BUSINESS LOGIC
   ========================================================================== */
function addItemToCart(product, quantity) {
  const existingIndex = state.cart.findIndex(item => item.product.id === product.id);
  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += quantity;
  } else {
    state.cart.push({ product, quantity });
  }
  saveCartAndSyncUI();
}

function updateCartItemQty(id, delta) {
  const index = state.cart.findIndex(item => item.product.id === id);
  if (index === -1) return;
  
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  saveCartAndSyncUI();
}

function removeCartItemCompletely(id) {
  state.cart = state.cart.filter(item => item.product.id !== id);
  saveCartAndSyncUI();
}

function saveCartAndSyncUI() {
  localStorage.setItem("cart", JSON.stringify(state.cart));
  updateCartUI();
}

function loadCartFromStorage() {
  state.cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCartUI();
}

function updateCartUI() {
  const itemsContainer = document.getElementById("cart-items");
  const countBadge = document.getElementById("cart-count");
  const totalDisplay = document.getElementById("total");

  if (state.cart.length === 0) {
    itemsContainer.innerHTML = `
      <div class="cart-empty-state">
        <p>Your cart is currently empty.</p>
      </div>
    `;
    countBadge.innerText = "0";
    totalDisplay.innerText = "0.00";
    return;
  }

  let totalSum = 0;
  let totalItemsCount = 0;

  itemsContainer.innerHTML = state.cart.map(item => {
    const subtotal = item.product.price * item.quantity;
    totalSum += subtotal;
    totalItemsCount += item.quantity;

    return `
      <div class="cart-item">
        <img src="${item.product.image}" alt="${item.product.title}">
        <div class="cart-item-details">
          <h5>${item.product.title}</h5>
          <p class="cart-item-unit-price">$${item.product.price.toFixed(2)}</p>
          <div class="cart-item-controls">
            <div class="item-counter">
              <button class="qty-minus" data-id="${item.product.id}">-</button>
              <span>${item.quantity}</span>
              <button class="qty-plus" data-id="${item.product.id}">+</button>
            </div>
            <button class="remove-item-btn" data-id="${item.product.id}">Remove</button>
          </div>
        </div>
        <div class="cart-item-subtotal">$${subtotal.toFixed(2)}</div>
      </div>
    `;
  }).join("");

  countBadge.innerText = totalItemsCount;
  totalDisplay.innerText = totalSum.toFixed(2);
}

/* ==========================================================================
   UI DISPLAY VIEWS, MODALS, ANIMATIONS & TOASTS
   ========================================================================== */
function toggleCartPanel() {
  const panel = document.getElementById("cart-panel");
  const overlay = document.getElementById("cart-overlay");
  
  if (panel.classList.contains("open")) {
    panel.classList.remove("open");
    overlay.style.display = "none";
  } else {
    panel.classList.add("open");
    overlay.style.display = "block";
  }
}

function openModal(product) {
  state.selectedProduct = product;
  const modal = document.getElementById("modal");
  
  document.getElementById("modal-img").src = product.image;
  document.getElementById("modal-img").alt = product.title;
  document.getElementById("modal-category").innerText = product.category;
  document.getElementById("modal-title").innerText = product.title;
  document.getElementById("modal-rating").innerText = `${product.rating.rate} / 5 (${product.rating.count} reviews)`;
  document.getElementById("modal-price").innerText = product.price.toFixed(2);
  document.getElementById("modal-desc").innerText = product.description;
  document.getElementById("modal-qty").value = 1;

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden"; // Prevents background body scrolling
}

function closeModal() {
  const modal = document.getElementById("modal");
  // modal.style.display = "none";
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function handleModalQtyChange(delta) {
  const qtyInput = document.getElementById("modal-qty");
  let currentVal = parseInt(qtyInput.value) + delta;
  if (currentVal < 1) currentVal = 1;
  qtyInput.value = currentVal;
}

// Premium Micro-interaction Toast System
function showToast(message, type = "info") {
  const container = document.body;
  const toast = document.createElement("div");
  toast.className = `toast-notification ${type}`;
  toast.innerText = message;
  
  container.appendChild(toast);
  
  // Slide In & Out timing execution
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}