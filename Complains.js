// item_Issue.js

const themeToggleIssue = document.getElementById('themeToggle');
const htmlIssue = document.documentElement;
const issueForm = document.getElementById('issueForm');

const borrowId = document.getElementById('borrowId');
const itemName = document.getElementById('itemName');
const borrowerName = document.getElementById('borrowerName');
const issueType = document.getElementById('issueType');
const severity = document.getElementById('severity');
const description = document.getElementById('issueDescription');

const confirmationMessageIssue = document.getElementById('confirmationMessage');
const errorMessageIssue = document.getElementById('errorMessage');

function updateThemeToggleIconIssue(theme) {
  themeToggleIssue.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleThemeIssue() {
  const currentTheme = htmlIssue.getAttribute('data-theme');
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  htmlIssue.setAttribute('data-theme', nextTheme);
  localStorage.setItem('theme', nextTheme);
  updateThemeToggleIconIssue(nextTheme);
}

function clearMessagesIssue() {
  if (confirmationMessageIssue) confirmationMessageIssue.style.display = 'none';
  if (errorMessageIssue) errorMessageIssue.style.display = 'none';
}

function showErrorIssue(message) {
  if (!errorMessageIssue || !confirmationMessageIssue) return;
  errorMessageIssue.textContent = message;
  errorMessageIssue.style.display = 'block';
  confirmationMessageIssue.style.display = 'none';
}

function showSuccessIssue(message) {
  if (!errorMessageIssue || !confirmationMessageIssue) return;
  confirmationMessageIssue.textContent = message;
  confirmationMessageIssue.style.display = 'block';
  errorMessageIssue.style.display = 'none';
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateIssueForm() {
  clearMessagesIssue();

  if (!issueTitleInput.value.trim()) {
    showErrorIssue('Issue title is required.');
    return false;
  }

  if (!issueItemIdInput.value.trim()) {
    showErrorIssue('Related Item ID is required.');
    return false;
  }

  if (!issueTypeSelect.value) {
    showErrorIssue('Please select the issue type.');
    return false;
  }

  if (!issueDescriptionInput.value.trim()) {
    showErrorIssue('Please describe the issue.');
    return false;
  }

  if (!contactEmailInput.value.trim() || !isValidEmail(contactEmailInput.value.trim())) {
    showErrorIssue('A valid contact email is required.');
    return false;
  }

  return true;
}

if (themeToggleIssue) {
  themeToggleIssue.addEventListener('click', toggleThemeIssue);
}

if (issueForm) {
  issueForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (validateIssueForm()) {
      showSuccessIssue('Issue report submitted successfully.');
      issueForm.reset();
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initializeThemeIssue();
  clearMessagesIssue();
});
