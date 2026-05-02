// issue_Item.js for borrow

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
const issueItemForm = document.getElementById('issueItemForm');
const itemIdInput = document.getElementById('itemId');
const borrowerNameInput = document.getElementById('borrowerName');
const borrowerEmailInput = document.getElementById('borrowerEmail');
const issueDateInput = document.getElementById('issueDate');
const dueDateInput = document.getElementById('dueDate');
const durationInput = document.getElementById('duration');
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
  if (confirmationMessage) confirmationMessage.style.display = 'none';
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

function validateBorrowForm() {
  clearMessages();

  if (!itemIdInput?.value.trim()) {
    showError('Item ID is required.');
    return false;
  }
  if (!borrowerNameInput?.value.trim()) {
    showError('Borrower name is required.');
    return false;
  }
  if (!borrowerEmailInput?.value.trim()) {
    showError('Borrower email is required.');
    return false;
  }
  if (!issueDateInput?.value) {
    showError('Issue date is required.');
    return false;
  }
  if (!dueDateInput?.value) {
    showError('Due date is required.');
    return false;
  }
  if (!durationInput?.value) {
    showError('Duration is required.');
    return false;
  }

  return true;
}

if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

if (issueItemForm) {
  issueItemForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!validateBorrowForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      showError('You must be logged in to issue an item.');
      return;
    }

    const data = {
      itemId: itemIdInput.value.trim(),
      borrowerName: borrowerNameInput.value.trim(),
      borrowerEmail: borrowerEmailInput.value.trim(),
      issueDate: issueDateInput.value,
      dueDate: dueDateInput.value,
      duration: durationInput.value,
    };

    try {
      const response = await fetch('/api/borrows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess('Item issued successfully!');
        issueItemForm.reset();
      } else {
        showError(result.error || 'Failed to issue item');
      }
    } catch (error) {
      console.error('Issue item error:', error);
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
