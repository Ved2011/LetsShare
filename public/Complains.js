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
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
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
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  confirmationMessage.style.display = 'none';
}

function showSuccess(message) {
  confirmationMessage.textContent = message;
  confirmationMessage.style.display = 'block';
  errorMessage.style.display = 'none';
}

function validateComplaintForm() {
  clearMessages();

  if (!borrowIdInput.value.trim()) {
    showError('Borrow ID is required.');
    return false;
  }

  if (!itemNameInput.value.trim()) {
    showError('Item name is required.');
    return false;
  }

  if (!borrowerNameInput.value.trim()) {
    showError('Borrower name is required.');
    return false;
  }

  if (!issueTypeSelect.value) {
    showError('Issue type is required.');
    return false;
  }

  if (!severitySelect.value) {
    showError('Severity is required.');
    return false;
  }

  if (!issueDescriptionInput.value.trim()) {
    showError('Description is required.');
    return false;
  }

  if (!afterImageInput.files || afterImageInput.files.length === 0) {
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
    formData.append('borrowerName', borrowerNameInput.value.trim()); // not used in backend
    formData.append('issueType', issueTypeSelect.value);
    formData.append('severity', severitySelect.value);
    formData.append('description', issueDescriptionInput.value.trim());
    if (beforeImageInput.files[0]) formData.append('beforeImage', beforeImageInput.files[0]);
    formData.append('afterImage', afterImageInput.files[0]);

    try {
      const response = await fetch('http://localhost:3000/api/complaints', {
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
