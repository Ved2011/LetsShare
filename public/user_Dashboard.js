const html = document.documentElement;
let themeToggle;
let dashboardItems;
let dashboardBorrows;
let dashboardMyItems;
let recentItemsContainer;
let myItemsContainer;
let borrowedItemsContainer;
let requestsContainer;
let communitySearchInput;
let dashboardSearchInput;
let searchButton;
let searchCommunitiesContainer;
let searchSection;
let searchMessage;
let joinedCommunitiesContainer;
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
  if (!complaintsSection) return;

  if (complaints.length === 0) {
    complaintsSection.style.display = 'none';
    return;
  }

  window.allComplaints = complaints;
  renderFilteredComplaints();
}

function renderFilteredComplaints() {
  const complaintsSection = document.getElementById('complaintsSection');
  const complaintsList = document.getElementById('complaintsList');
  if (!complaintsSection || !complaintsList || !window.allComplaints) return;

  complaintsSection.style.display = 'block';
  complaintsList.innerHTML = '';

  const severityFilter = document.getElementById('complaintSeverityFilter')?.value || 'all';
  const typeFilter = document.getElementById('complaintTypeFilter')?.value || 'all';

  let filtered = window.allComplaints;

  if (severityFilter !== 'all') {
    filtered = filtered.filter(c => c.severity === severityFilter);
  }
  if (typeFilter !== 'all') {
    filtered = filtered.filter(c => c.issue_type === typeFilter);
  }

  if (filtered.length === 0) {
    complaintsList.innerHTML = '<p class="empty-state">No complaints match the selected filters.</p>';
    return;
  }

  filtered.forEach(complaint => {
    const isAccused = complaint.accused_id === JSON.parse(localStorage.getItem('user')).id;
    const card = document.createElement('div');
    card.className = 'item-card';
    card.style.background = 'var(--card-bg)';
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

window.renderFilteredComplaints = renderFilteredComplaints;

async function loadWarnings() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/users/warnings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const warnings = await response.json();
      displayWarnings(warnings);
    }
  } catch (error) {
    console.error('Error loading warnings:', error);
  }
}

function displayWarnings(warnings) {
  const warningsSection = document.getElementById('warningsSection');
  const warningsList = document.getElementById('warningsList');
  if (!warningsSection || !warningsList) return;

  if (warnings.length === 0) {
    warningsSection.style.display = 'none';
    return;
  }

  warningsSection.style.display = 'block';
  warningsList.innerHTML = warnings.map(w => `
    <div class="item-card" style="background: #fff; border: 1px solid rgba(220, 53, 69, 0.2); padding: 1rem; border-radius: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <span class="badge" style="background: rgba(220,53,69,0.1); color: #dc3545; font-size: 0.75rem; padding: 0.25rem 0.5rem; font-weight: bold; border-radius: 4px;">${w.category}</span>
        <span style="font-size: 0.8rem; color: var(--muted);">${new Date(w.created_at).toLocaleDateString()}</span>
      </div>
      <p style="font-size: 0.9rem; font-style: italic; color: var(--text); margin: 0.25rem 0;">"${w.message}"</p>
      <small style="color: var(--muted); font-size: 0.75rem;">Issued by: ${w.admin_name || 'System'}</small>
    </div>
  `).join('');
}

function initDashboard() {
  loadCounts();
  loadJoinedCommunities();
  loadMyItems();
  loadBorrowedItems();
  loadRequests();
  loadOverdueItems();
  loadComplaints();
  loadWarnings();
}

async function loadDashboard() {
  const token = localStorage.getItem('token');
  let user = JSON.parse(localStorage.getItem('user') || 'null');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const statsResponse = await fetch('/api/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      if (dashboardItems) dashboardItems.textContent = stats.total_items || 0;
    }

    const itemsResponse = await fetch('/api/items');
    if (itemsResponse.ok) {
      const items = await itemsResponse.json();
      allItems = items; 
      const myItems = items.filter(item => item.owner_id === user.id);
      dashboardMyItems.textContent = myItems.length;
      displayMyItems(myItems);
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

      const myRequests = borrows.filter(borrow => borrow.status === 'requested' && Number(borrow.owner_id) === Number(user.id));
      displayRequests(myRequests);
      
      // Personalized Greeting
      const heading = document.querySelector('.section-heading h2');
      if (heading && user.name) {
          heading.innerHTML = `Welcome back, ${user.name.split(' ')[0]}! 👋`;
      }
    }
    
    // Add Reveal Animations
    document.querySelectorAll('.card').forEach(card => card.classList.add('reveal'));
    const revealOnScroll = () => {
        document.querySelectorAll('.reveal').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) el.classList.add('active');
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    loadJoinedCommunities();
    loadOverdueItems();
    loadComplaints();
    loadWarnings();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

async function loadWarnings() {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('/api/users/warnings', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const warnings = await response.json();
      displayWarnings(warnings);
    }
  } catch (error) {
    console.error('Error loading warnings:', error);
  }
}

