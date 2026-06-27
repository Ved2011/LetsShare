<<<<<<< HEAD
// issue_Item.js — redesigned ecommerce browse

let allItems = [];
let activeCategory = '';
let activeSort = 'newest';

// ─── Filter / Sort / Render ───────────────────────────────────
function filterItems() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  let filtered = allItems.filter(item => {
    const matchesSearch = !query ||
      item.name.toLowerCase().includes(query) ||
      (item.description || '').toLowerCase().includes(query) ||
      (item.category || '').toLowerCase().includes(query);
    const matchesCategory = !activeCategory ||
      (item.category || '').toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Sort
  if (activeSort === 'price_asc') filtered.sort((a, b) => (a.price_per_day || 0) - (b.price_per_day || 0));
  else if (activeSort === 'price_desc') filtered.sort((a, b) => (b.price_per_day || 0) - (a.price_per_day || 0));
  else filtered.sort((a, b) => b.id - a.id); // newest

  renderItems(filtered);
}

function selectCategory(el) {
  document.querySelectorAll('#categoryChips .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeCategory = el.dataset.category || '';
  filterItems();
}

function selectSort(el) {
  document.querySelectorAll('[data-sort]').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  activeSort = el.dataset.sort;
  filterItems();
}

function toggleFilters() {
  const panel = document.getElementById('filterPanel');
  const btn = document.getElementById('filterToggleBtn');
  const isOpen = panel.classList.toggle('open');
  btn.classList.toggle('active', isOpen);
}

// ─── Render ───────────────────────────────────────────────────
function renderItems(items) {
  const grid = document.getElementById('itemsList');
  if (!grid) return;

  const countEl = document.getElementById('itemCount');
  if (countEl) countEl.textContent = `${items.length} item${items.length !== 1 ? 's' : ''}`;

  if (!items.length) {
    grid.innerHTML = `<div class="empty-browse"><span class="empty-icon">🔍</span><p>No items found.</p></div>`;
    return;
  }

  grid.innerHTML = items.map(item => `
    <div class="product-card" onclick="window.location.href='item_View.html?id=${item.id}'">
      <div class="product-img-wrap">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" loading="lazy">
        <span class="product-status-badge">Available</span>
      </div>
      <div class="product-info">
        <div class="product-name">${item.name}</div>
        <div class="product-owner">by ${item.owner_name || 'Anonymous'}</div>
        <div class="product-price">
          Rs. ${Number(item.price_per_day || 0).toFixed(0)}
          <small>/ day</small>
        </div>
      </div>
      <div class="product-borrow-btn">View & Borrow</div>
    </div>
  `).join('');
}

// ─── Load Items ───────────────────────────────────────────────
async function loadItems() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('Failed to load');
    const items = await res.json();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    // Only available items not owned by the logged-in user
    allItems = items.filter(item =>
      item.status === 'available' &&
      (!user || Number(item.owner_id) !== Number(user.id))
    );
    filterItems();
  } catch (e) {
    console.error('Error loading items:', e);
    const grid = document.getElementById('itemsList');
    if (grid) grid.innerHTML = `<div class="empty-browse"><span class="empty-icon">⚠️</span><p>Failed to load items.</p></div>`;
  }
}

// ─── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Avatar
  const avatar = document.getElementById('headerAvatar');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (avatar && user.name) avatar.textContent = user.name.charAt(0).toUpperCase();

  loadItems();
});

// Expose for HTML onclick
window.filterItems = filterItems;
window.selectCategory = selectCategory;
window.selectSort = selectSort;
window.toggleFilters = toggleFilters;

=======
// issue_Item.js
const html = document.documentElement;
let themeToggle;
let itemsList;

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  if (!themeToggle) return;
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIcon(nextTheme);
}

async function loadItems() {
  if (!itemsList) return;
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      displayItems(items);
    } else {
      itemsList.innerHTML = '<p class="error">Failed to load items.</p>';
    }
  } catch (error) {
    console.error('Error loading items:', error);
    itemsList.innerHTML = '<p class="error">Error connecting to server.</p>';
  }
}

function displayItems(items) {
  if (!itemsList) return;
  itemsList.innerHTML = '';

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');

  // Filter for available items and hide own items
  const availableItems = items.filter(item => 
    item.status === 'available' && 
    (!user || Number(item.owner_id) !== Number(user.id))
  );

  if (availableItems.length === 0) {
    itemsList.innerHTML = '<p>No available items to borrow at the moment.</p>';
    return;
  }

    availableItems.forEach(item => {
    const isOwner = user && Number(user.id) === Number(item.owner_id);
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.cursor = 'pointer';
    card.onclick = () => window.location.href = `item_View.html?id=${item.id}`;
    
    let actionHtml = '';
    if (isOwner) {
      actionHtml = '<span class="status available">Owner</span>';
    } else {
      actionHtml = `<button class="btn small primary">View & Borrow</button>`;
    }

    card.innerHTML = `
      <div class="card-info">
        <h4>${item.name}</h4>
        <p>${item.description || 'No description'}</p>
        <p style="font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem;">Rs. ${Number(item.price_per_day || 0).toFixed(2)} / day</p>
      </div>
      <div class="item-meta">
        <span class="status ${item.status}">${item.status}</span>
        <div class="item-actions">
          ${actionHtml}
        </div>
      </div>
    `;
    itemsList.appendChild(card);
  });
}

async function requestItem(itemId) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.showAlert('Please log in to request items.', 'error');
    setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    return;
  }

  try {
    const response = await fetch('/api/borrows', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ itemId })
    });

    if (response.ok) {
      window.showAlert('Borrow request sent successfully!');
      loadItems(); // Refresh list
    } else {
      const error = await response.json();
      window.showAlert('Failed: ' + (error.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Request error:', error);
    window.showAlert('Failed to send request.', 'error');
  }
}

// Make requestItem global for the onclick handler
window.requestItem = requestItem;

document.addEventListener('DOMContentLoaded', () => {
  themeToggle = document.getElementById('themeToggle');
  itemsList = document.getElementById('itemsList');

  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  initializeTheme();
  
  const headerAvatar = document.getElementById('headerAvatar');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (headerAvatar && user.name) {
    headerAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
  
  loadItems();
});
>>>>>>> 5d0a726 (wer)
