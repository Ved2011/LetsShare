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
};

async function loadOverdueItems() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/borrows/overdue', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const overdueItems = await response.json();
      displayOverdueItems(overdueItems);
    }
  } catch (error) {
    console.error('Error loading overdue items:', error);
  }
}

function displayOverdueItems(items) {
  const overdueSection = document.getElementById('overdueSection');
  const overdueList = document.getElementById('overdueItemsList');
  if (!overdueSection || !overdueList) return;

  if (items.length === 0) {
    overdueSection.style.display = 'none';
    return;
  }

  overdueSection.style.display = 'block';
  overdueList.innerHTML = '';

  items.forEach(item => {
    const isOwner = item.owner_id === JSON.parse(localStorage.getItem('user')).id;
    const days = Math.floor(item.days_overdue || 1); // fallback if null

    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.background = '#fff';
    card.style.border = '1px solid rgba(220, 53, 69, 0.2)';
    
    card.innerHTML = `
      <div class="card-info">
        <h4 style="color: #dc3545;">${item.item_name}</h4>
        <p style="font-weight: 500;">
          ${isOwner ? `Your item is overdue by ${days} days (Borrowed by: ${item.borrower_name})` : `You are overdue by ${days} days! (Owner: ${item.owner_id})`}
        </p>
      </div>
      <div class="item-meta">
        <span class="status error" style="background: rgba(220,53,69,0.1); color: #dc3545;">Overdue</span>
        <div class="item-actions">
           ${!isOwner ? `<button class="btn small" style="background: #dc3545; color: white; border-color: #dc3545;" onclick="returnItem(${item.id})">Return Now</button>` : ''}
        </div>
      </div>
    `;
    overdueList.appendChild(card);
  });
}

async function returnItem(borrowId) {
  window.showConfirm('Are you sure you want to return this item?', async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/borrows/${borrowId}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        window.showAlert('Item returned successfully!');
        loadDashboard();
        loadOverdueItems();
      } else {
        const err = await response.json();
        window.showAlert('Failed to return item: ' + err.error, 'error');
      }
    } catch (error) {
      console.error('Return item error:', error);
      window.showAlert('Failed to return item', 'error');
    }
  });
}

window.returnItem = returnItem;

async function loadComplaints() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/complaints', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const complaints = await response.json();
      displayComplaints(complaints);
    }
  } catch (error) {
    console.error('Error loading complaints:', error);
  }
}

function displayComplaints(complaints) {
  const complaintsSection = document.getElementById('complaintsSection');
  const complaintsList = document.getElementById('complaintsList');
  if (!complaintsSection || !complaintsList) return;

  if (complaints.length === 0) {
    complaintsSection.style.display = 'none';
    return;
  }

  complaintsSection.style.display = 'block';
  complaintsList.innerHTML = '';

  complaints.forEach(complaint => {
    const isAccused = complaint.accused_id === JSON.parse(localStorage.getItem('user')).id;
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.background = '#fff';
    card.style.border = '1px solid rgba(245, 158, 11, 0.2)';
    
    card.innerHTML = `
      <div class="card-info">
        <h4 style="color: #d97706;">Issue: ${complaint.issue_type} - ${complaint.item_name}</h4>
        <p style="font-weight: 500;">
          ${isAccused ? `A complaint was filed against you regarding: ${complaint.description}` : `You filed a complaint against ${complaint.borrower_name}: ${complaint.description}`}
        </p>
      </div>
      <div class="item-meta">
        <span class="status error" style="background: rgba(245,158,11,0.1); color: #d97706;">${complaint.status}</span>
      </div>
    `;
    complaintsList.appendChild(card);
  });
}

