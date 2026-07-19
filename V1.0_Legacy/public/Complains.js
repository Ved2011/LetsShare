// Complains.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const issueForm = document.getElementById('issueForm');

const borrowIdInput = document.getElementById('borrowId');
const itemNameInput = document.getElementById('itemName');
const borrowerNameInput = document.getElementById('borrowerName');
const issueTypeSelect = document.getElementById('issueType');
const severitySelect = document.getElementById('severity');
const issueDescriptionInput = document.getElementById('issueDescription');
const beforeImageInput = document.getElementById('beforeImage');
const afterImageInput = document.getElementById('afterImage');

const confirmationMessage = document.getElementById('confirmationMessage');
const errorMessage = document.getElementById('errorMessage');

function updateThemeToggleIcon(theme) {
  if (themeToggle) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const currentTheme = html.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIcon(nextTheme);
}

function clearMessages() {
  if (confirmationMessage) confirmationMessage.style.display = 'none';
  if (errorMessage) errorMessage.style.display = 'none';
}

function showError(message) {
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }
  if (confirmationMessage) {
    confirmationMessage.style.display = 'none';
  }
}

function showSuccess(message) {
  if (confirmationMessage) {
    confirmationMessage.textContent = message;
    confirmationMessage.style.display = 'block';
  }
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

function validateComplaintForm() {
  clearMessages();

  if (!borrowIdInput?.value.trim()) {
    showError('Borrow ID is required.');
    return false;
  }

  if (!itemNameInput?.value.trim()) {
    showError('Item name is required.');
    return false;
  }

  if (!borrowerNameInput?.value.trim()) {
    showError('Borrower name is required.');
    return false;
  }

  if (!issueTypeSelect?.value) {
    showError('Issue type is required.');
    return false;
  }

  if (!severitySelect?.value) {
    showError('Severity is required.');
    return false;
  }

  if (!issueDescriptionInput?.value.trim()) {
    showError('Description is required.');
    return false;
  }

  if (!afterImageInput?.files || afterImageInput.files.length === 0) {
    showError('After image is required.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (issueForm) {
  issueForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!validateComplaintForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('You must be logged in to submit a complaint.');
      return;
    }

    const formData = new FormData();
    formData.append('borrowId', borrowIdInput.value.trim());
    formData.append('itemName', itemNameInput.value.trim());
    formData.append('borrowerName', borrowerNameInput.value.trim());
    formData.append('issueType', issueTypeSelect.value);
    formData.append('severity', severitySelect.value);
    formData.append('issueDescription', issueDescriptionInput.value.trim());
    if (beforeImageInput.files[0]) {
      formData.append('beforeImage', beforeImageInput.files[0]);
    }
    formData.append('afterImage', afterImageInput.files[0]);

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Complaint submitted successfully!');
        issueForm.reset();
      } else {
        showError(result.error || 'Failed to submit complaint');
      }
    } catch (error) {
      console.error('Complaint submission error:', error);
      showError('Network error. Please try again.');
    }
  });
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeToggleIcon(savedTheme);
}

document.addEventListener('DOMContentLoaded', function () {
  initializeTheme();
  clearMessages();

  // Pre-fill from URL parameters
  const params = new URLSearchParams(window.location.search);
  const borrowId = params.get('borrowId');
  const itemName = params.get('itemName');
  const borrowerName = params.get('borrowerName');

  if (borrowId && borrowIdInput) borrowIdInput.value = borrowId;
  if (itemName && itemNameInput) itemNameInput.value = itemName;
  if (borrowerName && borrowerNameInput) borrowerNameInput.value = borrowerName;
});
