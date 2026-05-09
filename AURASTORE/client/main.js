import './style.css';

// --- State Management ---
const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('cart')) || [],
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  isCartOpen: false,
};

const API_URL = 'http://localhost:5000/api';

// --- API Helpers ---
async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    state.products = await res.json();
    renderProducts();
  } catch (err) {
    console.error('Failed to fetch products', err);
  }
}

// --- Cart Actions ---
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  const existingItem = state.cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  updateCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.id !== productId);
  updateCart();
}

function updateQuantity(productId, delta) {
  const item = state.cart.find(item => item.id === productId);
  if (item) {
    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCart();
    }
  }
}

function updateCart() {
  localStorage.setItem('cart', JSON.stringify(state.cart));
  renderCart();
  updateCartCount();
}

function updateCartCount() {
  const count = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-count').forEach(el => el.textContent = count);
}

// --- Auth Actions ---
async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    state.user = data.user;
    state.token = data.token;
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    
    closeModal('login-modal');
    updateUI();
  } catch (err) {
    alert(err.message);
  }
}

async function register(name, email, password) {
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    state.user = data.user;
    state.token = data.token;
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
    
    closeModal('register-modal');
    updateUI();
  } catch (err) {
    alert(err.message);
  }
}

function logout() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  updateUI();
}

// --- UI Rendering ---
function renderProducts() {
  const grid = document.querySelector('.products-grid');
  if (!grid) return;
  
  grid.innerHTML = state.products.map(p => `
    <div class="product-card glass">
      <img src="${p.image_url}" alt="${p.name}" class="product-image">
      <div class="product-info">
        <span class="product-category">${p.category}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-price">$${p.price.toFixed(2)}</p>
        <button class="add-to-cart-btn" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `).join('');
}

function renderCart() {
  const cartItems = document.querySelector('.cart-items');
  const cartTotal = document.querySelector('.cart-total-price');
  
  cartItems.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <img src="${item.image_url}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${item.price.toFixed(2)}</div>
        <div class="quantity-controls">
          <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="qty-btn" onclick="removeFromCart(${item.id})">×</button>
    </div>
  `).join('');

  const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotal.textContent = `$${total.toFixed(2)}`;
}

function updateUI() {
  const authContainer = document.getElementById('auth-container');
  if (state.user) {
    authContainer.innerHTML = `
      <span>Hi, ${state.user.name}</span>
      <a class="nav-link" id="logout-btn">Logout</a>
    `;
    document.getElementById('logout-btn').onclick = logout;
  } else {
    authContainer.innerHTML = `
      <a class="nav-link" onclick="openModal('login-modal')">Login</a>
      <a class="nav-link" onclick="openModal('register-modal')">Register</a>
    `;
  }
}

// --- Modal Helpers ---
window.openModal = (id) => document.getElementById(id).style.display = 'flex';
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleCart = () => {
  state.isCartOpen = !state.isCartOpen;
  document.querySelector('.cart-drawer').classList.toggle('open', state.isCartOpen);
};

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
  fetchProducts();
  updateUI();
  updateCart();
  updateCartCount();

  // Scroll effect
  window.addEventListener('scroll', () => {
    document.querySelector('header').classList.toggle('scrolled', window.scrollY > 50);
  });

  // Form listeners
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    login(e.target.email.value, e.target.password.value);
  });

  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    register(e.target.name.value, e.target.email.value, e.target.password.value);
  });

  document.getElementById('checkout-btn')?.addEventListener('submit', async (e) => {
    if (!state.user) return openModal('login-modal');
    if (state.cart.length === 0) return alert('Cart is empty');
    
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: state.user.id,
          items: state.cart,
          totalPrice: state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
        })
      });
      const data = await res.json();
      alert('Order placed successfully! Order ID: ' + data.orderId);
      state.cart = [];
      updateCart();
      toggleCart();
    } catch (err) {
      alert('Checkout failed');
    }
  });
});
