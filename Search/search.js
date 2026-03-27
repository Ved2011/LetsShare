// search.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const categorySelect = document.getElementById('category');
const conditionSelect = document.getElementById('condition');
const sortBySelect = document.getElementById('sortBy');
const resultsContainer = document.getElementById('results');
const errorMessage = document.getElementById('errorMessage');

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIcon(nextTheme);
}

function showError(message) {
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
}

function clearError() {
  errorMessage.style.display = 'none';
  errorMessage.textContent = '';
}

function createResultCard(item) {
  const card = document.createElement('div');
  card.className = 'result-card';

  const image = document.createElement('div');
  image.className = 'result-image';
  image.textContent = '📦';

  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = item.title;

  const meta = document.createElement('div');
  meta.className = 'result-meta';
  meta.textContent = `${item.category} • ${item.condition}`;

  const description = document.createElement('p');
  description.textContent = item.description;
  description.style.margin = '0';
  description.style.color = 'var(--muted)';
  description.style.fontSize = '0.9rem';
  description.style.lineHeight = '1.4';

  card.appendChild(image);
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(description);

  return card;
}

const sampleItems = [
  {
    title: 'Bluetooth Headphones',
    category: 'Electronics',
    condition: 'Like New',
    description: 'Comfortable wireless headphones with long battery life.',
  },
  {
    title: 'Denim Jacket',
    category: 'Clothing',
    condition: 'Good',
    description: 'Classic denim jacket with light wear.',
  },
  {
    title: 'Wooden Coffee Table',
    category: 'Furniture',
    condition: 'Fair',
    description: 'Sturdy small table perfect for living room use.',
  },
  {
    title: 'Best-Selling Novel',
    category: 'Books',
    condition: 'New',
    description: 'Hardcover book in perfect condition.',
  },
  {
    title: 'Vintage Camera',
    category: 'Other',
    condition: 'Good',
    description: 'Retro camera for collectors and hobbyists.',
  },
];

function normalizeText(text) {
  return text.toLowerCase().trim();
}

function filterItems() {
  clearError();
  const query = normalizeText(searchInput.value);
  const category = categorySelect.value;
  const condition = conditionSelect.value;
  const sortBy = sortBySelect.value;

  let filtered = sampleItems.filter(item => {
    const matchesQuery = query === '' || normalizeText(item.title).includes(query) || normalizeText(item.description).includes(query);
    const matchesCategory = category === '' || normalizeText(item.category) === normalizeText(category);
    const matchesCondition = condition === '' || normalizeText(item.condition) === normalizeText(condition.replace('-', ' '));
    return matchesQuery && matchesCategory && matchesCondition;
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<div class="no-results"><p>No items matched your search. Try a different filter or keyword.</p></div>';
    return;
  }

  if (sortBy === 'popular') {
    filtered = filtered.slice().reverse();
  } else if (sortBy === 'recent') {
    filtered = filtered.slice();
  }

  resultsContainer.innerHTML = '';
  filtered.forEach(item => resultsContainer.appendChild(createResultCard(item)));
}

searchButton.addEventListener('click', function (event) {
  event.preventDefault();
  filterItems();
});

searchInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    filterItems();
  }
});

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  clearError();
});