function displayWarnings(warnings) {
  const warningsSection = document.getElementById('warningsSection');
  const warningsList = document.getElementById('warningsList');
  const warningCount = document.getElementById('warningCount');
  if (!warningsSection || !warningsList || !warningCount) return;

  if (warnings.length === 0) {
    warningsSection.style.display = 'none';
    return;
  }

  warningsSection.style.display = 'block';
  warningCount.textContent = warnings.length;
  warningsList.innerHTML = '';

  warnings.forEach(warning => {
    const card = document.createElement('div');
    card.style.background = 'var(--card-bg)';
    card.style.border = '1px solid rgba(239, 68, 68, 0.2)';
    card.style.padding = '1rem';
    card.style.borderRadius = '8px';
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <h4 style="color: #ef4444; margin: 0 0 0.5rem 0;">${warning.severity.toUpperCase()} Severity</h4>
        <small style="color: var(--muted);">${new Date(warning.created_at).toLocaleDateString()}</small>
      </div>
      <p style="margin: 0; font-size: 0.9rem;">${warning.reason}</p>
    `;
    warningsList.appendChild(card);
  });
}

function handleInvalidToken() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

async function loadJoinedCommunities() {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/communities', { headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) {
      const communities = await res.json();
      const user = JSON.parse(localStorage.getItem('user'));
      const joined = communities.filter(c => c.is_member || c.admin_id === user.id);
      displayJoinedCommunities(joined);
    }
  } catch (err) {
    console.error('Error loading joined communities:', err);
  }
}

function displayJoinedCommunities(communities) {
  if (!joinedCommunitiesContainer) return;
  if (communities.length === 0) {
    joinedCommunitiesContainer.innerHTML = '<p class="empty-state">You haven\'t joined any communities yet.</p>';
    return;
  }
  joinedCommunitiesContainer.innerHTML = communities.map(c => renderCommunityCard(c)).join('');
}

function renderCommunityCard(c) {
  const user = JSON.parse(localStorage.getItem('user'));
  return `
    <div class="community-card" onclick="window.location.href='community_Home.html?id=${c.id}'" style="background: var(--card-bg); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; cursor: pointer; transition: transform 0.2s;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <h3 style="margin: 0;">${c.name}</h3>
          <span class="community-badge ${c.is_private ? 'badge-private' : 'badge-public'}" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: bold;">${c.is_private ? 'Private' : 'Public'}</span>
      </div>
      <p style="color: var(--muted); font-size: 0.85rem; margin: 0.5rem 0;">📍 ${c.address}</p>
      <div style="margin-top: 1rem; display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted);">
          <span>👥 ${c.member_count} members</span>
          ${c.is_member ? '<span style="color: var(--accent); font-weight: bold;">Joined</span>' : ''}
          ${c.admin_id === user.id ? '<span style="color: #10b981; font-weight: bold;">Admin</span>' : ''}
      </div>
    </div>
  `;
}

function displayMyItems(items) {
  if (!myItemsContainer) return;
  myItemsContainer.innerHTML = '';
  if (!items.length) {
    myItemsContainer.innerHTML = '<p class="empty-state">You haven\'t uploaded any items yet.</p>';
    return;
  }
  
  // Sort by newest and limit to 3
  const recentItems = [...items].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
  
  myItemsContainer.innerHTML = recentItems.map(item => `
    <div class="community-card" onclick="window.location.href='item_View.html?id=${item.id}'" style="display: flex; flex-direction: column; gap: 0.75rem; padding: 1rem;">
      <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" style="width: 100%; height: 160px; border-radius: 12px; object-fit: cover; background: #f1f5f9;">
      <div style="flex: 1;">
        <h4 style="margin: 0; font-size: 1rem; line-height: 1.4;">${item.name}</h4>
        <p style="color: var(--accent); font-weight: 700; margin-top: 0.25rem;">Rs. ${Number(item.price_per_day || 0).toFixed(2)} / day</p>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <button class="btn small outline" style="flex: 1; padding: 0.4rem;" onclick="event.stopPropagation(); editItem(${item.id})">Edit</button>
        <button class="btn small danger" style="padding: 0.4rem;" onclick="event.stopPropagation(); deleteItem(${item.id})">🗑️</button>
      </div>
    </div>
  `).join('');
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

async function searchDashboard(query) {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch('/api/communities', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const communities = await response.json();
      const filtered = communities.filter(c => 
        c.name.toLowerCase().includes(query.toLowerCase()) || 
        c.address.toLowerCase().includes(query.toLowerCase())
      );
      
      searchCommunitiesContainer.innerHTML = filtered.length 
        ? filtered.map(c => renderCommunityCard(c)).join('')
        : '<p class="empty-state">No communities found.</p>';
      
      searchSection.classList.remove('hidden');
    }
  } catch (err) {
    console.error('Search error:', err);
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

  dashboardBorrows = document.getElementById('dashboardBorrows');
  dashboardMyItems = document.getElementById('dashboardMyItems');
  joinedCommunitiesContainer = document.getElementById('joinedCommunitiesGrid');
  myItemsContainer = document.getElementById('dashboardMyItemsList');
  borrowedItemsContainer = document.getElementById('dashboardBorrowedItemsList');
  requestsContainer = document.getElementById('dashboardRequestsList');
  dashboardSearchInput = document.getElementById('dashboardSearchInput');
  searchButton = document.getElementById('dashboardSearchButton');
  searchCommunitiesContainer = document.getElementById('dashboardCommunitiesSearchResults');
  searchSection = document.getElementById('dashboardSearchSection');
  searchMessage = document.getElementById('dashboardSearchMessage');

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  if (dashboardSearchInput) {
    dashboardSearchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim();
        if (query) {
            searchDashboard(query);
        } else {
            if (searchSection) searchSection.classList.add('hidden');
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