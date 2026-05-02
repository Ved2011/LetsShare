// item_Return.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const returnForm = document.getElementById('issueItemForm');
const itemIdInput = document.getElementById('itemId');
const itemNameInput = document.getElementById('itemName');
const ownerEmailInput = document.getElementById('ownerEmail');
const borrowerEmailInput = document.getElementById('borrowerEmail');
const returnConditionSelect = document.getElementById('returnCondition');
const notesInput = document.getElementById('notes');
const returnDateInput = document.getElementById('returnDate');
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

function validateReturnForm() {
  clearMessages();

  if (!itemIdInput?.value.trim()) {
    showError('Item ID is required.');
    return false;
  }

  if (!itemNameInput?.value.trim()) {
    showError('Item name is required.');
    return false;
  }

  if (!ownerEmailInput?.value.trim()) {
    showError('Owner email is required.');
    return false;
  }

  if (!borrowerEmailInput?.value.trim()) {
    showError('Borrower email is required.');
    return false;
  }

  if (!returnConditionSelect?.value) {
    showError('Return condition is required.');
    return false;
  }

  if (!returnDateInput?.value) {
    showError('Return date is required.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (returnForm) {
  returnForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!validateReturnForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('You must be logged in to log a return.');
      return;
    }

    const data = {
      itemId: itemIdInput.value.trim(),
      itemName: itemNameInput.value.trim(),
      ownerEmail: ownerEmailInput.value.trim(),
      borrowerEmail: borrowerEmailInput.value.trim(),
      condition: returnConditionSelect.value,
      notes: notesInput?.value.trim() || null,
      returnDate: returnDateInput.value,
    };

    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Return logged successfully!');
        returnForm.reset();
      } else {
        showError(result.error || 'Failed to log return');
      }
    } catch (error) {
      console.error('Return log error:', error);
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
});
