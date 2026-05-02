// user_Profile.js
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const avatar = document.getElementById('avatar');
const newItemsList = document.getElementById('newItemsList');
const myItemsList = document.getElementById('myItemsList');
const borrowedItemsList = document.getElementById('borrowedItemsList');
const createItemBtn = document.getElementById('createItemBtn');
const borrowItemBtn = document.getElementById('borrowItemBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const logoutBtn = document.getElementById('logoutBtn');
const dashboardBtn = document.getElementById('dashboardBtn');

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
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

async function loadUserProfile() {
  const token = localStorage.getItem('token');
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

  if (storedUser) {
    userName.textContent = storedUser.name;
    userEmail.textContent = storedUser.email;
    avatar.textContent = storedUser.name.charAt(0).toUpperCase();
  } else {
    userName.textContent = 'Guest';
    userEmail.textContent = 'Please sign in to access full profile features.';
    avatar.textContent = 'G';
  }

  if (!token) {
    return;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      userName.textContent = user.name;
      userEmail.textContent = user.email;
      avatar.textContent = user.name.charAt(0).toUpperCase();
    } else if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

async function loadNewItems() {
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      const newItems = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
      displayItems(newItemsList, newItems);
    }
  } catch (error) {
    console.error('Error loading new items:', error);
  }
}

async function loadMyItems() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/items', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const items = await response.json();
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      const myItems = currentUser ? items.filter(item => item.owner_id === currentUser.id) : [];
      displayItems(myItemsList, myItems, true);
    }
  } catch (error) {
    console.error('Error loading my items:', error);
  }
}

async function loadBorrowedItems() {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/borrows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const borrows = await response.json();
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      const borrowed = currentUser ? borrows.filter(borrow => borrow.borrower_id === currentUser.id) : [];
      displayBorrowedItems(borrowed);
    }
  } catch (error) {
    console.error('Error loading borrowed items:', error);
  }
}

function displayItems(container, items, isMyItems = false) {
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<p>No items found.</p>';
    return;
  }
  items.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    let buttons = '';
    if (isMyItems) {
      buttons = `
        <div class="item-actions">
          <button class="btn small" onclick="editItem(${item.id})">Edit</button>
          <button class="btn small danger" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      `;
    } else {
      // Check if user can borrow this item
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const isOwner = user && user.id === item.owner_id;
      const canBorrow = token && !isOwner && item.status === 'available';

      if (canBorrow) {
        buttons = `
          <div class="item-actions">
            <button class="btn small" onclick="borrowItem(${item.id})">Borrow</button>
          </div>
        `;
      } else if (isOwner) {
        buttons = `<span class="status owner">Your Item</span>`;
      } else if (item.status !== 'available') {
        buttons = `<span class="status ${item.status}">${item.status}</span>`;
      }
    }
    itemCard.innerHTML = `
      <p><strong>${item.name}</strong></p>
      <p>${item.description || 'No description'}</p>
      <span class="status ${item.status}">${item.status}</span>
      ${buttons}
    `;
    container.appendChild(itemCard);
  });
}

function displayBorrowedItems(borrows) {
  borrowedItemsList.innerHTML = '';
  if (borrows.length === 0) {
    borrowedItemsList.innerHTML = '<p>No borrowed items.</p>';
    return;
  }
  borrows.forEach(borrow => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.innerHTML = `
      <p><strong>${borrow.item_name || 'Unknown Item'}</strong></p>
      <p class="muted">Due: ${borrow.due_date ? new Date(borrow.due_date).toLocaleDateString() : 'N/A'}</p>
    `;
    borrowedItemsList.appendChild(itemCard);
  });
}

function handleCreateItem() {
  window.location.href = 'ItemForm.html';
}

function handleBorrowItem() {
  window.location.href = 'issue_Item.html';
}

function handleEditProfile() {
  // For now, redirect to a profile edit page or show a modal
  alert('Edit profile functionality coming soon!');
}

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

async function editItem(itemId) {
  // For now, redirect to ItemForm with item id or show edit modal
  // Since ItemForm might not support editing, we'll implement a simple edit
  const newName = prompt('Enter new name:');
  if (!newName) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`http://localhost:3000/api/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    });
    if (response.ok) {
      alert('Item updated successfully');
      loadMyItems(); // Reload items
    } else {
      alert('Failed to update item');
    }
  } catch (error) {
    console.error('Error updating item:', error);
  }
}

async function deleteItem(itemId) {
  if (!confirm('Are you sure you want to delete this item?')) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      alert('Item deleted successfully');
      loadMyItems(); // Reload items
    } else {
      const error = await response.json();
      alert('Failed to delete item: ' + error.error);
    }
  } catch (error) {
    console.error('Error deleting item:', error);
  }
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
      loadNewItems(); // Refresh the items list
    } else {
      const error = await response.json();
      alert('Failed to send borrow request: ' + error.error);
    }
  } catch (error) {
    console.error('Error sending borrow request:', error);
    alert('Failed to send borrow request');
  }
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (createItemBtn) {
  createItemBtn.addEventListener('click', handleCreateItem);
}

if (borrowItemBtn) {
  borrowItemBtn.addEventListener('click', handleBorrowItem);
}

if (editProfileBtn) {
  editProfileBtn.addEventListener('click', handleEditProfile);
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

if (dashboardBtn) {
  dashboardBtn.addEventListener('click', () => {
    window.location.href = 'user_Dashboard.html';
  });
}

initializeTheme();
loadUserProfile();
loadNewItems();
loadMyItems();
loadBorrowedItems();