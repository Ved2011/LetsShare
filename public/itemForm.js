// itemForm.js

// ============= DARK MODE THEME TOGGLE =============
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Load theme from localStorage or system preference
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

function updateThemeToggleIcon(theme) {
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

themeToggle.addEventListener('click', function () {
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeToggleIcon(newTheme);
});

// Initialize theme on load
initializeTheme();

// ============= FORM HANDLING =============
// Select form fields and UI blocks
const nameInput = document.getElementById('Name');
const itemNameInput = document.getElementById('itemName');
const itemImageInput = document.getElementById('itemImage');
const brandInput = document.getElementById('Brand');
const categorySelect = document.getElementById('itemCategory');
const ageSelect = document.getElementById('Age');
const conditionSelect = document.getElementById('itemCondition');
const descriptionInput = document.getElementById('itemDescription');

const submitButton = document.querySelector('button[type="submit"]');
const clearButton = document.getElementById('clearButton');
const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');
const itemDetails = document.getElementById('itemDetails');

const detailName = document.getElementById('detailName');
const detailItemName = document.getElementById('detailItemName');
const detailBrand = document.getElementById('detailBrand');
const detailCategory = document.getElementById('detailCategory');
const detailAge = document.getElementById('detailAge');
const detailCondition = document.getElementById('detailCondition');
const detailDescription = document.getElementById('detailDescription');

const imagePreviewContainer = document.getElementById('imagePreview');
const previewImage = document.getElementById('preview');

let currentImageUrl = null;

function clearMessages() {
  confirmationMessage.style.display = 'none';
  errorMessage.style.display = 'none';
}

function showError(message) {
  errorMessage.style.display = 'block';
  errorMessage.textContent = message;
  confirmationMessage.style.display = 'none';
  itemDetails.style.display = 'none';
}

function showSuccess(message) {
  confirmationMessage.style.display = 'block';
  confirmationMessage.textContent = message;
  errorMessage.style.display = 'none';
}

function renderItemDetails() {
  detailName.textContent = nameInput.value.trim();
  detailItemName.textContent = itemNameInput.value.trim();
  detailBrand.textContent = brandInput.value.trim();
  detailCategory.textContent = categorySelect.value;
  detailAge.textContent = ageSelect.value;
  detailCondition.textContent = conditionSelect.value;
  detailDescription.textContent = descriptionInput.value.trim();
  itemDetails.style.display = 'block';
}

function isAllFieldsFilled() {
  return (
    nameInput.value.trim() !== '' &&
    itemNameInput.value.trim() !== '' &&
    brandInput.value.trim() !== '' &&
    categorySelect.value !== '' &&
    ageSelect.value !== '' &&
    conditionSelect.value !== '' &&
    descriptionInput.value.trim() !== '' 
  );
}

function handleSubmit(event) {
  event.preventDefault();
  clearMessages();

  if (!isAllFieldsFilled()) {
    showError('Please fill in all required fields. Item image is optional.');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    showError('You must be logged in to submit an item.');
    return;
  }

  const formData = new FormData();
  formData.append('name', itemNameInput.value.trim());
  formData.append('description', `${brandInput.value.trim()} - ${conditionSelect.value} - ${ageSelect.value} - ${descriptionInput.value.trim()}`);
  formData.append('category', categorySelect.value);
  if (itemImageInput.files && itemImageInput.files.length > 0) {
    formData.append('image', itemImageInput.files[0]);
  }

  fetch('/api/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })
  .then(response => response.json())
  .then(data => {
    if (data.message) {
      showSuccess('Item submitted successfully!');
      clearForm();
    } else {
      showError(data.error || 'Submission failed');
    }
  })
  .catch(error => {
    showError('Network error. Please try again.');
  });
}

function showImagePreview(file) {
  if (!file) {
    previewImage.style.display = 'none';
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
  nameInput.value = '';
  itemNameInput.value = '';
  itemImageInput.value = '';
  brandInput.value = 'Toys';
  categorySelect.value = 'Toys';
  ageSelect.value = '0-3';
  conditionSelect.value = 'Excellent';
  descriptionInput.value = '';
  previewImage.style.display = 'none';
  clearMessages();
  itemDetails.style.display = 'none';
  currentImageUrl = null;
}

itemImageInput.addEventListener('change', function () {
  clearMessages();
  const file = itemImageInput.files[0];
  showImagePreview(file);
});

function handleEnterKey(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleSubmit(event);
  }
}

[nameInput, itemNameInput, brandInput, descriptionInput].forEach(el => {
  el.addEventListener('keydown', handleEnterKey);
});

const itemForm = document.getElementById('itemForm');

itemForm.addEventListener('submit', handleSubmit);
clearButton.addEventListener('click', clearForm);

// Initialize state
clearMessages();
previewImage.style.display = 'none';
itemDetails.style.display = 'none';
