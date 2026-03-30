// issue_Item.js

const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

const issueItemForm = document.getElementById('issueItemForm');
const itemIdInput = document.getElementById('itemId');
const borrowerNameInput = document.getElementById('borrowerName');
const borrowerEmailInput = document.getElementById('borrowerEmail');
const issueDateInput = document.getElementById('issueDate');
const dueDateInput = document.getElementById('dueDate');
const purposeInput = document.getElementById('purpose');

const confirmationMessageIssueItem = document.getElementById('confirmationMessage');
const errorMessageIssueItem = document.getElementById('errorMessage');

// ============= DARK MODE THEME TOGGLE =============


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

if (themeToggle) {
  themeToggle.addEventListener('click', function () {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
  });
}

// Initialize theme on load
initializeTheme();

function clearMessagesIssueItem() {
  if (confirmationMessageIssueItem) confirmationMessageIssueItem.style.display = 'none';
  if (errorMessageIssueItem) errorMessageIssueItem.style.display = 'none';
}

function showErrorIssueItem(message) {
  if (!errorMessageIssueItem || !confirmationMessageIssueItem) return;
  errorMessageIssueItem.textContent = message;
  errorMessageIssueItem.style.display = 'block';
  confirmationMessageIssueItem.style.display = 'none';
}

function showSuccessIssueItem(message) {
  if (!errorMessageIssueItem || !confirmationMessageIssueItem) return;
  confirmationMessageIssueItem.textContent = message;
  confirmationMessageIssueItem.style.display = 'block';
  errorMessageIssueItem.style.display = 'none';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateIssueItemForm() {
  clearMessagesIssueItem();

  if (!itemIdInput.value.trim()) {
    showErrorIssueItem('Item ID is required.');
    return false;
  }

  if (!borrowerNameInput.value.trim()) {
    showErrorIssueItem('Borrower name is required.');
    return false;
  }

  if (!borrowerEmailInput.value.trim() || !isValidEmail(borrowerEmailInput.value.trim())) {
    showErrorIssueItem('A valid borrower email is required.');
    return false;
  }

  if (!issueDateInput.value) {
    showErrorIssueItem('Issue date is required.');
    return false;
  }

  if (!dueDateInput.value) {
    showErrorIssueItem('Due date is required.');
    return false;
  }

  const issueDate = new Date(issueDateInput.value);
  const dueDate = new Date(dueDateInput.value);
  if (dueDate <= issueDate) {
    showErrorIssueItem('Due date must be after the issue date.');
    return false;
  }

  if (!purposeInput.value.trim()) {
    showErrorIssueItem('Please describe the reason for the request.');
    return false;
  }

  return true;
}

if (issueItemForm) {
  issueItemForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (validateIssueItemForm()) {
      showSuccessIssueItem('Item request submitted successfully.');
      issueItemForm.reset();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initializeTheme();
  clearMessagesIssueItem();
});
