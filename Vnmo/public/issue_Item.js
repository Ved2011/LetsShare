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

let allItems = [];

async function loadItems() {
  if (!itemsList) return;
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      allItems = await response.json();
      displayItems(allItems);
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
  
  // Filter for available items and hide own items
  const availableItems = items.filter(item => 
    item.status === 'available' && 
    (!user || Number(item.owner_id) !== Number(user.id))
  );

  if (availableItems.length === 0) {
    itemsList.innerHTML = '<p class="empty-state">No items found.</p>';
    return;
  }

  itemsList.innerHTML = availableItems.map(item => `
    <div class="item-square" onclick="window.location.href='item_View.html?id=${item.id}'">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" class="item-image" alt="${item.name}" loading="lazy">
        <div class="item-name">${item.name}</div>
        <div class="item-category">${item.category || 'Miscellaneous'}</div>
    </div>
  `).join('');
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
  
  if (headerAvatar && user.name) {
    headerAvatar.textContent = user.name.charAt(0).toUpperCase();
  }

  const borrowSearch = document.getElementById('borrowSearch');
  if (borrowSearch) {
    borrowSearch.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allItems.filter(item => 
        item.name.toLowerCase().includes(term) || 
        (item.description && item.description.toLowerCase().includes(term))
      );
      displayItems(filtered);
    });
  }
  
  loadItems();
});