function initDashboard() {
  loadCounts();
  loadAllItems();
  loadMyItems();
  loadBorrowedItems();
  loadRequests();
  loadOverdueItems();
  loadComplaints();
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
      const myBorrows = borrows.filter(borrow => Number(borrow.borrower_id) === Number(user.id));
      dashboardBorrows.textContent = myBorrows.length;
      displayBorrowedItems(myBorrows);

      // Load borrow requests for items owned by this user
      const myRequests = borrows.filter(borrow => borrow.status === 'requested' && Number(borrow.owner_id) === Number(user.id));
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
    card.style.cursor = 'pointer';
    
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        window.location.href = `item_View.html?id=${item.id}`;
      }
    });

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1;">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #f1f5f9;">
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
    card.style.cursor = 'pointer';

    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') {
        window.location.href = `item_View.html?id=${item.id}`;
      }
    });

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1;">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; background: #f1f5f9;">
        <div class="card-info">
          <h4>${item.name}</h4>
          <p style="margin-bottom: 0.25rem; opacity: 0.7;">Rs. ${Number(item.price_per_day || 0).toFixed(2)} / day</p>
          <p style="font-size: 0.8rem; color: var(--muted); margin: 0;">(You earn: Rs. ${(Number(item.price_per_day || 0) * 0.85).toFixed(2)})</p>
        </div>
      </div>
      <div class="item-meta">
        <div class="item-actions">
          <button class="btn small" onclick="editItem(${item.id})">Edit</button>
          <button class="btn small danger" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      </div>
    `;
    myItemsContainer.appendChild(card);
  });
}

function displayBorrowedItems(borrows) {
  if (!borrowedItemsContainer) return;
  borrowedItemsContainer.innerHTML = '';
  if (!borrows.length) {
    borrowedItemsContainer.innerHTML = '<p>You haven\'t borrowed any items at the moment.</p>';
    return;
  }
  borrows.forEach(borrow => {
    const card = document.createElement('div');
    card.className = 'item-card';
    const isPending = borrow.status === 'requested';
    card.innerHTML = `
      <div class="card-info">
        <h4>${borrow.item_name || 'Unknown Item'}</h4>
        <p class="muted">${isPending ? 'Waiting for owner approval' : `Due: ${borrow.due_date ? new Date(borrow.due_date).toLocaleDateString() : 'N/A'}`}</p>
      </div>
      <div class="item-meta">
        <span class="status ${borrow.status}">${isPending ? 'Pending' : 'Borrowed'}</span>
        <div class="item-actions">
          ${isPending ? '' : `<button class="btn small outline" style="color: #dc3545; border-color: #dc3545;" onclick="window.location.href='Complains.html?borrowId=${borrow.borrow_id || borrow.id}&itemName=${encodeURIComponent(borrow.item_name)}&borrowerName=${encodeURIComponent(borrow.owner_name)}'">Complain</button>
          <button class="btn small" onclick="returnItem(${borrow.id})">Return</button>`}
        </div>
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
      <div class="card-info">
        <h4>${request.item_name || 'Unknown Item'}</h4>
        <p>Requested by: ${request.borrower_name} (${request.borrower_email})</p>
        <p>Requested on: ${new Date(request.created_at).toLocaleDateString()}</p>
      </div>
      
      <div class="item-meta">
        <div id="actions-${request.id}" class="item-actions">
          <button class="btn small success" onclick="showApproveForm(${request.id})">Approve</button>
          <button class="btn small danger" onclick="declineRequest(${request.id})">Decline</button>
        </div>

        <div id="form-${request.id}" class="approve-form hidden">
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" id="dueDate-${request.id}">
          </div>
          <div class="form-group">
            <label>Duration (days)</label>
            <input type="number" id="duration-${request.id}" placeholder="e.g. 7" style="width: 100px;">
          </div>
          <div class="item-actions">
            <button class="btn small success" onclick="submitApproval(${request.id})">Confirm</button>
            <button class="btn small outline" onclick="hideApproveForm(${request.id})">Cancel</button>
          </div>
        </div>
      </div>
    `;
    requestsContainer.appendChild(card);
  });
}

function showApproveForm(id) {
  document.getElementById(`actions-${id}`).classList.add('hidden');
  document.getElementById(`form-${id}`).classList.remove('hidden');
}

function hideApproveForm(id) {
  document.getElementById(`actions-${id}`).classList.remove('hidden');
  document.getElementById(`form-${id}`).classList.add('hidden');
}

async function submitApproval(requestId) {
  const dueDate = document.getElementById(`dueDate-${requestId}`).value;
  const duration = document.getElementById(`duration-${requestId}`).value;

  if (!dueDate || !duration) {
    window.showAlert('Please fill in all fields.', 'error');
    return;
  }

  const token = localStorage.getItem('token');
  try {
    const response = await fetch(`/api/borrows/${requestId}/approve`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        issueDate: new Date().toISOString().split('T')[0],
        dueDate,
        duration: parseInt(duration)
      })
    });

    if (response.ok) {
      window.showAlert('Request approved successfully!');
      loadDashboard();
    } else {
      const error = await response.json();
      window.showAlert('Failed to approve request: ' + error.error, 'error');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    window.showAlert('Failed to approve request', 'error');
  }
}

window.showApproveForm = showApproveForm;
window.hideApproveForm = hideApproveForm;
window.submitApproval = submitApproval;

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
    window.showAlert('Please log in to follow users.', 'error');
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
      window.showAlert('Follow action failed: ' + (error.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Follow action error:', error);
    window.showAlert('Could not update follow status.', 'error');
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
  window.location.href = `ItemForm.html?id=${itemId}`;
}

async function updateItem(itemId, newName) {
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
      window.showAlert('Item updated successfully');
      loadDashboard(); // Reload dashboard
    } else {
      window.showAlert('Failed to update item', 'error');
    }
  } catch (error) {
    console.error('Error updating item:', error);
  }
}

async function deleteItem(itemId) {
  window.showConfirm('Are you sure you want to delete this item?', async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        window.showAlert('Item deleted successfully');
        loadDashboard(); // Reload dashboard
      } else {
        const error = await response.json();
        window.showAlert('Failed to delete item: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  });
}

async function returnItem(borrowId) {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/borrows', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const borrows = await response.json();
      const borrow = borrows.find(b => b.id === borrowId);
      if (borrow) {
        // Redirect to return page with pre-filled info
        const user = JSON.parse(localStorage.getItem('user'));
        const params = new URLSearchParams({
          itemId: borrow.item_id,
          itemName: borrow.item_name,
          ownerEmail: borrow.owner_email || '', 
          borrowerEmail: user.email
        });
        window.location.href = `item_Return.html?${params.toString()}`;
      }
    }
  } catch (error) {
    console.error('Error redirecting to return page:', error);
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
      window.showAlert('Request approved successfully!');
      loadDashboard(); // Reload dashboard
    } else {
      const error = await response.json();
      window.showAlert('Failed to approve request: ' + error.error, 'error');
    }
  } catch (error) {
    console.error('Error approving request:', error);
    window.showAlert('Failed to approve request', 'error');
  }
}

async function declineRequest(requestId) {
  window.showConfirm('Are you sure you want to decline this borrow request?', async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/borrows/${requestId}/decline`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        window.showAlert('Request declined successfully!');
        loadDashboard(); // Reload dashboard
      } else {
        const error = await response.json();
        window.showAlert('Failed to decline request: ' + error.error, 'error');
      }
    } catch (error) {
      console.error('Error declining request:', error);
      window.showAlert('Failed to decline request', 'error');
    }
  });
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
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const headerAvatar = document.getElementById('headerAvatar');
  if (headerAvatar && user.name) {
    headerAvatar.textContent = user.name.charAt(0).toUpperCase();
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    });
  }

  loadDashboard();
});