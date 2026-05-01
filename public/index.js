// index.js
const html = document.documentElement;
let themeToggle;
let logoLink;
let itemsContainer;
let statItems;
let statUsers;
let statBorrows;

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

function handleLogoClick(event) {
  event.preventDefault();
  const token = localStorage.getItem('token');
  if (token) {
    window.location.href = 'user_Profile.html';
  } else {
    window.location.href = 'login.html';
  }
}

async function loadNewItems() {
  if (!itemsContainer) return;

  try {
    const response = await fetch('http://localhost:3000/api/items');
    if (response.ok) {
      const items = await response.json();
      const newItems = items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
      displayItems(newItems);
    } else {
      console.error('Failed to load items');
    }
  } catch (error) {
    console.error('Error loading items:', error);
  }
}

function displayItems(items) {
  if (!itemsContainer) return;
  itemsContainer.innerHTML = '';
  if (items.length === 0) {
    itemsContainer.innerHTML = '<p>No items available yet.</p>';
    return;
  }
  items.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'item-card';
    itemCard.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.description || 'No description'}</p>
      <span class="status ${item.status}">${item.status}</span>
    `;
    itemsContainer.appendChild(itemCard);
  });
}

async function loadStats() {
  try {
    const response = await fetch('http://localhost:3000/api/stats');
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
  themeToggle = document.getElementById('themeToggle');
  logoLink = document.getElementById('logoLink');
  itemsContainer = document.getElementById('itemsContainer');
  statItems = document.getElementById('statItems');
  statUsers = document.getElementById('statUsers');
  statBorrows = document.getElementById('statBorrows');

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  if (logoLink) {
    logoLink.addEventListener('click', handleLogoClick);
  }

  initializeTheme();
  loadStats();
  loadNewItems();
});