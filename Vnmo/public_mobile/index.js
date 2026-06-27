// index.js
const html = document.documentElement;
let logoLink;
let itemsContainer;
let featuredCommunitiesGrid;
let statItems;
let statUsers;
let statBorrows;
let searchInput;
let searchResultsDropdown;
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
  itemsContainer.innerHTML = Array(3).fill(0).map(() => '<div class="skeleton skeleton-card"></div>').join('');
  try {
    const response = await fetch('/api/items');
    if (response.ok) {
      const items = await response.json();
      allItems = items;
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      let filteredItems = [...items];
      if (user) {
        filteredItems = filteredItems.filter(item => Number(item.owner_id) !== Number(user.id));
      }
      const newItems = filteredItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
      if (newItems.length === 0 && items.length > 0) {
        itemsContainer.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 2rem;">No new uploads from others yet.</p>';
      } else if (items.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align: center; color: var(--muted); padding: 2rem;">No Items Available</p>';
      } else {
        displayItems(newItems);
      }
    }
  } catch (error) {
    console.error('Error loading items:', error);
  }
}

async function loadFeaturedCommunities() {
  if (!featuredCommunitiesGrid) return;
  try {
    const res = await fetch('/api/communities');
    if (res.ok) {
      const communities = await res.json();
      const featured = communities.slice(0, 3);
      featuredCommunitiesGrid.innerHTML = featured.map(c => `
                <div class="community-card" onclick="window.location.href='community_Home.html?id=${c.id}'" style="background: var(--card-bg); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; cursor: pointer; transition: all 0.3s ease;">
                    <h4 style="margin-top: 0; color: var(--accent);">${c.name}</h4>
                    <p style="font-size: 0.9rem; color: var(--muted); margin-bottom: 1rem;">${c.description || 'A vibrant community of sharers.'}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; opacity: 0.8;">
                        <span>📍 ${c.city || 'Global'}</span>
                        <span class="btn small outline">Visit</span>
                    </div>
                </div>
            `).join('');
    }
  } catch (err) {
    console.error('Error loading featured communities:', err);
  }
}

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

function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark style="background: rgba(79, 124, 222, 0.2); color: inherit; padding: 0 2px; border-radius: 4px;">$1</mark>');
}

function displayDropdownResults(items) {
  if (!searchResultsDropdown) return;
  const query = searchInput.value.trim();
  searchResultsDropdown.innerHTML = '';
  if (items.length === 0) {
    searchResultsDropdown.innerHTML = '<div style="padding: 1rem; color: var(--muted); text-align: center;">No items found.</div>';
  } else {
    items.forEach(item => {
      const itemEl = document.createElement('div');
      itemEl.className = 'dropdown-item';
      const name = highlightText(item.name || '', query);
      const owner = highlightText(item.owner_name || 'Anonymous', query);
      itemEl.innerHTML = `
        <div class="dropdown-info">
          <h5>${name}</h5>
          <p>Owner: ${owner}</p>
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

function displayItems(items) {
  if (!itemsContainer) return;
  itemsContainer.innerHTML = '';
  items.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.style.cursor = 'pointer';
    itemCard.addEventListener('click', () => {
      window.location.href = `item_View.html?id=${item.id}`;
    });
    itemCard.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1;">
        <img src="${item.imageBase64 || 'assets/untitled.png'}" alt="${item.name}" style="width: 60px; height: 60px; border-radius: 12px; object-fit: cover; background: #f1f5f9;">
        <div class="card-info">
          <h4>${item.name}</h4>
          <p style="margin-bottom: 0.25rem; opacity: 0.7;">Owner: ${item.owner_name || 'Anonymous'}</p>
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

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    if (response.ok) {
      const stats = await response.json();
      animateValue(statItems, 0, stats.total_items || 0, 1000);
      animateValue(statUsers, 0, stats.total_users || 0, 1000);
      animateValue(statBorrows, 0, stats.active_borrows || 0, 1000);
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function animateValue(obj, start, end, duration) {
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', () => {
  logoLink = document.getElementById('logoLink');
  itemsContainer = document.getElementById('itemsContainer');
  featuredCommunitiesGrid = document.getElementById('featuredCommunitiesGrid');
  statItems = document.getElementById('statItems');
  statUsers = document.getElementById('statUsers');
  statBorrows = document.getElementById('statBorrows');
  searchInput = document.getElementById('searchInput');
  searchResultsDropdown = document.getElementById('searchResultsDropdown');

  if (logoLink) logoLink.addEventListener('click', handleLogoClick);

  initializeTheme();
  loadStats();
  loadAllItems();
  loadFeaturedCommunities();

  const revealOnScroll = () => {
    document.querySelectorAll('.reveal, .card').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50) el.classList.add('active');
    });
  };
  window.addEventListener('scroll', revealOnScroll);
  setTimeout(revealOnScroll, 100);

  const token = localStorage.getItem('token');
  if (token) {
<<<<<<< HEAD
    const authButtons = document.getElementById('authButtons');
    if (authButtons) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      authButtons.style.display = 'flex';
      authButtons.style.alignItems = 'center';
      authButtons.innerHTML = `
        <a href="user_Dashboard.html" class="btn primary" style="margin-right: 1rem;">Go to Dashboard</a>
        <a href="user_Profile.html" class="header-avatar" style="text-decoration:none; width:36px; height:36px; border-radius:50%; background:var(--accent); color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; flex-shrink:0;">${user.name ? user.name.charAt(0).toUpperCase() : 'U'}</a>
      `;
    }
=======
    const guestButtons = document.querySelectorAll('.auth-buttons a.btn');
    guestButtons.forEach(btn => btn.style.display = 'none');
>>>>>>> 5d0a726 (wer)
  }
});