// itemForm.js

// ============= DARK MODE THEME TOGGLE =============
const html = document.documentElement;

let themeToggle;
let nameInput;
let itemNameInput;
let itemImageInput;
let brandInput;
let categorySelect;
let ageSelect;
let conditionSelect;
let descriptionInput;
let submitButton;
let clearButton;
let confirmationMessage;
let errorMessage;
let itemDetails;
let detailName;
let detailItemName;
let detailBrand;
let detailCategory;
let detailAge;
let detailCondition;
let detailDescription;
let imagePreviewContainer;
let previewImage;

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
  if (confirmationMessage) {
    confirmationMessage.style.display = 'none';
  }
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (errorMessage) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = message;
  }
  if (confirmationMessage) {
    confirmationMessage.style.display = 'none';
  }
  if (itemDetails) {
    itemDetails.style.display = 'none';
  }
}

function showSuccess(message) {
  if (confirmationMessage) {
    confirmationMessage.style.display = 'block';
    confirmationMessage.textContent = message;
  }
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

function renderItemDetails() {
  if (!detailName || !detailItemName || !detailBrand || !detailCategory || !detailAge || !detailCondition || !detailDescription || !itemDetails) {
    return;
  }
  detailName.textContent = nameInput?.value.trim() || '';
  detailItemName.textContent = itemNameInput?.value.trim() || '';
  detailBrand.textContent = brandInput?.value.trim() || '';
  detailCategory.textContent = categorySelect?.value || '';
  detailAge.textContent = ageSelect?.value || '';
  detailCondition.textContent = conditionSelect?.value || '';
  detailDescription.textContent = descriptionInput?.value.trim() || '';
  itemDetails.style.display = 'block';
}

function isAllFieldsFilled() {
  return (
    nameInput?.value.trim() !== '' &&
    itemNameInput?.value.trim() !== '' &&
    brandInput?.value.trim() !== '' &&
    categorySelect?.value !== '' &&
    ageSelect?.value !== '' &&
    conditionSelect?.value !== '' &&
    descriptionInput?.value.trim() !== ''
  );
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
  submitButton = document.querySelector('button[type="submit"]');
  clearButton = document.getElementById('clearButton');
  confirmationMessage = document.getElementById('confirmationMessage');
  errorMessage = document.getElementById('errorMessage');
  itemDetails = document.getElementById('itemDetails');
  detailName = document.getElementById('detailName');
  detailItemName = document.getElementById('detailItemName');
  detailBrand = document.getElementById('detailBrand');
  detailCategory = document.getElementById('detailCategory');
  detailAge = document.getElementById('detailAge');
  detailCondition = document.getElementById('detailCondition');
  detailDescription = document.getElementById('detailDescription');
  imagePreviewContainer = document.getElementById('imagePreview');
  previewImage = document.getElementById('preview');

  if (themeToggle) {
    themeToggle.addEventListener('click', safeToggleTheme);
  }

  const itemForm = document.getElementById('itemForm');
  if (itemForm) {
    itemForm.addEventListener('submit', handleSubmit);
  }
  if (clearButton) {
    clearButton.addEventListener('click', clearForm);
  }
  if (itemImageInput) {
    itemImageInput.addEventListener('change', function () {
      clearMessages();
      const file = itemImageInput.files?.[0];
      showImagePreview(file);
    });
  }

  [nameInput, itemNameInput, brandInput, descriptionInput].forEach(el => {
    if (el) {
      el.addEventListener('keydown', handleEnterKey);
    }
  });

  initializeTheme();
  recoverSession();
  
  const headerAvatar = document.getElementById('headerAvatar');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (headerAvatar && user.name) {
    headerAvatar.textContent = user.name.charAt(0).toUpperCase();
  }
  clearMessages();
  if (previewImage) {
    previewImage.style.display = 'none';
  }
  if (itemDetails) {
    itemDetails.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', initializePage);

async function handleSubmit(event) {
  event.preventDefault();
  clearMessages();

  if (!isAllFieldsFilled()) {
    showError('Please fill in all required fields. Item image is optional.');
    return;
  }

  let token = localStorage.getItem('token');
  let user = JSON.parse(localStorage.getItem('user') || 'null');

  console.log('ItemForm submit - token:', !!token, 'user:', !!user);

  if (token && !user) {
    console.log('Trying to recover user from token');
    const recovered = await recoverSession();
    console.log('Recovery result:', recovered);
    if (recovered) {
      user = JSON.parse(localStorage.getItem('user') || 'null');
      console.log('Recovered user:', !!user);
    } else {
      token = null;
    }
  }

  if (!token || !user) {
    console.log('No valid auth, showing error');
    showError('You must be logged in to submit an item.');
    return;
  }

  console.log('Submitting item for user:', user.name);

  renderItemDetails();

  const formData = new FormData();
  formData.append('owner_name', nameInput?.value.trim() || '');
  formData.append('name', itemNameInput?.value.trim() || '');
  formData.append('brand', brandInput?.value.trim() || '');
  formData.append('category', categorySelect?.value || '');
  formData.append('age', ageSelect?.value || '');
  formData.append('condition', conditionSelect?.value || '');
  formData.append('description', descriptionInput?.value.trim() || '');
  if (itemImageInput?.files && itemImageInput.files.length > 0) {
    formData.append('image', itemImageInput.files[0]);
  }

  try {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data.error || 'Submission failed';
      showError(message);
      return;
    }

    showSuccess('Item submitted successfully!');
    clearForm();
  } catch (error) {
    console.error('Item submit error:', error);
    showError('Network error. Please try again.');
  }
}

function showImagePreview(file) {
  if (!previewImage) {
    return;
  }
  if (!file) {
    previewImage.style.display = 'none';
    previewImage.src = '';
    return;
  }

  const allowedTypes = ['image/png', 'image/jpeg'];
  if (!allowedTypes.includes(file.type)) {
    showError('Only PNG and JPEG images are accepted.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    previewImage.src = e.target.result;
    previewImage.style.display = 'block';
    currentImageUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

function clearForm() {
  if (nameInput) nameInput.value = '';
  if (itemNameInput) itemNameInput.value = '';
  if (itemImageInput) itemImageInput.value = '';
  if (brandInput) brandInput.value = 'Toys';
  if (categorySelect) categorySelect.value = 'Toys';
  if (ageSelect) ageSelect.value = '0-3';
  if (conditionSelect) conditionSelect.value = 'Excellent';
  if (descriptionInput) descriptionInput.value = '';
  if (previewImage) {
    previewImage.style.display = 'none';
    previewImage.src = '';
  }
  clearMessages();
  if (itemDetails) {
    itemDetails.style.display = 'none';
  }
  currentImageUrl = null;
}

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSubmit(event);
  }
}

