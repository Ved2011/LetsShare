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
    console.log('Loading items from API...');
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      console.log('Items loaded:', items.length);
      allItems = items; // store for search
      const newItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
      displayItems(newItems);
    } else {
      console.error('Failed to load items:', response.status);
    }
  } catch (error) {
    console.error('Error loading items:', error);
  }
}

let searchResultsDropdown;

function filterAndDisplay() {
  if (!searchInput || !searchResultsDropdown) return;
  
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) {
    searchResultsDropdown.classList.remove('active');
    searchResultsDropdown.innerHTML = '';
    return;
  }
  
  const filtered = allItems.filter(item =>
    (item.name && item.name.toLowerCase().includes(query)) ||
    (item.description && item.description.toLowerCase().includes(query)) ||
    (item.owner_name && item.owner_name.toLowerCase().includes(query))
  );
  
  displayDropdownResults(filtered);
}

function displayDropdownResults(items) {
  if (!searchResultsDropdown) return;
  
  searchResultsDropdown.innerHTML = '';
  
  if (items.length === 0) {
    searchResultsDropdown.innerHTML = '<div style="padding: 1rem; color: var(--muted); text-align: center;">No items found.</div>';
  } else {
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'dropdown-item';
      itemEl.innerHTML = `
        <div class="dropdown-info">
          <h5>${item.name}</h5>
          <p>${item.owner_name ? 'Owner: ' + item.owner_name : 'No description'}</p>
        </div>
        <span class="dropdown-status status ${item.status}">${item.status}</span>
      `;
      itemEl.addEventListener('click', () => {
        window.location.href = `item_View.html?id=${item.id}`;
      });
      searchResultsDropdown.appendChild(itemEl);
    });
  }
  
  searchResultsDropdown.classList.add('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (searchResultsDropdown && !searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
    searchResultsDropdown.classList.remove('active');
  }
});

window.borrowItem = borrowItem;

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
    itemCard.style.cursor = 'pointer';
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isOwner = user && Number(user.id) === Number(item.owner_id);

    itemCard.addEventListener('click', () => {
      window.location.href = `item_View.html?id=${item.id}`;
    });

    itemCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1;">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover; background: #f1f5f9;">
        <div class="card-info">
          <h4>${item.name}</h4>
          <p style="margin-bottom: 0.25rem; opacity: 0.7;">Owner: ${item.owner_name || 'Anonymous'}</p>
          <p style="font-weight: 700; color: var(--accent); margin: 0;">Rs. ${Number(item.price_per_day || 0).toFixed(2)} / day</p>
        </div>
      </div>
      <div class="item-meta">
        <span class="status ${item.status}">${item.status}</span>
        <div class="item-actions">
           <button class="btn small outline">View Details</button>
        </div>
      </div>
    `;
    itemsContainer.appendChild(itemCard);
  });
}

async function borrowItem(itemId) {
  const token = localStorage.getItem('token');
  if (!token) {
    window.showAlert('Please log in to borrow items', 'error');
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
      loadAllItems(); // Refresh the items list
    } else {
      const error = await response.json();
      window.showAlert('Failed to send borrow request: ' + error.error, 'error');
    }
  } catch (error) {
    console.error('Error sending borrow request:', error);
    window.showAlert('Failed to send borrow request', 'error');
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
  searchResultsDropdown = document.getElementById('searchResultsDropdown');

  console.log('Search input element found:', !!searchInput);
  console.log('Search dropdown element found:', !!searchResultsDropdown);
  
  if (logoLink) logoLink.addEventListener('click', handleLogoClick);
  if (searchInput) {
    searchInput.addEventListener('input', filterAndDisplay);
    console.log('Search event listener attached');
  } else {
    console.error('Search input not found in DOM');
  }

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