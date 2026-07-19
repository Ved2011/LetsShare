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
    grid.innerHTML = `<div class="empty-browse"><span class="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span><p>No items found.</p></div>`;
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
    if (grid) grid.innerHTML = `<div class="empty-browse"><span class="empty-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span><p>Failed to load items.</p></div>`;
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

