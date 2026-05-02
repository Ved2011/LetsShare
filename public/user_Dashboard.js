const html = document.documentElement;
let themeToggle;
let dashboardItems;
let dashboardUsers;
let dashboardBorrows;
let dashboardMyItems;
let recentItemsContainer;
let myItemsContainer;
let borrowedItemsContainer;
let requestsContainer;
let communitySearchInput;
let dashboardSearchInput;
let searchButton;
let searchUsersContainer;
let searchItemsContainer;
let searchSection;
let searchMessage;
let allItems = [];

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

async function recoverSession() {
  const token = localStorage.getItem('token');
  let user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) {
    return null;
  }

  // If we have a cached user, return it immediately
  if (user) {
    return user;
  }

  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    }
  } catch (err) {
    console.warn('Failed to recover cached user:', err);
    // Don't clear token on network errors - might be temporary
  }

  // Only clear if we get an auth error (401/403)
  // For now, return null and let dashboard handle it
  return null;
}

async function loadDashboard() {
  const token = localStorage.getItem('token');
  let user = JSON.parse(localStorage.getItem('user') || 'null');

  console.log('Dashboard load - token:', !!token, 'user:', !!user);

  // If we have a cached user, use it
  if (user) {
    // Verify token in background if present
    if (token) {
      recoverSession();
    }
  } else if (token) {
    // Try to recover user from token
    console.log('Trying to recover user from token');
    user = await recoverSession();
    console.log('Recovery result:', !!user);
  }

  if (!user) {
    console.log('No valid auth, redirecting to login');
    window.location.href = 'login.html';
    return;
  }

  console.log('Loading dashboard for user:', user.name);

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
      allItems = items; // store for searching
      const myItems = items.filter(item => item.owner_id === user.id);
      dashboardMyItems.textContent = myItems.length;
      displayMyItems(myItems);
      // initially show all community items
      displayRecentItems(items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }

    const borrowsResponse = await fetch('/api/borrows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (borrowsResponse.status === 401 || borrowsResponse.status === 403) {
      handleInvalidToken();
      return;
    }

    if (borrowsResponse.ok) {
      const borrows = await borrowsResponse.json();
      const myBorrows = borrows.filter(borrow => borrow.borrower_id === user.id);
      dashboardBorrows.textContent = myBorrows.length;
      displayBorrowedItems(myBorrows);

      // Load borrow requests for items owned by this user
      const myRequests = borrows.filter(borrow => borrow.status === 'requested' && borrow.owner_id === user.id);
      displayRequests(myRequests);
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function handleInvalidToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

function filterAndDisplay() {
  if (!communitySearchInput) return;
  const query = communitySearchInput.value.trim().toLowerCase();
  
  // Filter community items
  const filtered = allItems.filter(item =>
    (item.name && item.name.toLowerCase().includes(query)) ||
    (item.description && item.description.toLowerCase().includes(query))
  );
  displayRecentItems(filtered);
}

function displayRecentItems(items) {
  if (!recentItemsContainer) return;
  recentItemsContainer.innerHTML = '';
  if (!items.length) {
    recentItemsContainer.innerHTML = '<p>No items found matching your search.</p>';
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
  if (!myItemsContainer) return;
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
  if (!borrowedItemsContainer) return;
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

function displayRequests(requests) {
  requestsContainer.innerHTML = '';
  if (!requests.length) {
    requestsContainer.innerHTML = '<p>No pending borrow requests.</p>';
    return;
  }
  requests.forEach(request => {
    const card = document.createElement('div');
    card.className = 'item-card request-card';
    card.innerHTML = `
      <h4>${request.item_name || 'Unknown Item'}</h4>
      <p>Requested by: ${request.borrower_name} (${request.borrower_email})</p>
      <p>Requested: ${new Date(request.created_at).toLocaleDateString()}</p>
      <div class="item-actions">
        <button class="btn small success" onclick="approveRequest(${request.id})">Approve</button>
        <button class="btn small danger" onclick="declineRequest(${request.id})">Decline</button>
      </div>
    `;
    requestsContainer.appendChild(card);
  });
}

function renderUserSearchResults(users) {
  searchUsersContainer.innerHTML = '';
  if (!users.length) {
    searchUsersContainer.innerHTML = '<p>No users found.</p>';
    return;
  }
  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <h4>${user.name}</h4>
      <p>${user.email}</p>
      <div class="item-actions">
        <button class="btn small ${user.is_followed ? 'outline' : 'primary'}" onclick="toggleFollow(${user.id}, ${user.is_followed})">
          ${user.is_followed ? 'Following' : 'Follow'}
        </button>
      </div>
    `;
    searchUsersContainer.appendChild(card);
  });
}

function renderItemSearchResults(items) {
  searchItemsContainer.innerHTML = '';
  if (!items.length) {
    searchItemsContainer.innerHTML = '<p>No items found.</p>';
    return;
  }
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.description || 'No description'}</p>
      <p class="muted">Owner: ${item.owner_name}</p>
      <span class="status ${item.status}">${item.status}</span>
    `;
    searchItemsContainer.appendChild(card);
  });
}

function clearSearchMessage() {
  if (searchMessage) {
    searchMessage.textContent = '';
    searchMessage.classList.add('hidden');
  }
}

function showSearchMessage(message) {
  if (searchMessage) {
    searchMessage.textContent = message;
    searchMessage.classList.remove('hidden');
  }
}

async function searchDashboard(query) {
  const token = localStorage.getItem('token');
  if (!token) {
    showSearchMessage('Please log in to search.');
    return;
  }

  try {
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      const error = await response.json();
      showSearchMessage(error.error || 'Search failed. Please try again.');
      if (searchSection) {
        searchSection.classList.add('hidden');
      }
      return;
    }

    clearSearchMessage();
    const { users, items } = await response.json();
    renderUserSearchResults(users);
    renderItemSearchResults(items);
    if (searchSection) {
      searchSection.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Search error:', error);
    showSearchMessage('Search failed. Please try again.');
    if (searchSection) {
      searchSection.classList.add('hidden');
    }
  }
}

async function toggleFollow(userId, isFollowed) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to follow users.');
    return;
  }

  const method = isFollowed ? 'DELETE' : 'POST';
  try {
    const response = await fetch(`/api/users/${userId}/follow`, {
      method,
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const query = dashboardSearchInput?.value.trim();
      if (query) {
        searchDashboard(query);
      }
    } else {
      const error = await response.json();
      alert('Follow action failed: ' + (error.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Follow action error:', error);
    alert('Could not update follow status.');
  }
}

async function handleSearch() {
  const query = dashboardSearchInput?.value.trim();
  if (!query) {
    if (searchSection) {
      searchSection.classList.add('hidden');
    }
    showSearchMessage('Enter a search term for users or items.');
    return;
  }
  clearSearchMessage();
  await searchDashboard(query);
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
  const token = localStorage.getItem('token');
  try {
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

async function approveRequest(requestId) {
  const issueDate = prompt('Enter issue date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
  if (!issueDate) return;

  const dueDate = prompt('Enter due date (YYYY-MM-DD):');
  if (!dueDate) return;

  const duration = prompt('Enter duration in days:');
  if (!duration) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/borrows/${requestId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        issueDate,
        dueDate,
        duration: parseInt(duration)
      })
    });

    if (response.ok) {
      alert('Request approved successfully!');
      loadDashboard(); // Reload dashboard
    } else {
      const error = await response.json();
      alert('Failed to approve request: ' + error.error);
    }
  } catch (error) {
    console.error('Error approving request:', error);
    alert('Failed to approve request');
  }
}

async function declineRequest(requestId) {
  if (!confirm('Are you sure you want to decline this borrow request?')) return;

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/borrows/${requestId}/decline`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      alert('Request declined successfully!');
      loadDashboard(); // Reload dashboard
    } else {
      const error = await response.json();
      alert('Failed to decline request: ' + error.error);
    }
  } catch (error) {
    console.error('Error declining request:', error);
    alert('Failed to decline request');
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
  requestsContainer = document.getElementById('dashboardRequestsList');
  communitySearchInput = document.getElementById('searchInput');
  dashboardSearchInput = document.getElementById('dashboardSearchInput');
  searchButton = document.getElementById('dashboardSearchButton');
  searchUsersContainer = document.getElementById('dashboardUsersSearchResults');
  searchItemsContainer = document.getElementById('dashboardItemsSearchResults');
  searchSection = document.getElementById('dashboardSearchSection');
  searchMessage = document.getElementById('dashboardSearchMessage');

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (searchButton) {
    searchButton.addEventListener('click', handleSearch);
  }
  if (dashboardSearchInput) {
    dashboardSearchInput.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    });
  }
  if (searchSection) {
    searchSection.classList.add('hidden');
  }
  if (searchMessage) {
    searchMessage.classList.add('hidden');
  }

  if (communitySearchInput) {
    communitySearchInput.addEventListener('input', filterAndDisplay);
  }

  initializeTheme();
  loadDashboard();
});