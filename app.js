const API = "https://fakestoreapi.com/products";

let cart = [];
let allProducts = [];
let selectedProduct = null;

//  LOAD CART FROM STORAGE
function loadCart() {
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCart();
}

//  FETCH PRODUCTS
fetch(API)
  .then((res) => res.json())
  .then((data) => {
    allProducts = data;
    displayProducts(data);
  });

//  DISPLAY PRODUCTS
function displayProducts(products) {
  const container = document.getElementById("products");
  container.innerHTML = "";

  products.forEach((p, index) => {
    container.innerHTML += `
      <div class="product">
        <img src="${p.image}">
        <h4>${p.title.substring(0, 50)}...</h4>
        <p>$${p.price.toFixed(2)}</p>
        <button onclick="showDetails(${index})">View</button>
        <button onclick="addToCartByIndex(${index})">Add</button>
      </div>
    `;
  });
}

//  SHOW MODAL
function showDetails(index) {
  const product = allProducts[index];
  selectedProduct = product;

  const modal = document.getElementById("modal");
  modal.style.display = "block";

  document.getElementById("modal-title").innerText = product.title;
  document.getElementById("modal-img").src = product.image;
  document.getElementById("modal-desc").innerText =
    product.description.length > 100
      ? product.description.substring(0, 100) + "..."
      : product.description;
  document.getElementById("modal-price").innerText = product.price.toFixed(2);
}

//  ADD FROM MODAL
function addToCartFromModal() {
  if (selectedProduct) {
    addToCart(selectedProduct);
  }
}

//  ADD TO CART
function addToCart(product) {
  cart.push(product);
  saveCart();
}

//  ADD TO CART (FROM INDEX)
function addToCartByIndex(index) {
  addToCart(allProducts[index]);
}

//  REMOVE FROM CART
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
}

//  SAVE CART
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

//  UPDATE CART UI
function updateCart() {
  const items = document.getElementById("cart-items");
  const count = document.getElementById("cart-count");
  const total = document.getElementById("total");

  items.innerHTML = "";
  let sum = 0;

  cart.forEach((item, index) => {
    sum += item.price;

    items.innerHTML += `
      <div class="cart-item">
        <span>${item.title.substring(0, 12)}...</span>
        <span>$${item.price.toFixed(2)}</span>
        <button onclick="removeFromCart(${index})">X</button>
      </div>
    `;
  });

  count.innerText = cart.length;
  total.innerText = sum.toFixed(2);
}

//  TOGGLE CART
function toggleCart() {
  const panel = document.getElementById("cart-panel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

//  CLOSE CART BUTTON
document.addEventListener("DOMContentLoaded", () => {
  loadCart();

  const closeBtn = document.getElementById("close-cart");
  if (closeBtn) {
    closeBtn.onclick = () => {
      document.getElementById("cart-panel").style.display = "none";
    };
  }
});

//  CLOSE MODAL WHEN CLICK OUTSIDE
window.onclick = function (e) {
  const modal = document.getElementById("modal");

  if (e.target === modal) {
    modal.style.display = "none";
  }
};

//  AUTO SLIDE
let currentIndex = 0;
let autoSlideInterval;

function startAutoSlide() {
  autoSlideInterval = setInterval(nextSlide, 4000);
}
