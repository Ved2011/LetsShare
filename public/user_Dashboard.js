const html = document.documentElement;
let themeToggle;
let dashboardItems;
let dashboardUsers;
let dashboardBorrows;
let dashboardMyItems;
let recentItemsContainer;
let myItemsContainer;
let borrowedItemsContainer;

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  html.setAttribute('data-theme', savedTheme);
  if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  if (themeToggle) {
    themeToggle.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
  }
}

async function loadDashboard() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!token || !user) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const statsResponse = await fetch('/api/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      dashboardItems.textContent = stats.total_items || 0;
      dashboardUsers.textContent = stats.total_users || 0;
    }

    const itemsResponse = await fetch('/api/items');
    if (itemsResponse.ok) {
      const items = await itemsResponse.json();
      const myItems = items.filter(item => item.owner_id === user.id);
      dashboardMyItems.textContent = myItems.length;
      displayMyItems(myItems);
      displayRecentItems(items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6));
    }

    const borrowsResponse = await fetch('/api/borrows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (borrowsResponse.ok) {
      const borrows = await borrowsResponse.json();
      const myBorrows = borrows.filter(borrow => borrow.borrower_id === user.id);
      dashboardBorrows.textContent = myBorrows.length;
      displayBorrowedItems(myBorrows);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function displayRecentItems(items) {
  recentItemsContainer.innerHTML = '';
  if (!items.length) {
    recentItemsContainer.innerHTML = '<p>No items available yet.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.description || 'No description'}</p>
      <span class="status ${item.status}">${item.status}</span>
    `;
    recentItemsContainer.appendChild(card);
  });
}

function displayMyItems(items) {
  myItemsContainer.innerHTML = '';
  if (!items.length) {
    myItemsContainer.innerHTML = '<p>You haven\'t uploaded any items yet.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.description || 'No description'}</p>
      <span class="status ${item.status}">${item.status}</span>
      <div class="item-actions">
        <button class="btn small" onclick="editItem(${item.id})">Edit</button>
        <button class="btn small danger" onclick="deleteItem(${item.id})">Delete</button>
      </div>
    `;
    myItemsContainer.appendChild(card);
  });
}

function displayBorrowedItems(borrows) {
  borrowedItemsContainer.innerHTML = '';
  if (!borrows.length) {
    borrowedItemsContainer.innerHTML = '<p>You haven\'t borrowed any items yet.</p>';
    return;
  }
  borrows.forEach(borrow => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <h4>${borrow.item_name || 'Unknown Item'}</h4>
      <p>Due: ${borrow.due_date ? new Date(borrow.due_date).toLocaleDateString() : 'N/A'}</p>
      <span class="status ${borrow.status}">${borrow.status}</span>
      <div class="item-actions">
        <button class="btn small" onclick="returnItem(${borrow.id})">Return</button>
      </div>
    `;
    borrowedItemsContainer.appendChild(card);
  });
}

async function editItem(itemId) {
  const newName = prompt('Enter new name:');
  if (!newName) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    });
    if (response.ok) {
      alert('Item updated successfully');
      loadDashboard(); // Reload dashboard
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
      loadDashboard(); // Reload dashboard
    } else {
      const error = await response.json();
      alert('Failed to delete item: ' + error.error);
    }
  } catch (error) {
    console.error('Error deleting item:', error);
  }
}

async function returnItem(borrowId) {
  // For simplicity, assume return without additional data
  const token = localStorage.getItem('token');
  try {
    // Need to get borrow details to return
    const borrowsResponse = await fetch('/api/borrows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (borrowsResponse.ok) {
      const borrows = await borrowsResponse.json();
      const borrow = borrows.find(b => b.id === borrowId);
      if (borrow) {
        const returnResponse = await fetch('/api/returns', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemId: borrow.item_id,
            borrowerEmail: JSON.parse(localStorage.getItem('user')).email,
            condition: 'good',
            notes: 'Returned via dashboard'
          })
        });
        if (returnResponse.ok) {
          alert('Item returned successfully');
          loadDashboard(); // Reload dashboard
        } else {
          alert('Failed to return item');
        }
      }
    }
  } catch (error) {
    console.error('Error returning item:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  themeToggle = document.getElementById('themeToggle');
  dashboardItems = document.getElementById('dashboardItems');
  dashboardUsers = document.getElementById('dashboardUsers');
  dashboardBorrows = document.getElementById('dashboardBorrows');
  dashboardMyItems = document.getElementById('dashboardMyItems');
  recentItemsContainer = document.getElementById('dashboardRecentItems');
  myItemsContainer = document.getElementById('dashboardMyItemsList');
  borrowedItemsContainer = document.getElementById('dashboardBorrowedItemsList');

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  initializeTheme();
  loadDashboard();
});