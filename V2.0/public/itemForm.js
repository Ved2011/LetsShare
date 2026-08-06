// itemForm.js

// ============= DARK MODE THEME TOGGLE =============
const html = document.documentElement;

let themeToggle, nameInput, itemNameInput, itemImageInput, brandInput, categorySelect, ageSelect, conditionSelect, descriptionInput, pricePerDayInput, visibilitySelect;
let submitButton, clearButton, confirmationMessage, errorMessage, itemDetails, previewImage, imagePreviewContainer;
let currentImageUrl = null;

// Load theme from localStorage or system preference
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function safeToggleTheme() {
  if (!themeToggle) return;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon(newTheme);
}

function clearMessages() {
  if (confirmationMessage) confirmationMessage.style.display = 'none';
  if (errorMessage) errorMessage.style.display = 'none';
}

function getCachedAuth() {
  return {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null')
  };
}

async function recoverSession() {
  const { token } = getCachedAuth();
  if (!token) return false;
  try {
    const response = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const user = await response.json();
      localStorage.setItem('user', JSON.stringify(user));
      return true;
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (err) {
    console.warn('Failed to recover auth session:', err);
  }
  return false;
}

function showError(message) {
  if (errorMessage) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = message;
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (confirmationMessage) confirmationMessage.style.display = 'none';
}

function showSuccess(message) {
  if (confirmationMessage) {
    confirmationMessage.style.display = 'block';
    confirmationMessage.textContent = message;
    confirmationMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (errorMessage) errorMessage.style.display = 'none';
}

function isAllFieldsFilled() {
  return (
    nameInput?.value.trim() !== '' &&
    itemNameInput?.value.trim() !== '' &&
    brandInput?.value.trim() !== '' &&
    categorySelect?.value !== '' &&
    ageSelect?.value !== '' &&
    conditionSelect?.value !== '' &&
    descriptionInput?.value.trim() !== '' &&
    pricePerDayInput?.value.trim() !== ''
  );
}

async function loadItemForEdit(id) {
  try {
    const response = await fetch(`/api/items/${id}`);
    if (response.ok) {
      const item = await response.json();
      if (nameInput) nameInput.value = item.owner_name || '';
      itemNameInput.value = item.name;
      brandInput.value = item.brand || '';
      categorySelect.value = item.category || '';
      ageSelect.value = item.age || '';
      conditionSelect.value = item.condition || '';
      descriptionInput.value = item.description || '';
      pricePerDayInput.value = item.price_per_day || 0;
      if (visibilitySelect) visibilitySelect.value = item.exclusive_community_id || '';
      
      if (item.imageBase64) {
        previewImage.src = item.imageBase64;
        imagePreviewContainer.style.display = 'block';
      }
      
      const event = new Event('input');
      pricePerDayInput.dispatchEvent(event);
    }
  } catch (err) {
    console.error('Error loading item for edit:', err);
  }
}

async function submitForm(editId = null) {
  console.log('Attempting to submit form. editId:', editId);
  
  if (!isAllFieldsFilled()) {
    showError('Please fill in all required fields. Item image is optional.');
    return;
  }

  const { token } = getCachedAuth();
  if (!token) {
    showError('Please log in first.');
    return;
  }

  const formData = new FormData();
  formData.append('owner_name', nameInput.value.trim());
  formData.append('name', itemNameInput.value.trim());
  formData.append('brand', brandInput.value.trim());
  formData.append('category', categorySelect.value);
  formData.append('age', ageSelect.value);
  formData.append('condition', conditionSelect.value);
  formData.append('description', descriptionInput.value.trim());
  formData.append('price_per_day', pricePerDayInput.value);
  if (visibilitySelect && visibilitySelect.value) {
    formData.append('exclusive_community_id', visibilitySelect.value);
  }
  
  if (itemImageInput.files[0]) {
    formData.append('image', itemImageInput.files[0]);
  }

  try {
    const url = editId ? `/api/items/${editId}` : '/api/items';
    const method = editId ? 'PUT' : 'POST';
    
    console.log(`Sending ${method} request to ${url}`);
    
    const response = await fetch(url, {
      method: method,
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (response.ok) {
      showSuccess(editId ? 'Item updated successfully!' : 'Item listed successfully!');
      setTimeout(() => {
        window.location.href = 'user_Dashboard.html';
      }, 1500);
    } else {
      const err = await response.json();
      showError(err.error || 'Failed to save item.');
    }
  } catch (err) {
    console.error('Submit error:', err);
    showError('An error occurred. Please check your connection.');
  }
}

function initializePage() {
  themeToggle = document.getElementById('themeToggle');
  nameInput = document.getElementById('Name');
  itemNameInput = document.getElementById('itemName');
  itemImageInput = document.getElementById('itemImage');
  brandInput = document.getElementById('Brand');
  categorySelect = document.getElementById('itemCategory');
  ageSelect = document.getElementById('Age');
  conditionSelect = document.getElementById('itemCondition');
  descriptionInput = document.getElementById('itemDescription');
  pricePerDayInput = document.getElementById('pricePerDay');
  visibilitySelect = document.getElementById('itemVisibility');
  
  submitButton = document.querySelector('button[type="submit"]');
  clearButton = document.getElementById('clearButton');
  confirmationMessage = document.getElementById('confirmationMessage');
  errorMessage = document.getElementById('errorMessage');
  itemDetails = document.getElementById('itemDetails');
  imagePreviewContainer = null; // handled by dragDrop.js
  previewImage = null;          // handled by dragDrop.js

  const priceBreakdown = document.getElementById('priceBreakdown');
  const platformFee = document.getElementById('platformFee');
  const ownerEarnings = document.getElementById('ownerEarnings');

  if (pricePerDayInput) {
    pricePerDayInput.addEventListener('input', () => {
      const price = parseFloat(pricePerDayInput.value) || 0;
      if (price > 100) { pricePerDayInput.value = 100; return; }
      if (price > 0) {
        priceBreakdown.style.display = 'block';
        const fee = price * 0.10;
        platformFee.textContent = `Rs. ${fee.toFixed(2)}`;
        ownerEarnings.textContent = `Rs. ${ (price - fee).toFixed(2)}`;
      } else {
        priceBreakdown.style.display = 'none';
      }
    });
  }

  if (themeToggle) themeToggle.addEventListener('click', safeToggleTheme);
  if (clearButton) clearButton.addEventListener('click', () => { window.location.reload(); });
  
  // Image preview is now handled by dragDrop.js — no extra listener needed here.

  initializeTheme();
  recoverSession().then(() => {
    const { user } = getCachedAuth();
    if (user && nameInput && !nameInput.value) {
      nameInput.value = user.name;
    }
    const headerAvatar = document.getElementById('headerAvatar');
    if (headerAvatar && user?.name) {
      headerAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
    loadUserCommunities();
  });

  const urlParams = new URLSearchParams(window.location.search);
  const editItemId = urlParams.get('id');

  if (editItemId) {
    const pageTitle = document.querySelector('h2');
    if (pageTitle) pageTitle.textContent = 'Edit Item Details';
    if (submitButton) submitButton.textContent = 'Update Item';
    loadItemForEdit(editItemId);
  }

  const itemFormEl = document.getElementById('itemForm');
  if (itemFormEl) {
    itemFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm(editItemId);
    });
  }

  // Handle Enter key for all inputs
  [nameInput, itemNameInput, brandInput, descriptionInput, pricePerDayInput].forEach(el => {
    if (el) {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitForm(editItemId);
        }
      });
    }
  });
}

async function loadUserCommunities() {
  if (!visibilitySelect) return;
  const { token } = getCachedAuth();
  if (!token) return;

  try {
    const response = await fetch('/api/communities', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      const communities = await response.json();
      const myCommunities = communities.filter(c => c.is_member);
      
      myCommunities.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `Only members of ${c.name}`;
        visibilitySelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error loading user communities:', err);
  }
}

document.addEventListener('DOMContentLoaded', initializePage);
