// index.js
const html = document.documentElement;
let logoLink;
let itemsContainer;
let statItems;
let statUsers;
let statBorrows;
let searchInput;
let allItems = [];

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  html.setAttribute('data-theme', savedTheme);
}

function handleLogoClick(event) {
  event.preventDefault();
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'user_Dashboard.html';
  } else {
    window.location.href = 'login.html';
  }
}

async function loadAllItems() {
  if (!itemsContainer) return;
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      allItems = items; // store for search
      const newItems = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
      displayItems(newItems);
    } else {
      console.error('Failed to load items');
    }
  } catch (error) {
    console.error('Error loading items:', error);
  }
}

function filterAndDisplay() {
  if (!searchInput) return;
  const query = searchInput.value.trim().toLowerCase();
  if (!query) {
    // show newest when no query
    const newItems = allItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
    displayItems(newItems);
    return;
  }
  const filtered = allItems.filter(item =>
    (item.name && item.name.toLowerCase().includes(query)) ||
    (item.description && item.description.toLowerCase().includes(query))
  );
  displayItems(filtered);
}

function displayItems(items) {
  if (!itemsContainer) return;
  itemsContainer.innerHTML = '';
  if (items.length === 0) {
    itemsContainer.innerHTML = '<p>No items found.</p>';
    return;
  }
  items.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isOwner = user && Number(user.id) === Number(item.owner_id);
    const canBorrow = token && !isOwner && item.status === 'available';

    let actions = '';
    if (canBorrow) {
      actions = `<button class="btn small primary" onclick="borrowItem(${item.id})">Borrow</button>`;
    } else if (isOwner) {
      actions = `<span class="status available">Owner</span>`;
    }

    itemCard.innerHTML = `
      <div class="card-info">
        <h4>${item.name}</h4>
        <p>${item.description || 'No description'}</p>
      </div>
      <div class="item-meta">
        <span class="status ${item.status}">${item.status}</span>
        <div class="item-actions">
          ${actions}
        </div>
      </div>
    `;
    itemsContainer.appendChild(itemCard);
  });
}

async function borrowItem(itemId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to borrow items');
    window.location.href = 'login.html';
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
      alert('Borrow request sent successfully!');
      loadAllItems(); // Refresh the items list
    } else {
      const error = await response.json();
      alert('Failed to send borrow request: ' + error.error);
    }
  } catch (error) {
    console.error('Error sending borrow request:', error);
    alert('Failed to send borrow request');
  }
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      const stats = await response.json();
      if (statItems) statItems.textContent = stats.total_items || 0;
      if (statUsers) statUsers.textContent = stats.total_users || 0;
      if (statBorrows) statBorrows.textContent = stats.active_borrows || 0;
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  logoLink = document.getElementById('logoLink');
  itemsContainer = document.getElementById('itemsContainer');
  statItems = document.getElementById('statItems');
  statUsers = document.getElementById('statUsers');
  statBorrows = document.getElementById('statBorrows');
  searchInput = document.getElementById('searchInput');

  if (logoLink) logoLink.addEventListener('click', handleLogoClick);
  if (searchInput) searchInput.addEventListener('input', filterAndDisplay);

  initializeTheme();
  loadStats();
  loadAllItems();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (token) {
    const loggedInButtons = document.getElementById('loggedInButtons');
    if (loggedInButtons) loggedInButtons.style.display = 'flex';
    
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerAvatar && user.name) {
      headerAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
    
    const guestButtons = document.getElementById('guestButtons');
    if (guestButtons) guestButtons.style.display = 'none';
  }
});