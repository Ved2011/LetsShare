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
const categorySelect = document.getElementById('Category');
const ageSelect = document.getElementById('Age');
const conditionSelect = document.getElementById('Condition');
const descriptionInput = document.getElementById('Description');

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
  const hasImage = itemImageInput.files && itemImageInput.files.length > 0;
  return (
    nameInput.value.trim() !== '' &&
    itemNameInput.value.trim() !== '' &&
    hasImage &&
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
    showError('Please fill in all required fields and upload a valid PNG/JPEG image.');
    return;
  }

  renderItemDetails();
  showSuccess('Your item has been submitted successfully!');
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

submitButton.addEventListener('click', handleSubmit);
clearButton.addEventListener('click', clearForm);

// Initialize state
clearMessages();
previewImage.style.display = 'none';
itemDetails.style.display = 'none';
